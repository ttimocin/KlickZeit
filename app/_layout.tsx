import { CloudRestoreOnLoginPrompt } from '@/components/cloud-restore-on-login';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { AdsFlowProvider } from '@/context/AdsFlowContext';
import { PremiumPromoProvider } from '@/context/PremiumPromoContext';
import { PurchasesProvider } from '@/context/PurchasesContext';
import { checkForUpdates } from '@/services/update-checker';
import { initializeMobileAds } from '@/utils/mobile-ads';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, Platform, View } from 'react-native';
import 'react-native-reanimated';

// Expo dev modunda ekranı uyanık tutma bazen Activity hazır olmadan çağrılır; uygulamayı etkilemez.
if (__DEV__) {
  LogBox.ignoreLogs([
    'Unable to activate keep awake',
    '`activateKeepAwake` is deprecated',
  ]);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Uygulama başladığında güncelleme kontrolü
  useEffect(() => {
    // Güncelleme kontrolü hata verse bile uygulamanın açılmasını engelleme
    checkForUpdates().catch((error) => {
      console.log('Güncelleme kontrolü başarısız oldu, uygulama normal şekilde devam ediyor:', error);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    initializeMobileAds();
  }, []);

  // Giriş yapıldıysa ve login sayfasındaysa ana sayfaya yönlendir
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (user && !user.isAnonymous && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="delete-account" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
        <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <CloudRestoreOnLoginPrompt />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <PurchasesProvider>
          <AdsFlowProvider>
            <LanguageProvider>
              <PremiumPromoProvider>
                <RootLayoutNav />
              </PremiumPromoProvider>
            </LanguageProvider>
          </AdsFlowProvider>
        </PurchasesProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
