package com.taytek.zeitlog

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class KlickZeitBuildConfigModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "KlickZeitBuildConfig"

  override fun getConstants(): Map<String, Any> =
    mapOf(
      "isDebug" to BuildConfig.DEBUG,
      "buildType" to BuildConfig.BUILD_TYPE,
    )
}
