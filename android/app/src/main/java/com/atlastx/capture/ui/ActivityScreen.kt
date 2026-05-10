package com.atlastx.capture.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.data.Observation

@Composable
fun ActivityScreen(viewModel: CaptureViewModel) {
    val state by viewModel.activity.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.loadActivity() }

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("Recent observations", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
                Text(
                    "Latest 100 community submissions across Atlas TX.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            OutlinedButton(onClick = { viewModel.loadActivity(force = true) }) { Text("Refresh") }
        }

        Spacer(Modifier.height(16.dp))

        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
            when (val s = state) {
                ActivityState.Idle, ActivityState.Loading -> CircularProgressIndicator()
                is ActivityState.Failed -> Text("Failed: ${s.message}", color = MaterialTheme.colorScheme.error)
                is ActivityState.Ready -> {
                    if (s.items.isEmpty()) {
                        Text(
                            "No observations yet. Submit a strip from the Capture tab.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxSize()) {
                            items(s.items, key = { it.id }) { ObservationCard(it) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ObservationCard(o: Observation) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(o.status.uppercase(), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                Text(o.createdAt ?: "—", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            o.countySlug?.let { Text("County: $it", style = MaterialTheme.typography.bodySmall) }
            o.stripBrand?.let { Text("Strip: $it", style = MaterialTheme.typography.bodySmall) }
            o.llmModel?.let {
                Text("Model: $it", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            o.agreement?.let { Text("Agreement: %.2f".format(it), style = MaterialTheme.typography.labelSmall) }
            if (o.qaFlags.isNotEmpty()) {
                Text(
                    "QA: ${o.qaFlags.joinToString(", ")}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
