package com.atlastx.capture.data

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.UUID

data class CaptureSettings(
    val baseUrl: String,
    val deviceId: String,
    val stripBrand: String,
    val attachLocation: Boolean,
)

class SettingsRepository(private val store: DataStore<Preferences>) {

    val flow: Flow<CaptureSettings> = store.data.map { prefs ->
        CaptureSettings(
            baseUrl = prefs[KEY_BASE_URL] ?: DEFAULT_BASE_URL,
            deviceId = prefs[KEY_DEVICE_ID] ?: "",
            stripBrand = prefs[KEY_STRIP_BRAND] ?: DEFAULT_STRIP_BRAND,
            attachLocation = prefs[KEY_ATTACH_LOCATION] ?: false,
        )
    }

    suspend fun current(): CaptureSettings = flow.first()

    suspend fun ensureDeviceId(): String = store.edit { prefs ->
        if (prefs[KEY_DEVICE_ID].isNullOrBlank()) {
            prefs[KEY_DEVICE_ID] = UUID.randomUUID().toString()
        }
    }[KEY_DEVICE_ID]!!

    suspend fun setBaseUrl(value: String) = store.edit { it[KEY_BASE_URL] = value.trim() }
    suspend fun setStripBrand(value: String) = store.edit { it[KEY_STRIP_BRAND] = value.trim() }
    suspend fun setAttachLocation(value: Boolean) = store.edit { it[KEY_ATTACH_LOCATION] = value }
    suspend fun regenerateDeviceId() = store.edit { it[KEY_DEVICE_ID] = UUID.randomUUID().toString() }

    companion object {
        const val DEFAULT_BASE_URL = "https://atlastexas.org"
        const val DEFAULT_STRIP_BRAND = "JED Pool Tools 5-way"

        private val KEY_BASE_URL = stringPreferencesKey("base_url")
        private val KEY_DEVICE_ID = stringPreferencesKey("device_id")
        private val KEY_STRIP_BRAND = stringPreferencesKey("strip_brand")
        private val KEY_ATTACH_LOCATION = booleanPreferencesKey("attach_location")
    }
}
