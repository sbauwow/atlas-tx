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

@Serializable
data class CountyPolygon(
    val fips: String,
    val name: String,
    /**
     * Pre-projected rings in a normalized [viewWidth] × [viewHeight] coordinate
     * space (set on the parent asset). Each ring is a flat `[x0, y0, x1, y1, ...]`
     * list of doubles. Multipolygons land here as separate ring entries on the
     * same county; we render and hit-test them independently.
     */
    val rings: List<List<Double>>,
)

@Serializable
data class CountyPolygonAsset(
    val viewWidth: Double,
    val viewHeight: Double,
    val counties: List<CountyPolygon>,
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

object CountyPolygons {
    private const val ASSET_PATH = "tx-counties-polygons.json"

    @Volatile
    private var cached: CountyPolygonAsset? = null

    private val json = Json { ignoreUnknownKeys = true }

    fun load(context: Context): CountyPolygonAsset {
        cached?.let { return it }
        synchronized(this) {
            cached?.let { return it }
            val raw = context.assets.open(ASSET_PATH).bufferedReader().use { it.readText() }
            val parsed = json.decodeFromString<CountyPolygonAsset>(raw)
            cached = parsed
            return parsed
        }
    }
}
