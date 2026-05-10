package com.atlastx.capture.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.R
import com.atlastx.capture.data.AnalyteComparison
import com.atlastx.capture.data.ComparisonScope
import com.atlastx.capture.data.Observation
import com.atlastx.capture.data.ObservationComparison

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
                is UploadState.Done -> {
                    ResultBody(observation = s.observation, deduped = s.deduped)
                    s.comparison?.let { ComparisonSection(it) }
                }
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
private fun ComparisonSection(comparison: ObservationComparison) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            "How your sample compares",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            "Where your strip's bands fall against the historical distribution of community submissions for the same chart. Screening signal only — never a regulatory comparison.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        comparison.countyScope?.let {
            ScopeCard(
                title = comparison.countySlug?.let { slug -> "Your county · $slug" } ?: "Your county",
                scope = it,
            )
        }
        ScopeCard(title = "Statewide (TX)", scope = comparison.stateScope)
    }
}

@Composable
private fun ScopeCard(title: String, scope: ComparisonScope) {
    Card {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(
                    "${scope.observationCount} prior submission${if (scope.observationCount == 1) "" else "s"}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (scope.perAnalyte.isEmpty()) {
                Text(
                    "No comparable analytes in this scope.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                scope.perAnalyte.forEach { AnalyteComparisonRow(it) }
            }
        }
    }
}

@Composable
private fun AnalyteComparisonRow(comparison: AnalyteComparison) {
    val total = comparison.totalCount
    val youPct = if (total > 0) {
        val pct = comparison.distributionPercent.getOrNull(comparison.yourBandIndex) ?: 0.0
        "${pct.formatPct()}% of submissions matched your band"
    } else {
        "No prior submissions for this analyte yet."
    }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(comparison.analyteName, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
            Text(
                "your band: ${comparison.yourBandLabel}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        DistributionBar(comparison)

        if (total > 0) {
            val modeLabel = comparison.modeBandIndex
                ?.let { comparison.bandLabels.getOrNull(it) }
                ?: "—"
            Text(
                "$youPct · most common: $modeLabel · n=$total",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (comparison.smallSample) {
                Text(
                    "Small sample — interpret with caution.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            Text(
                youPct,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun DistributionBar(comparison: AnalyteComparison) {
    val total = comparison.distribution.sum().coerceAtLeast(1)
    Row(modifier = Modifier.fillMaxWidth().height(20.dp).clip(RoundedCornerShape(6.dp))) {
        comparison.distribution.forEachIndexed { index, count ->
            val weight = (count.toFloat() / total).coerceAtLeast(0.0001f)
            val color = bandColor(index, comparison.bandLabels.size, isYourBand = index == comparison.yourBandIndex)
            val border = if (index == comparison.yourBandIndex) Color.White else Color.Transparent
            Box(
                modifier = Modifier
                    .weight(weight)
                    .fillMaxSize()
                    .background(color),
            ) {
                if (index == comparison.yourBandIndex) {
                    Box(
                        modifier = Modifier
                            .width(2.dp)
                            .fillMaxSize()
                            .background(border),
                    )
                }
            }
        }
    }
    if (comparison.distribution.sum() == 0) {
        Spacer(Modifier.height(0.dp))
    }
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(
            comparison.bandLabels.firstOrNull() ?: "",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            comparison.bandLabels.lastOrNull() ?: "",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun bandColor(index: Int, total: Int, isYourBand: Boolean): Color {
    val t = if (total <= 1) 0f else index.toFloat() / (total - 1)
    val base = lerpColor(Color(0xFF38BDF8), Color(0xFFEF4444), t)
    return if (isYourBand) base else base.copy(alpha = 0.55f)
}

private fun lerpColor(start: Color, end: Color, fraction: Float): Color {
    val f = fraction.coerceIn(0f, 1f)
    return Color(
        red = start.red + (end.red - start.red) * f,
        green = start.green + (end.green - start.green) * f,
        blue = start.blue + (end.blue - start.blue) * f,
        alpha = start.alpha + (end.alpha - start.alpha) * f,
    )
}

private fun Double.formatPct(): String =
    if (this >= 10.0) "%.0f".format(this) else "%.1f".format(this)

@Composable
private fun LabeledLine(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
