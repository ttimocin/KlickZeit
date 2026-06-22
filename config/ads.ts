import { Platform } from 'react-native';
import { getBannerAdUnitId } from '@/utils/mobile-ads';

export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-1513134902454765~1337786914';
export const ADMOB_IOS_APP_ID = 'ca-app-pub-1513134902454765~1926200034';

const PRODUCTION_HOME_BANNER_IDS = {
  android: 'ca-app-pub-1513134902454765/4552363375',
  ios: 'ca-app-pub-1513134902454765/3701060523',
} as const;

/** Standart banner yüksekliği — layout kayması olmaması için sabit tutulur. */
export const HOME_BANNER_HEIGHT = 50;

export const TAB_BAR_BASE_HEIGHT = 60;

const productionBannerId =
  Platform.select({
    android: PRODUCTION_HOME_BANNER_IDS.android,
    ios: PRODUCTION_HOME_BANNER_IDS.ios,
    default: PRODUCTION_HOME_BANNER_IDS.android,
  }) ?? PRODUCTION_HOME_BANNER_IDS.android;

export const HOME_BANNER_AD_UNIT_ID = getBannerAdUnitId(productionBannerId);
