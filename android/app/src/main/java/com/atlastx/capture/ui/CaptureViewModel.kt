package com.atlastx.capture.ui

import android.app.Application
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.atlastx.capture.AtlasApp
import com.atlastx.capture.data.ApiClient
import com.atlastx.capture.data.CaptureSettings
import com.atlastx.capture.data.Centroids
import com.atlastx.capture.data.CountyCentroid
import com.atlastx.capture.data.CountyOverviewEntry
import com.atlastx.capture.data.Observation
import com.atlastx.capture.data.ObservationComparison
import com.atlastx.capture.data.SettingsRepository
import com.atlastx.capture.data.SubmitResult
import com.atlastx.capture.data.WaterOverviewResponse
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
    data class Done(
        val observation: Observation,
        val deduped: Boolean,
        val comparison: ObservationComparison?,
    ) : UploadState
    data class Failed(val message: String) : UploadState
}

sealed interface MapDataState {
    data object Idle : MapDataState
    data object Loading : MapDataState
    data class Ready(
        val centroids: List<CountyCentroid>,
        val overviewBySlug: Map<String, CountyOverviewEntry>,
    ) : MapDataState
    data class Failed(val message: String) : MapDataState
}

sealed interface ActivityState {
    data object Idle : ActivityState
    data object Loading : ActivityState
    data class Ready(val items: List<Observation>) : ActivityState
    data class Failed(val message: String) : ActivityState
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

    private val _capturedMime = MutableStateFlow("image/jpeg")
    val capturedMime: StateFlow<String> = _capturedMime.asStateFlow()

    private val _upload = MutableStateFlow<UploadState>(UploadState.Idle)
    val upload: StateFlow<UploadState> = _upload.asStateFlow()

    private val _countySlug = MutableStateFlow<String?>(null)
    val countySlug: StateFlow<String?> = _countySlug.asStateFlow()

    private val _mapData = MutableStateFlow<MapDataState>(MapDataState.Idle)
    val mapData: StateFlow<MapDataState> = _mapData.asStateFlow()

    private val _activity = MutableStateFlow<ActivityState>(ActivityState.Idle)
    val activity: StateFlow<ActivityState> = _activity.asStateFlow()

    private val _importError = MutableStateFlow<String?>(null)
    val importError: StateFlow<String?> = _importError.asStateFlow()

    fun clearImportError() { _importError.value = null }

    fun newCaptureFile(): Pair<File, Uri> {
        val dir = File(app.filesDir, "captures").apply { mkdirs() }
        val name = "strip-" + timestamp() + ".jpg"
        val file = File(dir, name)
        val uri = FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file)
        return file to uri
    }

    fun setCapturedFromCamera(file: File?) {
        _capturedFile.value = file
        _capturedMime.value = "image/jpeg"
        _upload.value = UploadState.Idle
    }

    /**
     * Decode any picked image (jpeg / png / webp / heic / heif) into a Bitmap and
     * re-encode as JPEG, so the server side never sees a HEIC payload mislabeled
     * as JPEG. Surfaces failure as `importError` instead of silently returning
     * null — the gallery flow used to dead-end on Pixel HEIC files because
     * the byte stream copied through unchanged but the server's vision pass
     * could not actually grade the image.
     */
    fun importGalleryUri(uri: Uri): File? {
        _importError.value = null
        val resolver = app.contentResolver
        val dir = File(app.filesDir, "captures").apply { mkdirs() }
        val file = File(dir, "strip-${timestamp()}.jpg")

        val bitmap: Bitmap? = runCatching {
            resolver.openInputStream(uri)?.use { input ->
                BitmapFactory.decodeStream(input)
            }
        }.getOrNull()

        if (bitmap == null) {
            _importError.value = "Could not read this image. Try a JPEG/PNG/HEIC photo from the gallery."
            return null
        }

        val ok = runCatching {
            file.outputStream().use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 92, out)
            }
        }.getOrElse {
            _importError.value = "Failed to save the picked image: ${it.message ?: it.javaClass.simpleName}"
            file.takeIf { it.exists() }?.delete()
            return null
        }

        bitmap.recycle()

        if (!ok || file.length() == 0L) {
            file.takeIf { it.exists() }?.delete()
            _importError.value = "Encoded image was empty."
            return null
        }

        _capturedFile.value = file
        _capturedMime.value = "image/jpeg"
        _upload.value = UploadState.Idle
        return file
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
                imageMime = _capturedMime.value,
            )
            _upload.value = when (result) {
                is SubmitResult.Ok -> UploadState.Done(result.observation, result.deduped, result.comparison)
                is SubmitResult.Error -> UploadState.Failed(result.message)
            }
        }
    }

    fun reset() {
        _capturedFile.value?.takeIf { it.exists() }?.delete()
        _capturedFile.value = null
        _capturedMime.value = "image/jpeg"
        _upload.value = UploadState.Idle
        _countySlug.value = null
    }

    private fun timestamp(): String =
        SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date())

    fun loadMapData(force: Boolean = false) {
        val current = _mapData.value
        if (!force && (current is MapDataState.Ready || current is MapDataState.Loading)) return
        _mapData.value = MapDataState.Loading
        viewModelScope.launch {
            val centroids = runCatching { Centroids.load(app) }.getOrNull()
            if (centroids == null) {
                _mapData.value = MapDataState.Failed("Could not load county centroids.")
                return@launch
            }
            val baseUrl = settings.current().baseUrl
            val overview: WaterOverviewResponse? = api.fetchWaterOverview(baseUrl)
            val map = overview?.counties.orEmpty().associateBy { it.county.slug }
            _mapData.value = MapDataState.Ready(centroids = centroids, overviewBySlug = map)
        }
    }

    fun loadActivity(force: Boolean = false) {
        val current = _activity.value
        if (!force && (current is ActivityState.Ready || current is ActivityState.Loading)) return
        _activity.value = ActivityState.Loading
        viewModelScope.launch {
            val baseUrl = settings.current().baseUrl
            val items = api.fetchRecentObservations(baseUrl)
            _activity.value = ActivityState.Ready(items)
        }
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
