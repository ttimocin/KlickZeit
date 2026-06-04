import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getUserCode } from './user-code';

const NICKNAME_KEY = 'game_nickname';
const NICKNAME_SET_KEY = 'game_nickname_set'; // kullanıcı diyalogu gördü mü

/**
 * Kullanıcının oyun takma adını döndürür.
 * Ayarlanmamışsa anonim kullanıcı kodunu döndürür.
 */
export const getGameNickname = async (): Promise<string> => {
    try {
        const saved = await AsyncStorage.getItem(NICKNAME_KEY);
        if (saved) return saved;
        // Fallback: anonim kod
        return getUserCode();
    } catch {
        return getUserCode();
    }
};

/**
 * Takma adı kaydet (AsyncStorage + Firebase varsa Firestore'a yedekle).
 */
export const setGameNickname = async (nickname: string): Promise<void> => {
    try {
        const trimmed = nickname.trim().slice(0, 24); // max 24 karakter
        await AsyncStorage.setItem(NICKNAME_KEY, trimmed);
        await AsyncStorage.setItem(NICKNAME_SET_KEY, 'true');

        // Firebase ile giriş yapılmışsa Firestore'a da yedekle
        const user = auth.currentUser;
        if (user && !user.isAnonymous) {
            const userCode = getUserCode();
            if (userCode !== 'KZ-GUEST') {
                await setDoc(
                    doc(db, 'user_profiles', userCode),
                    { gameNickname: trimmed, updatedAt: new Date() },
                    { merge: true }
                );
            }
        }
    } catch (error) {
        console.error('Takma ad kaydedilemedi:', error);
    }
};

/**
 * Kullanıcı daha önce takma ad diyalogunu görürse true döner.
 */
export const hasSeenNicknamePrompt = async (): Promise<boolean> => {
    try {
        const val = await AsyncStorage.getItem(NICKNAME_SET_KEY);
        return val !== null;
    } catch {
        return false;
    }
};

/**
 * Takma ad diyaloğunun gösterildiğini işaretle (istemese bile).
 */
export const markNicknamePromptSeen = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(NICKNAME_SET_KEY, 'true');
    } catch { /* ignore */ }
};

/**
 * Firestore'dan kayıtlı takma adı çek (varsa AsyncStorage'a yaz).
 * Uygulama açılışında veya login sonrası çağrılmalı.
 */
export const syncNicknameFromFirestore = async (): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user || user.isAnonymous) return;
        const userCode = getUserCode();
        if (userCode === 'KZ-GUEST') return;

        const snap = await getDoc(doc(db, 'user_profiles', userCode));
        if (snap.exists()) {
            const data = snap.data();
            if (data.gameNickname) {
                await AsyncStorage.setItem(NICKNAME_KEY, data.gameNickname);
                await AsyncStorage.setItem(NICKNAME_SET_KEY, 'true');
            }
        }
    } catch { /* ignore, offline etc */ }
};
