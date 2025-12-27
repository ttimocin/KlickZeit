import i18n from '@/i18n';
import { DailySummary, WorkRecord } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getRecords, upsertRecordByDateType } from './storage';

// Kayıtları günlük özete dönüştür
const groupByDate = (records: WorkRecord[]): DailySummary[] => {
  const grouped: { [key: string]: DailySummary } = {};
  
  // Tarihe göre sırala (eskiden yeniye)
  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  
  for (const record of sorted) {
    if (!grouped[record.date]) {
      grouped[record.date] = { date: record.date };
    }
    
    if (record.type === 'giris' && !grouped[record.date].giris) {
      grouped[record.date].giris = record.time;
    } else if (record.type === 'cikis') {
      grouped[record.date].cikis = record.time;
    }
    
    // Tatil günü bilgisini aktar
    if (record.isHoliday) {
      grouped[record.date].isHoliday = true;
    }
  }
  
  // Çalışma süresini hesapla
  for (const date in grouped) {
    const summary = grouped[date];
    if (summary.giris && summary.cikis) {
      const [girisH, girisM] = summary.giris.split(':').map(Number);
      const [cikisH, cikisM] = summary.cikis.split(':').map(Number);
      
      const girisMinutes = girisH * 60 + girisM;
      const cikisMinutes = cikisH * 60 + cikisM;
      const diff = cikisMinutes - girisMinutes;
      
      if (diff > 0) {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        summary.calismaSuresi = `${hours} ${i18n.t('hours')} ${minutes} ${i18n.t('minutes')}`;
      }
    }
  }
  
  // Tarihe göre sırala (yeniden eskiye)
  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
};

// CSV formatına dönüştür (Excel uyumlu)
const toCSV = (summaries: DailySummary[]): string => {
  // BOM (Byte Order Mark) - Excel'in UTF-8 karakterleri doğru göstermesi için
  const BOM = '\uFEFF';
  
  // Header'ları ASCII karakterlerle yaz (Türkçe karakter sorunu önlemek için)
  const header = `Tarih;Giris;Cikis;Sure\r\n`;
  
  // Çalışma süresini de ASCII formatla
  const rows = summaries.map(s => {
    let sure = '-';
    if (s.giris && s.cikis) {
      const [girisH, girisM] = s.giris.split(':').map(Number);
      const [cikisH, cikisM] = s.cikis.split(':').map(Number);
      const diff = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);
      if (diff > 0) {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        sure = `${hours}:${String(minutes).padStart(2, '0')}`;
      }
    }
    return `${s.date};${s.giris || '-'};${s.cikis || '-'};${sure}`;
  }).join('\r\n');
  
  return BOM + header + rows;
};

// CSV dosyası olarak dışa aktar
export const exportToCSV = async (): Promise<boolean> => {
  try {
    const records = await getRecords();
    
    if (records.length === 0) {
      return false;
    }
    
    const summaries = groupByDate(records);
    const csv = toCSV(summaries);
    
    const fileName = `is_takip_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, csv);
    
    // Paylaşım diyaloğunu aç
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'İş Takip Kayıtlarını Paylaş',
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Export hatası:', error);
    return false;
  }
};

// Günlük özetleri getir
export const getDailySummaries = async (): Promise<DailySummary[]> => {
  const records = await getRecords();
  return groupByDate(records);
};

// Tarih formatını YYYY-MM-DD'ye dönüştür
const parseDate = (dateStr: string): string | null => {
  const trimmed = dateStr.trim();
  
  // YYYY-MM-DD formatı
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // DD.MM.YYYY formatı
  const dotMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // DD/MM/YYYY formatı
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
};

// Saat formatını kontrol et
const parseTime = (timeStr: string): string | null => {
  const trimmed = timeStr.trim();
  if (!trimmed || trimmed === '-') return null;
  
  // HH:MM formatı
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  return null;
};

// CSV dosyasından içe aktar (mevcut kayıtları günceller veya yeni ekler)
export const importFromCSV = async (): Promise<{ success: boolean; imported: number; updated: number; error?: string }> => {
  try {
    // Dosya seç
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
      copyToCacheDirectory: true,
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, imported: 0, updated: 0, error: 'cancelled' };
    }
    
    const file = result.assets[0];
    
    // Dosya içeriğini oku
    const content = await FileSystem.readAsStringAsync(file.uri);
    
    // BOM karakterini kaldır
    const cleanContent = content.replace(/^\uFEFF/, '');
    
    // Satırlara ayır
    const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, imported: 0, updated: 0, error: 'empty' };
    }
    
    // İlk satır header, atla
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let updated = 0;
    
    for (const line of dataLines) {
      // ; veya , veya tab ile ayır
      const parts = line.split(/[;,\t]/).map(p => p.trim());
      
      if (parts.length < 2) continue;
      
      const [rawDate, rawGiris, rawCikis] = parts;
      
      // Tarihi parse et
      const date = parseDate(rawDate);
      if (!date) continue;
      
      // Giriş kaydı ekle veya güncelle
      const giris = parseTime(rawGiris);
      if (giris) {
        const result = await upsertRecordByDateType(date, 'giris', giris);
        if (result.action === 'added') imported++;
        else if (result.action === 'updated') updated++;
      }
      
      // Çıkış kaydı ekle veya güncelle
      const cikis = parseTime(rawCikis);
      if (cikis) {
        const result = await upsertRecordByDateType(date, 'cikis', cikis);
        if (result.action === 'added') imported++;
        else if (result.action === 'updated') updated++;
      }
    }
    
    return { success: true, imported, updated };
  } catch (error) {
    console.error('Import hatası:', error);
    return { success: false, imported: 0, updated: 0, error: String(error) };
  }
};



