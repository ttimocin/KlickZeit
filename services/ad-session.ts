import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUNCH_COUNT_KEY = '@app_launch_count';

/** İlk açılışta reklam yok; 2. oturumdan itibaren gösterilir. */
export const ADS_MIN_SESSION_FOR_DISPLAY = 2;

export async function incrementAndGetLaunchCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(LAUNCH_COUNT_KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = Number.isFinite(current) ? current + 1 : 1;
  await AsyncStorage.setItem(LAUNCH_COUNT_KEY, String(next));
  return next;
}

export function shouldShowAdsForSession(launchCount: number): boolean {
  return launchCount >= ADS_MIN_SESSION_FOR_DISPLAY;
}
