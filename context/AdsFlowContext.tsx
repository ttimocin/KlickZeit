import { usePurchases } from '@/context/PurchasesContext';
import {
  incrementAndGetLaunchCount,
  shouldShowAdsForSession,
} from '@/services/ad-session';
import {
  initializeMobileAds,
  presentAdsConsentForms,
  requestAppTrackingIfNeeded,
} from '@/utils/mobile-ads';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

type AdsFlowContextValue = {
  isReady: boolean;
  shouldShowAds: boolean;
  consentFlowCompleted: boolean;
};

const AdsFlowContext = createContext<AdsFlowContextValue | null>(null);

export function AdsFlowProvider({ children }: { children: React.ReactNode }) {
  const { isPro, isLoading: purchasesLoading } = usePurchases();
  const [isReady, setIsReady] = useState(false);
  const [shouldShowAds, setShouldShowAds] = useState(false);
  const [consentFlowCompleted, setConsentFlowCompleted] = useState(false);
  const consentStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const launchCount = await incrementAndGetLaunchCount();
        if (!cancelled) {
          setShouldShowAds(shouldShowAdsForSession(launchCount));
        }
      } catch (error) {
        console.warn('Oturum sayacı okunamadı:', error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || purchasesLoading) return;

    // İlk oturum: reklam yok, UMP ve iOS ATT istenmez.
    if (!shouldShowAds || isPro) {
      setConsentFlowCompleted(true);
      return;
    }

    if (consentStartedRef.current) return;
    consentStartedRef.current = true;

    let cancelled = false;

    (async () => {
      if (Platform.OS === 'web') {
        if (!cancelled) setConsentFlowCompleted(true);
        return;
      }

      try {
        // 2+ oturum: AdMob → Google UMP onayı → iOS ATT → bannerlar
        await initializeMobileAds();
        await presentAdsConsentForms();
        await requestAppTrackingIfNeeded();
      } catch (error) {
        console.warn('Reklam gizlilik akışı tamamlanamadı:', error);
      } finally {
        if (!cancelled) setConsentFlowCompleted(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, purchasesLoading, shouldShowAds, isPro]);

  return (
    <AdsFlowContext.Provider
      value={{
        isReady,
        shouldShowAds,
        consentFlowCompleted,
      }}
    >
      {children}
    </AdsFlowContext.Provider>
  );
}

export function useAdsFlow(): AdsFlowContextValue {
  const ctx = useContext(AdsFlowContext);
  if (!ctx) {
    throw new Error('useAdsFlow must be used within AdsFlowProvider');
  }
  return ctx;
}
