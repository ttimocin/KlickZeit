import { useModal } from '@/components/custom-modal';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { showError, showWarning, ModalComponent } = useModal();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email formatını kontrol et
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Şifre güçlülüğünü kontrol et
  const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      showWarning(i18n.t('error'), i18n.t('fillAllFields'));
      return;
    }

    // Email formatını kontrol et
    if (!isValidEmail(email)) {
      showWarning(i18n.t('error'), 'Geçersiz e-posta adresi');
      return;
    }

    // Şifre uzunluğunu kontrol et (sadece kayıt için)
    if (!isLogin && !isValidPassword(password)) {
      showWarning(i18n.t('error'), 'Şifre en az 6 karakter olmalı');
      return;
    }

    setIsLoading(true);
    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (result.error) {
        showError(i18n.t('error'), result.error);
      }
    } catch (error) {
      showError(i18n.t('error'), 'Beklenmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        showError(i18n.t('error'), result.error);
      }
    } catch (error) {
      showError(i18n.t('error'), 'Beklenmeyen bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>⏱️</Text>
          <Text style={styles.appName}>KlickZeit</Text>
          <Text style={styles.tagline}>{i18n.t('appDescription')}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isLogin ? i18n.t('loginTitle') : i18n.t('registerTitle')}
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={styles.input}
              placeholder={i18n.t('email')}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={styles.input}
              placeholder={i18n.t('password')}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={isDark ? '#888' : '#666'}
              />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? i18n.t('login') : i18n.t('register')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{i18n.t('or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.googleButtonText}>{i18n.t('continueWithGoogle')}</Text>
          </TouchableOpacity>

          {/* Toggle Login/Register */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? i18n.t('noAccount') : i18n.t('hasAccount')}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleLink}>
                {isLogin ? i18n.t('register') : i18n.t('login')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Custom Modal */}
      <ModalComponent />
    </KeyboardAvoidingView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      fontSize: 64,
      marginBottom: 8,
    },
    appName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    tagline: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      marginTop: 8,
    },
    formContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
      marginBottom: 24,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      height: 56,
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
    },
    submitButton: {
      backgroundColor: '#4CAF50',
      borderRadius: 12,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? '#333' : '#e0e0e0',
    },
    dividerText: {
      marginHorizontal: 16,
      color: isDark ? '#666' : '#999',
      fontSize: 14,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      height: 56,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      gap: 12,
    },
    googleButtonText: {
      color: isDark ? '#fff' : '#333',
      fontSize: 16,
      fontWeight: '500',
    },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      gap: 4,
    },
    toggleText: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    toggleLink: {
      color: '#4CAF50',
      fontSize: 14,
      fontWeight: '600',
    },
  });




