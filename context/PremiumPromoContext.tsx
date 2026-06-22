import { useAdsFlow } from '@/context/AdsFlowContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { showPurchasesUnavailableAlert, shouldEnablePurchases } from '@/utils/revenuecat';

const LAST_PROMO_DATE_KEY = '@last_promo_date';

type ShowPremiumPromoOptions = {
  /** Ayarlar yanındaki Pro butonu — günlük limit ve reklam onayı beklemez. */
  manual?: boolean;
};

type PremiumPromoContextValue = {
  showPremiumPromo: (options?: ShowPremiumPromoOptions) => void;
};

const PremiumPromoContext = createContext<PremiumPromoContextValue | null>(null);

export function usePremiumPromo(): PremiumPromoContextValue {
  const ctx = useContext(PremiumPromoContext);
  if (!ctx) {
    throw new Error('usePremiumPromo must be used within PremiumPromoProvider');
  }
  return ctx;
}

export function PremiumPromoProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const { isPro, isLoading } = usePurchases();
  const { shouldShowAds, consentFlowCompleted } = useAdsFlow();
  const { forceUpdate } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const autoPromoCheckedRef = useRef(false);

  const animateIn = useCallback(() => {
    scaleAnim.setValue(0.9);
    opacityAnim.setValue(0);
    setIsVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  const showPremiumPromo = useCallback(
    async (options?: ShowPremiumPromoOptions) => {
      if (isLoading || isPro) return;

      if (!options?.manual) {
        if (!shouldShowAds || !consentFlowCompleted) return;

        try {
          const lastPromoDate = await AsyncStorage.getItem(LAST_PROMO_DATE_KEY);
          const today = new Date().toISOString().split('T')[0];
          if (lastPromoDate === today) return;
          await AsyncStorage.setItem(LAST_PROMO_DATE_KEY, today);
        } catch (error) {
          console.error('Error checking promo eligibility:', error);
        }
      }

      animateIn();
    },
    [animateIn, consentFlowCompleted, isLoading, isPro, shouldShowAds],
  );

  useEffect(() => {
    if (autoPromoCheckedRef.current) return;
    if (isLoading || isPro || !shouldShowAds || !consentFlowCompleted) return;

    autoPromoCheckedRef.current = true;
    const timer = setTimeout(() => {
      void showPremiumPromo();
    }, 800);

    return () => clearTimeout(timer);
  }, [consentFlowCompleted, isLoading, isPro, shouldShowAds, showPremiumPromo]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleAccept = () => {
    handleClose();
    setTimeout(() => {
      if (!shouldEnablePurchases()) {
        showPurchasesUnavailableAlert();
        return;
      }
      RevenueCatUI.presentPaywall().catch((error) => {
        console.error('Paywall açılamadı:', error);
      });
    }, 300);
  };

  return (
    <PremiumPromoContext.Provider value={{ showPremiumPromo }}>
      {children}
      <Modal
        key={`premium-promo-${forceUpdate}`}
        transparent
        visible={isVisible}
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#2E7D32', '#1B5E20'] : ['#4CAF50', '#2E7D32']}
              style={styles.headerGradient}
            >
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.appLogo}
                  resizeMode="cover"
                />
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.title}>{i18n.t('premiumPromoTitle')}</Text>
            </LinearGradient>

            <View style={styles.content}>
              <Text style={[styles.description, { color: isDark ? '#E0E0E0' : '#424242' }]}>
                {i18n.t('premiumPromoDescription')}
              </Text>

              <View style={styles.featuresList}>
                <View style={styles.featureRow}>
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                  <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>
                    {i18n.t('premiumPromoFeature1')}
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                  <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>
                    {i18n.t('premiumPromoFeature2')}
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Feather name="check-circle" size={20} color="#4CAF50" />
                  <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>
                    {i18n.t('premiumPromoFeature3')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleAccept} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>{i18n.t('premiumPromoAccept')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                <Text style={[styles.secondaryButtonText, { color: isDark ? '#B0B0B0' : '#757575' }]}>
                  {i18n.t('premiumPromoLater')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </PremiumPromoContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerGradient: {
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 88,
    height: 88,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  proBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
