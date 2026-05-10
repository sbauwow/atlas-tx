package com.atlastx.capture

import android.app.Application
import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.atlastx.capture.data.SettingsRepository

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "atlas_capture_settings")

class AtlasApp : Application() {
    val settings: SettingsRepository by lazy { SettingsRepository(dataStore) }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        @Volatile var instance: AtlasApp? = null
            private set
    }
}
