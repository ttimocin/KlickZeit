import { useModal } from '@/components/custom-modal';
import { HomeBannerAd } from '@/components/HomeBannerAd';
import { HOME_BANNER_HEIGHT, TAB_BAR_BASE_HEIGHT } from '@/config/ads';
import { SyncProgressModal, SyncProgressState } from '@/components/sync-progress-modal';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { exportToCSV, exportToExcel, exportToPDF, getDailySummaries, importFromCSV } from '@/services/export';
import { getWeekKeysFromWorkStart } from '@/services/extended-weeks';
import { formatBackupCompleteMessage } from '@/utils/backup-message';
import { addHolidayRecord, addAnnualLeaveRecord, clearDayRecords, deleteRecordByDateType, getAppStandards, getAverageWorkMinutes, getBreakCounted, getBreakDuration, isFlexibleSchedule, removeAnnualLeaveRecord, removeHolidayRecord, setBreakCounted, setBreakDuration, upsertRecordByDateType } from '@/services/storage';
import { DailySummary } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Android için LayoutAnimation desteği
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Varsayılan değerler (ayarlardan yüklenmezse kullanılır)
const DEFAULT_DAILY_WORK_MINUTES = 420;
const DEFAULT_WEEKLY_WORK_MINUTES = 2100;
const DEFAULT_BREAK_MINUTES = 30;
const DEFAULT_EVENING_THRESHOLD_MINUTES = 1200;

// Hafta bilgisi tipi
interface WeekDayData {
  dayName: string;
  shortName: string;
  date: string;
  giris: string | null;
  cikis: string | null;
  duration: number;
  durationText: string;
  overtime: number;
  overtimeText: string;
  isHoliday: boolean;
  isAnnualLeave: boolean;
  breakCounted: boolean;
}

interface WeekData {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  days: WeekDayData[];
  totalMinutes: number;
  totalText: string;
  totalOvertime: number;
  totalOvertimeText: string;
  isCurrentWeek: boolean;
  isExtendedPast?: boolean;
}

// Haftanın başlangıç tarihini al (Pazartesi)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Tarih formatla
const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// YYYY-MM-DD → yerel gece yarısı (UTC parse bugünü gelecek sayabiliyordu)
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Süreyi dakikadan saat:dakika formatına çevir
const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
};

// Fazla/eksik süreyi formatla
const formatOvertime = (minutes: number): string => {
  if (minutes === 0) return '-';
  const sign = minutes > 0 ? '+' : '';
  return `${sign}${minutes}`;
};

// Kısa gün adları (Pazartesi-Pazar sırasıyla, indeks: 0=Pzt..6=Paz)
const shortDayNames: Record<string, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  pt: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
  ar: ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'],
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
};

const fullDayNames: Record<string, string[]> = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  pt: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
  ar: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  zh: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
  ru: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
  uk: ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'],
};

// JS getDay (0=Pazar..6=Cumartesi) -> Pazartesi bazlı indeks (0=Pzt..6=Paz)
const jsDayToMondayIndex = (jsDay: number): number => jsDay === 0 ? 6 : jsDay - 1;

const buildWeekData = (
  weekStart: Date,
  weekKey: string,
  lang: string,
  sortedWorkingDays: number[],
  isCurrentWeek: boolean,
  isExtendedPast: boolean
): WeekData => {
  const firstWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[0]);
  const lastWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[sortedWorkingDays.length - 1]);
  const weekDisplayStart = new Date(weekStart);
  weekDisplayStart.setDate(weekDisplayStart.getDate() + firstWorkDayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + lastWorkDayOffset);

  const dateRange = `${weekDisplayStart.getDate()}.${weekDisplayStart.getMonth() + 1} - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`;
  let weekLabel: string;
  if (isCurrentWeek) {
    weekLabel = `${i18n.t('thisWeek')} (${dateRange})`;
  } else if (isExtendedPast) {
    weekLabel = `${i18n.t('pastWeek')} (${dateRange})`;
  } else {
    weekLabel = dateRange;
  }

  return {
    weekStart: weekKey,
    weekEnd: formatDateStr(weekEnd),
    weekLabel,
    days: sortedWorkingDays.map((jsDay) => {
      const mondayIdx = jsDayToMondayIndex(jsDay);
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + mondayIdx);
      return {
        dayName: fullDayNames[lang]?.[mondayIdx] || fullDayNames.tr[mondayIdx],
        shortName: shortDayNames[lang]?.[mondayIdx] || shortDayNames.tr[mondayIdx],
        date: formatDateStr(dayDate),
        giris: null,
        cikis: null,
        duration: 0,
        durationText: '-',
        overtime: 0,
        overtimeText: '-',
        isHoliday: false,
        isAnnualLeave: false,
        breakCounted: false,
      };
    }),
    totalMinutes: 0,
    totalText: '-',
    totalOvertime: 0,
    totalOvertimeText: '-',
    isCurrentWeek,
    isExtendedPast,
  };
};

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate, language } = useLanguage();
  const { showModal, showWarning, showError, showInfo, ModalComponent } = useModal();

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState & { title: string }>({
    visible: false,
    current: 0,
    total: 0,
    title: '',
  });
  const [breakCountedMap, setBreakCountedMap] = useState<Record<string, boolean>>({});
  const [breakDurationMap, setBreakDurationMap] = useState<Record<string, number>>({});
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingGiris, setEditingGiris] = useState<string>('');
  const [editingCikis, setEditingCikis] = useState<string>('');
  const [editingIsHoliday, setEditingIsHoliday] = useState(false);
  const [editingIsAnnualLeave, setEditingIsAnnualLeave] = useState(false);
  /** Açık = mola net çalışmadan düşülür (storage: breakCounted = false) */
  const [editingDeductBreak, setEditingDeductBreak] = useState(true);
  const [editingBreakDuration, setEditingBreakDuration] = useState<string>('30');
  const [editingMolaGiris, setEditingMolaGiris] = useState<string>('');
  const [editingMolaCikis, setEditingMolaCikis] = useState<string>('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Ayarlardan yüklenen standartlar
  const [dailyWorkMinutes, setDailyWorkMinutes] = useState(DEFAULT_DAILY_WORK_MINUTES);
  const [weeklyWorkMinutes, setWeeklyWorkMinutes] = useState(DEFAULT_WEEKLY_WORK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
  const [eveningThresholdMinutes, setEveningThresholdMinutes] = useState(DEFAULT_EVENING_THRESHOLD_MINUTES);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [workStartDate, setWorkStartDate] = useState<string | undefined>(undefined);
  const [annualLeaveQuota, setAnnualLeaveQuota] = useState(0);
  const [averageWorkMinutes, setAverageWorkMinutes] = useState(480);
  const [isFlexible, setIsFlexible] = useState(false);

  const loadSummaries = useCallback(async () => {
    // Standartları yükle
    const standards = await getAppStandards();
    const flexible = isFlexibleSchedule(standards);
    setIsFlexible(flexible);
    setDailyWorkMinutes(standards.dailyWorkMinutes);
    setWeeklyWorkMinutes(standards.dailyWorkMinutes * (standards.workingDays || [1, 2, 3, 4, 5]).length);
    setBreakMinutes(flexible ? 0 : standards.defaultBreakMinutes);
    setEveningThresholdMinutes(standards.eveningThresholdMinutes);
    setWorkingDays(standards.workingDays || [1, 2, 3, 4, 5]);
    setWorkStartDate(standards.workStartDate);
    setAnnualLeaveQuota(standards.annualLeaveQuota || 0);
    setAverageWorkMinutes(getAverageWorkMinutes(standards));
    const data = await getDailySummaries();
    setSummaries(data);

    // BreakCounted değerlerini yükle
    const breakCounted: Record<string, boolean> = {};
    const breakDuration: Record<string, number> = {};
    for (const summary of data) {
      breakCounted[summary.date] = await getBreakCounted(summary.date);
      const duration = await getBreakDuration(summary.date);
      if (duration !== null) {
        breakDuration[summary.date] = duration;
      }
    }
    setBreakCountedMap(breakCounted);
    setBreakDurationMap(breakDuration);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummaries();
    }, [loadSummaries])
  );

  // Çalışma süresini hesapla (mola dahil)
  const calculateDuration = (
    giris: string | null,
    cikis: string | null,
    isHoliday: boolean,
    breakCounted: boolean,
    breakDurationMinutes: number,
    isAnnualLeave: boolean
  ): { duration: number; netDuration: number; overtime: number } => {
    if (!giris || !cikis) return { duration: 0, netDuration: 0, overtime: 0 };
    const [girisH, girisM] = giris.split(':').map(Number);
    const [cikisH, cikisM] = cikis.split(':').map(Number);
    const grossDuration = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);

    if (grossDuration <= 0) return { duration: 0, netDuration: 0, overtime: 0 };

    // Tatil günlerinde veya mola sayılıyorsa mola düşme
    let netDuration = (isHoliday || breakCounted) ? grossDuration : grossDuration - breakDurationMinutes;

    // Yıllık izin / resmi tatil: sabit modda günlük hedef; esnek modda ortalama süre
    if ((isAnnualLeave || isHoliday) && !isFlexible) {
      netDuration = dailyWorkMinutes;
    } else if ((isAnnualLeave || isHoliday) && isFlexible) {
      netDuration = averageWorkMinutes;
    }

    const overtime =
      isFlexible || isAnnualLeave || isHoliday ? 0 : netDuration - dailyWorkMinutes;

    return { duration: grossDuration, netDuration: netDuration > 0 ? netDuration : 0, overtime };
  };

  // Güne tıklama - düzenleme modalı aç
  const handleDayPress = async (day: WeekDayData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Gelecek tarihler için işlem yapma (bugün düzenlenebilir)
    const todayStr = formatDateStr(new Date());
    if (day.date > todayStr) {
      return;
    }

    // Mevcut değerleri yükle
    const summary = summaries.find(s => s.date === day.date);
    const currentBreakCounted = breakCountedMap[day.date] || false;
    const currentBreakDuration = breakDurationMap[day.date] ?? 0;

    setEditingDate(day.date);
    setEditingGiris(day.giris || '');
    setEditingCikis(day.cikis || '');
    setEditingIsHoliday(day.isHoliday);
    setEditingIsAnnualLeave(day.isAnnualLeave);
    setEditingDeductBreak(!currentBreakCounted);
    setEditingBreakDuration(String(currentBreakDuration));
    setEditingMolaGiris(summary?.molaGiris || '');
    setEditingMolaCikis(summary?.molaCikis || '');
    setEditDayModalVisible(true);
  };

  const handleClearDay = () => {
    if (!editingDate) return;
    Alert.alert(i18n.t('clearDay'), i18n.t('clearDayConfirm'), [
      { text: i18n.t('cancel'), style: 'cancel' },
      {
        text: i18n.t('remove'),
        style: 'destructive',
        onPress: async () => {
          await clearDayRecords(editingDate);
          await loadSummaries();
          setEditDayModalVisible(false);
        },
      },
    ]);
  };

  const saveEditedDay = async () => {
    if (!editingDate) return;

    if (editingIsHoliday) {
      await addHolidayRecord(editingDate);
    } else if (editingIsAnnualLeave) {
      await addAnnualLeaveRecord(editingDate);
    } else {
      await removeHolidayRecord(editingDate);
      await removeAnnualLeaveRecord(editingDate);

      const giris = editingGiris.trim();
      const cikis = editingCikis.trim();
      const molaGiris = editingMolaGiris.trim();
      const molaCikis = editingMolaCikis.trim();
      const hasWorkData = giris || cikis || molaGiris || molaCikis;

      if (!hasWorkData) {
        await clearDayRecords(editingDate);
      } else {
        if (giris) {
          await upsertRecordByDateType(editingDate, 'giris', giris);
        } else {
          await deleteRecordByDateType(editingDate, 'giris');
        }
        if (cikis) {
          await upsertRecordByDateType(editingDate, 'cikis', cikis);
        } else {
          await deleteRecordByDateType(editingDate, 'cikis');
        }
        if (molaGiris) {
          await upsertRecordByDateType(editingDate, 'molagiris', molaGiris);
        } else {
          await deleteRecordByDateType(editingDate, 'molagiris');
        }
        if (molaCikis) {
          await upsertRecordByDateType(editingDate, 'molacikis', molaCikis);
        } else {
          await deleteRecordByDateType(editingDate, 'molacikis');
        }

        const duration = parseInt(editingBreakDuration, 10) || breakMinutes;
        await setBreakCounted(editingDate, !editingDeductBreak);
        await setBreakDuration(editingDate, duration);
      }
    }

    await loadSummaries();
    setEditDayModalVisible(false);
  };

  const usedAnnualLeave = useMemo(
    () => summaries.filter((s) => s.isAnnualLeave).length,
    [summaries]
  );
  const remainingAnnualLeave = Math.max(0, annualLeaveQuota - usedAnnualLeave);

  // Haftalık verileri hesapla
  const weeklyData = useMemo((): WeekData[] => {
    const weeks: Map<string, WeekData> = new Map();
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const lang = language || 'tr';

    // workingDays (JS getDay: 0=Pazar..6=Cumartesi) -> Pazartesi bazlı sıralanmış
    const sortedWorkingDays = [...workingDays].sort((a, b) => jsDayToMondayIndex(a) - jsDayToMondayIndex(b));

    // Summaries'den haftalık veri oluştur
    for (const summary of summaries) {
      const date = parseLocalDate(summary.date);
      const weekStart = getWeekStart(date);
      const weekKey = formatDateStr(weekStart);

      if (!weeks.has(weekKey)) {
        const isCurrentWeek = weekKey === formatDateStr(currentWeekStart);
        weeks.set(
          weekKey,
          buildWeekData(weekStart, weekKey, lang, sortedWorkingDays, isCurrentWeek, false)
        );
      }

      // Bu günün verilerini ekle
      const week = weeks.get(weekKey)!;
      const dayOfWeek = date.getDay();
      const dayIndex = sortedWorkingDays.indexOf(dayOfWeek);

      if (dayIndex >= 0) {
        week.days[dayIndex].giris = summary.giris || null;
        week.days[dayIndex].cikis = summary.cikis || null;
        week.days[dayIndex].isHoliday = summary.isHoliday || false;
        week.days[dayIndex].isAnnualLeave = summary.isAnnualLeave || false;
        week.days[dayIndex].breakCounted = breakCountedMap[summary.date] || false;

        const breakDur = breakDurationMap[summary.date] ?? 0;
        const { netDuration, overtime } = calculateDuration(
          summary.giris || null,
          summary.cikis || null,
          summary.isHoliday || false,
          breakCountedMap[summary.date] || false,
          breakDur,
          summary.isAnnualLeave || false
        );
        if (netDuration > 0) {
          week.days[dayIndex].duration = netDuration;
          week.days[dayIndex].durationText = formatDuration(netDuration);
          week.days[dayIndex].overtime = overtime;
          week.days[dayIndex].overtimeText = formatOvertime(overtime);
          week.totalMinutes += netDuration;
        }
      }
    }

    // Toplamları güncelle
    for (const week of weeks.values()) {
      if (week.totalMinutes > 0) {
        week.totalText = formatDuration(week.totalMinutes);
        if (!isFlexible) {
          week.totalOvertime = week.days.reduce((sum, d) => sum + d.overtime, 0);
          week.totalOvertimeText = formatOvertime(week.totalOvertime);
        }
      }
    }

    // İşe başlama tarihinden bugüne tüm haftalar (boş tablolarla doldurulabilir)
    if (workStartDate) {
      const weekKeysFromStart = getWeekKeysFromWorkStart(workStartDate, today);
      for (const weekKey of weekKeysFromStart) {
        if (!weeks.has(weekKey)) {
          const weekStart = parseLocalDate(weekKey);
          const isCurrentWeek = weekKey === formatDateStr(currentWeekStart);
          weeks.set(
            weekKey,
            buildWeekData(weekStart, weekKey, lang, sortedWorkingDays, isCurrentWeek, false)
          );
        }
      }
    }

    // Güncel hafta yoksa ekle
    const currentWeekKey = formatDateStr(currentWeekStart);
    if (!weeks.has(currentWeekKey)) {
      weeks.set(
        currentWeekKey,
        buildWeekData(currentWeekStart, currentWeekKey, lang, sortedWorkingDays, true, false)
      );
    }

    return Array.from(weeks.values()).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [summaries, language, breakCountedMap, breakDurationMap, workingDays, dailyWorkMinutes, averageWorkMinutes, weeklyWorkMinutes, breakMinutes, workStartDate, isFlexible]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummaries();
    setRefreshing(false);
  };

  const [exportFormatModalVisible, setExportFormatModalVisible] = useState(false);

  const handleExport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (summaries.length === 0) {
      showWarning(i18n.t('warning'), i18n.t('noRecordsToExport'));
      return;
    }

    setExportFormatModalVisible(true);
  };

  const handleExportFormat = async (format: 'csv' | 'pdf' | 'excel') => {
    setExportFormatModalVisible(false);
    let success = false;
    switch (format) {
      case 'csv':
        success = await exportToCSV();
        break;
      case 'pdf':
        success = await exportToPDF();
        break;
      case 'excel':
        success = await exportToExcel();
        break;
    }
    if (!success) {
      showError(i18n.t('error'), i18n.t('exportFailed'));
    }
  };

  const handleImport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await importFromCSV();

    if (result.error === 'cancelled') {
      return;
    }

    const totalChanges = result.imported + (result.updated || 0);

    if (result.success && totalChanges > 0) {
      let message = '';
      if (result.imported > 0) {
        message += `${result.imported} ${i18n.t('importedRecords')}`;
      }
      if (result.updated && result.updated > 0) {
        if (message) message += '\n';
        message += `${result.updated} ${i18n.t('updatedRecords')}`;
      }
      showModal({
        title: i18n.t('importSuccess'),
        message,
        icon: '✅',
        buttons: [{ text: i18n.t('ok'), style: 'default' }],
      });
      await loadSummaries();
    } else if (result.success && totalChanges === 0) {
      showInfo(i18n.t('info'), i18n.t('noNewRecordsToImport'));
    } else {
      showError(i18n.t('error'), i18n.t('importFailed'));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress({
      visible: true,
      current: 0,
      total: 0,
      title: i18n.t('backupInProgress'),
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { syncAllPendingRecords, syncStandards } = await import('@/services/firebase-sync');
      const result = await syncAllPendingRecords((current, total) => {
        setSyncProgress({
          visible: true,
          current,
          total,
          title: i18n.t('backupInProgress'),
        });
      });

      if (result.notLoggedIn) {
        showInfo(i18n.t('info'), i18n.t('loginToSync'));
        return;
      }
      if (result.offline) {
        showInfo(i18n.t('info'), i18n.t('noInternetConnection'));
        return;
      }

      if (result.nothingToSync) {
        setSyncProgress({ visible: true, current: 1, total: 1, title: i18n.t('backupInProgress') });
      }
      const standardsResult = await syncStandards({ force: true });
      const { title, message, isWarning } = formatBackupCompleteMessage(result, standardsResult);

      if (result.nothingToSync && standardsResult.ok && standardsResult.skipped) {
        showInfo(title, message);
      } else if (result.success > 0 || result.failed > 0 || !standardsResult.skipped) {
        showModal({
          title,
          message,
          icon: isWarning ? '⚠️' : '☁️',
          buttons: [{ text: i18n.t('ok'), style: 'default' }],
        });
      } else {
        showInfo(i18n.t('info'), i18n.t('noRecordsToSync'));
      }
    } finally {
      setSyncProgress((prev) => ({ ...prev, visible: false }));
      setSyncing(false);
    }
  };

  // Ay adları
  const monthNames: Record<string, string[]> = {
    tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
  };

  // Aylık bakiye / çalışma süresi hesapla (20:00 sonrası mesai dahil)
  const monthlyBalances = useMemo(() => {
    const lang = language || 'tr';
    const names = monthNames[lang] || monthNames.tr;

    if (isFlexible) {
      const monthsMap = new Map<string, { totalMinutes: number; dayCount: number; year: number; month: number; eveningMinutes: number }>();
      const EVENING_THRESHOLD = eveningThresholdMinutes;

      for (const week of weeklyData) {
        for (const day of week.days) {
          if (day.duration <= 0) continue;
          const date = parseLocalDate(day.date);
          const year = date.getFullYear();
          const month = date.getMonth();
          const key = `${year}-${String(month + 1).padStart(2, '0')}`;

          if (!monthsMap.has(key)) {
            monthsMap.set(key, { totalMinutes: 0, dayCount: 0, year, month, eveningMinutes: 0 });
          }
          const entry = monthsMap.get(key)!;
          entry.totalMinutes += day.duration;
          entry.dayCount += 1;

          if (day.cikis) {
            const [cH, cM] = day.cikis.split(':').map(Number);
            const cikisMinutes = cH * 60 + cM;
            if (cikisMinutes > EVENING_THRESHOLD) {
              entry.eveningMinutes += cikisMinutes - EVENING_THRESHOLD;
            }
          }
        }
      }

      return Array.from(monthsMap.entries())
        .map(([key, data]) => ({
          key,
          monthName: names[data.month],
          year: data.year,
          month: data.month,
          totalMinutes: data.totalMinutes,
          targetMinutes: 0,
          dayCount: data.dayCount,
          workedDayCount: data.dayCount,
          balance: 0,
          balanceText: '-',
          eveningMinutes: data.eveningMinutes,
          eveningText: formatDuration(data.eveningMinutes),
        }))
        .sort((a, b) => b.key.localeCompare(a.key));
    }

    const monthsMap = new Map<string, { totalMinutes: number; targetMinutes: number; dayCount: number; workedDayCount: number; year: number; month: number; eveningMinutes: number }>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const EVENING_THRESHOLD = eveningThresholdMinutes;

    // weeklyData'dan gün verilerini hızlı erişim için indeksle
    const dayDataByDate = new Map<string, WeekDayData>();
    for (const week of weeklyData) {
      for (const day of week.days) {
        dayDataByDate.set(day.date, day);
      }
    }

    // Başlangıç tarihini belirle: workStartDate yoksa en eski summary
    let effectiveStartStr: string | null = workStartDate ?? null;
    if (!effectiveStartStr && summaries.length > 0) {
      effectiveStartStr = summaries.reduce(
        (min, s) => (s.date < min ? s.date : min),
        summaries[0].date
      );
    }

    if (!effectiveStartStr) return [];

    // workStartDate'ten dünkü güne kadar tüm günleri gez
    let current = parseLocalDate(effectiveStartStr);
    current.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    while (current <= yesterday) {
      const dateStr = formatDateStr(current);
      const year = current.getFullYear();
      const month = current.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthsMap.has(key)) {
        monthsMap.set(key, { totalMinutes: 0, targetMinutes: 0, dayCount: 0, workedDayCount: 0, year, month, eveningMinutes: 0 });
      }

      const entry = monthsMap.get(key)!;

      // Gerçek çalışma verisi varsa ekle; hedef yalnızca çalışılan günler için
      const dayData = dayDataByDate.get(dateStr);
      if (dayData && dayData.duration > 0) {
        entry.totalMinutes += dayData.duration;
        entry.workedDayCount += 1;
        entry.targetMinutes += dailyWorkMinutes;
      }

      // 20:00 sonrası çalışma hesapla
      if (dayData?.cikis) {
        const [cH, cM] = dayData.cikis.split(':').map(Number);
        const cikisMinutes = cH * 60 + cM;
        if (cikisMinutes > EVENING_THRESHOLD) {
          entry.eveningMinutes += (cikisMinutes - EVENING_THRESHOLD);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    const result = Array.from(monthsMap.entries()).map(([key, data]) => {
      const balance = data.totalMinutes - data.targetMinutes;
      return {
        key,
        monthName: names[data.month],
        year: data.year,
        month: data.month,
        totalMinutes: data.totalMinutes,
        targetMinutes: data.targetMinutes,
        dayCount: data.dayCount,
        workedDayCount: data.workedDayCount,
        balance,
        balanceText: formatOvertime(balance),
        eveningMinutes: data.eveningMinutes,
        eveningText: formatDuration(data.eveningMinutes),
      };
    }).sort((a, b) => b.key.localeCompare(a.key));

    return result;
  }, [weeklyData, language, workStartDate, workingDays, dailyWorkMinutes, eveningThresholdMinutes, summaries, isFlexible]);

  // Tüm ayların toplam bakiyesi veya toplam çalışma
  const cumulativeBalance = useMemo(() => {
    if (monthlyBalances.length === 0) return null;
    const totalMinutes = monthlyBalances.reduce((sum, m) => sum + m.totalMinutes, 0);
    const dayCount = monthlyBalances.reduce((sum, m) => sum + m.dayCount, 0);
    if (isFlexible) {
      return {
        totalMinutes,
        targetMinutes: 0,
        dayCount,
        balance: 0,
        balanceText: formatDuration(totalMinutes),
      };
    }
    const targetMinutes = monthlyBalances.reduce((sum, m) => sum + m.targetMinutes, 0);
    const balance = totalMinutes - targetMinutes;
    return {
      totalMinutes,
      targetMinutes,
      dayCount,
      balance,
      balanceText: formatOvertime(balance),
    };
  }, [monthlyBalances, isFlexible]);

  // Bu ayın özeti (üst kart — esnek mod)
  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lang = language || 'tr';
    const names = monthNames[lang] || monthNames.tr;
    const entry = monthlyBalances.find((m) => m.key === key);
    const minutes = entry?.totalMinutes ?? 0;
    return {
      title: `${names[now.getMonth()]} ${now.getFullYear()}`,
      minutes,
      display: formatDuration(minutes),
      workedDayCount: entry?.workedDayCount ?? entry?.dayCount ?? 0,
    };
  }, [monthlyBalances, language]);

  const flexibleTotalWorkText = useMemo(() => {
    if (!isFlexible) return null;
    const totalMinutes = monthlyBalances.reduce((sum, m) => sum + m.totalMinutes, 0);
    return formatDuration(totalMinutes);
  }, [monthlyBalances, isFlexible]);

  const flexibleTotalDayCount = useMemo(() => {
    if (!isFlexible) return 0;
    return monthlyBalances.reduce((sum, m) => sum + m.dayCount, 0);
  }, [monthlyBalances, isFlexible]);

  const detailsTotalWorkedDays = useMemo(() => {
    return monthlyBalances.reduce((sum, m) => sum + (m.workedDayCount ?? m.dayCount), 0);
  }, [monthlyBalances]);

  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const bottomChromeHeight = tabBarHeight + HOME_BANNER_HEIGHT;
  const styles = createStyles(isDark);

  const renderDetailsDays = (count: number, extraStyle?: object) => (
    <Text style={[styles.detailsTableCell, extraStyle]}>{count}</Text>
  );

  const renderDetailsHours = (minutes: number, extraStyle?: object) => (
    <Text style={[styles.detailsTableCell, extraStyle]}>{formatDuration(minutes)}</Text>
  );

  const renderDetailsBalance = (balanceText: string, extraStyle?: object) => (
    <Text style={[styles.detailsTableCell, extraStyle]}>{balanceText}</Text>
  );

  // Saat renklendirmesi - geç kalma veya erken çıkış kontrolü (esnek modda nötr)
  const getTimeColor = (time: string | null, type: 'giris' | 'cikis'): string => {
    if (isFlexible) return isDark ? '#e5e5e5' : '#1a1a1a';
    if (!time) return isDark ? '#999' : '#ccc';

    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    if (type === 'giris') {
      // 08:00'dan sonra giriş = geç kalma (kırmızı)
      if (totalMinutes > 8 * 60) return '#ef4444';
      // Normal giriş (yeşil)
      if (totalMinutes >= 7 * 60 && totalMinutes <= 8 * 60) return '#10b981';
    } else {
      // 17:00'dan önce çıkış = erken çıkış (kırmızı)
      if (totalMinutes < 17 * 60) return '#ef4444';
      // Normal çıkış (yeşil)
      if (totalMinutes >= 17 * 60 && totalMinutes <= 18 * 60) return '#10b981';
    }

    // Nötr renk
    return isDark ? '#e5e5e5' : '#1a1a1a';
  };

  const renderWeekCard = (week: WeekData) => (
    <View key={week.weekStart} style={[styles.weekCard, week.isCurrentWeek && styles.currentWeekCard]}>
      <View style={styles.weekHeader}>
        <View style={styles.weekLabelRow}>
          <Text style={styles.weekLabel}>{week.weekLabel}</Text>
        </View>
        <View style={styles.weekTotalContainer}>
          <Text style={styles.weekTotalValue}>{week.totalText}</Text>
          {!isFlexible && week.totalMinutes > 0 && (
            <Text style={[
              styles.weekTotalOvertime,
              week.totalOvertime >= 0 ? styles.weekOvertimePositive : styles.weekOvertimeNegative
            ]}>
              {week.totalOvertimeText}
            </Text>
          )}
        </View>
      </View>

      {/* Tablo Başlıkları */}
      <View style={styles.tableHeader}>
        <View style={styles.headerDayName}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('tableDate')}</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('entry')}</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('exit')}</Text>
        </View>
        <View style={styles.headerDurationCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('workedHoursCol')}</Text>
        </View>
        {!isFlexible && (
          <View style={styles.headerOvertimeCell}>
            <Text style={styles.headerText} numberOfLines={1}>±</Text>
          </View>
        )}
      </View>

      {/* Günler - Satır bazlı görünüm */}
      <View style={styles.daysContainer}>
        {week.days.slice().reverse().map((day, i) => {
          const isLateEntry = !isFlexible && day.giris && getTimeColor(day.giris, 'giris') === '#ef4444';
          const isEarlyExit = !isFlexible && day.cikis && getTimeColor(day.cikis, 'cikis') === '#ef4444';

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayRow,
                i < week.days.length - 1 && styles.dayRowBorder,
                day.isHoliday && styles.holidayRow,
                day.isAnnualLeave && styles.annualLeaveRow
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              {/* Gün adı - Sol */}
              <View style={styles.dayNameContainer}>
                <Text style={styles.dayName}>
                  {parseLocalDate(day.date).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' })} {day.shortName}
                </Text>
                {day.isHoliday && (
                  <View style={styles.holidayTag}>
                    <Ionicons name="sunny" size={10} color="#10b981" />
                  </View>
                )}
                {day.isAnnualLeave && (
                  <View style={styles.annualLeaveTag}>
                    <Ionicons name="airplane" size={10} color="#f59e0b" />
                  </View>
                )}
              </View>

              {/* Giriş saati */}
              <View style={styles.timeCell}>
                {day.giris ? (
                  <View style={[
                    styles.timeBadge,
                    isFlexible && styles.timeBadgeNeutral,
                    !isFlexible && isLateEntry && styles.timeBadgeError,
                    !isFlexible && !isLateEntry && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      !isFlexible && isLateEntry && styles.timeTextError,
                      !isFlexible && !isLateEntry && styles.timeTextSuccess
                    ]}>
                      {day.giris}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.timeEmpty}>-</Text>
                )}
              </View>

              {/* Çıkış saati */}
              <View style={styles.timeCell}>
                {day.cikis ? (
                  <View style={[
                    styles.timeBadge,
                    isFlexible && styles.timeBadgeNeutral,
                    !isFlexible && isEarlyExit && styles.timeBadgeError,
                    !isFlexible && !isEarlyExit && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      !isFlexible && isEarlyExit && styles.timeTextError,
                      !isFlexible && !isEarlyExit && styles.timeTextSuccess
                    ]}>
                      {day.cikis}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.timeEmpty}>-</Text>
                )}
              </View>

              {/* Süre */}
              <View style={styles.durationCell}>
                <Text style={[
                  styles.durationText,
                  day.duration > 0 && styles.durationTextFilled
                ]}>
                  {day.durationText}
                </Text>
              </View>

              {/* Fazla/Eksik */}
              {!isFlexible && (
                <View style={styles.overtimeCell}>
                  {day.duration > 0 ? (
                    <Text style={[
                      styles.overtimeText,
                      day.overtime > 0 && styles.overtimeTextPositive,
                      day.overtime < 0 && styles.overtimeTextNegative
                    ]}>
                      {day.overtimeText}
                    </Text>
                  ) : (
                    <Text style={styles.overtimeEmpty}>-</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView key={`history-${forceUpdate}`} style={styles.container}>
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('records')}</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>


      {/* Özet kartı: sabit modda toplam bakiye, esnek modda bu ay */}
      <View style={styles.monthSummaryCard}>
        <View style={styles.monthSummaryHeader}>
          <Text style={styles.monthSummaryTitle}>
            {isFlexible ? currentMonthSummary.title : i18n.t('totalBalance')}
          </Text>
          <TouchableOpacity
            style={styles.detailsHeaderButton}
            onPress={() => setDetailsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsHeaderButtonText}>{i18n.t('details')}</Text>
            <Ionicons name="chevron-forward" size={14} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
        </View>
        <View style={styles.monthSummaryTable}>
          <View style={styles.monthSummaryTableHeader}>
            <Text style={styles.monthSummaryColLabel} numberOfLines={2}>
              {isFlexible ? i18n.t('workedDaysCol') : i18n.t('workedHoursCol')}
            </Text>
            <Text style={styles.monthSummaryColLabel} numberOfLines={2}>
              {isFlexible ? i18n.t('workedHoursCol') : i18n.t('balanceCol')}
            </Text>
          </View>
          <View style={styles.monthSummaryTableRow}>
            {isFlexible ? (
              <>
                <Text style={styles.monthSummaryColValue}>
                  {currentMonthSummary.workedDayCount}
                </Text>
                <Text style={styles.monthSummaryColValue}>
                  {currentMonthSummary.display}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.monthSummaryColValue}>
                  {formatDuration(cumulativeBalance?.totalMinutes ?? 0)}
                </Text>
                <Text style={[
                  styles.monthSummaryColValue,
                  cumulativeBalance && cumulativeBalance.balance > 0 && styles.totalBalancePositive,
                  cumulativeBalance && cumulativeBalance.balance < 0 && styles.totalBalanceNegative,
                ]}>
                  {cumulativeBalance?.balanceText ?? '-'}
                </Text>
              </>
            )}
          </View>
        </View>
        {annualLeaveQuota > 0 && (
          <View style={styles.monthSummaryLeaveRow}>
            <View style={styles.monthSummaryLeaveLeft}>
              <Ionicons name="airplane-outline" size={15} color="#f59e0b" />
              <Text style={styles.monthSummaryLeaveLabel}>{i18n.t('remainingAnnualLeave')}</Text>
            </View>
            <Text style={styles.monthSummaryLeaveValue}>
              {remainingAnnualLeave}
              <Text style={styles.monthSummaryLeaveSlash}> / </Text>
              {annualLeaveQuota}
            </Text>
          </View>
        )}
      </View>

      {/* Aylık Detaylar Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.detailsModalOverlay}>
          <View style={styles.detailsModalContainer}>
            {/* Modal Header */}
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>
                {isFlexible ? i18n.t('monthlyWorkTime') : i18n.t('monthlyDetails')}
              </Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.detailsModalClose}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            {/* Modal Content — tablo */}
            <ScrollView
              style={styles.detailsModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailsTable}>
                <View style={styles.detailsTableHeader}>
                  <Text style={[styles.detailsTableHeaderText, styles.detailsTableColMonth]} numberOfLines={2}>
                    {i18n.t('tableMonth')}
                  </Text>
                  <Text style={styles.detailsTableHeaderText} numberOfLines={2}>
                    {i18n.t('workedDaysCol')}
                  </Text>
                  <Text style={styles.detailsTableHeaderText} numberOfLines={2}>
                    {i18n.t('workedHoursCol')}
                  </Text>
                  {!isFlexible && (
                    <>
                      <Text style={styles.detailsTableHeaderText} numberOfLines={2}>
                        {i18n.t('target')}
                      </Text>
                      <Text style={styles.detailsTableHeaderText} numberOfLines={2}>
                        {i18n.t('balanceCol')}
                      </Text>
                    </>
                  )}
                </View>

                {monthlyBalances.map((m, index) => (
                  <View key={m.key}>
                    <View style={[
                      styles.detailsTableRow,
                      index % 2 === 1 && styles.detailsTableRowAlt,
                    ]}>
                      <Text style={[styles.detailsTableCell, styles.detailsTableColMonth]} numberOfLines={1}>
                        {m.monthName} {m.year}
                      </Text>
                      {renderDetailsDays(m.workedDayCount ?? m.dayCount)}
                      {renderDetailsHours(m.totalMinutes, styles.detailsTableCellBold)}
                      {!isFlexible && (
                        <>
                          {renderDetailsHours(m.targetMinutes)}
                          {renderDetailsBalance(m.balanceText, [
                              styles.detailsTableCellBold,
                              m.balance >= 0 ? styles.totalBalancePositive : styles.totalBalanceNegative,
                          ])}
                        </>
                      )}
                    </View>
                    {m.eveningMinutes > 0 && (
                      <View style={styles.detailsTableEveningRow}>
                        <Ionicons name="moon-outline" size={12} color="#f59e0b" />
                        <Text style={styles.detailsTableEveningText}>
                          {Math.floor(eveningThresholdMinutes / 60)}:{String(eveningThresholdMinutes % 60).padStart(2, '0')} {i18n.t('eveningWork')}: {m.eveningText}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {monthlyBalances.length > 0 && (
                  <View style={[styles.detailsTableRow, styles.detailsTableTotalRow]}>
                    <Text style={[styles.detailsTableCell, styles.detailsTableColMonth, styles.detailsTableTotalText]}>
                      {i18n.t('total')}
                    </Text>
                    {renderDetailsDays(
                      isFlexible ? flexibleTotalDayCount : detailsTotalWorkedDays,
                      styles.detailsTableTotalText
                    )}
                    {renderDetailsHours(
                      isFlexible
                        ? monthlyBalances.reduce((sum, m) => sum + m.totalMinutes, 0)
                        : (cumulativeBalance?.totalMinutes ?? 0),
                      styles.detailsTableTotalText
                    )}
                    {!isFlexible && cumulativeBalance && (
                      <>
                        {renderDetailsHours(cumulativeBalance.targetMinutes, styles.detailsTableTotalText)}
                        {renderDetailsBalance(cumulativeBalance.balanceText, [
                            styles.detailsTableTotalText,
                            cumulativeBalance.balance >= 0 ? styles.totalBalancePositive : styles.totalBalanceNegative,
                        ])}
                      </>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Aksiyon Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons
            name={syncing ? "cloud-upload" : "cloud-upload-outline"}
            size={18}
            color={isDark ? '#888' : '#666'}
          />
          <Text style={styles.actionText}>
            {syncing ? i18n.t('syncing') : i18n.t('syncronize')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExport}
        >
          <Ionicons name="download-outline" size={18} color={isDark ? '#888' : '#666'} />
          <Text style={styles.actionText}>{i18n.t('downloadCSV')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleImport}
        >
          <Ionicons name="document-text-outline" size={18} color={isDark ? '#888' : '#666'} />
          <Text style={styles.actionText}>{i18n.t('importCSV')}</Text>
        </TouchableOpacity>
      </View>

      {/* Export Format Modal */}
      <Modal
        visible={exportFormatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportFormatModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.exportModalOverlay}
          activeOpacity={1}
          onPress={() => setExportFormatModalVisible(false)}
        >
          <View style={styles.exportModalContent}>
            <Text style={styles.exportModalTitle}>{i18n.t('exportFormat')}</Text>
            <TouchableOpacity
              style={styles.exportFormatOption}
              onPress={() => handleExportFormat('csv')}
            >
              <Ionicons name="document-text-outline" size={22} color={isDark ? '#4fc3f7' : '#1976d2'} />
              <Text style={styles.exportFormatText}>{i18n.t('exportCSV')}</Text>
              <Text style={styles.exportFormatDesc}>.csv</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportFormatOption}
              onPress={() => handleExportFormat('pdf')}
            >
              <Ionicons name="document-outline" size={22} color={isDark ? '#ef5350' : '#c62828'} />
              <Text style={styles.exportFormatText}>{i18n.t('exportPDF')}</Text>
              <Text style={styles.exportFormatDesc}>.pdf</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportFormatOption}
              onPress={() => handleExportFormat('excel')}
            >
              <Ionicons name="grid-outline" size={22} color={isDark ? '#66bb6a' : '#2e7d32'} />
              <Text style={styles.exportFormatText}>{i18n.t('exportExcel')}</Text>
              <Text style={styles.exportFormatDesc}>.xlsx</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportModalCancel}
              onPress={() => setExportFormatModalVisible(false)}
            >
              <Text style={styles.exportModalCancelText}>{i18n.t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Haftalık Görünüm */}
      <ScrollView
        style={styles.weeklyContainer}
        contentContainerStyle={[styles.weeklyContent, { paddingBottom: bottomChromeHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#fff' : '#333'}
          />
        }
      >
        {weeklyData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>{i18n.t('noRecordsYet')}</Text>
            <Text style={styles.emptySubtext}>{i18n.t('addFromHome')}</Text>
          </View>
        ) : (
          weeklyData.map(renderWeekCard)
        )}
      </ScrollView>

      <View style={[styles.bannerDock, { bottom: tabBarHeight }]}>
        <HomeBannerAd isDark={isDark} />
      </View>

      {/* Custom Modal */}
      <SyncProgressModal
        visible={syncProgress.visible}
        title={syncProgress.title}
        current={syncProgress.current}
        total={syncProgress.total}
      />
      <ModalComponent />

      {/* Day Edit Modal */}
      <Modal
        visible={editDayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{i18n.t('editDay')}</Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Tatil Toggle */}
              <View style={styles.modalSection}>
                <View style={styles.modalRow}>
                  <View style={styles.modalRowContent}>
                    <Text style={styles.modalLabel}>{i18n.t('holiday')}</Text>
                    <Text style={styles.modalDesc}>{i18n.t('holidayDesc')}</Text>
                  </View>
                  <Switch
                    value={editingIsHoliday}
                    onValueChange={(val) => {
                      setEditingIsHoliday(val);
                      if (val) setEditingIsAnnualLeave(false);
                    }}
                    trackColor={{ false: isDark ? '#333' : '#ddd', true: '#10b981' }}
                    thumbColor={editingIsHoliday ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Yıllık İzin Toggle */}
              <View style={styles.modalSection}>
                <View style={styles.modalRow}>
                  <View style={styles.modalRowContent}>
                    <Text style={styles.modalLabel}>{i18n.t('annualLeave')}</Text>
                    <Text style={styles.modalDesc}>{i18n.t('annualLeaveDesc')}</Text>
                  </View>
                  <Switch
                    value={editingIsAnnualLeave}
                    onValueChange={(val) => {
                      setEditingIsAnnualLeave(val);
                      if (val) setEditingIsHoliday(false);
                    }}
                    trackColor={{ false: isDark ? '#333' : '#ddd', true: '#f59e0b' }}
                    thumbColor={editingIsAnnualLeave ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {!editingIsHoliday && !editingIsAnnualLeave && (
                <>
                  {/* Giriş Saati */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>{i18n.t('entryTimeLabel')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={editingGiris}
                      onChangeText={setEditingGiris}
                      placeholder="08:00"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  {/* Çıkış Saati */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>{i18n.t('exitTimeLabel')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={editingCikis}
                      onChangeText={setEditingCikis}
                      placeholder="17:00"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  {/* Mola düşümü */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalRow}>
                      <View style={styles.modalRowContent}>
                        <Text style={styles.modalLabel}>{i18n.t('breakCounted')}</Text>
                        <Text style={styles.modalDesc}>{i18n.t('breakCountedDesc')}</Text>
                      </View>
                      <Switch
                        value={editingDeductBreak}
                        onValueChange={setEditingDeductBreak}
                        trackColor={{ false: isDark ? '#333' : '#ddd', true: '#10b981' }}
                        thumbColor={editingDeductBreak ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  </View>

                  {/* Mola Süresi */}
                  <View style={[styles.modalSection, !editingDeductBreak && { opacity: 0.45 }]}>
                    <Text style={styles.modalLabel}>{i18n.t('breakDuration')}</Text>
                    <View style={styles.durationInputContainer}>
                      <TextInput
                        style={styles.durationInput}
                        value={editingBreakDuration}
                        onChangeText={(text) => {
                          const num = parseInt(text, 10);
                          if (!isNaN(num) && num >= 0 && num <= 480) {
                            setEditingBreakDuration(text);
                          } else if (text === '') {
                            setEditingBreakDuration('');
                          }
                        }}
                        keyboardType="numeric"
                        placeholder="30"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                        editable={editingDeductBreak}
                      />
                      <Text style={styles.durationUnit}>{i18n.t('breakDurationMinutes')}</Text>
                    </View>
                  </View>

                  {/* Mola Giriş Saati */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>{i18n.t('breakEntryLabel')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={editingMolaGiris}
                      onChangeText={setEditingMolaGiris}
                      placeholder="12:00"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>

                  {/* Mola Çıkış Saati */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>{i18n.t('breakExitLabel')}</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={editingMolaCikis}
                      onChangeText={setEditingMolaCikis}
                      placeholder="12:30"
                      placeholderTextColor={isDark ? '#666' : '#999'}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalClearButton}
              onPress={handleClearDay}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.modalClearButtonText}>{i18n.t('clearDay')}</Text>
            </TouchableOpacity>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEditDayModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>{i18n.t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveEditedDay}
              >
                <Text style={styles.modalButtonSaveText}>{i18n.t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      paddingHorizontal: 16,
    },
    settingsButton: {
      padding: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
    },
    subtitleContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#888' : '#999',
    },
    monthSummaryCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    monthSummaryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthSummaryTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
    },
    monthSummaryTable: {
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      backgroundColor: isDark ? '#222' : '#f8f8f8',
    },
    monthSummaryTableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#ececec',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    monthSummaryTableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    monthSummaryColLabel: {
      flex: 1,
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#888' : '#777',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    monthSummaryColValue: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      textAlign: 'center',
    },
    monthSummaryColUnit: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#888' : '#777',
    },
    monthSummaryLeaveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    monthSummaryLeaveLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    monthSummaryLeaveLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#aaa' : '#666',
    },
    monthSummaryLeaveValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#f59e0b',
    },
    monthSummaryLeaveSlash: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#888' : '#999',
    },
    totalBalanceValue: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    totalBalancePositive: {
      color: '#10b981',
    },
    totalBalanceNegative: {
      color: '#ef4444',
    },
    totalBalanceLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#888' : '#999',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    totalBalanceDetails: {
      alignItems: 'flex-end',
    },
    totalBalanceDetailText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      marginBottom: 4,
    },
    totalBalanceDetailSubtext: {
      fontSize: 12,
      color: isDark ? '#888' : '#999',
    },
    totalBalanceHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    detailsHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    detailsHeaderButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
    },
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      gap: 4,
    },
    detailsButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
    },
    // Modal styles
    detailsModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    detailsModalContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 30,
    },
    detailsModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    detailsModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
    },
    detailsModalClose: {
      padding: 4,
    },
    detailsModalScroll: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
    },
    detailsTable: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      backgroundColor: isDark ? '#222' : '#fafafa',
    },
    detailsTableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      backgroundColor: isDark ? '#2d2d2d' : '#ececec',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    detailsTableHeaderText: {
      flex: 1,
      fontSize: 9,
      fontWeight: '700',
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
    detailsTableColMonth: {
      flex: 1.35,
      textAlign: 'left',
      paddingLeft: 4,
    },
    detailsTableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    detailsTableRowAlt: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    },
    detailsTableTotalRow: {
      borderBottomWidth: 0,
      backgroundColor: isDark ? '#2a2a2a' : '#e8e8e8',
    },
    detailsTableCell: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#ccc' : '#444',
      textAlign: 'center',
    },
    detailsTableCellBold: {
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
    },
    detailsTableCellUnit: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#888' : '#888',
    },
    detailsTableTotalText: {
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
    },
    detailsTableEveningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.05)',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    detailsTableEveningText: {
      flex: 1,
      fontSize: 11,
      color: isDark ? '#d4a574' : '#92400e',
    },
    detailsEveningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      gap: 6,
    },
    detailsEveningIcon: {
      width: 20,
      alignItems: 'center',
    },
    detailsEveningLabel: {
      flex: 1,
      fontSize: 12,
      color: isDark ? '#aaa' : '#666',
    },
    detailsEveningValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#f59e0b',
    },
    monthlyDetailsList: {
      marginTop: 8,
    },
    monthlyDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    monthlyDetailLeft: {
      flex: 1,
    },
    monthlyDetailMonth: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      marginBottom: 2,
    },
    monthlyDetailSub: {
      fontSize: 12,
      color: isDark ? '#888' : '#999',
    },
    monthlyDetailRight: {
      alignItems: 'flex-end',
    },
    monthlyDetailBalance: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2,
    },
    monthlyDetailDays: {
      fontSize: 11,
      color: isDark ? '#888' : '#999',
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#aaa' : '#666',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#888' : '#999',
      marginTop: 8,
    },
    // Weekly styles
    weeklyContainer: {
      flex: 1,
    },
    weeklyContent: {
      padding: 20,
      paddingTop: 16,
    },
    bannerDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    weekCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    currentWeekCard: {
      borderWidth: 1.5,
      borderColor: '#10b981',
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    weekLabelRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 8,
    },
    weekLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#fff' : '#1a1a1a',
      letterSpacing: -0.5,
    },
    weekTotalContainer: {
      alignItems: 'flex-end',
      gap: 4,
    },
    weekTotalValue: {
      fontSize: 20,
      fontWeight: '800',
      color: '#10b981',
      letterSpacing: -0.5,
    },
    weekTotalOvertime: {
      fontSize: 11,
      fontWeight: '600',
    },
    weekOvertimePositive: {
      color: '#10b981',
    },
    weekOvertimeNegative: {
      color: '#ef4444',
    },
    // Tablo Başlıkları
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 2,
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    headerDayName: {
      width: 75,
    },
    headerTimeCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerDurationCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerOvertimeCell: {
      flex: 1,
      alignItems: 'center',
    },
    headerText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#888' : '#999',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    // Günler - Satır bazlı görünüm
    daysContainer: {
      gap: 0,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 2,
    },
    dayRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    holidayRow: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)',
      borderRadius: 8,
      marginHorizontal: -4,
      paddingHorizontal: 8,
    },
    annualLeaveRow: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.04)',
      borderRadius: 8,
      marginHorizontal: -4,
      paddingHorizontal: 8,
    },
    dayNameContainer: {
      width: 75,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dayName: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
    },
    holidayTag: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    annualLeaveTag: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    timeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      minWidth: 52,
      alignItems: 'center',
      marginHorizontal: 3,
      alignSelf: 'center',
    },
    timeBadgeNeutral: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    },
    timeBadgeSuccess: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    },
    timeBadgeError: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    },
    timeText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
    },
    timeTextSuccess: {
      color: '#10b981',
    },
    timeTextError: {
      color: '#ef4444',
    },
    timeEmpty: {
      fontSize: 13,
      color: isDark ? '#666' : '#ccc',
      fontWeight: '400',
    },
    durationCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#999' : '#aaa',
    },
    durationTextFilled: {
      color: isDark ? '#e5e5e5' : '#1a1a1a',
      fontWeight: '600',
    },
    overtimeCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overtimeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    overtimeTextPositive: {
      color: '#10b981',
    },
    overtimeTextNegative: {
      color: '#ef4444',
    },
    overtimeEmpty: {
      fontSize: 13,
      color: isDark ? '#666' : '#ccc',
      fontWeight: '400',
    },
    // Break Edit Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
      textAlign: 'center',
      marginBottom: 24,
    },
    modalSection: {
      marginBottom: 24,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalRowContent: {
      flex: 1,
      marginRight: 16,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
      marginBottom: 4,
    },
    modalDesc: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#666',
      lineHeight: 18,
    },
    durationInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    durationInput: {
      flex: 1,
      height: 48,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      marginRight: 12,
    },
    durationUnit: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      fontWeight: '500',
    },
    modalClearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      marginBottom: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
    },
    modalClearButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ef4444',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      backgroundColor: isDark ? '#333' : '#f5f5f5',
    },
    modalButtonSave: {
      backgroundColor: '#10b981',
    },
    modalButtonCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#999' : '#666',
    },
    modalScroll: {
      maxHeight: 400,
    },
    timeInput: {
      height: 48,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      marginTop: 8,
    },
    modalButtonSaveText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    exportModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    exportModalContent: {
      backgroundColor: isDark ? '#1e1e2e' : '#fff',
      borderRadius: 16,
      padding: 20,
      width: '80%',
      maxWidth: 320,
    },
    exportModalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      marginBottom: 16,
      textAlign: 'center',
    },
    exportFormatOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: isDark ? '#2a2a3e' : '#f5f5f7',
      marginBottom: 8,
    },
    exportFormatText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#1a1a2e',
      marginLeft: 12,
      flex: 1,
    },
    exportFormatDesc: {
      fontSize: 13,
      color: isDark ? '#888' : '#999',
    },
    exportModalCancel: {
      marginTop: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    exportModalCancelText: {
      fontSize: 15,
      color: isDark ? '#888' : '#666',
      fontWeight: '500',
    },
  });
