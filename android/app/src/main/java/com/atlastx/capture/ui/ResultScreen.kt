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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.R
import com.atlastx.capture.data.Observation

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResultScreen(
    viewModel: CaptureViewModel,
    onDone: () -> Unit,
) {
    val upload by viewModel.upload.collectAsStateWithLifecycle()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Result") }) },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            when (val s = upload) {
                is UploadState.Done -> ResultBody(observation = s.observation, deduped = s.deduped)
                is UploadState.Failed -> Text(
                    "Submit failed: ${s.message}",
                    color = MaterialTheme.colorScheme.error,
                )
                else -> Text(stringResource(R.string.result_pending))
            }

            Spacer(Modifier.height(8.dp))

            Button(
                onClick = {
                    viewModel.reset()
                    onDone()
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(stringResource(R.string.action_done))
            }

            OutlinedButton(onClick = { viewModel.reset(); onDone() }, modifier = Modifier.fillMaxWidth()) {
                Text("Capture another")
            }

            Text(
                stringResource(R.string.result_screening_only),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ResultBody(observation: Observation, deduped: Boolean) {
    Card {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            LabeledLine(label = stringResource(R.string.result_status_label), value = observation.status.uppercase())
            observation.stripBrand?.let { LabeledLine("Strip", it) }
            observation.countySlug?.let { LabeledLine("County", it) }
            observation.llmModel?.let { LabeledLine("Model", it) }
            observation.agreement?.let { LabeledLine("Agreement", "%.2f".format(it)) }
            LabeledLine("Observation id", observation.id)
            if (deduped) Text(
                "(Already submitted earlier — server returned the existing record.)",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (observation.qaFlags.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    stringResource(R.string.result_caveats_label),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                observation.qaFlags.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}

@Composable
private fun LabeledLine(label: String, value: String) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
