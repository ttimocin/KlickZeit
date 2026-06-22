import {
  incrementAndGetLaunchCount,
  shouldShowAdsForSession,
} from '@/services/ad-session';
import { presentAdsConsentForms } from '@/utils/mobile-ads';
import React, {
  createContext,
  useCallback,
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
  notifyBannerAdLoaded: () => void;
  notifyBannerAdFailed: () => void;
};

const AdsFlowContext = createContext<AdsFlowContextValue | null>(null);

export function AdsFlowProvider({ children }: { children: React.ReactNode }) {
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

  const runConsentFlow = useCallback(async () => {
    if (consentStartedRef.current) return;
    consentStartedRef.current = true;

    if (Platform.OS === 'web') {
      setConsentFlowCompleted(true);
      return;
    }

    try {
      await presentAdsConsentForms();
    } catch (error) {
      console.warn('Gizlilik onay formu gösterilemedi:', error);
    } finally {
      setConsentFlowCompleted(true);
    }
  }, []);

  const notifyBannerAdLoaded = useCallback(() => {
    if (!shouldShowAds || consentStartedRef.current) return;
    void runConsentFlow();
  }, [runConsentFlow, shouldShowAds]);

  const notifyBannerAdFailed = useCallback(() => {
    if (!shouldShowAds || consentStartedRef.current) return;
    void runConsentFlow();
  }, [runConsentFlow, shouldShowAds]);

  return (
    <AdsFlowContext.Provider
      value={{
        isReady,
        shouldShowAds,
        consentFlowCompleted,
        notifyBannerAdLoaded,
        notifyBannerAdFailed,
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
