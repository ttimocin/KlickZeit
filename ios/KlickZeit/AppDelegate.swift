import Expo
import FirebaseCore
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

// @react-native-firebase/app-didFinishLaunchingWithOptions
    FirebaseApp.configure()

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    let port = ProcessInfo.processInfo.environment["RCT_METRO_PORT"] ?? "8083"
#if targetEnvironment(simulator)
    let host = ProcessInfo.processInfo.environment["RCT_METRO_HOST"] ?? "127.0.0.1"
#else
    let host: String = {
      if let envHost = ProcessInfo.processInfo.environment["RCT_METRO_HOST"], !envHost.isEmpty {
        return envHost
      }
      if let ipPath = Bundle.main.path(forResource: "ip", ofType: "txt"),
         let ip = try? String(contentsOfFile: ipPath, encoding: .utf8)
           .trimmingCharacters(in: .whitespacesAndNewlines),
         !ip.isEmpty {
        return ip
      }
      let packagerHost = RCTBundleURLProvider.sharedSettings().packagerServerHost()
      if !packagerHost.isEmpty {
        return packagerHost
      }
      return "127.0.0.1"
    }()
#endif
    return URL(string: "http://\(host):\(port)/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&lazy=true&minify=false")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
