package com.atlastx.capture.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.atlastx.capture.R
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CaptureScreen(
    viewModel: CaptureViewModel,
    onSubmitted: () -> Unit,
    onBack: () -> Unit,
    initialSource: CaptureSource = CaptureSource.NONE,
) {
    val captured by viewModel.capturedFile.collectAsStateWithLifecycle()
    val upload by viewModel.upload.collectAsStateWithLifecycle()
    val countySlug by viewModel.countySlug.collectAsStateWithLifecycle()
    val importError by viewModel.importError.collectAsStateWithLifecycle()

    var autoLaunched by remember { mutableStateOf(false) }

    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        // Even on `ok = false` some cameras still wrote a usable image to our
        // FileProvider URI. The view model checks file existence + bytes and
        // surfaces the right error UI.
        val outcome = viewModel.finishCameraCapture(cameraOk = ok)
        if (outcome == CaptureViewModel.CameraResult.Canceled &&
            initialSource == CaptureSource.CAMERA &&
            captured == null
        ) {
            // Genuine cancel (no file or empty file) → back to capture home so
            // the user is not stranded on a blank preview screen.
            onBack()
        }
        // Failed (file existed but decode bombed) keeps the user on the
        // capture screen with the inline error card, so they can retry from
        // the in-screen buttons.
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        if (uri != null) {
            viewModel.importGalleryUri(uri)
        } else if (initialSource == CaptureSource.GALLERY && captured == null) {
            onBack()
        }
    }

    LaunchedEffect(upload) {
        if (upload is UploadState.Done) onSubmitted()
    }

    LaunchedEffect(initialSource, captured) {
        if (autoLaunched || captured != null) return@LaunchedEffect
        when (initialSource) {
            CaptureSource.GALLERY -> {
                autoLaunched = true
                galleryLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                )
            }
            CaptureSource.CAMERA -> {
                autoLaunched = true
                val (_, uri) = viewModel.newCaptureFile()
                cameraLauncher.launch(uri)
            }
            CaptureSource.NONE -> Unit
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Capture") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        }
    ) { padding ->
        CaptureBody(
            padding = padding,
            captured = captured,
            upload = upload,
            countySlug = countySlug,
            importError = importError,
            onDismissImportError = viewModel::clearImportError,
            onPickGallery = {
                viewModel.clearImportError()
                galleryLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                )
            },
            onShoot = {
                val (_, uri) = viewModel.newCaptureFile()
                cameraLauncher.launch(uri)
            },
            onCountySlugChange = viewModel::setCountySlug,
            onRetake = {
                viewModel.reset()
                viewModel.clearImportError()
            },
            onSubmit = viewModel::submit,
        )
    }
}

@Composable
private fun CaptureBody(
    padding: PaddingValues,
    captured: File?,
    upload: UploadState,
    countySlug: String?,
    importError: String?,
    onDismissImportError: () -> Unit,
    onPickGallery: () -> Unit,
    onShoot: () -> Unit,
    onCountySlugChange: (String) -> Unit,
    onRetake: () -> Unit,
    onSubmit: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(padding)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            "1. Dip strip per kit instructions; wait the full incubation time.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            "2. Place the strip next to its bottle's color chart, in daylight, no flash.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            "3. Photograph both strip and chart in the same frame.",
            style = MaterialTheme.typography.bodyMedium,
        )

        Spacer(Modifier.height(8.dp))

        Card {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(3f / 4f)
                    .clip(RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center,
            ) {
                if (captured != null) {
                    AsyncImage(
                        model = captured,
                        contentDescription = "Captured strip preview",
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    Text(
                        "No photo yet",
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }

        if (importError != null) {
            Card {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        "Could not import image",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.error,
                    )
                    Text(
                        importError,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                    OutlinedButton(onClick = onDismissImportError, modifier = Modifier.fillMaxWidth()) {
                        Text("Dismiss")
                    }
                }
            }
        }

        if (captured == null) {
            Button(onClick = onShoot, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.action_capture))
            }
            OutlinedButton(onClick = onPickGallery, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Filled.PhotoLibrary, contentDescription = null)
                Text("  " + stringResource(R.string.action_pick_image))
            }
        } else {
            OutlinedTextField(
                value = countySlug ?: "",
                onValueChange = onCountySlugChange,
                label = { Text("County slug (optional)") },
                placeholder = { Text("travis-county") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Button(
                onClick = onSubmit,
                modifier = Modifier.fillMaxWidth(),
                enabled = upload !is UploadState.InFlight,
            ) {
                Text(
                    if (upload is UploadState.InFlight) "Uploading…"
                    else stringResource(R.string.action_submit)
                )
            }
            OutlinedButton(onClick = onRetake, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.action_retake))
            }

            (upload as? UploadState.Failed)?.let {
                Text(
                    "Submit failed: ${it.message}",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        Spacer(Modifier.height(8.dp))
        Text(
            stringResource(R.string.result_screening_only),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
