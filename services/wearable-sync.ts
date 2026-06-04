import * as WearableDataLayer from '../modules/wearable-data-layer/src';

/**
 * Wear OS'a giriş saatini gönder
 */
export async function sendEntryTimeToWear(time: string): Promise<void> {
  try {
    // isAvailable kontrolünü atla, direkt gönder
    // Bazen node'lar geç bağlanabilir veya emülatörlerde kontrol yanlış sonuç verebilir
    await WearableDataLayer.sendEntryTime(time);
  } catch (error) {
    // Hata olsa bile uygulama çalışmaya devam etsin
    console.error('[WearableSync] Hata:', error);
  }
}

