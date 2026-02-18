import { WorkRecord } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'work_records';

// Tüm kayıtları getir
export const getRecords = async (): Promise<WorkRecord[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Kayıtlar alınırken hata:', error);
    return [];
  }
};

// Yeni kayıt ekle
export const addRecord = async (record: WorkRecord): Promise<boolean> => {
  try {
    const records = await getRecords();
    records.unshift(record); // En başa ekle
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Kayıt eklenirken hata:', error);
    return false;
  }
};

// Kaydı güncelle (sync durumu için)
export const updateRecord = async (id: string, updates: Partial<WorkRecord>): Promise<boolean> => {
  try {
    const records = await getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Kayıt güncellenirken hata:', error);
    return false;
  }
};

// Tarih ve tip bazlı kayıt güncelle veya ekle
export const upsertRecordByDateType = async (date: string, type: 'giris' | 'cikis', time: string): Promise<{ action: 'added' | 'updated' | 'unchanged' }> => {
  try {
    const records = await getRecords();
    const existingIndex = records.findIndex(r => r.date === date && r.type === type);

    if (existingIndex !== -1) {
      // Mevcut kayıt var - saati kontrol et
      if (records[existingIndex].time === time) {
        return { action: 'unchanged' };
      }
      // Saati güncelle
      records[existingIndex].time = time;
      records[existingIndex].timestamp = new Date(`${date}T${time}:00`).getTime();
      records[existingIndex].synced = false;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return { action: 'updated' };
    } else {
      // Yeni kayıt ekle
      const newRecord: WorkRecord = {
        id: `import_${date}_${type}_${Date.now()}_${Math.random()}`,
        type,
        timestamp: new Date(`${date}T${time}:00`).getTime(),
        date,
        time,
        synced: false,
      };
      records.unshift(newRecord);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return { action: 'added' };
    }
  } catch (error) {
    console.error('Kayıt upsert hatası:', error);
    return { action: 'unchanged' };
  }
};

// Kayıt sil
export const deleteRecord = async (id: string): Promise<boolean> => {
  try {
    const records = await getRecords();
    const filtered = records.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Kayıt silinirken hata:', error);
    return false;
  }
};

// Tüm kayıtları temizle
export const clearAllRecords = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Kayıtlar temizlenirken hata:', error);
    return false;
  }
};

// Tüm kayıtları ayarla (Firebase'den yükleme için)
export const setRecords = async (records: WorkRecord[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Kayıtlar kaydedilirken hata:', error);
    return false;
  }
};

// Son kaydı getir (bugünün son kaydı - sadece giris/cikis)
export const getLastRecord = async (): Promise<WorkRecord | null> => {
  try {
    const records = await getRecords();
    const today = new Date().toISOString().split('T')[0];
    // Sadece giris ve cikis kayıtlarını filtrele (mola kayıtlarını hariç tut)
    const todayRecords = records.filter(r => r.date === today && (r.type === 'giris' || r.type === 'cikis'));
    return todayRecords.length > 0 ? todayRecords[0] : null;
  } catch (error) {
    console.error('Son kayıt alınırken hata:', error);
    return null;
  }
};

// Tatil günü ekle (otomatik 7 saat çalışma)
export const addHolidayRecord = async (date: string): Promise<boolean> => {
  try {
    const records = await getRecords();

    // Bu tarih için mevcut kayıtları sil
    const filtered = records.filter(r => r.date !== date);

    // Giriş kaydı (08:00)
    const girisRecord: WorkRecord = {
      id: `holiday_${date}_giris_${Date.now()}`,
      type: 'giris',
      timestamp: new Date(`${date}T08:00:00`).getTime(),
      date,
      time: '08:00',
      synced: false,
      isHoliday: true,
    };

    // Çıkış kaydı (15:00 - 7 saat sonra)
    const cikisRecord: WorkRecord = {
      id: `holiday_${date}_cikis_${Date.now()}`,
      type: 'cikis',
      timestamp: new Date(`${date}T15:00:00`).getTime(),
      date,
      time: '15:00',
      synced: false,
      isHoliday: true,
    };

    // Kayıtları ekle
    filtered.unshift(cikisRecord);
    filtered.unshift(girisRecord);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Tatil kaydı eklenirken hata:', error);
    return false;
  }
};

// Tatil kaydını kaldır
export const removeHolidayRecord = async (date: string): Promise<boolean> => {
  try {
    const records = await getRecords();
    const filtered = records.filter(r => !(r.date === date && r.isHoliday));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Tatil kaydı silinirken hata:', error);
    return false;
  }
};

// Bir günün tatil olup olmadığını kontrol et
export const isHolidayDate = async (date: string): Promise<boolean> => {
  try {
    const records = await getRecords();
    return records.some(r => r.date === date && r.isHoliday);
  } catch (error) {
    return false;
  }
};

// Mola sayılıyor mu kaydet
const BREAK_COUNTED_KEY = 'break_counted_dates';

export const setBreakCounted = async (date: string, counted: boolean): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_COUNTED_KEY);
    const dates: Record<string, boolean> = data ? JSON.parse(data) : {};

    if (counted) {
      dates[date] = true;
    } else {
      delete dates[date];
    }

    await AsyncStorage.setItem(BREAK_COUNTED_KEY, JSON.stringify(dates));
    return true;
  } catch (error) {
    console.error('Mola sayılıyor kaydedilirken hata:', error);
    return false;
  }
};

export const getBreakCounted = async (date: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_COUNTED_KEY);
    if (!data) return false;
    const dates: Record<string, boolean> = JSON.parse(data);
    return dates[date] === true;
  } catch (error) {
    console.error('Mola sayılıyor okunurken hata:', error);
    return false;
  }
};

// Mola süresini kaydet (dakika cinsinden)
const BREAK_DURATION_KEY = 'break_duration_dates';

export const setBreakDuration = async (date: string, duration: number): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_DURATION_KEY);
    const dates: Record<string, number> = data ? JSON.parse(data) : {};

    if (duration > 0) {
      dates[date] = duration;
    } else {
      delete dates[date];
    }

    await AsyncStorage.setItem(BREAK_DURATION_KEY, JSON.stringify(dates));
    return true;
  } catch (error) {
    console.error('Mola süresi kaydedilirken hata:', error);
    return false;
  }
};

export const getBreakDuration = async (date: string): Promise<number | null> => {
  try {
    const data = await AsyncStorage.getItem(BREAK_DURATION_KEY);
    if (!data) return null;
    const dates: Record<string, number> = JSON.parse(data);
    return dates[date] ?? null;
  } catch (error) {
    console.error('Mola süresi okunurken hata:', error);
    return null;
  }
};

// Bugünün mola kayıtlarını getir
export const getTodayBreakRecords = async (): Promise<WorkRecord[]> => {
  try {
    const records = await getRecords();
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => r.date === today && (r.type === 'molagiris' || r.type === 'molacikis'));
  } catch (error) {
    console.error('Bugünün mola kayıtları alınırken hata:', error);
    return [];
  }
};

// Son mola kaydını getir (bugünün)
export const getLastBreakRecord = async (): Promise<WorkRecord | null> => {
  try {
    const breakRecords = await getTodayBreakRecords();
    if (breakRecords.length === 0) return null;
    // En son kaydı getir (timestamp'e göre sırala)
    const sorted = breakRecords.sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0];
  } catch (error) {
    console.error('Son mola kaydı alınırken hata:', error);
    return null;
  }
};


// Uygulama standartları
const APP_STANDARDS_KEY = 'app_standards';

export interface AppStandards {
  dailyWorkMinutes: number;    // Günlük çalışma süresi (dk), varsayılan 420 (7 saat)
  defaultBreakMinutes: number; // Varsayılan mola süresi (dk), varsayılan 30
  eveningThresholdMinutes: number; // Akşam mesai başlangıcı (gece yarısından dk), varsayılan 1200 (20:00)
  workingDays: number[]; // Çalışma günleri (JS getDay: 0=Pazar..6=Cumartesi), varsayılan [1,2,3,4,5]
}

export const DEFAULT_STANDARDS: AppStandards = {
  dailyWorkMinutes: 420,
  defaultBreakMinutes: 30,
  eveningThresholdMinutes: 1200,
  workingDays: [1, 2, 3, 4, 5], // Pazartesi-Cuma
};

export const getAppStandards = async (): Promise<AppStandards> => {
  try {
    const data = await AsyncStorage.getItem(APP_STANDARDS_KEY);
    if (data) {
      return { ...DEFAULT_STANDARDS, ...JSON.parse(data) };
    }
    return { ...DEFAULT_STANDARDS };
  } catch (error) {
    console.error('Standartlar okunurken hata:', error);
    return { ...DEFAULT_STANDARDS };
  }
};

export const setAppStandards = async (standards: Partial<AppStandards>): Promise<boolean> => {
  try {
    const current = await getAppStandards();
    const updated = { ...current, ...standards };
    await AsyncStorage.setItem(APP_STANDARDS_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Standartlar kaydedilirken hata:', error);
    return false;
  }
};







