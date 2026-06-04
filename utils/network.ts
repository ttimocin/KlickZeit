/**
 * Hızlı çevrimiçi kontrolü (uygulama açılışında veya Firebase öncesi).
 * Başarısız olursa çevrimdışı kabul edilir; uzun Firestore beklemelerini önler.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
