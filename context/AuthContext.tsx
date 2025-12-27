import { auth } from '@/config/firebase';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Google Sign-In yapılandırması
GoogleSignin.configure({
    webClientId: '1014925050088-uagisb6c5lntdbdikkd5f8gbn5tssp73.apps.googleusercontent.com',
});

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return { error: getErrorMessage(firebaseError.code || 'unknown') };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      return { error: getErrorMessage(firebaseError.code || 'unknown') };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Google Play Services kontrolü
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Google ile giriş yap
      const signInResult = await GoogleSignin.signIn();
      
      // ID token al
      const idToken = signInResult?.data?.idToken;
      
      if (!idToken) {
        return { error: 'Google token alınamadı' };
      }
      
      // Firebase credential oluştur
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Firebase'e giriş yap
      await signInWithCredential(auth, credential);
      
      return {};
    } catch (error: unknown) {
      console.log('Google Sign-In Error:', error);
      
      const googleError = error as { code?: string; message?: string };
      
      if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: 'Giriş iptal edildi' };
      } else if (googleError.code === statusCodes.IN_PROGRESS) {
        return { error: 'Giriş işlemi devam ediyor' };
      } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Servisleri kullanılamıyor' };
      }
      
      return { error: 'Google ile giriş başarısız' };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      console.error('Çıkış yapılırken hata:', error);
      // Hata olsa bile kullanıcıyı çıkış yapmış say
      // Çünkü yerel state zaten temizlenecek
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInWithGoogle, logout }}>
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
      return 'Bu e-posta adresi zaten kullanımda';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı';
    case 'auth/user-not-found':
      return 'Kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Hatalı şifre';
    case 'auth/invalid-credential':
      return 'Geçersiz e-posta veya şifre';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Lütfen bekleyin';
    default:
      return 'Bir hata oluştu';
  }
}




