import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseExtra = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const fromGoogleServices = Constants.expoConfig?.extra?.firebase as FirebaseExtra | undefined;

// google-services.json (app.config.js) öncelikli; .env yedek
const firebaseConfig = {
  apiKey: fromGoogleServices?.apiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: fromGoogleServices?.authDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: fromGoogleServices?.projectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: fromGoogleServices?.storageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: fromGoogleServices?.messagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: fromGoogleServices?.appId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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
