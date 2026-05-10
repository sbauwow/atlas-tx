package com.atlastx.capture.ui

import android.app.Application
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.atlastx.capture.AtlasApp
import com.atlastx.capture.data.ApiClient
import com.atlastx.capture.data.CaptureSettings
import com.atlastx.capture.data.Observation
import com.atlastx.capture.data.SettingsRepository
import com.atlastx.capture.data.SubmitResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

sealed interface UploadState {
    data object Idle : UploadState
    data object InFlight : UploadState
    data class Done(val observation: Observation, val deduped: Boolean) : UploadState
    data class Failed(val message: String) : UploadState
}

class CaptureViewModel(
    private val app: Application,
    private val settings: SettingsRepository,
    private val api: ApiClient = ApiClient(),
) : AndroidViewModel(app) {

    val settingsState: StateFlow<CaptureSettings> = settings.flow.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = CaptureSettings(
            baseUrl = SettingsRepository.DEFAULT_BASE_URL,
            deviceId = "",
            stripBrand = SettingsRepository.DEFAULT_STRIP_BRAND,
            attachLocation = false,
        ),
    )

    private val _capturedFile = MutableStateFlow<File?>(null)
    val capturedFile: StateFlow<File?> = _capturedFile.asStateFlow()

    private val _upload = MutableStateFlow<UploadState>(UploadState.Idle)
    val upload: StateFlow<UploadState> = _upload.asStateFlow()

    private val _countySlug = MutableStateFlow<String?>(null)
    val countySlug: StateFlow<String?> = _countySlug.asStateFlow()

    fun newCaptureFile(): Pair<File, Uri> {
        val dir = File(app.filesDir, "captures").apply { mkdirs() }
        val name = "strip-" + SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date()) + ".jpg"
        val file = File(dir, name)
        val uri = FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file)
        return file to uri
    }

    fun setCaptured(file: File?) {
        _capturedFile.value = file
        _upload.value = UploadState.Idle
    }

    fun setCountySlug(slug: String?) { _countySlug.value = slug?.takeIf { it.isNotBlank() } }

    fun submit() {
        val file = _capturedFile.value ?: return
        if (!file.exists() || file.length() == 0L) {
            _upload.value = UploadState.Failed("captured file is missing or empty")
            return
        }
        _upload.value = UploadState.InFlight
        viewModelScope.launch {
            val s = settings.current()
            val deviceId = s.deviceId.ifBlank { settings.ensureDeviceId() }
            val result = api.submitStrip(
                baseUrl = s.baseUrl,
                deviceId = deviceId,
                stripBrand = s.stripBrand,
                countySlug = _countySlug.value,
                imageFile = file,
                imageMime = "image/jpeg",
            )
            _upload.value = when (result) {
                is SubmitResult.Ok -> UploadState.Done(result.observation, result.deduped)
                is SubmitResult.Error -> UploadState.Failed(result.message)
            }
        }
    }

    fun reset() {
        _capturedFile.value?.takeIf { it.exists() }?.delete()
        _capturedFile.value = null
        _upload.value = UploadState.Idle
        _countySlug.value = null
    }

    fun setBaseUrl(value: String) = viewModelScope.launch { settings.setBaseUrl(value) }
    fun setStripBrand(value: String) = viewModelScope.launch { settings.setStripBrand(value) }
    fun setAttachLocation(value: Boolean) = viewModelScope.launch { settings.setAttachLocation(value) }
    fun regenerateDeviceId() = viewModelScope.launch { settings.regenerateDeviceId() }

    companion object {
        fun factory(settings: SettingsRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    val app = AtlasApp.instance
                        ?: error("AtlasApp not initialized; ensure android:name=\".AtlasApp\" is set in AndroidManifest.")
                    return CaptureViewModel(app, settings) as T
                }
            }
    }
}
