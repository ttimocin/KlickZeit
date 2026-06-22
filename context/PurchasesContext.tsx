import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import { getRevenueCatApiKey, isNativeDebugBuild, shouldEnablePurchases } from '@/utils/revenuecat';

// Entitlement Name
export const ENTITLEMENT_ID = 'KlickZeit Pro';

interface PurchasesContextState {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  purchasesEnabled: boolean;
  restorePurchases: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextState>({
  isPro: false,
  customerInfo: null,
  isLoading: true,
  purchasesEnabled: false,
  restorePurchases: async () => {},
});

export const usePurchases = () => useContext(PurchasesContext);

export const PurchasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const purchasesEnabled = shouldEnablePurchases();
  const { user } = useAuth();
  const wasIdentifiedUser = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const setupPurchases = async () => {
      if (!purchasesEnabled) {
        const apiKey = getRevenueCatApiKey();
        if (!apiKey) {
          console.error(
            'RevenueCat API key eksik. .env dosyasına EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ve EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ekleyin.'
          );
        } else if (!__DEV__ && apiKey.startsWith('test_') && !isNativeDebugBuild()) {
          console.warn(
            'RevenueCat test anahtarı release build\'de devre dışı. Premium testi için debug APK veya goog_ anahtarı kullanın.'
          );
        }
        if (isMounted) setIsLoading(false);
        return;
      }

      const apiKey = getRevenueCatApiKey();
      if (!apiKey) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey });

        const info = await Purchases.getCustomerInfo();
        if (isMounted) {
          setCustomerInfo(info);
          setIsPro(typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Purchases:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    setupPurchases();

    if (!purchasesEnabled) {
      return () => {
        isMounted = false;
      };
    }

    const customerInfoListener = (info: CustomerInfo) => {
      if (isMounted) {
        setCustomerInfo(info);
        setIsPro(typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, [purchasesEnabled]);

  useEffect(() => {
    const syncUserIdentity = async () => {
      if (!purchasesEnabled) return;

      try {
        if (user && !user.isAnonymous) {
          wasIdentifiedUser.current = true;
          const { customerInfo } = await Purchases.logIn(user.uid);
          setCustomerInfo(customerInfo);
          setIsPro(typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
        } else if (wasIdentifiedUser.current) {
          wasIdentifiedUser.current = false;
          const customerInfo = await Purchases.logOut();
          setCustomerInfo(customerInfo);
          setIsPro(typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
        }
      } catch (error) {
        console.error('Error syncing user identity to Purchases:', error);
      }
    };

    if (!isLoading) {
      syncUserIdentity();
    }
  }, [user, isLoading, purchasesEnabled]);

  const restorePurchases = async () => {
    if (!purchasesEnabled) return;

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setIsPro(typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
    } catch (error) {
      console.error('Error restoring purchases:', error);
    }
  };

  return (
    <PurchasesContext.Provider
      value={{ isPro, customerInfo, isLoading, purchasesEnabled, restorePurchases }}
    >
      {children}
    </PurchasesContext.Provider>
  );
};
