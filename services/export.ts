import i18n from '@/i18n';
import { DailySummary, WorkRecord } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getAppStandards, getBreakCounted, getBreakDuration, getRecords, isFlexibleSchedule, markAllRecordsUnsynced, setBreakCounted, setBreakDuration, upsertRecordByDateType } from './storage';

// Kayıtları günlük özete dönüştür
const groupByDate = async (records: WorkRecord[]): Promise<DailySummary[]> => {
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
    } else if (record.type === 'molagiris' && !grouped[record.date].molaGiris) {
      // İlk mola giriş saatini kaydet
      grouped[record.date].molaGiris = record.time;
    } else if (record.type === 'molacikis') {
      // Son mola çıkış saatini kaydet (her molacikis'te güncelle)
      grouped[record.date].molaCikis = record.time;
    }

    // Tatil günü bilgisini aktar
    if (record.isHoliday) {
      grouped[record.date].isHoliday = true;
    }

    // Yıllık izin bilgisini aktar
    if (record.isAnnualLeave) {
      grouped[record.date].isAnnualLeave = true;
    }
  }

  // Çalışma süresini hesapla ve mola bilgilerini ekle
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

    // Mola bilgilerini ekle
    summary.breakCounted = await getBreakCounted(date);
    const breakDuration = await getBreakDuration(date);
    if (breakDuration !== null) {
      (summary as any).breakDuration = breakDuration;
    }
  }

  // Tarihe göre sırala (yeniden eskiye)
  return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
};

// CSV formatına dönüştür (Excel uyumlu)
const toCSV = (
  summaries: DailySummary[],
  dailyTarget: number,
  defaultBreakMinutes: number,
  skipBalance = false
): string => {
  // BOM (Byte Order Mark) - Excel'in UTF-8 karakterleri doğru göstermesi için
  const BOM = '\uFEFF';

  const DAILY_TARGET = dailyTarget;

  // Header'ları seçili dile göre yaz
  const header = `${i18n.t('csvDate')};${i18n.t('csvEntry')};${i18n.t('csvExit')};${i18n.t('csvGrossDuration')};${i18n.t('csvNetDuration')};${i18n.t('csvBalance')};${i18n.t('csvHoliday')};${i18n.t('csvAnnualLeave')};${i18n.t('csvBreakCounted')};${i18n.t('csvBreakDuration')};${i18n.t('csvBreakEntry')};${i18n.t('csvBreakExit')}\r\n`;

  // Çalışma süresini de ASCII formatla
  const rows = summaries.map(s => {
    let brutSure = '-';
    let netSure = '-';
    let bakiye = '-';

    if (s.giris && s.cikis) {
      const [girisH, girisM] = s.giris.split(':').map(Number);
      const [cikisH, cikisM] = s.cikis.split(':').map(Number);
      const diff = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);

      if (diff > 0) {
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        brutSure = `${hours}:${String(minutes).padStart(2, '0')}`;

        // Net süreyi hesapla (mola düşülmüşse)
        const breakCounted = s.breakCounted || false;
        const breakDuration = (s as any).breakDuration ?? 0;
        const netDiff = breakCounted ? diff : (diff - breakDuration);

        if (netDiff > 0) {
          const netHours = Math.floor(netDiff / 60);
          const netMinutes = netDiff % 60;
          netSure = `${netHours}:${String(netMinutes).padStart(2, '0')}`;

          if (!skipBalance) {
            const balanceMin = netDiff - DAILY_TARGET;
            const absBalance = Math.abs(balanceMin);
            const bH = Math.floor(absBalance / 60);
            const bM = absBalance % 60;
            const sign = balanceMin >= 0 ? '+' : '-';
            bakiye = `${sign}${bH}:${String(bM).padStart(2, '0')}`;
          }
        } else {
          netSure = '0:00';
          if (!skipBalance) {
            const balanceMin = 0 - DAILY_TARGET;
            const absBalance = Math.abs(balanceMin);
            const bH = Math.floor(absBalance / 60);
            const bM = absBalance % 60;
            bakiye = `-${bH}:${String(bM).padStart(2, '0')}`;
          }
        }

        if (!skipBalance && s.isAnnualLeave) {
          const hours = Math.floor(DAILY_TARGET / 60);
          const mins = DAILY_TARGET % 60;
          netSure = `${hours}:${String(mins).padStart(2, '0')}`;
          bakiye = '+0:00';
        }
      }
    }

    const tatil = s.isHoliday ? '1' : '0';
    const yillikIzin = s.isAnnualLeave ? '1' : '0';
    const breakCounted = s.breakCounted ? '1' : '0';
    const breakDuration = (s as any).breakDuration ?? 0;
    const molaGiris = s.molaGiris || '-';
    const molaCikis = s.molaCikis || '-';
    return `${s.date};${s.giris || '-'};${s.cikis || '-'};${brutSure};${netSure};${bakiye};${tatil};${yillikIzin};${breakCounted};${breakDuration};${molaGiris};${molaCikis}`;
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

    const summaries = await groupByDate(records);
    const standards = await getAppStandards();
    const csv = toCSV(
      summaries,
      standards.dailyWorkMinutes,
      standards.defaultBreakMinutes,
      isFlexibleSchedule(standards)
    );

    const fileName = `KlickZeit_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csv);

    // Paylaşım diyaloğunu aç
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
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

// PDF olarak dışa aktar
export const exportToPDF = async (): Promise<boolean> => {
  try {
    const records = await getRecords();
    if (records.length === 0) return false;

    const summaries = await groupByDate(records);
    const standards = await getAppStandards();
    const defaultBreakMinutes = standards.defaultBreakMinutes;
    const DAILY_TARGET = standards.dailyWorkMinutes;
    const skipBalance = isFlexibleSchedule(standards);

    // HTML tablo oluştur
    const rows = summaries.map(s => {
      let brutSure = '-';
      let netSure = '-';
      let bakiye = '-';

      if (s.giris && s.cikis) {
        const [girisH, girisM] = s.giris.split(':').map(Number);
        const [cikisH, cikisM] = s.cikis.split(':').map(Number);
        const diff = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);
        if (diff > 0) {
          brutSure = `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`;
          const breakCounted = s.breakCounted || false;
          const breakDuration = (s as any).breakDuration ?? 0;
          const netDiff = breakCounted ? diff : (diff - breakDuration);
          if (netDiff > 0) {
            netSure = `${Math.floor(netDiff / 60)}:${String(netDiff % 60).padStart(2, '0')}`;
            if (!skipBalance) {
              const balanceMin = netDiff - DAILY_TARGET;
              const absB = Math.abs(balanceMin);
              bakiye = `${balanceMin >= 0 ? '+' : '-'}${Math.floor(absB / 60)}:${String(absB % 60).padStart(2, '0')}`;
            }
          } else {
            netSure = '0:00';
            if (!skipBalance) {
              const balanceMin = 0 - DAILY_TARGET;
              const absB = Math.abs(balanceMin);
              bakiye = `-${Math.floor(absB / 60)}:${String(absB % 60).padStart(2, '0')}`;
            }
          }
        }
      }

      const tatil = s.isHoliday ? '✓' : '';
      const yillikIzin = s.isAnnualLeave ? '✓' : '';
      const rowBg = s.isHoliday ? '#e8f5e9' : s.isAnnualLeave ? '#fffbeb' : '#fff';
      const balColor = bakiye.startsWith('+') ? '#2e7d32' : bakiye.startsWith('-') ? '#c62828' : '#333';

      return `<tr style="background:${rowBg}">
        <td>${s.date}</td>
        <td>${s.giris || '-'}</td>
        <td>${s.cikis || '-'}</td>
        <td>${brutSure}</td>
        <td>${netSure}</td>
        <td style="color:${balColor};font-weight:600">${bakiye}</td>
        <td style="text-align:center">${tatil}</td>
        <td style="text-align:center">${yillikIzin}</td>
        <td>${s.molaGiris || '-'}</td>
        <td>${s.molaCikis || '-'}</td>
      </tr>`;
    }).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, sans-serif; padding: 20px; font-size: 11px; }
            h1 { font-size: 18px; color: #1a1a2e; margin-bottom: 4px; }
            .subtitle { color: #666; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1a1a2e; color: #fff; padding: 8px 6px; text-align: left; font-size: 10px; }
            td { padding: 6px; border-bottom: 1px solid #eee; font-size: 10px; }
            tr:hover { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>KlickZeit</h1>
          <div class="subtitle">${summaries.length} ${i18n.t('records')} • ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>${i18n.t('csvDate')}</th>
                <th>${i18n.t('csvEntry')}</th>
                <th>${i18n.t('csvExit')}</th>
                <th>${i18n.t('csvGrossDuration')}</th>
                <th>${i18n.t('csvNetDuration')}</th>
                <th>${i18n.t('csvBalance')}</th>
                <th>${i18n.t('csvHoliday')}</th>
                <th>${i18n.t('csvAnnualLeave')}</th>
                <th>${i18n.t('csvBreakEntry')}</th>
                <th>${i18n.t('csvBreakExit')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    // Dosyayı KlickZeit_ ismiyle taşı
    const fileName = `KlickZeit_${new Date().toISOString().split('T')[0]}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'KlickZeit PDF',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('PDF Export hatası:', error);
    return false;
  }
};

// Excel olarak dışa aktar
export const exportToExcel = async (): Promise<boolean> => {
  try {
    const records = await getRecords();
    if (records.length === 0) return false;

    const summaries = await groupByDate(records);
    const standards = await getAppStandards();
    const DAILY_TARGET = standards.dailyWorkMinutes;
    const skipBalance = isFlexibleSchedule(standards);

    // Satırları oluştur
    const data = summaries.map(s => {
      let brutSure = '-';
      let netSure = '-';
      let bakiye = '-';

      if (s.giris && s.cikis) {
        const [girisH, girisM] = s.giris.split(':').map(Number);
        const [cikisH, cikisM] = s.cikis.split(':').map(Number);
        const diff = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);
        if (diff > 0) {
          brutSure = `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')}`;
          const breakCounted = s.breakCounted || false;
          const breakDuration = (s as any).breakDuration ?? 0;
          const netDiff = breakCounted ? diff : (diff - breakDuration);
          if (netDiff > 0) {
            netSure = `${Math.floor(netDiff / 60)}:${String(netDiff % 60).padStart(2, '0')}`;
            if (!skipBalance) {
              const balanceMin = netDiff - DAILY_TARGET;
              const absB = Math.abs(balanceMin);
              bakiye = `${balanceMin >= 0 ? '+' : '-'}${Math.floor(absB / 60)}:${String(absB % 60).padStart(2, '0')}`;
            }
          } else {
            netSure = '0:00';
            if (!skipBalance) {
              const balanceMin = 0 - DAILY_TARGET;
              const absB = Math.abs(balanceMin);
              bakiye = `-${Math.floor(absB / 60)}:${String(absB % 60).padStart(2, '0')}`;
            }
          }

          if (!skipBalance && s.isAnnualLeave) {
            const hours = Math.floor(DAILY_TARGET / 60);
            const mins = DAILY_TARGET % 60;
            netSure = `${hours}:${String(mins).padStart(2, '0')}`;
            bakiye = '+0:00';
          }
        }
      }

      return {
        [i18n.t('csvDate')]: s.date,
        [i18n.t('csvEntry')]: s.giris || '-',
        [i18n.t('csvExit')]: s.cikis || '-',
        [i18n.t('csvGrossDuration')]: brutSure,
        [i18n.t('csvNetDuration')]: netSure,
        [i18n.t('csvBalance')]: bakiye,
        [i18n.t('csvHoliday')]: s.isHoliday ? '1' : '0',
        [i18n.t('csvAnnualLeave')]: s.isAnnualLeave ? '1' : '0',
        [i18n.t('csvBreakCounted')]: s.breakCounted ? '1' : '0',
        [i18n.t('csvBreakDuration')]: (s as any).breakDuration ?? 0,
        [i18n.t('csvBreakEntry')]: s.molaGiris || '-',
        [i18n.t('csvBreakExit')]: s.molaCikis || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);

    // Sütun genişliklerini ayarla
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 8 },  // Entry
      { wch: 8 },  // Exit
      { wch: 12 }, // Gross
      { wch: 10 }, // Net
      { wch: 10 }, // Balance
      { wch: 8 },  // Holiday
      { wch: 12 }, // Annual Leave
      { wch: 14 }, // BreakCounted
      { wch: 12 }, // BreakDuration
      { wch: 10 }, // BreakEntry
      { wch: 10 }, // BreakExit
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KlickZeit');

    // Base64 olarak yaz
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const fileName = `KlickZeit_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'KlickZeit Excel',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Excel Export hatası:', error);
    return false;
  }
};

// Günlük özetleri getir
export const getDailySummaries = async (): Promise<DailySummary[]> => {
  const records = await getRecords();
  return await groupByDate(records);
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

// iOS Files app often tags CSV as plain text / comma-separated-values, not text/csv MIME.
const getCsvDocumentPickerTypes = (): string | string[] => {
  if (Platform.OS === 'ios') {
    return [
      'public.comma-separated-values-text',
      'public.plain-text',
      'text/csv',
      'text/*',
      '*/*',
    ];
  }
  return ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'];
};

// CSV dosyasından içe aktar (mevcut kayıtları günceller veya yeni ekler)
export const importFromCSV = async (): Promise<{ success: boolean; imported: number; updated: number; error?: string }> => {
  try {
    // Dosya seç
    const result = await DocumentPicker.getDocumentAsync({
      type: getCsvDocumentPickerTypes(),
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

      // Sütunlar: Date;Entry;Exit;GrossDuration;NetDuration;Balance;Holiday;AnnualLeave;BreakCounted;BreakDuration;BreakEntry;BreakExit
      const [rawDate, rawGiris, rawCikis, , , , rawTatil, rawYillikIzin, rawBreakCounted, rawBreakDuration, rawMolaGiris, rawMolaCikis] = parts;

      // Tarihi parse et
      const date = parseDate(rawDate);
      if (!date) continue;

      // Önce tatil ve yıllık izin bilgisini kontrol et
      const isTatil = rawTatil === '1' || rawTatil?.toLowerCase() === 'true' || rawTatil?.toLowerCase() === 'evet' || rawTatil === '✓';
      const isYillikIzin = rawYillikIzin === '1' || rawYillikIzin?.toLowerCase() === 'true' || rawYillikIzin?.toLowerCase() === 'evet' || rawYillikIzin === '✓';

      if (isYillikIzin) {
        // Yıllık izin olarak işaretle
        const { addAnnualLeaveRecord } = await import('./storage');
        await addAnnualLeaveRecord(date);
        imported++;
      } else if (isTatil) {
        // Tatil günü olarak işaretle - mevcut kayıtları sil ve tatil kaydı ekle
        const { addHolidayRecord } = await import('./storage');
        await addHolidayRecord(date);
        imported++; // Tatil kaydı eklendi
      } else {
        // Normal gün - giriş ve çıkış kayıtlarını güncelle

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

      // Mola sayılıyor bilgisini kaydet (eski formatlarda olmayabilir)
      if (rawBreakCounted !== undefined && rawBreakCounted !== '') {
        const breakCounted = rawBreakCounted === '1' || rawBreakCounted.toLowerCase() === 'true' || rawBreakCounted.toLowerCase() === 'evet';
        await setBreakCounted(date, breakCounted);
      }

      // Mola süresi bilgisini kaydet (eski formatlarda olmayabilir)
      if (rawBreakDuration !== undefined && rawBreakDuration !== '') {
        const breakDuration = parseInt(rawBreakDuration, 10);
        if (!isNaN(breakDuration) && breakDuration >= 0) {
          await setBreakDuration(date, breakDuration);
        }
      }

      // Mola giriş/çıkış bilgisini kaydet
      const molaGiris = parseTime(rawMolaGiris);
      if (molaGiris) {
        const result = await upsertRecordByDateType(date, 'molagiris', molaGiris);
        if (result.action === 'added') imported++;
        else if (result.action === 'updated') updated++;
      }

      const molaCikis = parseTime(rawMolaCikis);
      if (molaCikis) {
        const result = await upsertRecordByDateType(date, 'molacikis', molaCikis);
        if (result.action === 'added') imported++;
        else if (result.action === 'updated') updated++;
      }
    }

    await markAllRecordsUnsynced();

    return { success: true, imported, updated };
  } catch (error) {
    console.error('Import hatası:', error);
    return { success: false, imported: 0, updated: 0, error: String(error) };
  }
};









