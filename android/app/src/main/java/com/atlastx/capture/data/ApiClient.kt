package com.atlastx.capture.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.util.concurrent.TimeUnit

sealed interface SubmitResult {
    data class Ok(val observation: Observation, val deduped: Boolean) : SubmitResult
    data class Error(val message: String) : SubmitResult
}

class ApiClient {
    private val http = OkHttpClient.Builder()
        .callTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    suspend fun submitStrip(
        baseUrl: String,
        deviceId: String,
        stripBrand: String,
        countySlug: String?,
        imageFile: File,
        imageMime: String,
    ): SubmitResult = withContext(Dispatchers.IO) {
        val reading = ClientReading()
        val readingJson = json.encodeToString(reading)

        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                name = "image",
                filename = imageFile.name,
                body = imageFile.asRequestBody(imageMime.toMediaType()),
            )
            .addFormDataPart("clientReading", readingJson)
            .addFormDataPart("stripBrand", stripBrand)
            .apply { countySlug?.let { addFormDataPart("countySlug", it) } }
            .build()

        val request = Request.Builder()
            .url("${baseUrl.trimEnd('/')}/api/citizen/observations")
            .header("X-Atlas-Capture-Device-Id", deviceId)
            .header("User-Agent", "atlas-tx-capture/0.1.0 (android)")
            .post(body)
            .build()

        runCatching { http.newCall(request).execute() }.fold(
            onSuccess = { resp ->
                resp.use {
                    val text = it.body?.string().orEmpty()
                    if (!it.isSuccessful) {
                        val msg = runCatching { json.decodeFromString<ObservationResponse>(text).error }
                            .getOrNull() ?: "HTTP ${it.code}"
                        SubmitResult.Error(msg)
                    } else {
                        runCatching { json.decodeFromString<ObservationResponse>(text) }.fold(
                            onSuccess = { parsed ->
                                val obs = parsed.observation
                                if (obs == null) SubmitResult.Error(parsed.error ?: "no observation in response")
                                else SubmitResult.Ok(obs, parsed.deduped == true)
                            },
                            onFailure = { e -> SubmitResult.Error("parse failed: ${e.message}") },
                        )
                    }
                }
            },
            onFailure = { e -> SubmitResult.Error("network: ${e.message ?: e.javaClass.simpleName}") },
        )
    }

    suspend fun ping(baseUrl: String): Boolean = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("${baseUrl.trimEnd('/')}/api/citizen/observations")
            .get()
            .build()
        runCatching { http.newCall(request).execute().use { it.isSuccessful } }.getOrDefault(false)
    }

    @Suppress("unused")
    private fun emptyJsonBody() = "{}".toRequestBody("application/json".toMediaType())
}
