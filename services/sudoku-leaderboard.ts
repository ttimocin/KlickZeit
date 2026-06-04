import { db } from '@/config/firebase';
import { Logger } from '@/utils/logger';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Difficulty } from './sudoku';
import { getUserCode, getUserDisplayName } from './user-code';

export interface LeaderboardEntry {
    userCode: string;
    displayName: string;
    bestTime: number; // saniye cinsinden
    updatedAt: any;
}

/**
 * Firestore'a en iyi süreyi kaydet.
 * Sadece mevcut süreden daha iyiyse günceller.
 * @returns true eğer yeni rekor kaydedildiyse
 */
export const saveBestTimeToFirestore = async (
    difficulty: Difficulty,
    time: number
): Promise<boolean> => {
    try {
        const userCode = getUserCode();
        if (userCode === 'KZ-GUEST') return false;

        const displayName = getUserDisplayName();
        const docRef = doc(db, 'sudoku_leaderboard', difficulty, 'records', userCode);

        // Mevcut kayıt var mı kontrol et
        const existing = await getDoc(docRef);
        if (existing.exists()) {
            const data = existing.data() as LeaderboardEntry;
            // Sadece daha iyi süre varsa güncelle
            if (time >= data.bestTime) return false;
        }

        await setDoc(docRef, {
            userCode,
            displayName,
            bestTime: time,
            updatedAt: serverTimestamp(),
        });

        return true;
    } catch (error) {
        Logger.error('Leaderboard kayıt hatası:', error);
        return false;
    }
};

/**
 * Belirli bir zorluk için Top N sıralamayı getir.
 */
export const getLeaderboard = async (
    difficulty: Difficulty,
    topN: number = 10
): Promise<LeaderboardEntry[]> => {
    try {
        const recordsRef = collection(db, 'sudoku_leaderboard', difficulty, 'records');
        const q = query(recordsRef, orderBy('bestTime', 'asc'), limit(topN));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
    } catch (error) {
        Logger.error('Leaderboard yükleme hatası:', error);
        return [];
    }
};

/**
 * Mevcut kullanıcının belirli zorluktaki sırasını bul.
 * @returns sıra numarası (1'den başlar), bulunamazsa null
 */
export const getUserRank = async (
    difficulty: Difficulty
): Promise<number | null> => {
    try {
        const userCode = getUserCode();
        if (userCode === 'KZ-GUEST') return null;

        // Tüm kayıtları süreye göre sıralı getir
        const recordsRef = collection(db, 'sudoku_leaderboard', difficulty, 'records');
        const q = query(recordsRef, orderBy('bestTime', 'asc'));
        const snapshot = await getDocs(q);

        let rank = 1;
        for (const doc of snapshot.docs) {
            if (doc.id === userCode) return rank;
            rank++;
        }

        return null;
    } catch (error) {
        Logger.error('Sıralama bulunamadı:', error);
        return null;
    }
};
