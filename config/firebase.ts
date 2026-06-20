import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseExtra = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

const fromBuildConfig = Constants.expoConfig?.extra?.firebase as FirebaseExtra | undefined;

// Release build: app.config.js (GoogleService-Info.plist) gömülü; .env yalnızca dev yedek
const firebaseConfig = {
  apiKey: fromBuildConfig?.apiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: fromBuildConfig?.authDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: fromBuildConfig?.projectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: fromBuildConfig?.storageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    fromBuildConfig?.messagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: fromBuildConfig?.appId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    'Firebase yapılandırması eksik. GoogleService-Info.plist veya .env kontrol edin.'
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

export default app;
