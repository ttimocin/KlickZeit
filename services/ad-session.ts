import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = '@app_launch_count';

/** İlk açılışta reklam yok; 2. oturumdan itibaren gösterilir. */
export const ADS_MIN_SESSION_FOR_DISPLAY = 2;

let launchCountPromise: Promise<number> | null = null;

/** Oturum sayacını yalnızca bir kez artır (Strict Mode çift mount koruması). */
export async function incrementAndGetLaunchCount(): Promise<number> {
  if (!launchCountPromise) {
    launchCountPromise = (async () => {
      const raw = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
      const current = raw ? parseInt(raw, 10) : 0;
      const next = Number.isFinite(current) ? current + 1 : 1;
      await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(next));
      return next;
    })();
  }
  return launchCountPromise;
}

export function shouldShowAdsForSession(launchCount: number): boolean {
  return launchCount >= ADS_MIN_SESSION_FOR_DISPLAY;
}
