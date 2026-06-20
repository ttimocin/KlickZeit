import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { useAuth } from './AuthContext';

// API Keys
const API_KEYS = {
  apple: 'test_OxCywxSZWDxZqJHLmSHbSruWlJo',
  google: 'test_OxCywxSZWDxZqJHLmSHbSruWlJo',
};

// Entitlement Name
export const ENTITLEMENT_ID = 'KlickZeit Pro';

interface PurchasesContextState {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  restorePurchases: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextState>({
  isPro: false,
  customerInfo: null,
  isLoading: true,
  restorePurchases: async () => {},
});

export const usePurchases = () => useContext(PurchasesContext);

export const PurchasesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const setupPurchases = async () => {
      try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: API_KEYS.apple });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: API_KEYS.google });
        }

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
  }, []);

  // Kullanıcı değiştiğinde (giriş/çıkış yaptığında) RevenueCat'e kimliği bildir
  useEffect(() => {
    const syncUserIdentity = async () => {
      try {
        if (user && !user.isAnonymous) {
          // Gerçek kullanıcı giriş yaptıysa ID'sini bildir
          const { customerInfo } = await Purchases.logIn(user.uid);
          setCustomerInfo(customerInfo);
          setIsPro(typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
        } else {
          // Anonim kullanıcıysa veya çıkış yaptıysa
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
  }, [user, isLoading]);

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setIsPro(typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
    } catch (error) {
      console.error('Error restoring purchases:', error);
    }
  };

  return (
    <PurchasesContext.Provider value={{ isPro, customerInfo, isLoading, restorePurchases }}>
      {children}
    </PurchasesContext.Provider>
  );
};
