package com.atlastx.capture.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.BuildConfig
import com.atlastx.capture.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: CaptureViewModel,
    onBack: () -> Unit,
) {
    val settings by viewModel.settingsState.collectAsStateWithLifecycle()
    var baseUrl by remember(settings.baseUrl) { mutableStateOf(settings.baseUrl) }
    var stripBrand by remember(settings.stripBrand) { mutableStateOf(settings.stripBrand) }

    LaunchedEffect(baseUrl) { if (baseUrl != settings.baseUrl) viewModel.setBaseUrl(baseUrl) }
    LaunchedEffect(stripBrand) { if (stripBrand != settings.stripBrand) viewModel.setStripBrand(stripBrand) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { baseUrl = it },
                label = { Text(stringResource(R.string.settings_base_url)) },
                supportingText = { Text(stringResource(R.string.settings_base_url_hint)) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            OutlinedTextField(
                value = stripBrand,
                onValueChange = { stripBrand = it },
                label = { Text(stringResource(R.string.settings_strip_brand)) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    stringResource(R.string.settings_attach_location),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Switch(
                    checked = settings.attachLocation,
                    onCheckedChange = viewModel::setAttachLocation,
                )
            }

            Column {
                Text(
                    stringResource(R.string.settings_device_id),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    settings.deviceId.ifBlank { "(not yet generated)" },
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            OutlinedButton(
                onClick = viewModel::regenerateDeviceId,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.settings_reset_device_id))
            }

            Column {
                Text(
                    stringResource(R.string.settings_app_version),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE}) · ${BuildConfig.GIT_SHA}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}
