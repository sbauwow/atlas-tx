package com.atlastx.capture

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import com.atlastx.capture.ui.AppRoot
import com.atlastx.capture.ui.theme.AtlasCaptureTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as AtlasApp
        lifecycleScope.launch { app.settings.ensureDeviceId() }

        setContent {
            AtlasCaptureTheme {
                AppRoot(settings = app.settings)
            }
        }
    }
}
