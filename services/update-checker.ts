import i18n from '@/i18n';
import remoteConfig from '@react-native-firebase/remote-config';
import { Alert, BackHandler, Linking } from 'react-native';

// Mevcut uygulama versiyonu (app.json'dan alınmalı)
const CURRENT_VERSION = '1.0.0';

// Versiyon karşılaştırma (1.0.0 formatı)
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

// Remote Config'i başlat ve güncelleme kontrolü yap
export const checkForUpdates = async (): Promise<void> => {
  try {
    // Remote Config ayarları
    await remoteConfig().setDefaults({
      force_update_version: '1.0.0',
      latest_version: '1.0.0',
      update_url: 'https://play.google.com/store/apps/details?id=com.taytek.zeitlog',
    });
    
    // Minimum fetch interval (debug için 0, production için 3600)
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 saat
    });
    
    // Remote Config'den verileri çek
    await remoteConfig().fetchAndActivate();
    
    // Değerleri al
    const forceUpdateVersion = remoteConfig().getValue('force_update_version').asString();
    const latestVersion = remoteConfig().getValue('latest_version').asString();
    const updateUrl = remoteConfig().getValue('update_url').asString();
    
    console.log('Remote Config:', { forceUpdateVersion, latestVersion, updateUrl, currentVersion: CURRENT_VERSION });
    
    // Zorunlu güncelleme kontrolü
    if (compareVersions(CURRENT_VERSION, forceUpdateVersion) < 0) {
      showForceUpdateDialog(updateUrl);
      return;
    }
    
    // İsteğe bağlı güncelleme kontrolü
    if (compareVersions(CURRENT_VERSION, latestVersion) < 0) {
      showOptionalUpdateDialog(latestVersion, updateUrl);
    }
  } catch (error) {
    console.error('Remote Config hatası:', error);
    // Hata durumunda sessizce devam et
  }
};

// Zorunlu güncelleme diyaloğu
const showForceUpdateDialog = (updateUrl: string) => {
  Alert.alert(
    i18n.t('updateRequired'),
    i18n.t('updateRequiredMessage'),
    [
      {
        text: i18n.t('updateNow'),
        onPress: () => {
          Linking.openURL(updateUrl);
          // Uygulamayı arka plana at veya kapat
          BackHandler.exitApp();
        },
      },
    ],
    { cancelable: false }
  );
};

// İsteğe bağlı güncelleme diyaloğu
const showOptionalUpdateDialog = (newVersion: string, updateUrl: string) => {
  Alert.alert(
    i18n.t('updateAvailable'),
    i18n.t('updateAvailableMessage').replace('{version}', newVersion),
    [
      {
        text: i18n.t('later'),
        style: 'cancel',
      },
      {
        text: i18n.t('updateNow'),
        onPress: () => {
          Linking.openURL(updateUrl);
        },
      },
    ]
  );
};

export default { checkForUpdates };

