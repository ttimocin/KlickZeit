/**
 * Logger utility for production-safe logging.
 * Hides logs in production to prevent sensitive data leakage.
 * Production errors are reported to Firebase Crashlytics on native platforms.
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
            console.error(message, ...args);
        } else if (Platform.OS !== 'web') {
            const firstArg = args?.[0];
            const err = firstArg instanceof Error ? firstArg : new Error(message);
            crashlytics().log(message);
            crashlytics().recordError(err);
        }
    }
};
