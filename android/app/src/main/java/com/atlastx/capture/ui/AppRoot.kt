package com.atlastx.capture.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.atlastx.capture.data.SettingsRepository

object Routes {
    const val HOME = "home"
    const val CAPTURE = "capture?source={source}"
    const val RESULT = "result"
    const val SETTINGS = "settings"

    fun capture(source: CaptureSource = CaptureSource.NONE): String =
        "capture?source=${source.value}"
}

enum class CaptureSource(val value: String) {
    NONE("none"),
    CAMERA("camera"),
    GALLERY("gallery");

    companion object {
        fun fromString(s: String?): CaptureSource = entries.firstOrNull { it.value == s } ?: NONE
    }
}

@Composable
fun AppRoot(settings: SettingsRepository) {
    val nav = rememberNavController()
    val viewModel: CaptureViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        factory = CaptureViewModel.factory(settings),
    )

    NavHost(navController = nav, startDestination = Routes.HOME) {
        composable(Routes.HOME) {
            HomeScreen(
                viewModel = viewModel,
                onTakePhoto = { nav.navigate(Routes.capture(CaptureSource.CAMERA)) },
                onUploadExisting = { nav.navigate(Routes.capture(CaptureSource.GALLERY)) },
                onSettings = { nav.navigate(Routes.SETTINGS) },
            )
        }
        composable(
            route = Routes.CAPTURE,
            arguments = listOf(
                navArgument("source") {
                    type = NavType.StringType
                    defaultValue = CaptureSource.NONE.value
                    nullable = false
                },
            ),
        ) { backStackEntry ->
            val source = CaptureSource.fromString(backStackEntry.arguments?.getString("source"))
            CaptureScreen(
                viewModel = viewModel,
                initialSource = source,
                onSubmitted = {
                    nav.navigate(Routes.RESULT) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onBack = { nav.popBackStack() },
            )
        }
        composable(Routes.RESULT) {
            ResultScreen(
                viewModel = viewModel,
                onDone = {
                    nav.popBackStack(Routes.HOME, inclusive = false)
                },
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(
                viewModel = viewModel,
                onBack = { nav.popBackStack() },
            )
        }
    }
}
