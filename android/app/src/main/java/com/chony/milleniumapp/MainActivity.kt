package com.chony.milleniumapp

import android.os.Build
import android.os.Bundle
import android.view.View                     // ▲ NEW
import androidx.core.graphics.Insets        // ▲ NEW
import androidx.core.view.EdgeToEdge        // ▲ NEW
import androidx.core.view.ViewCompat        // ▲ NEW
import androidx.core.view.WindowInsetsCompat// ▲ NEW

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import expo.modules.splashscreen.SplashScreenManager

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // ──────────────────────────────────────────────────────────────
    // keep Expo splash-screen hook (GENERATED – do not modify)
    // ──────────────────────────────────────────────────────────────
    SplashScreenManager.registerOnActivity(this)

    // React Native setup
    super.onCreate(null)

    // ──────────────────────────────────────────────────────────────
    // Edge-to-edge handling for Android 15+ (SDK 35)
    // ──────────────────────────────────────────────────────────────
    // 1) Make status & nav bars transparent
    EdgeToEdge.enable(this)

    // 2) Grab React Native’s content view
    val root: View = findViewById(android.R.id.content)

    // 3) Apply system-bar insets as padding so UI is never hidden
    ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
      val bars: Insets = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }
  }

  /** Name of the JS component. */
  override fun getMainComponentName(): String = "main"

  /** React Activity Delegate (unchanged). */
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
   * Align back-button behaviour with Android S+
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
