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
