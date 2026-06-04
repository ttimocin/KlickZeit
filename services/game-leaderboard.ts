import { auth, db } from '@/config/firebase';
import { Logger } from '@/utils/logger';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { getGameNickname } from './game-nickname';
import { getUserCode } from './user-code';

export type GameName = 'snake' | 'tetris';

export interface GameLeaderboardEntry {
    userCode: string;
    displayName: string;
    bestScore: number;
    updatedAt: any;
}

/**
 * Auth state'in hazır olmasını bekler.
 * currentUser null olsa da listener bir kez tetiklenir (kullanıcı yoksa null döner).
 */
const waitForAuth = (): Promise<typeof auth.currentUser> =>
    new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });

/**
 * Firestore'a en iyi skoru kaydet (yüksek skor = daha iyi).
 * Sadece mevcut skordan daha iyiyse günceller.
 * @returns true eğer yeni rekor kaydedildiyse
 */
export const saveGameScore = async (
    game: GameName,
    score: number
): Promise<boolean> => {
    try {
        const user = await waitForAuth();
        if (!user) return false;

        const userCode = getUserCode();
        if (userCode === 'KZ-GUEST') return false;

        const displayName = await getGameNickname();
        const docRef = doc(db, 'game_leaderboard', game, 'records', userCode);

        // Mevcut kayıt var mı kontrol et
        const existing = await getDoc(docRef);
        if (existing.exists()) {
            const data = existing.data() as GameLeaderboardEntry;
            // Sadece daha yüksek skor varsa güncelle
            if (score <= data.bestScore) return false;
        }

        await setDoc(docRef, {
            userCode,
            displayName,
            bestScore: score,
            updatedAt: serverTimestamp(),
        });

        return true;
    } catch (error) {
        Logger.error('Game leaderboard kayıt hatası:', error);
        return false;
    }
};


/**
 * Belirli bir oyun için Top N sıralamayı getir.
 */
export const getGameLeaderboard = async (
    game: GameName,
    topN: number = 10
): Promise<GameLeaderboardEntry[]> => {
    try {
        const recordsRef = collection(db, 'game_leaderboard', game, 'records');
        const q = query(recordsRef, orderBy('bestScore', 'desc'), limit(topN));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as GameLeaderboardEntry);
    } catch (error) {
        Logger.error('Game leaderboard yükleme hatası:', error);
        return [];
    }
};

/**
 * Mevcut kullanıcının belirli oyundaki sırasını bul.
 * @returns sıra numarası (1'den başlar), bulunamazsa null
 */
export const getGameUserRank = async (
    game: GameName
): Promise<number | null> => {
    try {
        const userCode = getUserCode();
        if (userCode === 'KZ-GUEST') return null;

        const recordsRef = collection(db, 'game_leaderboard', game, 'records');
        const q = query(recordsRef, orderBy('bestScore', 'desc'));
        const snapshot = await getDocs(q);

        let rank = 1;
        for (const doc of snapshot.docs) {
            if (doc.id === userCode) return rank;
            rank++;
        }

        return null;
    } catch (error) {
        Logger.error('Game sıralama hatası:', error);
        return null;
    }
};
