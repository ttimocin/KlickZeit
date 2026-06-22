import {
  AppLanguage,
  buildLegalPageUrl,
  LegalPage,
} from '@/config/website';
import { Alert, Linking } from 'react-native';

export async function openLegalPage(page: LegalPage, language: AppLanguage): Promise<boolean> {
  const url = buildLegalPageUrl(page, language);

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Bağlantı açılamadı', url);
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Legal page link failed:', error);
    Alert.alert('Bağlantı açılamadı', url);
    return false;
  }
}
