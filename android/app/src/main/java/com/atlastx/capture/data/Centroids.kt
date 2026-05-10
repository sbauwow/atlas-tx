package com.atlastx.capture.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class CountyCentroid(
    val slug: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val fips: String? = null,
)

object Centroids {
    private const val ASSET_PATH = "tx-county-centroids.json"

    @Volatile
    private var cached: List<CountyCentroid>? = null

    private val json = Json { ignoreUnknownKeys = true }

    fun load(context: Context): List<CountyCentroid> {
        cached?.let { return it }
        synchronized(this) {
            cached?.let { return it }
            val raw = context.assets.open(ASSET_PATH).bufferedReader().use { it.readText() }
            val parsed = json.decodeFromString<List<CountyCentroid>>(raw)
            cached = parsed
            return parsed
        }
    }
}
