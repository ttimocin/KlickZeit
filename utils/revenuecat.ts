import Constants from 'expo-constants';
import i18n from '@/i18n';
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
      i18n.t('purchasesNotConfiguredTitle'),
      i18n.t('purchasesNotConfiguredMessage')
    );
    return;
  }

  if (apiKey.startsWith('test_') && !isNativeDebugBuild()) {
    Alert.alert(
      i18n.t('purchasesTestModeTitle'),
      i18n.t('purchasesTestModeMessage')
    );
    return;
  }

  Alert.alert(
    i18n.t('purchasesUnavailableTitle'),
    i18n.t('purchasesUnavailableMessage')
  );
}
