package com.atlastx.capture.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.Canvas
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.data.CountyCentroid
import com.atlastx.capture.data.CountyOverviewEntry
import kotlinx.coroutines.launch

private val SeverityPalette = listOf(
    Color(0xFF334155), // 0 — slate-700
    Color(0xFF22D3EE), // 1 — cyan-400
    Color(0xFFEAB308), // 2 — yellow-500
    Color(0xFFF97316), // 3 — orange-500
    Color(0xFFEF4444), // 4 — red-500
)

private fun severityFor(entry: CountyOverviewEntry?): Int {
    if (entry == null) return 0
    val mismatch = entry.mismatch?.score ?: 0
    val risk = (entry.metrics.floodplainFeatureCount ?: 0) * 3 +
        (entry.metrics.activeWaterAlertCount ?: 0) * 4 +
        (entry.metrics.sewerOverflowCount30d ?: 0) * 2 +
        (entry.metrics.streamGaugeCount ?: 0)
    val mismatchLevel = when {
        mismatch >= 75 -> 4
        mismatch >= 40 -> 3
        else -> 0
    }
    val riskLevel = when {
        risk >= 8 -> 3
        risk >= 4 -> 2
        risk >= 1 -> 1
        else -> 0
    }
    return maxOf(mismatchLevel, riskLevel)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(viewModel: CaptureViewModel) {
    val mapState by viewModel.mapData.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.loadMapData() }

    var selected by remember { mutableStateOf<CountyCentroid?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScopeCompat()

    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 16.dp)) {
        Text(
            "Texas water risk",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            "Mismatch + operational pressure across 254 counties. Tap a county for detail.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1.05f)
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF020617)),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = mapState) {
                MapDataState.Idle, MapDataState.Loading -> CircularProgressIndicator(color = Color(0xFF22D3EE))
                is MapDataState.Failed -> Text(
                    "Map data failed: ${s.message}",
                    color = Color(0xFFFCA5A5),
                    modifier = Modifier.padding(20.dp),
                )
                is MapDataState.Ready -> CountyChoropleth(
                    centroids = s.centroids,
                    overviewBySlug = s.overviewBySlug,
                    onSelect = { selected = it },
                )
            }
        }

        Spacer(Modifier.height(12.dp))
        SeverityLegend()

        if (mapState is MapDataState.Ready) {
            Spacer(Modifier.height(12.dp))
            Text(
                "${(mapState as MapDataState.Ready).overviewBySlug.size} counties · live from atlastexas.org",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }

    val current = selected
    val ready = mapState as? MapDataState.Ready
    if (current != null && ready != null) {
        ModalBottomSheet(
            onDismissRequest = { selected = null },
            sheetState = sheetState,
        ) {
            CountyDetailSheet(
                centroid = current,
                entry = ready.overviewBySlug[current.slug],
                onClose = {
                    scope.launch { sheetState.hide() }.invokeOnCompletion {
                        if (!sheetState.isVisible) selected = null
                    }
                },
            )
        }
    }
}

@Composable
private fun rememberCoroutineScopeCompat() = androidx.compose.runtime.rememberCoroutineScope()

@Composable
private fun CountyChoropleth(
    centroids: List<CountyCentroid>,
    overviewBySlug: Map<String, CountyOverviewEntry>,
    onSelect: (CountyCentroid) -> Unit,
) {
    val bounds by remember(centroids) {
        derivedStateOf {
            val minLat = centroids.minOf { it.lat }
            val maxLat = centroids.maxOf { it.lat }
            val minLon = centroids.minOf { it.lon }
            val maxLon = centroids.maxOf { it.lon }
            Bounds(minLat, maxLat, minLon, maxLon)
        }
    }

    val ranked = remember(centroids, overviewBySlug) {
        centroids.map { c ->
            val entry = overviewBySlug[c.slug]
            CentroidRender(centroid = c, severity = severityFor(entry))
        }.sortedBy { it.severity } // higher severity drawn last (on top)
    }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(centroids, bounds) {
                detectTapGestures { tap ->
                    val pad = 24f
                    val w = size.width.toFloat()
                    val h = size.height.toFloat()
                    val nearest = centroids.minByOrNull { c ->
                        val (x, y) = project(c, bounds, w, h, pad)
                        val dx = tap.x - x
                        val dy = tap.y - y
                        dx * dx + dy * dy
                    }
                    if (nearest != null) {
                        val (nx, ny) = project(nearest, bounds, w, h, pad)
                        val dx = tap.x - nx
                        val dy = tap.y - ny
                        if (dx * dx + dy * dy < 80f * 80f) onSelect(nearest)
                    }
                }
            },
    ) {
        val pad = 24f
        val w = size.width
        val h = size.height
        for (entry in ranked) {
            val (x, y) = project(entry.centroid, bounds, w, h, pad)
            val color = SeverityPalette[entry.severity]
            val r = if (entry.severity >= 3) 9f else 6f
            drawCircle(color = color, radius = r, center = Offset(x, y))
            if (color.luminance() > 0.4f) {
                drawCircle(color = Color(0xFF0F172A), radius = r, center = Offset(x, y), style = Stroke(width = 1f))
            }
        }
    }
}

private data class Bounds(val minLat: Double, val maxLat: Double, val minLon: Double, val maxLon: Double)
private data class CentroidRender(val centroid: CountyCentroid, val severity: Int)

private fun project(
    c: CountyCentroid,
    b: Bounds,
    width: Float,
    height: Float,
    pad: Float,
): Pair<Float, Float> {
    val w = width - pad * 2
    val h = height - pad * 2
    val x = ((c.lon - b.minLon) / (b.maxLon - b.minLon)) * w + pad
    val y = h - ((c.lat - b.minLat) / (b.maxLat - b.minLat)) * h + pad
    return x.toFloat() to y.toFloat()
}

@Composable
private fun SeverityLegend() {
    val labels = listOf("none", "low", "moderate", "high", "severe")
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        for (i in 0..4) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(10.dp).clip(CircleShape).background(SeverityPalette[i]),
                )
                Spacer(Modifier.size(6.dp))
                Text(labels[i], style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun CountyDetailSheet(
    centroid: CountyCentroid,
    entry: CountyOverviewEntry?,
    onClose: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp).fillMaxWidth()) {
        Text(centroid.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        Text(
            "FIPS ${centroid.fips ?: "—"} · ${"%.3f".format(centroid.lat)}, ${"%.3f".format(centroid.lon)}",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(12.dp))

        if (entry == null) {
            Text("No live overview entry for this county yet.", style = MaterialTheme.typography.bodyMedium)
        } else {
            MetricRow("Floodplain footprint", entry.metrics.floodplainFeatureCount)
            MetricRow("Active alerts", entry.metrics.activeWaterAlertCount)
            MetricRow("Stream gauges", entry.metrics.streamGaugeCount)
            MetricRow("Sewer overflows (30d)", entry.metrics.sewerOverflowCount30d)
            MetricRow("Permits", entry.metrics.generalPermitCount)
            entry.mismatch?.score?.let { MetricRow("Mismatch score", it) }
            if (!entry.mismatch?.flags.isNullOrEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "Mismatch flags",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                entry.mismatch?.flags?.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            }
        }

        Spacer(Modifier.height(16.dp))
        Button(onClick = onClose, modifier = Modifier.fillMaxWidth()) { Text("Close") }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun MetricRow(label: String, value: Int?) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            value?.toString() ?: "—",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
        )
    }
}
