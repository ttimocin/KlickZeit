import Constants from 'expo-constants';
import { Alert, NativeModules, Platform } from 'react-native';

type RevenueCatExtra = {
  appleApiKey?: string;
  googleApiKey?: string;
};

type KlickZeitBuildConfigModule = {
  isDebug?: boolean;
  buildType?: string;
};

const fromBuildConfig = Constants.expoConfig?.extra?.revenueCat as RevenueCatExtra | undefined;
const nativeBuildConfig = NativeModules.KlickZeitBuildConfig as KlickZeitBuildConfigModule | undefined;

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    return fromBuildConfig?.appleApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? null;
  }
  if (Platform.OS === 'android') {
    return fromBuildConfig?.googleApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? null;
  }
  return null;
}

/** Embedded JS bundle may have __DEV__=false even in debug APK; use native BuildConfig.DEBUG. */
export function isNativeDebugBuild(): boolean {
  if (__DEV__) return true;
  if (nativeBuildConfig?.isDebug === true) return true;
  if (nativeBuildConfig?.buildType === 'debug') return true;
  return false;
}

/** RevenueCat test_ anahtarları yalnızca native debug build'de çalışır. */
export function shouldEnablePurchases(): boolean {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) return false;
  if (apiKey.startsWith('test_') && !isNativeDebugBuild()) return false;
  return true;
}

export function showPurchasesUnavailableAlert(): void {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    Alert.alert(
      'Premium yapılandırılmamış',
      'RevenueCat API anahtarı bulunamadı. .env dosyasını kontrol edin.'
    );
    return;
  }

  if (apiKey.startsWith('test_') && !isNativeDebugBuild()) {
    Alert.alert(
      'Premium (test modu)',
      'Test Store anahtarı release APK\'da çalışmaz. Premium testi için debug APK kullanın veya RevenueCat\'ten goog_ production anahtarı ekleyin.'
    );
    return;
  }

  Alert.alert(
    'Premium kullanılamıyor',
    'Satın alma ekranı şu an açılamıyor. Lütfen daha sonra tekrar deneyin.'
  );
}
