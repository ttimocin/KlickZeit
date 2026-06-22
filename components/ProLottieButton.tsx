import { usePremiumPromo } from '@/context/PremiumPromoContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

const PRO_ANIMATION = require('../assets/animatioon/pro.json');

export function ProLottieButton() {
  const { isPro } = usePurchases();
  const { showPremiumPromo } = usePremiumPromo();
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (isPro) return;
      setAnimationKey((key) => key + 1);
    }, [isPro]),
  );

  if (isPro) return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => showPremiumPromo({ manual: true })}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="KlickZeit Pro"
    >
      <LottieView
        key={`pro-lottie-${animationKey}`}
        source={PRO_ANIMATION}
        autoPlay
        loop={false}
        style={styles.lottie}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
    marginRight: 2,
  },
  lottie: {
    width: 40,
    height: 40,
  },
});
