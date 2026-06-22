import { usePremiumPromo } from '@/context/PremiumPromoContext';
import { usePurchases } from '@/context/PurchasesContext';
import i18n from '@/i18n';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { useCallback, useRef } from 'react';
import { InteractionManager, StyleSheet, TouchableOpacity } from 'react-native';

const PRO_ANIMATION = require('../assets/animatioon/pro.json');

export function ProLottieButton() {
  const { isPro } = usePurchases();
  const { showPremiumPromo } = usePremiumPromo();
  const lottieRef = useRef<LottieView>(null);
  const isFirstPlayRef = useRef(true);

  const playAnimation = useCallback(() => {
    if (isPro) return;
    lottieRef.current?.reset();
    lottieRef.current?.play();
  }, [isPro]);

  useFocusEffect(
    useCallback(() => {
      if (isPro) return;

      // İlk açılışta Lottie henüz hazır olmayabilir; key ile remount autoPlay'i bozar.
      const delay = isFirstPlayRef.current ? 150 : 0;
      isFirstPlayRef.current = false;

      let timer: ReturnType<typeof setTimeout> | null = null;
      const task = InteractionManager.runAfterInteractions(() => {
        timer = setTimeout(playAnimation, delay);
      });

      return () => {
        task.cancel();
        if (timer) clearTimeout(timer);
      };
    }, [isPro, playAnimation]),
  );

  if (isPro) return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => showPremiumPromo({ manual: true })}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={i18n.t('proButtonA11yLabel')}
    >
      <LottieView
        ref={lottieRef}
        source={PRO_ANIMATION}
        autoPlay={false}
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
