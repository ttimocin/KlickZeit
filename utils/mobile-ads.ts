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

/** AdMob UMP — AB / ABD eyaletleri gizlilik onayı (tek form). */
export async function presentAdsConsentForms(): Promise<void> {
  if (!isMobileAdsNativeModuleAvailable()) return;

  const { AdsConsent } = require('react-native-google-mobile-ads');

  // gatherConsent = requestInfoUpdate + loadAndShowConsentFormIfRequired
  // showPrivacyOptionsForm ayrıca çağrılmaz — aynı onay ekranını ikinci kez açar.
  // Gizlilik seçenekleri ayarlardan erişilebilir olmalı (privacyOptionsRequirementStatus).
  await AdsConsent.gatherConsent();
}

/** UMP: ayarlarda gizlilik seçenekleri girişi gerekli mi? */
export async function isAdsPrivacyOptionsRequired(): Promise<boolean> {
  if (!isMobileAdsNativeModuleAvailable()) return false;

  try {
    const {
      AdsConsent,
      AdsConsentPrivacyOptionsRequirementStatus,
    } = require('react-native-google-mobile-ads');
    const status = await AdsConsent.getPrivacyOptionsRequirementStatus();
    return status === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch (error) {
    console.warn('AdMob gizlilik seçenekleri durumu okunamadı:', error);
    return false;
  }
}

/** Ayarlardan reklam onayı / gizlilik tercihlerini yeniden aç. */
export async function presentAdsConsentFromSettings(): Promise<boolean> {
  if (!isMobileAdsNativeModuleAvailable()) return false;

  const {
    AdsConsent,
    AdsConsentPrivacyOptionsRequirementStatus,
  } = require('react-native-google-mobile-ads');

  const info = await AdsConsent.requestInfoUpdate();

  if (
    info.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
  ) {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  }

  if (info.isConsentFormAvailable) {
    await AdsConsent.showForm();
    return true;
  }

  await AdsConsent.loadAndShowConsentFormIfRequired();
  const after = await AdsConsent.getConsentInfo();
  return after.isConsentFormAvailable || after.status !== 'UNKNOWN';
}

/** Ayarlardan "Gizlilik seçenekleri" için — otomatik gösterilmez. */
export async function presentAdsPrivacyOptionsForm(): Promise<void> {
  if (!isMobileAdsNativeModuleAvailable()) return;

  const { AdsConsent } = require('react-native-google-mobile-ads');
  await AdsConsent.showPrivacyOptionsForm();
}

/** iOS ATT — UMP gatherConsent sonrası, yalnızca reklam gösterilecek kullanıcılar için. */
export async function requestAppTrackingIfNeeded(): Promise<void> {
  if (Platform.OS !== 'ios') return;

  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    await requestTrackingPermissionsAsync();
  } catch (error) {
    console.warn('ATT izni istenemedi:', error);
  }
}

export function getBannerAdUnitId(productionId: string): string {
  if (__DEV__) return GOOGLE_TEST_BANNER_ID;
  return productionId;
}
