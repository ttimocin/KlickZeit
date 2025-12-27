import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyCfqdLcrtddDq4CzwiL8LklMQ7VXr59SuU",
  authDomain: "zeitlog-8aad7.firebaseapp.com",
  projectId: "zeitlog-8aad7",
  storageBucket: "zeitlog-8aad7.firebasestorage.app",
  messagingSenderId: "1014925050088",
  appId: "1:1014925050088:android:96df4b3ea9b68bd706895d"
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



