/**
 * Logger utility for production-safe logging.
 * Hides logs in production to prevent sensitive data leakage.
 * Centralizes error handling for future integration with logging services (e.g., Crashlytics, Sentry).
 */
import { Platform } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';

export const Logger = {
    log: (message: string, ...args: any[]) => {
        if (__DEV__) {
            console.log(message, ...args);
        }
    },

    warn: (message: string, ...args: any[]) => {
        if (__DEV__) {
            console.warn(message, ...args);
        }
    },

    error: (message: string, ...args: any[]) => {
        if (__DEV__) {
            // Development: Tam hata detayını ve stack trace'i göster
            console.error(message, ...args);
        } else {
            // Production: Hassas bilgileri gizle
            // Kullanıcıya detay gösterme, sadece log servisine gönder (ileride eklenebilir)
            // Şimdilik console'a basmıyoruz; Crashlytics'e gönderiyoruz.
            if (Platform.OS !== 'web') {
                const firstArg = args?.[0];
                const err = firstArg instanceof Error ? firstArg : new Error(message);
                crashlytics().log(message);
                crashlytics().recordError(err);
            }
        }
    }
};
