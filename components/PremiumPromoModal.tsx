import { usePurchases } from '@/context/PurchasesContext';
import { useTheme } from '@/context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { showPurchasesUnavailableAlert, shouldEnablePurchases } from '@/utils/revenuecat';

const LAST_PROMO_DATE_KEY = '@last_promo_date';

export function PremiumPromoModal() {
  const [isVisible, setIsVisible] = useState(false);
  const { isPro, isLoading } = usePurchases();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const checkPromoEligibility = async () => {
      if (isLoading || isPro) return;

      try {
        const lastPromoDate = await AsyncStorage.getItem(LAST_PROMO_DATE_KEY);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Bugün zaten gösterildiyse tekrar gösterme
        if (lastPromoDate === today) {
          return;
        }

        // Değilse göster ve bugünü kaydet
        await AsyncStorage.setItem(LAST_PROMO_DATE_KEY, today);
        
        // Animasyonlu gösterim
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
          })
        ]).start();
      } catch (error) {
        console.error('Error checking promo eligibility:', error);
      }
    };

    // Uygulama açıldıktan 3 saniye sonra göster (hemen göz yormasın)
    const timer = setTimeout(() => {
      checkPromoEligibility();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, isPro]);

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
      })
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

  if (!isVisible) return null;

  return (
    <Modal
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
              opacity: opacityAnim
            }
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#2E7D32', '#1B5E20'] : ['#4CAF50', '#2E7D32']}
            style={styles.headerGradient}
          >
            <Feather name="star" size={48} color="#FFD700" style={styles.icon} />
            <Text style={styles.title}>Reklamsız Deneyim!</Text>
          </LinearGradient>
          
          <View style={styles.content}>
            <Text style={[styles.description, { color: isDark ? '#E0E0E0' : '#424242' }]}>
              KlickZeit'i reklamlar olmadan, tamamen kesintisiz ve odaklanmış bir şekilde kullanmak ister misiniz?
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Feather name="check-circle" size={20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>Ömür boyu tek seferlik ödeme</Text>
              </View>
              <View style={styles.featureRow}>
                <Feather name="check-circle" size={20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>Banner reklamları kaldırır</Text>
              </View>
              <View style={styles.featureRow}>
                <Feather name="check-circle" size={20} color="#4CAF50" />
                <Text style={[styles.featureText, { color: isDark ? '#E0E0E0' : '#424242' }]}>Ekstra odaklanma sağlar</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Evet, Reklamları Kaldır</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleClose}
            >
              <Text style={[styles.secondaryButtonText, { color: isDark ? '#B0B0B0' : '#757575' }]}>
                Belki daha sonra
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 16,
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
