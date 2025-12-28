import { useModal } from '@/components/custom-modal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { loadFromFirebase, syncAllPendingRecords } from '@/services/firebase-sync';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const languages = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const themes = [
  { code: 'system', icon: 'phone-portrait-outline' as const },
  { code: 'light', icon: 'sunny' as const },
  { code: 'dark', icon: 'moon' as const },
];

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { language, setLanguage, forceUpdate } = useLanguage();
  const { user, logout } = useAuth();
  const { showModal, ModalComponent } = useModal();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogout = async () => {
    showModal({
      title: i18n.t('logout'),
      message: i18n.t('logoutConfirm'),
      icon: '👋',
      buttons: [
        { text: i18n.t('cancel'), style: 'cancel' },
        { text: i18n.t('logout'), style: 'destructive', onPress: () => logout() },
      ],
    });
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    const result = await syncAllPendingRecords();
    setIsSyncing(false);
    
    showModal({
      title: i18n.t('syncComplete'),
      message: `${i18n.t('successful')}: ${result.success}\n${i18n.t('failed')}: ${result.failed}`,
      icon: result.failed > 0 ? '⚠️' : '☁️',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleLoadFromCloud = async () => {
    setIsSyncing(true);
    const result = await loadFromFirebase();
    setIsSyncing(false);
    
    showModal({
      title: i18n.t('info'),
      message: result.loaded > 0 
        ? `${result.loaded} ${i18n.t('recordsLoaded')}`
        : i18n.t('noNewRecords'),
      icon: result.loaded > 0 ? '✅' : 'ℹ️',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleLanguageChange = async (langCode: 'tr' | 'en' | 'de') => {
    await setLanguage(langCode);
    // Tüm navigation'ı yenilemek için replace kullan
    router.replace('/(tabs)');
  };

  const getThemeName = (code: string) => {
    switch (code) {
      case 'system': return i18n.t('systemTheme');
      case 'light': return i18n.t('lightMode');
      case 'dark': return i18n.t('darkMode');
      default: return code;
    }
  };

  const styles = createStyles(isDark);

  return (
    <View key={`settings-${forceUpdate}`} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('settings')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Dil Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('language')}</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.option,
                language === lang.code && styles.optionSelected,
              ]}
              onPress={() => handleLanguageChange(lang.code as 'tr' | 'en' | 'de')}
            >
              <Text style={styles.optionFlag}>{lang.flag}</Text>
              <Text style={styles.optionText}>{lang.name}</Text>
              {language === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tema Seçimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('theme')}</Text>
          {themes.map((t) => (
            <TouchableOpacity
              key={t.code}
              style={[
                styles.option,
                themeMode === t.code && styles.optionSelected,
              ]}
              onPress={() => setThemeMode(t.code as 'system' | 'light' | 'dark')}
            >
              <Ionicons 
                name={t.icon} 
                size={24} 
                color={t.code === 'dark' ? '#FFD700' : t.code === 'light' ? '#FFA500' : (isDark ? '#fff' : '#333')} 
                style={styles.themeIcon}
              />
              <Text style={styles.optionText}>{getThemeName(t.code)}</Text>
              {themeMode === t.code && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Hakkında */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('about')}</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>ZeitLog</Text>
            <Text style={styles.appVersion}>v1.0.0</Text>
            <Text style={styles.appDescription}>{i18n.t('appDescription')}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={async () => {
              try {
                await Linking.openURL('https://github.com/ttimocin/ZeitLog');
              } catch (error) {
                console.error('GitHub linki açılırken hata:', error);
              }
            }}
          >
            <Ionicons name="logo-github" size={20} color={isDark ? '#fff' : '#333'} />
            <Text style={styles.linkText}>GitHub</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/privacy-policy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={isDark ? '#fff' : '#333'} />
            <Text style={styles.linkText}>{i18n.t('privacyPolicy')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => router.push('/terms-of-service')}
          >
            <Ionicons name="document-text-outline" size={20} color={isDark ? '#fff' : '#333'} />
            <Text style={styles.linkText}>{i18n.t('termsOfService')}</Text>
          </TouchableOpacity>
        </View>

        {/* Hesap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('account')}</Text>
          
          {user ? (
            <>
              <View style={styles.userInfo}>
                <Ionicons name="person-circle-outline" size={40} color="#4CAF50" />
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              
              {/* Sync Butonları */}
              <TouchableOpacity 
                style={styles.syncButton} 
                onPress={handleSyncToCloud}
                disabled={isSyncing}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#4CAF50" />
                <Text style={styles.syncButtonText}>{i18n.t('syncToCloud')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.syncButton} 
                onPress={handleLoadFromCloud}
                disabled={isSyncing}
              >
                <Ionicons name="cloud-download-outline" size={20} color="#2196F3" />
                <Text style={[styles.syncButtonText, { color: '#2196F3' }]}>{i18n.t('loadFromCloud')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#FF5252" />
                <Text style={styles.logoutText}>{i18n.t('logout')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteAccountButton} 
                onPress={() => router.push('/delete-account')}
              >
                <Ionicons name="trash-outline" size={20} color="#FF5252" />
                <Text style={styles.deleteAccountText}>{i18n.t('deleteAccount')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.loginHint}>{i18n.t('loginHint')}</Text>
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => router.push('/login')}
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>{i18n.t('login')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ by TayTek</Text>
          <Text style={styles.copyright}>© 2025</Text>
        </View>
      </ScrollView>
      
      {/* Custom Modal */}
      <ModalComponent />
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
    },
    optionSelected: {
      backgroundColor: isDark ? '#1a3a1a' : '#e8f5e9',
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    optionFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    themeIcon: {
      marginRight: 12,
    },
    optionText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
      flex: 1,
    },
    aboutCard: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      marginBottom: 12,
    },
    appName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    appVersion: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 4,
    },
    appDescription: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      gap: 8,
    },
    linkText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#333',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    userEmail: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      flex: 1,
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: isDark ? '#1a3a1a' : '#e8f5e9',
      borderRadius: 12,
      gap: 8,
      marginBottom: 8,
    },
    syncButtonText: {
      fontSize: 16,
      color: '#4CAF50',
      fontWeight: '500',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: isDark ? '#3a2020' : '#ffebee',
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
    },
    logoutText: {
      fontSize: 16,
      color: '#FF5252',
      fontWeight: '500',
    },
    deleteAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: isDark ? '#3a2020' : '#ffebee',
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#FF5252',
    },
    deleteAccountText: {
      fontSize: 16,
      color: '#FF5252',
      fontWeight: '500',
      marginLeft: 8,
    },
    loginHint: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      backgroundColor: '#4CAF50',
      borderRadius: 12,
      gap: 8,
    },
    loginButtonText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
    },
    copyright: {
      fontSize: 12,
      color: isDark ? '#444' : '#bbb',
      marginTop: 4,
    },
  });




