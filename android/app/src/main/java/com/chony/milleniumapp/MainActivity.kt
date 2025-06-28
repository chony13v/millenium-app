package com.chony.milleniumapp

import android.os.Build 
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // ──────────────────────────────────────────────────────────────
    // Mantén el hook de Expo Splash Screen (GENERATED – no modificar)
    // ──────────────────────────────────────────────────────────────
    SplashScreenManager.registerOnActivity(this)

    // Setup de React Native
    super.onCreate(null)

    // Ya no hay lógica de Edge-to-Edge aquí
  }

  /** Nombre del componente JS. */
  override fun getMainComponentName(): String = "main"

  /** React Activity Delegate (sin cambios). */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(
        this,
        mainComponentName,
        fabricEnabled
      ) {}
    )

  /**
   * Alinea el comportamiento del botón “atrás” con Android S+
   */
  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed()
      }
      return
    }
    super.invokeDefaultOnBackPressed()
  }
}
