import { HOME_BANNER_AD_UNIT_ID, HOME_BANNER_HEIGHT } from '@/config/ads';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

type Props = {
  isDark: boolean;
};

export function HomeBannerAd({ isDark }: Props) {
  if (Platform.OS === 'web') {
    return <View style={[styles.slot, { height: HOME_BANNER_HEIGHT }]} />;
  }

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
