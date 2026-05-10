package com.atlastx.capture.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.atlastx.capture.R
import com.atlastx.capture.data.SettingsRepository

object Routes {
    const val MAP = "map"
    const val CAPTURE_HOME = "capture-home"
    const val ACTIVITY = "activity"
    const val SETTINGS = "settings"

    const val CAPTURE_FLOW = "capture?source={source}"
    const val RESULT = "result"

    fun captureFlow(source: CaptureSource = CaptureSource.NONE): String =
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

private data class TabSpec(val route: String, val label: String, val icon: ImageVector)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppRoot(settings: SettingsRepository) {
    val nav = rememberNavController()
    val viewModel: CaptureViewModel = androidx.lifecycle.viewmodel.compose.viewModel(
        factory = CaptureViewModel.factory(settings),
    )

    val tabs = listOf(
        TabSpec(Routes.MAP, "Map", Icons.Filled.Map),
        TabSpec(Routes.CAPTURE_HOME, "Capture", Icons.Filled.PhotoCamera),
        TabSpec(Routes.ACTIVITY, "Activity", Icons.Filled.History),
        TabSpec(Routes.SETTINGS, "Settings", Icons.Filled.Settings),
    )

    Scaffold(
        topBar = { TopAppBar(title = { Text(stringResource(R.string.app_name)) }) },
        bottomBar = {
            val backStackEntry by nav.currentBackStackEntryAsState()
            val currentRoute = backStackEntry?.destination?.route
            // Hide nav bar inside the capture sub-flow so submission feels focused.
            val onSubFlow = currentRoute == Routes.CAPTURE_FLOW || currentRoute == Routes.RESULT
            if (!onSubFlow) {
                NavigationBar {
                    tabs.forEach { tab ->
                        val selected = backStackEntry?.destination?.hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = Routes.MAP,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.MAP) { MapScreen(viewModel) }
            composable(Routes.CAPTURE_HOME) {
                CaptureHomeScreen(
                    viewModel = viewModel,
                    onTakePhoto = { nav.navigate(Routes.captureFlow(CaptureSource.CAMERA)) },
                    onUploadExisting = { nav.navigate(Routes.captureFlow(CaptureSource.GALLERY)) },
                )
            }
            composable(Routes.ACTIVITY) { ActivityScreen(viewModel) }
            composable(Routes.SETTINGS) {
                SettingsScreen(viewModel = viewModel, onBack = { nav.popBackStack() })
            }

            composable(
                route = Routes.CAPTURE_FLOW,
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
                            popUpTo(Routes.CAPTURE_HOME) { inclusive = false }
                        }
                    },
                    onBack = { nav.popBackStack() },
                )
            }
            composable(Routes.RESULT) {
                ResultScreen(
                    viewModel = viewModel,
                    onDone = {
                        nav.popBackStack(Routes.CAPTURE_HOME, inclusive = false)
                        viewModel.loadActivity(force = true)
                    },
                )
            }
        }
    }
}
