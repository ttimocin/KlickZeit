import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { ENTITLEMENT_ID } from '@/context/PurchasesContext';

const OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || null;

/**
 * RevenueCat'te yayınladığın paywall, Current Offering'e bağlı olmalı.
 * Aksi halde SDK varsayılan şablonu gösterir (futbol videosu / basit liste).
 */
export async function presentKlickZeitPaywall(): Promise<PAYWALL_RESULT> {
  const offerings = await Purchases.getOfferings();

  const offering =
    (OFFERING_ID && offerings.all[OFFERING_ID]) ||
    offerings.current ||
    null;

  if (__DEV__) {
    console.log('[RevenueCat] offerings.current:', offerings.current?.identifier ?? 'yok');
    console.log('[RevenueCat] kullanılan offering:', offering?.identifier ?? 'yok');
    console.log(
      '[RevenueCat] paketler:',
      offering?.availablePackages.map((p) => p.identifier).join(', ') || 'yok'
    );
    if (!offering?.paywall) {
      console.warn(
        '[RevenueCat] Bu offering için paywall bağlı değil — Dashboard: Offerings → offering → Paywall seç'
      );
    }
  }

  if (!offering) {
    throw new Error('RevenueCat offering bulunamadı');
  }

  return RevenueCatUI.presentPaywall({ offering });
}

export async function presentKlickZeitPaywallIfNeeded(): Promise<PAYWALL_RESULT> {
  const offerings = await Purchases.getOfferings();
  const offering =
    (OFFERING_ID && offerings.all[OFFERING_ID]) ||
    offerings.current ||
    undefined;

  return RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT_ID,
    offering,
  });
}
