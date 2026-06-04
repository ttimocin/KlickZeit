import { auth, db } from '@/config/firebase';
import { WorkRecord } from '@/types';
import { Logger } from '@/utils/logger';
import { isOnline } from '@/utils/network';
import { collection, deleteField, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  AppStandards,
  DEFAULT_STANDARDS,
  getBreakCounted,
  getBreakDuration,
  getRecords,
  setBreakCounted,
  setBreakDuration,
  setRecords,
  updateRecord,
} from './storage';

// Yedekleme: yalnızca e-posta/Google ile giriş (anonim değil)
const isUserLoggedIn = () => {
  const user = auth.currentUser;
  return user !== null && !user.isAnonymous;
};
const getUserId = () => auth.currentUser?.uid;

// Tarih formatını belge adı için dönüştür (YYYY-MM-DD -> DD_MM_YYYY)
const dateToDocId = (date: string): string => {
  try {
    const parts = date.split('-');
    if (parts.length !== 3) {
      throw new Error('Geçersiz tarih formatı');
    }
    const [year, month, day] = parts;
    // Tarih formatını doğrula
    if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
      throw new Error('Geçersiz tarih formatı');
    }
    return `${day}_${month}_${year}`;
  } catch (error) {
    Logger.error('dateToDocId hatası:', error, 'date:', date);
    // Fallback: geçersiz tarih için hash kullan
    return date.replace(/-/g, '_');
  }
};

// Belge adını tarihe dönüştür (DD_MM_YYYY -> YYYY-MM-DD)
const docIdToDate = (docId: string): string => {
  try {
    const parts = docId.split('_');
    if (parts.length !== 3) {
      throw new Error('Geçersiz belge ID formatı');
    }
    const [day, month, year] = parts;
    // Tarih formatını doğrula
    if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
      throw new Error('Geçersiz belge ID formatı');
    }
    return `${year}-${month}-${day}`;
  } catch (error) {
    Logger.error('docIdToDate hatası:', error, 'docId:', docId);
    // Fallback: geçersiz format için orijinal değeri döndür
    return docId.replace(/_/g, '-');
  }
};

// Kullanıcının kayıt koleksiyonunu al: users/{userId}/work_records
const getUserRecordsCollection = () => {
  const userId = getUserId();
  if (!userId) return null;
  return collection(db, 'users', userId, 'work_records');
};

const timestampToMillis = (value: unknown, date: string, time: string): number => {
  if (typeof value === 'number' && value > 0) return value;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).getTime();
};

const parseFirestoreDocToRecords = (
  docId: string,
  data: Record<string, unknown>
): WorkRecord[] => {
  const dateRaw = data.date ?? docIdToDate(docId);
  const date = typeof dateRaw === 'string' ? dateRaw : docIdToDate(docId);
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return [];

  const isHoliday = data.isHoliday === true;
  const isAnnualLeave = data.isAnnualLeave === true;
  const records: WorkRecord[] = [];

  if (data.giris) {
    const time = String(data.giris);
    records.push({
      id: `firebase_${docId}_giris`,
      type: 'giris',
      timestamp: timestampToMillis(data.girisTimestamp, date, time),
      date,
      time,
      synced: true,
      isHoliday,
      isAnnualLeave,
    });
  }
  if (data.cikis) {
    const time = String(data.cikis);
    records.push({
      id: `firebase_${docId}_cikis`,
      type: 'cikis',
      timestamp: timestampToMillis(data.cikisTimestamp, date, time),
      date,
      time,
      synced: true,
      isHoliday,
      isAnnualLeave,
    });
  }
  if (data.molaGiris) {
    const time = String(data.molaGiris);
    records.push({
      id: `firebase_${docId}_molagiris`,
      type: 'molagiris',
      timestamp: timestampToMillis(data.molaGirisTimestamp, date, time),
      date,
      time,
      synced: true,
    });
  }
  if (data.molaCikis) {
    const time = String(data.molaCikis);
    records.push({
      id: `firebase_${docId}_molacikis`,
      type: 'molacikis',
      timestamp: timestampToMillis(data.molaCikisTimestamp, date, time),
      date,
      time,
      synced: true,
    });
  }
  return records;
};

/** Bir günün tüm yerel kayıtlarını tek Firestore belgesine yazar */
const syncDayDocumentToFirebase = async (
  userId: string,
  date: string,
  dayRecords: WorkRecord[]
): Promise<boolean> => {
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return false;

  const dateDocId = dateToDocId(date);
  const dayDocRef = doc(db, 'users', userId, 'work_records', dateDocId);
  const payload: Record<string, unknown> = {
    date,
    updatedAt: serverTimestamp(),
  };

  for (const record of dayRecords) {
    if (record.type === 'giris') {
      payload.giris = record.time;
      payload.girisTimestamp = record.timestamp;
      if (record.isHoliday) payload.isHoliday = true;
      if (record.isAnnualLeave) payload.isAnnualLeave = true;
    } else if (record.type === 'cikis') {
      payload.cikis = record.time;
      payload.cikisTimestamp = record.timestamp;
      if (record.isHoliday) payload.isHoliday = true;
      if (record.isAnnualLeave) payload.isAnnualLeave = true;
    } else if (record.type === 'molagiris' && !payload.molaGiris) {
      payload.molaGiris = record.time;
      payload.molaGirisTimestamp = record.timestamp;
    } else if (record.type === 'molacikis') {
      payload.molaCikis = record.time;
      payload.molaCikisTimestamp = record.timestamp;
    }
  }

  const breakCounted = await getBreakCounted(date);
  if (breakCounted) payload.breakCounted = true;

  const breakDuration = await getBreakDuration(date);
  if (breakDuration !== null && breakDuration > 0) {
    payload.breakDuration = breakDuration;
  }

  await setDoc(dayDocRef, payload, { merge: true });
  return true;
};

// Firebase'e kayıt ekle (gün bazlı)
export const syncToFirebase = async (record: WorkRecord): Promise<boolean> => {
  if (!isUserLoggedIn()) {
    return false;
  }
  if (!(await isOnline())) {
    return false;
  }

  const userId = getUserId();
  if (!userId) return false;

  try {
    // Tarih formatını doğrula
    if (!record.date || !record.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Logger.error('Geçersiz tarih formatı:', record.date);
      return false;
    }

    // Gün bazlı belge referansı: users/{userId}/work_records/{DD_MM_YYYY}
    const dateDocId = dateToDocId(record.date);
    if (!dateDocId) {
      Logger.error('Belge ID oluşturulamadı:', record.date);
      return false;
    }

    const dayDocRef = doc(db, 'users', userId, 'work_records', dateDocId);

    // Mevcut belgeyi oku
    const existingDoc = await getDoc(dayDocRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : {};

    // Yeni veriyi hazırla
    const updateData: Record<string, unknown> = {
      date: record.date,
      updatedAt: serverTimestamp(),
    };

    // Kayıt tipine göre veriyi hazırla
    if (record.type === 'giris') {
      updateData.giris = record.time;
      updateData.girisTimestamp = record.timestamp;
      // Tatil veya yıllık izin bilgisini kaydet
      if (record.isHoliday) {
        updateData.isHoliday = true;
      }
      if (record.isAnnualLeave) {
        updateData.isAnnualLeave = true;
      }
    } else if (record.type === 'cikis') {
      updateData.cikis = record.time;
      updateData.cikisTimestamp = record.timestamp;
      // Tatil veya yıllık izin bilgisini kaydet
      if (record.isHoliday) {
        updateData.isHoliday = true;
      }
      if (record.isAnnualLeave) {
        updateData.isAnnualLeave = true;
      }
    } else if (record.type === 'molagiris') {
      // Sadece ilk mola girişini kaydet (eğer yoksa)
      if (!existingData.molaGiris) {
        updateData.molaGiris = record.time;
        updateData.molaGirisTimestamp = record.timestamp;
      }
    } else if (record.type === 'molacikis') {
      // Son mola çıkışını her zaman güncelle
      updateData.molaCikis = record.time;
      updateData.molaCikisTimestamp = record.timestamp;
    } else {
      Logger.error('Geçersiz kayıt tipi:', record.type);
      return false;
    }

    // Belgeyi güncelle veya oluştur
    await setDoc(dayDocRef, { ...existingData, ...updateData }, { merge: true });

    // Yerel kaydı güncelle
    await updateRecord(record.id, { synced: true });
    return true;
  } catch (error: any) {
    Logger.error('Firebase sync hatası:', error);
    // Firebase hata kodlarını kontrol et
    if (error?.code === 'permission-denied') {
      Logger.error('Firestore izin hatası - kuralları kontrol edin');
    } else if (error?.code === 'unavailable') {
      Logger.error('Firebase servisi kullanılamıyor');
    }
    return false;
  }
};

export type SyncProgressCallback = (current: number, total: number) => void;

export type SyncAllRecordsResult = {
  success: number;
  failed: number;
  skipped: number;
  totalDays: number;
  nothingToSync?: boolean;
  notLoggedIn?: boolean;
  offline?: boolean;
};

// Değişmemiş (synced) günleri atlar; en az bir kaydı pending olan günleri yedekler
export const syncAllPendingRecords = async (
  onProgress?: SyncProgressCallback,
  options?: { forceFull?: boolean }
): Promise<SyncAllRecordsResult> => {
  if (!isUserLoggedIn()) {
    return { success: 0, failed: 0, skipped: 0, totalDays: 0, notLoggedIn: true };
  }
  if (!(await isOnline())) {
    return { success: 0, failed: 0, skipped: 0, totalDays: 0, offline: true };
  }

  const userId = getUserId();
  if (!userId) return { success: 0, failed: 0, skipped: 0, totalDays: 0, notLoggedIn: true };

  try {
    const records = await getRecords();
    const byDate = new Map<string, WorkRecord[]>();

    for (const record of records) {
      if (!record.date?.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
      const list = byDate.get(record.date) ?? [];
      list.push(record);
      byDate.set(record.date, list);
    }

    const allDates = Array.from(byDate.entries());
    const forceFull = options?.forceFull === true;
    const dateEntries = forceFull
      ? allDates
      : allDates.filter(([, dayRecords]) => dayRecords.some((r) => !r.synced));

    const skipped = allDates.length - dateEntries.length;

    if (dateEntries.length === 0) {
      onProgress?.(0, 0);
      return {
        success: 0,
        failed: 0,
        skipped,
        totalDays: allDates.length,
        nothingToSync: allDates.length > 0,
      };
    }

    const total = dateEntries.length;
    onProgress?.(0, total);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < dateEntries.length; i++) {
      const [date, dayRecords] = dateEntries[i];
      try {
        const ok = await syncDayDocumentToFirebase(userId, date, dayRecords);
        if (ok) {
          success++;
          for (const r of dayRecords) {
            await updateRecord(r.id, { synced: true });
          }
        } else {
          failed++;
        }
      } catch (error) {
        Logger.error('Gün yedekleme hatası:', date, error);
        failed++;
      }
      onProgress?.(i + 1, total);
    }

    return { success, failed, skipped, totalDays: allDates.length };
  } catch (error) {
    Logger.error('Toplu sync hatası:', error);
    return { success: 0, failed: 0, skipped: 0, totalDays: 0 };
  }
};

/** Tüm günleri yeniden buluta yazar (CSV sonrası veya onarım) */
export const syncAllRecordsFull = async (onProgress?: SyncProgressCallback) =>
  syncAllPendingRecords(onProgress, { forceFull: true });

// Mola ayarlarını Firebase'e sync et
export const syncBreakSettings = async (date: string, breakCounted: boolean): Promise<boolean> => {
  if (!isUserLoggedIn()) {
    return false;
  }

  const userId = getUserId();
  if (!userId) return false;

  try {
    const dateDocId = dateToDocId(date);
    if (!dateDocId) return false;

    const dayDocRef = doc(db, 'users', userId, 'work_records', dateDocId);

    await setDoc(dayDocRef, {
      date,
      breakCounted,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (error) {
    Logger.error('Mola ayarları sync hatası:', error);
    return false;
  }
};

export type LoadFromFirebaseOptions = {
  /** true: buluttaki veri yerel listeyi tamamen değiştirir (Ayarlar → Buluttan yükle) */
  replaceLocal?: boolean;
};

// Firebase'den kullanıcının kayıtlarını getir
export const loadFromFirebase = async (
  options?: LoadFromFirebaseOptions,
  onProgress?: SyncProgressCallback
): Promise<{ loaded: number; notLoggedIn?: boolean; offline?: boolean }> => {
  if (!isUserLoggedIn()) {
    return { loaded: 0, notLoggedIn: true };
  }
  if (!(await isOnline())) {
    return { loaded: 0, offline: true };
  }

  const userCollection = getUserRecordsCollection();
  if (!userCollection) return { loaded: 0 };

  try {
    const snapshot = await getDocs(userCollection);
    const firebaseRecords: WorkRecord[] = [];
    const docs = snapshot.docs;
    const total = docs.length;
    onProgress?.(0, total);

    for (let i = 0; i < docs.length; i++) {
      const docSnap = docs[i];
      try {
        const data = docSnap.data() as Record<string, unknown>;
        const dayRecords = parseFirestoreDocToRecords(docSnap.id, data);
        firebaseRecords.push(...dayRecords);

        const date = (typeof data.date === 'string' ? data.date : docIdToDate(docSnap.id)) as string;
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          if (typeof data.breakCounted === 'boolean') {
            await setBreakCounted(date, data.breakCounted);
          }
          if (typeof data.breakDuration === 'number' && data.breakDuration >= 0) {
            await setBreakDuration(date, data.breakDuration);
          }
        }
      } catch (error) {
        Logger.error('Belge işlenirken hata:', error, 'docId:', docSnap.id);
        continue;
      }
      onProgress?.(i + 1, total);
    }

    const sortedFirebase = firebaseRecords.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.replaceLocal) {
      await setRecords(sortedFirebase);
      return { loaded: sortedFirebase.length };
    }

    const localRecords = await getRecords();
    const localKeys = new Set(localRecords.map((r) => `${r.date}_${r.type}`));
    const newRecords = sortedFirebase.filter((r) => !localKeys.has(`${r.date}_${r.type}`));

    if (newRecords.length > 0) {
      const mergedRecords = [...localRecords, ...newRecords].sort((a, b) => b.timestamp - a.timestamp);
      await setRecords(mergedRecords);
    }

    return { loaded: newRecords.length };
  } catch (error) {
    Logger.error('Firebase kayıtları alınırken hata:', error);
    return { loaded: 0 };
  }
};

/** Bulutta yüklenebilir iş kaydı (giriş/çıkış) var mı */
export const cloudHasWorkBackup = async (): Promise<boolean> => {
  if (!isUserLoggedIn()) return false;
  if (!(await isOnline())) return false;

  const userCollection = getUserRecordsCollection();
  if (!userCollection) return false;

  try {
    const snapshot = await getDocs(userCollection);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Record<string, unknown>;
      if (data.giris || data.cikis) return true;
    }
    return false;
  } catch (error) {
    Logger.error('Bulut yedek kontrolü hatası:', error);
    return false;
  }
};

// Firebase'den tüm kayıtları getir
export const getFirebaseRecords = async (): Promise<WorkRecord[]> => {
  if (!isUserLoggedIn()) {
    return [];
  }

  const userCollection = getUserRecordsCollection();
  if (!userCollection) return [];

  try {
    const snapshot = await getDocs(userCollection);
    const records: WorkRecord[] = [];

    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data() as Record<string, unknown>;
        records.push(...parseFirestoreDocToRecords(docSnap.id, data));
      } catch (error) {
        Logger.error('Belge işlenirken hata:', error, 'docId:', docSnap.id);
        continue;
      }
    }

    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    Logger.error('Firebase kayıtları alınırken hata:', error);
    return [];
  }
};

export type SyncStandardsOptions = { /** Buluttan doğrulamadan zorla yaz (manuel yedekleme) */ force?: boolean };

export type SyncStandardsResult = { ok: boolean; skipped?: boolean; errorCode?: string };

const readCloudAnnualLeave = (data: Record<string, unknown> | undefined): number | null =>
  typeof data?.annualLeaveQuota === 'number' ? Math.round(data.annualLeaveQuota) : null;

const readCloudWorkStartDate = (data: Record<string, unknown> | undefined): string | null => {
  const v = data?.workStartDate;
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

/** İşe başlama + yıllık izin bulutta yereldekiyle aynı mı? */
const criticalSettingsMatchCloud = async (
  userId: string,
  standards: AppStandards
): Promise<boolean> => {
  const localQuota = Math.round(standards.annualLeaveQuota ?? 0);
  const localDate = standards.workStartDate ?? null;

  const refs = [
    doc(db, 'users', userId, 'settings', 'profile'),
    doc(db, 'users', userId, 'settings', 'standards'),
    doc(db, 'users', userId),
  ];

  for (const ref of refs) {
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;
    const d = snap.data() as Record<string, unknown>;
    if (readCloudAnnualLeave(d) === localQuota && readCloudWorkStartDate(d) === localDate) {
      return true;
    }
  }
  return false;
};

const writeCriticalProfileDoc = async (userId: string, standards: AppStandards): Promise<void> => {
  const profileRef = doc(db, 'users', userId, 'settings', 'profile');
  const data: Record<string, unknown> = {
    annualLeaveQuota: Math.max(0, Math.min(365, Math.round(standards.annualLeaveQuota ?? 0))),
    updatedAt: Date.now(),
  };
  if (standards.workStartDate) {
    data.workStartDate = standards.workStartDate;
  }
  await setDoc(profileRef, data, { merge: true });
  if (!standards.workStartDate) {
    await setDoc(profileRef, { workStartDate: deleteField() }, { merge: true });
  }
};

const verifyCriticalOnCloud = (
  standards: AppStandards,
  ...snaps: { exists: () => boolean; data: () => Record<string, unknown> | undefined }[]
): boolean => {
  const localQuota = Math.round(standards.annualLeaveQuota ?? 0);
  const localDate = standards.workStartDate ?? null;

  return snaps.some((snap) => {
    if (!snap.exists()) return false;
    const d = snap.data();
    return readCloudAnnualLeave(d) === localQuota && readCloudWorkStartDate(d) === localDate;
  });
};

/** Firestore'a yazılacak standartlar (işe başlama + yıllık izin dahil) */
const parseWorkScheduleMode = (value: unknown): AppStandards['workScheduleMode'] =>
  value === 'flexible' ? 'flexible' : 'fixed';

const buildStandardsFirestorePayload = (standards: AppStandards): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    workScheduleMode: standards.workScheduleMode ?? 'fixed',
    dailyWorkMinutes: standards.dailyWorkMinutes,
    defaultBreakMinutes: standards.defaultBreakMinutes,
    eveningThresholdMinutes: standards.eveningThresholdMinutes,
    workingDays: standards.workingDays,
    annualLeaveQuota: Math.max(0, Math.min(365, Math.round(standards.annualLeaveQuota ?? 0))),
    extendedPastWeeks: (standards.extendedPastWeeks ?? []).filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w)),
    updatedAt: Date.now(),
  };
  if (standards.workStartDate) {
    payload.workStartDate = standards.workStartDate;
  }
  return payload;
};

const buildCriticalSettingsPayload = (standards: AppStandards): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    annualLeaveQuota: Math.max(0, Math.min(365, Math.round(standards.annualLeaveQuota ?? 0))),
    settingsUpdatedAt: Date.now(),
  };
  if (standards.workStartDate) {
    payload.workStartDate = standards.workStartDate;
  }
  return payload;
};

const parseStandardsFromFirestore = (data: Record<string, unknown>): AppStandards => {
  const parsed: AppStandards = {
    ...DEFAULT_STANDARDS,
    workScheduleMode: parseWorkScheduleMode(data.workScheduleMode),
    dailyWorkMinutes: typeof data.dailyWorkMinutes === 'number' ? data.dailyWorkMinutes : DEFAULT_STANDARDS.dailyWorkMinutes,
    defaultBreakMinutes: typeof data.defaultBreakMinutes === 'number' ? data.defaultBreakMinutes : DEFAULT_STANDARDS.defaultBreakMinutes,
    eveningThresholdMinutes: typeof data.eveningThresholdMinutes === 'number' ? data.eveningThresholdMinutes : DEFAULT_STANDARDS.eveningThresholdMinutes,
    workingDays: Array.isArray(data.workingDays) ? (data.workingDays as number[]) : DEFAULT_STANDARDS.workingDays,
    annualLeaveQuota: typeof data.annualLeaveQuota === 'number' ? Math.round(data.annualLeaveQuota) : 0,
  };
  if (typeof data.workStartDate === 'string' && data.workStartDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    parsed.workStartDate = data.workStartDate;
  } else {
    delete parsed.workStartDate;
  }
  if (Array.isArray(data.extendedPastWeeks)) {
    parsed.extendedPastWeeks = data.extendedPastWeeks.filter(
      (w): w is string => typeof w === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w)
    );
  } else {
    parsed.extendedPastWeeks = [];
  }
  return parsed;
};

// Standartları Firebase'e sync et (profile + settings/standards + users/{uid})
export const syncStandards = async (options?: SyncStandardsOptions): Promise<SyncStandardsResult> => {
  if (!isUserLoggedIn()) return { ok: false, errorCode: 'not-logged-in' };
  if (!(await isOnline())) return { ok: false, errorCode: 'offline' };
  const userId = getUserId();
  if (!userId) return { ok: false, errorCode: 'no-user-id' };

  try {
    const { getAppStandards, saveSettingsSyncFingerprint } = await import('./storage');
    const standards = await getAppStandards();

    if (!options?.force && (await criticalSettingsMatchCloud(userId, standards))) {
      return { ok: true, skipped: true };
    }

    const profileDocRef = doc(db, 'users', userId, 'settings', 'profile');
    const standardsDocRef = doc(db, 'users', userId, 'settings', 'standards');
    const userDocRef = doc(db, 'users', userId);
    const payload = buildStandardsFirestorePayload(standards);
    const critical = buildCriticalSettingsPayload(standards);

    await writeCriticalProfileDoc(userId, standards);
    await setDoc(standardsDocRef, payload, { merge: true });
    await setDoc(userDocRef, critical, { merge: true });

    if (!standards.workStartDate) {
      await setDoc(standardsDocRef, { workStartDate: deleteField() }, { merge: true });
      await setDoc(userDocRef, { workStartDate: deleteField() }, { merge: true });
    }

    const [profileSnap, standardsSnap, userSnap] = await Promise.all([
      getDoc(profileDocRef),
      getDoc(standardsDocRef),
      getDoc(userDocRef),
    ]);

    if (verifyCriticalOnCloud(standards, profileSnap, standardsSnap, userSnap)) {
      await saveSettingsSyncFingerprint(standards);
      return { ok: true, skipped: false };
    }

    Logger.error('Kritik ayarlar bulutta doğrulanamadı:', {
      localDate: standards.workStartDate,
      localQuota: standards.annualLeaveQuota,
      profile: profileSnap.data(),
      standards: standardsSnap.data(),
      user: userSnap.data(),
    });
    return { ok: false, errorCode: 'verify-failed' };
  } catch (error) {
    const errorCode = (error as { code?: string })?.code ?? 'unknown';
    Logger.error('Standartlar sync hatası:', error);
    return { ok: false, errorCode };
  }
};

// Standartları Firebase'den yükle (settings/standards öncelikli, users/{uid} yedek)
export const loadStandardsFromFirebase = async (): Promise<boolean> => {
  if (!isUserLoggedIn()) return false;
  if (!(await isOnline())) return false;
  const userId = getUserId();
  if (!userId) return false;

  try {
    const standardsDocRef = doc(db, 'users', userId, 'settings', 'standards');
    const userDocRef = doc(db, 'users', userId);
    const [standardsSnap, userSnap] = await Promise.all([getDoc(standardsDocRef), getDoc(userDocRef)]);

    if (!standardsSnap.exists() && !userSnap.exists()) {
      return false;
    }

    const profileDocRef = doc(db, 'users', userId, 'settings', 'profile');
    const profileSnap = await getDoc(profileDocRef);

    const merged: Record<string, unknown> = {
      ...(userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {}),
      ...(standardsSnap.exists() ? (standardsSnap.data() as Record<string, unknown>) : {}),
      ...(profileSnap.exists() ? (profileSnap.data() as Record<string, unknown>) : {}),
    };

    const { setAppStandards } = await import('./storage');
    const parsed = parseStandardsFromFirestore(merged);
    await setAppStandards(parsed, { replace: true });
    return true;
  } catch (error) {
    Logger.error('Standartlar yükleme hatası:', error);
    return false;
  }
};
