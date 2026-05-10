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

    /**
     * Pending camera output. Lives on the view model rather than Compose
     * `remember` so we still know which file to ingest if Android killed the
     * activity while the camera was foregrounded.
     */
    private val _pendingCameraFile = MutableStateFlow<File?>(null)
    val pendingCameraFile: StateFlow<File?> = _pendingCameraFile.asStateFlow()

    fun newCaptureFile(): Pair<File, Uri> {
        val dir = File(app.filesDir, "captures").apply { mkdirs() }
        val name = "strip-" + timestamp() + ".jpg"
        val file = File(dir, name)
        val uri = FileProvider.getUriForFile(app, "${app.packageName}.fileprovider", file)
        _pendingCameraFile.value = file
        return file to uri
    }

    /**
     * Result branch: when the system camera returns we keep whatever bytes
     * landed on disk and try to ingest them ourselves. Some cameras report
     * `ok = false` but still wrote a complete image; we treat any non-empty
     * file as a try-it-anyway. `cameraOk` is only used for the cancel
     * fallback when the file is also empty.
     */
    fun finishCameraCapture(cameraOk: Boolean): CameraResult {
        val pending = _pendingCameraFile.value
        _pendingCameraFile.value = null

        if (pending == null) {
            android.util.Log.w(LOG_TAG, "finishCameraCapture: no pending file (process killed?)")
            return CameraResult.Canceled
        }
        if (!pending.exists()) {
            android.util.Log.w(LOG_TAG, "finishCameraCapture: pending file ${pending.absolutePath} missing")
            return if (cameraOk) {
                _importError.value = "Camera reported success but no photo landed on disk."
                CameraResult.Failed
            } else {
                CameraResult.Canceled
            }
        }
        val length = pending.length()
        if (length == 0L) {
            pending.delete()
            android.util.Log.w(LOG_TAG, "finishCameraCapture: pending file empty (cameraOk=$cameraOk)")
            return CameraResult.Canceled
        }

        android.util.Log.d(LOG_TAG, "finishCameraCapture: ${pending.absolutePath} ($length bytes, cameraOk=$cameraOk)")

        val processed = decodeAndReencodeJpeg(
            source = ImageSource.LocalFile(pending),
            destDir = File(app.filesDir, "captures"),
        )
        if (processed == null) {
            android.util.Log.e(LOG_TAG, "finishCameraCapture: decode/encode failed for ${pending.absolutePath}")
            _importError.value =
                "Could not read this photo. The camera may have written an unsupported format."
            // Keep the original around so we can debug, but stop pretending we have a captured file.
            return CameraResult.Failed
        }
        if (processed.absolutePath != pending.absolutePath) {
            pending.takeIf { it.exists() }?.delete()
        }
        _capturedFile.value = processed
        _capturedMime.value = "image/jpeg"
        _upload.value = UploadState.Idle
        return CameraResult.Captured
    }

    fun setCapturedFromCamera(file: File?) {
        // Legacy entry point retained for compatibility with the gallery flow's
        // pattern (and any tests that still call this directly). The capture
        // screen now uses finishCameraCapture, which knows about pending files.
        if (file == null) {
            _capturedFile.value = null
            _capturedMime.value = "image/jpeg"
            _upload.value = UploadState.Idle
            return
        }
        _pendingCameraFile.value = file
        finishCameraCapture(cameraOk = true)
    }

    enum class CameraResult { Captured, Canceled, Failed }

    /**
     * Decode any picked image (jpeg / png / webp / heic / heif) into a Bitmap and
     * re-encode as JPEG. Surfaces failure as `importError` instead of silently
     * returning null — the gallery flow used to dead-end on Pixel HEIC files
     * because the byte stream copied through unchanged but the server's vision
     * pass could not actually grade the image.
     */
    fun importGalleryUri(uri: Uri): File? {
        _importError.value = null
        val processed = decodeAndReencodeJpeg(
            source = ImageSource.ContentUri(uri),
            destDir = File(app.filesDir, "captures"),
        )
        if (processed == null) {
            _importError.value = "Could not read this image. Try a JPEG/PNG/HEIC photo from the gallery."
            return null
        }
        _capturedFile.value = processed
        _capturedMime.value = "image/jpeg"
        _upload.value = UploadState.Idle
        return processed
    }

    private sealed interface ImageSource {
        data class LocalFile(val file: File) : ImageSource
        data class ContentUri(val uri: Uri) : ImageSource
    }

    private fun decodeAndReencodeJpeg(
        source: ImageSource,
        destDir: File,
        maxEdgePx: Int = 2048,
        quality: Int = 88,
    ): File? {
        destDir.mkdirs()
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        runCatching { openSourceStream(source).use { BitmapFactory.decodeStream(it, null, bounds) } }
            .getOrNull()
        val rawW = bounds.outWidth
        val rawH = bounds.outHeight
        var sample = 1
        if (rawW > 0 && rawH > 0) {
            val longest = maxOf(rawW, rawH)
            while (longest / sample > maxEdgePx) sample *= 2
        }
        val decode = BitmapFactory.Options().apply { inSampleSize = sample.coerceAtLeast(1) }
        val bitmap: Bitmap = runCatching {
            openSourceStream(source).use { BitmapFactory.decodeStream(it, null, decode) }
        }.getOrNull() ?: return null

        val out = File(destDir, "strip-${timestamp()}.jpg")
        val ok = runCatching {
            out.outputStream().use { stream ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, quality, stream)
            }
        }.getOrDefault(false)
        bitmap.recycle()

        if (!ok || out.length() == 0L) {
            out.takeIf { it.exists() }?.delete()
            return null
        }
        return out
    }

    private fun openSourceStream(source: ImageSource): java.io.InputStream =
        when (source) {
            is ImageSource.LocalFile -> source.file.inputStream()
            is ImageSource.ContentUri -> app.contentResolver.openInputStream(source.uri)
                ?: error("could not open input stream for ${source.uri}")
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
        private const val LOG_TAG = "AtlasCapture"

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
