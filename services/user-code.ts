import { auth } from '@/config/firebase';

/**
 * Kullanıcı kodunu al.
 * Firebase UID'nin ilk 8 karakterinden oluşur.
 * Format: KZ-XXXXXXXX
 */
export const getUserCode = (): string => {
    const user = auth.currentUser;
    if (!user) return 'KZ-GUEST';

    const uidPart = user.uid.substring(0, 8).toUpperCase();
    return `KZ-${uidPart}`;
};

/**
 * Kullanıcı görünen adını al.
 * Giriş yapmışsa displayName, yoksa kullanıcı kodu döner.
 */
export const getUserDisplayName = (): string => {
    const user = auth.currentUser;
    if (!user) return 'Misafir';

    // Google/email ile giriş yapmışsa displayName kullan
    if (!user.isAnonymous && user.displayName) {
        return user.displayName;
    }

    // Anonim kullanıcı veya displayName yoksa kod döner
    return getUserCode();
};

/**
 * Kullanıcının anonim olup olmadığını kontrol et
 */
export const isGuestUser = (): boolean => {
    const user = auth.currentUser;
    return !user || user.isAnonymous;
};
