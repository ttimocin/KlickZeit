import { NativeModules, Platform } from 'react-native';

const GOOGLE_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

export function isMobileAdsNativeModuleAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  return NativeModules.RNGoogleMobileAdsModule != null;
}

export async function initializeMobileAds(): Promise<void> {
  if (!isMobileAdsNativeModuleAvailable()) {
    console.log('AdMob native modülü yok — reklamlar devre dışı.');
    return;
  }

  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    await mobileAds().initialize();
  } catch (error) {
    console.log('AdMob başlatılamadı:', error);
  }
}

export function getBannerAdUnitId(productionId: string): string {
  if (__DEV__) return GOOGLE_TEST_BANNER_ID;
  return productionId;
}
