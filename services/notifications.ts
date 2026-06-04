import i18n from '@/i18n';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAppStandards, isFlexibleSchedule } from './storage';

// Bildirim kanalı ID'si
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

// Giriş bildirimi göster + hatırlatmaları zamanla
export const showCheckInNotification = async (time: string, timestamp: number): Promise<void> => {
  try {
    // Anında bildirim
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: 'KlickZeit',
        body: `${i18n.t('entry')}: ${time}`,
        data: { type: 'check-in', time, checkInTimestamp: timestamp },
        sound: true,
      },
      trigger: null,
    });

    const standards = await getAppStandards();
    if (isFlexibleSchedule(standards)) {
      return;
    }

    const dailyWorkMinutes = standards.dailyWorkMinutes;
    const defaultBreakMinutes = standards.defaultBreakMinutes;
    const totalMinutes = dailyWorkMinutes + defaultBreakMinutes;

    // Yarım saat kala hatırlatma
    const reminderSeconds = Math.max((totalMinutes - 30) * 60, 60);
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-30min',
      content: {
        title: 'KlickZeit ⏰',
        body: `${i18n.t('entry')}: ${time} — 30 ${i18n.t('minutes')}!`,
        data: { type: 'reminder', time },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: reminderSeconds,
      },
    });

    // Tam çıkış zamanı hatırlatma
    const exitSeconds = totalMinutes * 60;
    await Notifications.scheduleNotificationAsync({
      identifier: 'reminder-exit',
      content: {
        title: 'KlickZeit ✅',
        body: `${i18n.t('entry')}: ${time} — ${i18n.t('checkOut')}!`,
        data: { type: 'reminder', time },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: exitSeconds,
      },
    });
  } catch (error) {
    console.error('Giriş bildirimi gönderilirken hata:', error);
  }
};

// Mola bittiğinde hatırlatmaları yeniden zamanla
export const rescheduleRemindersAfterBreak = async (
  checkInTimestamp: number,
  checkInTime: string,
  totalBreakMinutesTaken: number,
): Promise<void> => {
  try {
    // Mevcut hatırlatmaları iptal et
    await cancelWorkReminders();

    const standards = await getAppStandards();
    if (isFlexibleSchedule(standards)) {
      return;
    }

    const dailyWorkMinutes = standards.dailyWorkMinutes;

    // Giriş'ten beri geçen dakika - toplam mola = net çalışma
    const now = Date.now();
    const elapsedMinutes = (now - checkInTimestamp) / (1000 * 60);
    const workedMinutes = elapsedMinutes - totalBreakMinutesTaken;

    // Kalan çalışma süresi
    const remainingWorkMinutes = dailyWorkMinutes - workedMinutes;

    // Yarım saat kala hatırlatma
    const reminderMinutes = remainingWorkMinutes - 30;
    if (reminderMinutes > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'reminder-30min',
        content: {
          title: 'KlickZeit ⏰',
          body: `${i18n.t('entry')}: ${checkInTime} — 30 ${i18n.t('minutes')}!`,
          data: { type: 'reminder', time: checkInTime },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(Math.round(reminderMinutes * 60), 60),
        },
      });
    }

    // Çıkış zamanı hatırlatma
    if (remainingWorkMinutes > 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'reminder-exit',
        content: {
          title: 'KlickZeit ✅',
          body: `${i18n.t('entry')}: ${checkInTime} — ${i18n.t('checkOut')}!`,
          data: { type: 'reminder', time: checkInTime },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(Math.round(remainingWorkMinutes * 60), 60),
        },
      });
    }
  } catch (error) {
    console.error('Hatırlatma yeniden zamanlanırken hata:', error);
  }
};

// Çıkış bildirimi göster
export const showCheckOutNotification = async (checkOutTime: string): Promise<void> => {
  try {
    await dismissOngoingNotification();
    await cancelWorkReminders();

    await Notifications.scheduleNotificationAsync({
      identifier: 'checkout-summary',
      content: {
        title: 'KlickZeit',
        body: `${i18n.t('exit')}: ${checkOutTime}`,
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
  await Notifications.cancelScheduledNotificationAsync('reminder-30min');
  await Notifications.cancelScheduledNotificationAsync('reminder-exit');
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
