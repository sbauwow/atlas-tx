package com.atlastx.capture.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

const val OBSERVATION_SCHEMA_VERSION = 1
const val DEFAULT_CHART_ID = "jed-pool-tools-5way-v1"

@Serializable
data class ClientReading(
    val schemaVersion: Int = OBSERVATION_SCHEMA_VERSION,
    val chartId: String = DEFAULT_CHART_ID,
    val perAnalyte: List<JsonElement> = emptyList(),
)

@Serializable
data class ObservationResponse(
    val observation: Observation? = null,
    val deduped: Boolean? = null,
    val error: String? = null,
    val comparison: ObservationComparison? = null,
)

@Serializable
data class ObservationComparison(
    val countySlug: String? = null,
    val countyScope: ComparisonScope? = null,
    val stateScope: ComparisonScope,
    val smallSampleThreshold: Int = 5,
)

@Serializable
data class ComparisonScope(
    val observationCount: Int,
    val perAnalyte: List<AnalyteComparison> = emptyList(),
)

@Serializable
data class AnalyteComparison(
    val analyteId: String,
    val analyteName: String,
    val bandLabels: List<String> = emptyList(),
    val yourBandIndex: Int,
    val yourBandLabel: String,
    val distribution: List<Int> = emptyList(),
    val distributionPercent: List<Double> = emptyList(),
    val totalCount: Int,
    val yourPercentile: Int,
    val modeBandIndex: Int? = null,
    val smallSample: Boolean = true,
)

@Serializable
data class Observation(
    val id: String,
    val createdAt: String? = null,
    val kind: String? = null,
    val countySlug: String? = null,
    val stripBrand: String? = null,
    val status: String,
    val agreement: Double? = null,
    val qaFlags: List<String> = emptyList(),
    val llmModel: String? = null,
    @SerialName("llmReading") val llmReading: JsonElement? = null,
)

@Serializable
data class ObservationListResponse(
    val items: List<Observation> = emptyList(),
)

@Serializable
data class WaterOverviewResponse(
    val counties: List<CountyOverviewEntry> = emptyList(),
)

@Serializable
data class CountyOverviewEntry(
    val county: CountyOverviewRef,
    val metrics: CountyOverviewMetrics = CountyOverviewMetrics(),
    val mismatch: CountyOverviewMismatch? = null,
)

@Serializable
data class CountyOverviewRef(
    val slug: String,
    val name: String,
    val fips: String? = null,
)

@Serializable
data class CountyOverviewMetrics(
    val floodplainFeatureCount: Int? = null,
    val activeWaterAlertCount: Int? = null,
    val sewerOverflowCount30d: Int? = null,
    val streamGaugeCount: Int? = null,
    val generalPermitCount: Int? = null,
)

@Serializable
data class CountyOverviewMismatch(
    val score: Int? = null,
    val flags: List<String> = emptyList(),
)
