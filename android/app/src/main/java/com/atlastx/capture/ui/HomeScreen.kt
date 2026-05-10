package com.atlastx.capture.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.R

@Composable
fun CaptureHomeScreen(
    viewModel: CaptureViewModel,
    onTakePhoto: () -> Unit,
    onUploadExisting: () -> Unit,
) {
    val settings by viewModel.settingsState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp, vertical = 16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = stringResource(R.string.onboarding_headline),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            text = stringResource(R.string.onboarding_body),
            style = MaterialTheme.typography.bodyMedium,
        )

        Card {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                LabeledRow("Server", settings.baseUrl)
                LabeledRow(
                    "Device",
                    settings.deviceId.takeIf { it.isNotBlank() }?.let { it.take(8) + "…" } ?: "—",
                )
                LabeledRow("Strip", settings.stripBrand)
            }
        }

        Spacer(Modifier.height(8.dp))

        Button(onClick = onTakePhoto, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Filled.CameraAlt, contentDescription = null)
            Text("  Take a new photo")
        }
        OutlinedButton(onClick = onUploadExisting, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Filled.PhotoLibrary, contentDescription = null)
            Text("  Upload an existing photo")
        }
    }
}

@Composable
private fun LabeledRow(label: String, value: String) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
