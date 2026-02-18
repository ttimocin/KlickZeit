import { auth, db } from '@/config/firebase';
import { WorkRecord } from '@/types';
import { Logger } from '@/utils/logger';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { getRecords, setBreakCounted, setRecords, updateRecord } from './storage';

// Kullanıcı giriş yapmış mı kontrol et
const isUserLoggedIn = () => auth.currentUser !== null;
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

// Firebase'e kayıt ekle (gün bazlı)
export const syncToFirebase = async (record: WorkRecord): Promise<boolean> => {
  // Kullanıcı giriş yapmamışsa sync yapma
  if (!isUserLoggedIn()) {
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
      // Tatil bilgisini kaydet
      if (record.isHoliday) {
        updateData.isHoliday = true;
      }
    } else if (record.type === 'cikis') {
      updateData.cikis = record.time;
      updateData.cikisTimestamp = record.timestamp;
      // Tatil bilgisini kaydet
      if (record.isHoliday) {
        updateData.isHoliday = true;
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

// Senkronize edilmemiş kayıtları Firebase'e yükle
export const syncAllPendingRecords = async (): Promise<{ success: number; failed: number; notLoggedIn?: boolean }> => {
  // Kullanıcı giriş yapmamışsa
  if (!isUserLoggedIn()) {
    return { success: 0, failed: 0, notLoggedIn: true };
  }

  try {
    const records = await getRecords();
    const pending = records.filter(r => !r.synced);

    let success = 0;
    let failed = 0;

    for (const record of pending) {
      const result = await syncToFirebase(record);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  } catch (error) {
    Logger.error('Toplu sync hatası:', error);
    return { success: 0, failed: 0 };
  }
};

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

// Firebase'den kullanıcının kayıtlarını getir ve yerel kayıtlarla birleştir
export const loadFromFirebase = async (): Promise<{ loaded: number; notLoggedIn?: boolean }> => {
  if (!isUserLoggedIn()) {
    return { loaded: 0, notLoggedIn: true };
  }

  const userCollection = getUserRecordsCollection();
  if (!userCollection) return { loaded: 0 };

  try {
    const snapshot = await getDocs(userCollection);

    // Gün bazlı belgelerden kayıtları çıkar
    const firebaseRecords: WorkRecord[] = [];

    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        const date = data.date || docIdToDate(docSnap.id);

        // Tarih formatını doğrula
        if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.warn('Geçersiz tarih formatı atlandı:', date, 'docId:', docSnap.id);
          continue;
        }

        // Tatil bilgisini al
        const isHoliday = data.isHoliday === true;

        // Giriş kaydı
        if (data.giris && data.girisTimestamp) {
          firebaseRecords.push({
            id: `firebase_${docSnap.id}_giris`,
            type: 'giris',
            timestamp: typeof data.girisTimestamp === 'number' ? data.girisTimestamp : Date.now(),
            date,
            time: String(data.giris),
            synced: true,
            isHoliday,
          });
        }

        // Çıkış kaydı
        if (data.cikis && data.cikisTimestamp) {
          firebaseRecords.push({
            id: `firebase_${docSnap.id}_cikis`,
            type: 'cikis',
            timestamp: typeof data.cikisTimestamp === 'number' ? data.cikisTimestamp : Date.now(),
            date,
            time: String(data.cikis),
            synced: true,
            isHoliday,
          });
        }

        // Mola giriş kaydı
        if (data.molaGiris && data.molaGirisTimestamp) {
          firebaseRecords.push({
            id: `firebase_${docSnap.id}_molagiris`,
            type: 'molagiris',
            timestamp: typeof data.molaGirisTimestamp === 'number' ? data.molaGirisTimestamp : Date.now(),
            date,
            time: String(data.molaGiris),
            synced: true,
          });
        }

        // Mola çıkış kaydı
        if (data.molaCikis && data.molaCikisTimestamp) {
          firebaseRecords.push({
            id: `firebase_${docSnap.id}_molacikis`,
            type: 'molacikis',
            timestamp: typeof data.molaCikisTimestamp === 'number' ? data.molaCikisTimestamp : Date.now(),
            date,
            time: String(data.molaCikis),
            synced: true,
          });
        }

        // Mola ayarlarını geri yükle
        if (typeof data.breakCounted === 'boolean') {
          await setBreakCounted(date, data.breakCounted);
        }
      } catch (error) {
        Logger.error('Belge işlenirken hata:', error, 'docId:', docSnap.id);
        // Hatalı belgeyi atla ve devam et
        continue;
      }
    }

    // Mevcut yerel kayıtları al
    const localRecords = await getRecords();

    // Firebase kayıtlarını yerel kayıtlarla birleştir (tekrarları önle)
    const localKeys = new Set(localRecords.map(r => `${r.date}_${r.type}`));
    const newRecords = firebaseRecords.filter(r => !localKeys.has(`${r.date}_${r.type}`));

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
        const data = docSnap.data();
        const date = data.date || docIdToDate(docSnap.id);

        // Tarih formatını doğrula
        if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.warn('Geçersiz tarih formatı atlandı:', date, 'docId:', docSnap.id);
          continue;
        }

        // Tatil bilgisi
        const isHoliday = data.isHoliday === true;

        if (data.giris && data.girisTimestamp) {
          records.push({
            id: `firebase_${docSnap.id}_giris`,
            type: 'giris',
            timestamp: typeof data.girisTimestamp === 'number' ? data.girisTimestamp : Date.now(),
            date,
            time: String(data.giris),
            synced: true,
            isHoliday,
          });
        }

        if (data.cikis && data.cikisTimestamp) {
          records.push({
            id: `firebase_${docSnap.id}_cikis`,
            type: 'cikis',
            timestamp: typeof data.cikisTimestamp === 'number' ? data.cikisTimestamp : Date.now(),
            date,
            time: String(data.cikis),
            synced: true,
            isHoliday,
          });
        }

        if (data.molaGiris && data.molaGirisTimestamp) {
          records.push({
            id: `firebase_${docSnap.id}_molagiris`,
            type: 'molagiris',
            timestamp: typeof data.molaGirisTimestamp === 'number' ? data.molaGirisTimestamp : Date.now(),
            date,
            time: String(data.molaGiris),
            synced: true,
          });
        }

        if (data.molaCikis && data.molaCikisTimestamp) {
          records.push({
            id: `firebase_${docSnap.id}_molacikis`,
            type: 'molacikis',
            timestamp: typeof data.molaCikisTimestamp === 'number' ? data.molaCikisTimestamp : Date.now(),
            date,
            time: String(data.molaCikis),
            synced: true,
          });
        }
      } catch (error) {
        Logger.error('Belge işlenirken hata:', error, 'docId:', docSnap.id);
        // Hatalı belgeyi atla ve devam et
        continue;
      }
    }

    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    Logger.error('Firebase kayıtları alınırken hata:', error);
    return [];
  }
};
