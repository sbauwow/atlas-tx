package com.atlastx.capture.ui

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.atlastx.capture.data.SettingsRepository

object Routes {
    const val HOME = "home"
    const val CAPTURE = "capture"
    const val RESULT = "result"
    const val SETTINGS = "settings"
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
                onCapture = { nav.navigate(Routes.CAPTURE) },
                onSettings = { nav.navigate(Routes.SETTINGS) },
            )
        }
        composable(Routes.CAPTURE) {
            CaptureScreen(
                viewModel = viewModel,
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
