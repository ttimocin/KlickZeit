import { HOME_BANNER_AD_UNIT_ID, HOME_BANNER_HEIGHT } from '@/config/ads';
import { usePurchases } from '@/context/PurchasesContext';
import { isMobileAdsNativeModuleAvailable } from '@/utils/mobile-ads';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type Props = {
  isDark: boolean;
};

export function HomeBannerAd({ isDark }: Props) {
  const { isPro } = usePurchases();

  if (isPro) return null;

  if (Platform.OS === 'web' || !isMobileAdsNativeModuleAvailable()) {
    return <View style={[styles.slot, { height: HOME_BANNER_HEIGHT }]} />;
  }

  const { BannerAd, BannerAdSize } = require('react-native-google-mobile-ads');

  return (
    <View
      style={[
        styles.slot,
        {
          height: HOME_BANNER_HEIGHT,
          backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <BannerAd unitId={HOME_BANNER_AD_UNIT_ID} size={BannerAdSize.BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
