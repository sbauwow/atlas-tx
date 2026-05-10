package com.atlastx.capture.ui

import androidx.compose.foundation.Canvas
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.atlastx.capture.data.CountyCentroid
import com.atlastx.capture.data.CountyOverviewEntry
import com.atlastx.capture.data.CountyPolygonAsset
import kotlinx.coroutines.launch

private val SeverityPalette = listOf(
    Color(0xFF334155), // 0 — slate-700
    Color(0xFF22D3EE), // 1 — cyan-400
    Color(0xFFEAB308), // 2 — yellow-500
    Color(0xFFF97316), // 3 — orange-500
    Color(0xFFEF4444), // 4 — red-500
)
private val Accent = Color(0xFF22D3EE)

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

    var selectedFips by remember { mutableStateOf<String?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()

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
                MapDataState.Idle, MapDataState.Loading -> CircularProgressIndicator(color = Accent)
                is MapDataState.Failed -> Text(
                    "Map data failed: ${s.message}",
                    color = Color(0xFFFCA5A5),
                    modifier = Modifier.padding(20.dp),
                )
                is MapDataState.Ready -> CountyChoropleth(
                    polygons = s.polygons,
                    overviewByFips = s.overviewBySlug.values.associateBy {
                        it.county.fips ?: it.county.slug
                    },
                    selectedFips = selectedFips,
                    onSelect = { selectedFips = it },
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

    val ready = mapState as? MapDataState.Ready
    val pickedFips = selectedFips
    if (pickedFips != null && ready != null) {
        val centroid = ready.centroids.firstOrNull { it.fips == pickedFips }
        val polygon = ready.polygons.counties.firstOrNull { it.fips == pickedFips }
        val overview = ready.overviewBySlug.values.firstOrNull {
            (it.county.fips ?: "") == pickedFips
        }
        val name = centroid?.name ?: overview?.county?.name ?: polygon?.name ?: "County"
        val slug = centroid?.slug ?: overview?.county?.slug
        ModalBottomSheet(
            onDismissRequest = { selectedFips = null },
            sheetState = sheetState,
        ) {
            CountyDetailSheet(
                name = name,
                fips = pickedFips,
                slug = slug,
                centroid = centroid,
                entry = overview,
                onClose = {
                    scope.launch { sheetState.hide() }.invokeOnCompletion {
                        if (!sheetState.isVisible) selectedFips = null
                    }
                },
            )
        }
    }
}

private data class CountyDraw(
    val fips: String,
    val severity: Int,
    val rings: List<List<Double>>,
)

@Composable
private fun CountyChoropleth(
    polygons: CountyPolygonAsset,
    overviewByFips: Map<String, CountyOverviewEntry>,
    selectedFips: String?,
    onSelect: (String) -> Unit,
) {
    val drawList by remember(polygons, overviewByFips) {
        derivedStateOf {
            polygons.counties.map { c ->
                val entry = overviewByFips[c.fips]
                CountyDraw(
                    fips = c.fips,
                    severity = severityFor(entry),
                    rings = c.rings,
                )
            }.sortedBy { it.severity } // higher severity drawn last → on top
        }
    }

    Canvas(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(polygons) {
                detectTapGestures { tap ->
                    val s = minOf(
                        size.width / polygons.viewWidth,
                        size.height / polygons.viewHeight,
                    )
                    val offsetX = (size.width - polygons.viewWidth * s) / 2.0
                    val offsetY = (size.height - polygons.viewHeight * s) / 2.0
                    val viewX = (tap.x - offsetX) / s
                    val viewY = (tap.y - offsetY) / s
                    val hit = polygons.counties.firstOrNull { county ->
                        county.rings.any { ring -> pointInRing(ring, viewX, viewY) }
                    }
                    if (hit != null) onSelect(hit.fips)
                }
            },
    ) {
        val s = minOf(
            size.width / polygons.viewWidth.toFloat(),
            size.height / polygons.viewHeight.toFloat(),
        )
        val offsetX = (size.width - polygons.viewWidth.toFloat() * s) / 2f
        val offsetY = (size.height - polygons.viewHeight.toFloat() * s) / 2f

        for (draw in drawList) {
            val color = SeverityPalette[draw.severity]
            for (ring in draw.rings) {
                val path = ringToPath(ring, s, offsetX, offsetY)
                drawPath(path = path, color = color, alpha = if (draw.severity == 0) 0.55f else 1f)
                drawPath(
                    path = path,
                    color = Color(0xFF0F172A),
                    style = Stroke(width = 0.6f),
                )
            }
        }

        if (selectedFips != null) {
            val selected = polygons.counties.firstOrNull { it.fips == selectedFips }
            if (selected != null) {
                for (ring in selected.rings) {
                    val path = ringToPath(ring, s, offsetX, offsetY)
                    drawPath(path = path, color = Accent.copy(alpha = 0.18f))
                    drawPath(path = path, color = Accent, style = Stroke(width = 2.5f))
                }
            }
        }

        for ((fips, entry) in overviewByFips) {
            val alerts = entry.metrics.activeWaterAlertCount ?: 0
            if (alerts <= 0) continue
            val poly = polygons.counties.firstOrNull { it.fips == fips } ?: continue
            val centroid = ringCentroid(poly.rings.firstOrNull() ?: continue) ?: continue
            val cx = centroid.first.toFloat() * s + offsetX
            val cy = centroid.second.toFloat() * s + offsetY
            drawCircle(color = Color(0xFFF8FAFC), radius = 3.2f, center = Offset(cx, cy))
            drawCircle(
                color = Accent,
                radius = 7.5f,
                center = Offset(cx, cy),
                style = Stroke(width = 1.4f),
            )
        }
    }
}

private fun ringToPath(
    ring: List<Double>,
    scale: Float,
    offsetX: Float,
    offsetY: Float,
): Path {
    val path = Path()
    var i = 0
    var first = true
    while (i + 1 < ring.size) {
        val x = ring[i].toFloat() * scale + offsetX
        val y = ring[i + 1].toFloat() * scale + offsetY
        if (first) {
            path.moveTo(x, y)
            first = false
        } else {
            path.lineTo(x, y)
        }
        i += 2
    }
    path.close()
    return path
}

private fun ringCentroid(ring: List<Double>): Pair<Double, Double>? {
    if (ring.size < 4) return null
    var sumX = 0.0
    var sumY = 0.0
    var n = 0
    var i = 0
    while (i + 1 < ring.size) {
        sumX += ring[i]
        sumY += ring[i + 1]
        n += 1
        i += 2
    }
    if (n == 0) return null
    return sumX / n to sumY / n
}

private fun pointInRing(ring: List<Double>, x: Double, y: Double): Boolean {
    if (ring.size < 6) return false
    var inside = false
    var i = 0
    var j = ring.size - 2
    while (i + 1 < ring.size) {
        val xi = ring[i]; val yi = ring[i + 1]
        val xj = ring[j]; val yj = ring[j + 1]
        val intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi)
        if (intersect) inside = !inside
        j = i
        i += 2
    }
    return inside
}

@Composable
private fun SeverityLegend() {
    val labels = listOf("none", "low", "moderate", "high", "severe")
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        for (i in 0..4) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(SeverityPalette[i]))
                Spacer(Modifier.size(6.dp))
                Text(labels[i], style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun CountyDetailSheet(
    name: String,
    fips: String,
    slug: String?,
    centroid: CountyCentroid?,
    entry: CountyOverviewEntry?,
    onClose: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp).fillMaxWidth()) {
        Text(name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        Text(
            buildString {
                append("FIPS $fips")
                if (slug != null) append(" · $slug")
                if (centroid != null) {
                    append(" · ")
                    append("%.3f".format(centroid.lat))
                    append(", ")
                    append("%.3f".format(centroid.lon))
                }
            },
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
