import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const platformDefaults =
  Platform.OS === 'ios'
    ? {
        apiKey: 'AIzaSyBeR0NoZGT8uRgIh8IUyIMJhaslFoav_JA',
        appId: '1:1014925050088:ios:3cd6c740d039a5b206895d',
      }
    : {
        apiKey: 'AIzaSyCspELKD2Sdq3fstcXNFCXK5secuyWHtkA',
        appId: '1:1014925050088:android:96df4b3ea9b68bd706895d',
      };

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? platformDefaults.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? platformDefaults.appId,
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth - AsyncStorage ile persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore veritabanı
export const db = getFirestore(app);

export default app;












