import { auth } from '@/config/firebase';
import i18n from '@/i18n';
import Constants from 'expo-constants';
import { Logger } from '@/utils/logger';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  ActionCodeSettings,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

async function createAppleSignInNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const rawNonce = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );
  return { rawNonce, hashedNonce };
}

const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  (Constants.expoConfig?.extra?.firebase as { iosClientId?: string } | undefined)?.iosClientId ??
  '1014925050088-kgium6pn4lrfov3jb9usavmkjkm240rr.apps.googleusercontent.com';

// Google Sign-In yapılandırması
GoogleSignin.configure({
  webClientId: '1014925050088-uagisb6c5lntdbdikkd5f8gbn5tssp73.apps.googleusercontent.com',
  iosClientId: googleIosClientId,
});

interface AuthResult {
  error?: string;
  needsEmailVerification?: boolean;
  resentVerification?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  resendVerificationEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

function getEmailVerificationActionCodeSettings(): ActionCodeSettings {
  const projectId =
    (Constants.expoConfig?.extra?.firebase as { projectId?: string } | undefined)?.projectId ??
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
    'zeitlog-8aad7';

  // Özel domain gerekmez — Firebase proje domain'i otomatik yetkilidir
  return {
    url: `https://${projectId}.firebaseapp.com`,
    handleCodeInApp: false,
  };
}

async function sendVerificationEmail(user: User) {
  await sendEmailVerification(user, getEmailVerificationActionCodeSettings());
}

function isEmailPasswordUser(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === 'password');
}

async function ensureEmailVerifiedOrSignOut(user: User): Promise<boolean> {
  await user.reload();
  if (isEmailPasswordUser(user) && !user.emailVerified) {
    await signOut(auth);
    return false;
  }
  return true;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let loadingDone = false;
    const stopLoading = () => {
      if (!loadingDone) {
        loadingDone = true;
        setIsLoading(false);
      }
    };

    // İnternet yokken anonim giriş uzun sürebilir; en fazla 2.5 sn bekle
    const maxWait = setTimeout(stopLoading, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !currentUser.isAnonymous && isEmailPasswordUser(currentUser)) {
        const verified = await ensureEmailVerifiedOrSignOut(currentUser);
        if (!verified) {
          stopLoading();
          return;
        }
      }

      setUser(currentUser);
      stopLoading();
      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          Logger.error('Anonim giriş hatası (arka plan):', error);
        });
      }
    });

    return () => {
      clearTimeout(maxWait);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();

      if (!credential.user.emailVerified) {
        await sendVerificationEmail(credential.user);
        await signOut(auth);
        return {
          error: i18n.t('authEmailNotVerified'),
          resentVerification: true,
        };
      }

      return {};
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return { error: getErrorMessage(firebaseError.code || 'unknown') };
    }
  };

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendVerificationEmail(credential.user);
      await signOut(auth);
      return { needsEmailVerification: true };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return { error: getErrorMessage(firebaseError.code || 'unknown') };
    }
  };

  const resendVerificationEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.reload();

      if (credential.user.emailVerified) {
        await signOut(auth);
        return { error: i18n.t('authEmailAlreadyVerified') };
      }

      await sendVerificationEmail(credential.user);
      await signOut(auth);
      return { needsEmailVerification: true };
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return { error: getErrorMessage(firebaseError.code || 'unknown') };
    }
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        return { error: i18n.t('authAppleNotAvailable') };
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { error: i18n.t('authAppleNotAvailable') };
      }

      const { rawNonce, hashedNonce } = await createAppleSignInNonce();
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        return {
          error: i18n.t('authAppleSignInFailed', { message: i18n.t('authUnknownError') }),
        };
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });

      await signInWithCredential(auth, credential);
      return {};
    } catch (error: unknown) {
      Logger.error('❌ Apple Sign-In Error:', error);

      const appleError = error as { code?: string; message?: string };
      if (appleError.code === 'ERR_REQUEST_CANCELED') {
        return { error: i18n.t('authSignInCancelled') };
      }

      const detail = appleError.message || appleError.code || i18n.t('authUnknownError');
      return { error: i18n.t('authAppleSignInFailed', { message: detail }) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Google ile giriş yap
      const signInResult = await GoogleSignin.signIn();

      // ID token al
      const idToken = signInResult?.data?.idToken;

      if (!idToken) {
        Logger.error('❌ ID Token alınamadı');
        return { error: 'Google token alınamadı' };
      }

      // Firebase credential oluştur
      const credential = GoogleAuthProvider.credential(idToken);

      // Firebase'e giriş yap
      await signInWithCredential(auth, credential);

      return {};
    } catch (error: unknown) {
      Logger.error('❌ Google Sign-In Error:', error);
      Logger.error('Error details:', JSON.stringify(error, null, 2));

      const googleError = error as { code?: string; message?: string };

      if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: i18n.t('authSignInCancelled') };
      } else if (googleError.code === statusCodes.IN_PROGRESS) {
        return { error: i18n.t('authSignInInProgress') };
      } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: i18n.t('authPlayServicesNotAvailable') };
      }

      const detail = googleError.message || googleError.code || i18n.t('authUnknownError');
      return { error: i18n.t('authGoogleSignInFailed', { message: detail }) };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      signInAnonymously(auth).catch((error) => {
        Logger.error('Çıkış sonrası anonim giriş (arka plan):', error);
      });
    } catch (error: unknown) {
      Logger.error('Çıkış yapılırken hata:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        resendVerificationEmail,
        signInWithGoogle,
        signInWithApple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hata mesajlarını çevir
function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return i18n.t('authEmailAlreadyInUse');
    case 'auth/invalid-email':
      return i18n.t('invalidEmailFormat');
    case 'auth/weak-password':
      return i18n.t('authWeakPassword');
    case 'auth/user-not-found':
      return i18n.t('authUserNotFound');
    case 'auth/wrong-password':
      return i18n.t('authWrongPassword');
    case 'auth/invalid-credential':
      return i18n.t('authInvalidCredential');
    case 'auth/too-many-requests':
      return i18n.t('authTooManyRequests');
    default:
      return i18n.t('authGenericError');
  }
}




