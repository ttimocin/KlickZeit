import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim kanalı ID'si - yeni kanal
const CHANNEL_ID = 'klickzeit-alerts';
const NOTIFICATION_ID = 'klickzeit-work';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Bildirim kanalı oluştur (Android)
export const setupNotificationChannel = async (): Promise<void> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'KlickZeit Bildirimler',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        enableVibrate: true,
      });
    }
  } catch (error) {
    console.error('Bildirim kanalı oluşturulurken hata:', error);
  }
};

// Giriş bildirimi göster
export const showCheckInNotification = async (time: string, timestamp: number): Promise<void> => {
  try {
    // Anında bildirim
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'KlickZeit',
        body: `Giris: ${time}`,
        data: { type: 'check-in', time },
        sound: true,
      },
      trigger: null, // Hemen göster
    });

    // 6.5 saat sonra hatırlatma
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-6h30',
      content: {
        title: 'KlickZeit',
        body: `Giris: ${time} - Yarim saat kaldi!`,
        data: { type: 'reminder', time },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 6.5 * 60 * 60, // 6.5 saat
      },
    });

    // 7 saat sonra hatırlatma
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-7h',
      content: {
        title: 'KlickZeit',
        body: `Giris: ${time} - Cikis zamani!`,
        data: { type: 'reminder', time },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 7 * 60 * 60, // 7 saat
      },
    });
  } catch (error) {
    console.error('Giriş bildirimi gönderilirken hata:', error);
  }
};

// Çıkış bildirimi göster
export const showCheckOutNotification = async (checkOutTime: string): Promise<void> => {
  try {
    // Önce mevcut bildirimi ve hatırlatmaları kaldır
    await dismissOngoingNotification();
    await cancelWorkReminders();

    // Özet bildirimi göster
    await Notifications.scheduleNotificationAsync({
      identifier: 'checkout-summary',
      content: {
        title: 'KlickZeit',
        body: `Cikis: ${checkOutTime}`,
        data: { type: 'check-out' },
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Çıkış bildirimi gönderilirken hata:', error);
  }
};

// Çalışma hatırlatmalarını iptal et
export const cancelWorkReminders = async () => {
  await Notifications.cancelScheduledNotificationAsync('reminder-6h30');
  await Notifications.cancelScheduledNotificationAsync('reminder-7h');
};

// Kalıcı bildirimi kaldır
export const dismissOngoingNotification = async () => {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
};

// Tüm bildirimleri kaldır
export const dismissAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};

// Bildirim izinlerini kontrol et ve iste
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// Mevcut bildirim var mı kontrol et
export const hasOngoingNotification = async (): Promise<boolean> => {
  const notifications = await Notifications.getPresentedNotificationsAsync();
  return notifications.some(n => n.request.identifier === NOTIFICATION_ID);
};




