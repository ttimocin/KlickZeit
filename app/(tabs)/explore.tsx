import { useModal } from '@/components/custom-modal';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { exportToCSV, getDailySummaries, importFromCSV } from '@/services/export';
import { syncAllPendingRecords } from '@/services/firebase-sync';
import { addHolidayRecord, getAppStandards, getBreakCounted, getBreakDuration, removeHolidayRecord, setBreakCounted, setBreakDuration, upsertRecordByDateType } from '@/services/storage';
import { DailySummary } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

const fullDayNames: Record<string, string[]> = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
};

// JS getDay (0=Pazar..6=Cumartesi) -> Pazartesi bazlı indeks (0=Pzt..6=Paz)
const jsDayToMondayIndex = (jsDay: number): number => jsDay === 0 ? 6 : jsDay - 1;

export default function RecordsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate, language } = useLanguage();
  const { showModal, showWarning, showError, showInfo, ModalComponent } = useModal();

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [breakCountedMap, setBreakCountedMap] = useState<Record<string, boolean>>({});
  const [breakDurationMap, setBreakDurationMap] = useState<Record<string, number>>({});
  const [editDayModalVisible, setEditDayModalVisible] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingGiris, setEditingGiris] = useState<string>('');
  const [editingCikis, setEditingCikis] = useState<string>('');
  const [editingIsHoliday, setEditingIsHoliday] = useState(false);
  const [editingBreakCounted, setEditingBreakCounted] = useState(false);
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

  const loadSummaries = useCallback(async () => {
    // Standartları yükle
    const standards = await getAppStandards();
    setDailyWorkMinutes(standards.dailyWorkMinutes);
    setWeeklyWorkMinutes(standards.dailyWorkMinutes * (standards.workingDays || [1, 2, 3, 4, 5]).length);
    setBreakMinutes(standards.defaultBreakMinutes);
    setEveningThresholdMinutes(standards.eveningThresholdMinutes);
    setWorkingDays(standards.workingDays || [1, 2, 3, 4, 5]);
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
  const calculateDuration = (giris: string | null, cikis: string | null, isHoliday: boolean = false, breakCounted: boolean = false, breakDurationMinutes: number = breakMinutes): { duration: number; netDuration: number; overtime: number } => {
    if (!giris || !cikis) return { duration: 0, netDuration: 0, overtime: 0 };
    const [girisH, girisM] = giris.split(':').map(Number);
    const [cikisH, cikisM] = cikis.split(':').map(Number);
    const grossDuration = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);

    if (grossDuration <= 0) return { duration: 0, netDuration: 0, overtime: 0 };

    // Tatil günlerinde veya mola sayılıyorsa mola düşme
    const netDuration = (isHoliday || breakCounted) ? grossDuration : grossDuration - breakDurationMinutes;
    const overtime = netDuration - dailyWorkMinutes;

    return { duration: grossDuration, netDuration: netDuration > 0 ? netDuration : 0, overtime };
  };

  // Güne tıklama - düzenleme modalı aç
  const handleDayPress = async (day: WeekDayData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Gelecek tarihler için işlem yapma
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    if (dayDate > today) {
      return;
    }

    // Mevcut değerleri yükle
    const summary = summaries.find(s => s.date === day.date);
    const currentBreakCounted = breakCountedMap[day.date] || false;
    const currentBreakDuration = breakDurationMap[day.date] || breakMinutes;

    setEditingDate(day.date);
    setEditingGiris(day.giris || '');
    setEditingCikis(day.cikis || '');
    setEditingIsHoliday(day.isHoliday);
    setEditingBreakCounted(currentBreakCounted);
    setEditingBreakDuration(String(currentBreakDuration));
    setEditingMolaGiris(summary?.molaGiris || '');
    setEditingMolaCikis(summary?.molaCikis || '');
    setEditDayModalVisible(true);
  };

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
      const date = new Date(summary.date);
      const weekStart = getWeekStart(date);
      const weekKey = formatDateStr(weekStart);

      if (!weeks.has(weekKey)) {
        // Haftanın ilk ve son çalışma günlerini bul
        const firstWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[0]);
        const lastWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[sortedWorkingDays.length - 1]);
        const weekDisplayStart = new Date(weekStart);
        weekDisplayStart.setDate(weekDisplayStart.getDate() + firstWorkDayOffset);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + lastWorkDayOffset);

        const isCurrentWeek = weekKey === formatDateStr(currentWeekStart);

        // Hafta etiketi oluştur
        const dateRange = `${weekDisplayStart.getDate()}.${weekDisplayStart.getMonth() + 1} - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`;
        const weekLabel = isCurrentWeek
          ? `${i18n.t('thisWeek')} (${dateRange})`
          : dateRange;

        weeks.set(weekKey, {
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
              breakCounted: false,
            };
          }),
          totalMinutes: 0,
          totalText: '-',
          totalOvertime: 0,
          totalOvertimeText: '-',
          isCurrentWeek,
        });
      }

      // Bu günün verilerini ekle
      const week = weeks.get(weekKey)!;
      const dayOfWeek = date.getDay();
      const dayIndex = sortedWorkingDays.indexOf(dayOfWeek);

      if (dayIndex >= 0) {
        week.days[dayIndex].giris = summary.giris || null;
        week.days[dayIndex].cikis = summary.cikis || null;
        week.days[dayIndex].isHoliday = summary.isHoliday || false;
        week.days[dayIndex].breakCounted = breakCountedMap[summary.date] || false;

        const breakDur = breakDurationMap[summary.date] || breakMinutes;
        const { netDuration, overtime } = calculateDuration(
          summary.giris || null,
          summary.cikis || null,
          summary.isHoliday || false,
          breakCountedMap[summary.date] || false,
          breakDur
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
        week.totalOvertime = week.totalMinutes - weeklyWorkMinutes;
        week.totalOvertimeText = formatOvertime(week.totalOvertime);
      }
    }

    // Güncel hafta yoksa ekle
    const currentWeekKey = formatDateStr(currentWeekStart);
    if (!weeks.has(currentWeekKey)) {
      const firstWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[0]);
      const lastWorkDayOffset = jsDayToMondayIndex(sortedWorkingDays[sortedWorkingDays.length - 1]);
      const weekDisplayStart = new Date(currentWeekStart);
      weekDisplayStart.setDate(weekDisplayStart.getDate() + firstWorkDayOffset);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + lastWorkDayOffset);

      const dateRange = `${weekDisplayStart.getDate()}.${weekDisplayStart.getMonth() + 1} - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`;
      const weekLabel = `${i18n.t('thisWeek')} (${dateRange})`;

      weeks.set(currentWeekKey, {
        weekStart: currentWeekKey,
        weekEnd: formatDateStr(weekEnd),
        weekLabel,
        days: sortedWorkingDays.map((jsDay) => {
          const mondayIdx = jsDayToMondayIndex(jsDay);
          const dayDate = new Date(currentWeekStart);
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
            breakCounted: false,
          };
        }),
        totalMinutes: 0,
        totalText: '-',
        totalOvertime: 0,
        totalOvertimeText: '-',
        isCurrentWeek: true,
      });
    }

    return Array.from(weeks.values()).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [summaries, language, breakCountedMap, breakDurationMap, workingDays, dailyWorkMinutes, weeklyWorkMinutes, breakMinutes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummaries();
    setRefreshing(false);
  };

  const handleExport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (summaries.length === 0) {
      showWarning(i18n.t('warning'), i18n.t('noRecordsToExport'));
      return;
    }

    const success = await exportToCSV();
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
        buttons: [{ text: 'Tamam', style: 'default' }],
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await syncAllPendingRecords();

    if (result.notLoggedIn) {
      showInfo(i18n.t('info'), i18n.t('loginToSync'));
    } else if (result.success > 0 || result.failed > 0) {
      showModal({
        title: i18n.t('syncComplete'),
        message: `${i18n.t('successful')}: ${result.success}\n${i18n.t('failed')}: ${result.failed}`,
        icon: result.failed > 0 ? '⚠️' : '☁️',
        buttons: [{ text: 'Tamam', style: 'default' }],
      });
    } else {
      showInfo(i18n.t('info'), i18n.t('noRecordsToSync'));
    }

    setSyncing(false);
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

  // Aylık bakiye hesapla (20:00 sonrası mesai dahil)
  const monthlyBalances = useMemo(() => {
    const monthsMap = new Map<string, { totalMinutes: number; targetMinutes: number; dayCount: number; year: number; month: number; eveningMinutes: number }>();

    const today = new Date();
    const todayStr = formatDateStr(today);
    const EVENING_THRESHOLD = eveningThresholdMinutes;

    for (const week of weeklyData) {
      for (const day of week.days) {
        if (day.date < todayStr) {
          const date = new Date(day.date);
          const year = date.getFullYear();
          const month = date.getMonth();
          const key = `${year}-${String(month + 1).padStart(2, '0')}`;

          if (!monthsMap.has(key)) {
            monthsMap.set(key, { totalMinutes: 0, targetMinutes: 0, dayCount: 0, year, month, eveningMinutes: 0 });
          }

          const entry = monthsMap.get(key)!;
          const dayOfWeek = date.getDay();
          const isWorkingDay = workingDays.includes(dayOfWeek);

          if (isWorkingDay) {
            entry.targetMinutes += dailyWorkMinutes;
          }
          entry.dayCount += 1;

          if (day.duration > 0) {
            entry.totalMinutes += day.duration;
          }

          // 20:00 sonrası çalışma hesapla
          if (day.cikis) {
            const [cH, cM] = day.cikis.split(':').map(Number);
            const cikisMinutes = cH * 60 + cM;
            if (cikisMinutes > EVENING_THRESHOLD) {
              entry.eveningMinutes += (cikisMinutes - EVENING_THRESHOLD);
            }
          }
        }
      }
    }

    const lang = language || 'tr';
    const names = monthNames[lang] || monthNames.tr;

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
        balance,
        balanceText: formatOvertime(balance),
        eveningMinutes: data.eveningMinutes,
        eveningText: formatDuration(data.eveningMinutes),
      };
    }).sort((a, b) => b.key.localeCompare(a.key));

    return result;
  }, [weeklyData, language]);

  // Son ayın bakiyesi
  const lastMonthBalance = monthlyBalances.length > 0 ? monthlyBalances[0] : null;

  const styles = createStyles(isDark);

  // Saat renklendirmesi - geç kalma veya erken çıkış kontrolü
  const getTimeColor = (time: string | null, type: 'giris' | 'cikis'): string => {
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
        <Text style={styles.weekLabel}>{week.weekLabel}</Text>
        <View style={styles.weekTotalContainer}>
          <Text style={styles.weekTotalValue}>{week.totalText}</Text>
          {week.totalMinutes > 0 && (
            <Text style={[
              styles.weekTotalOvertime,
              week.totalOvertime >= 0 ? styles.weekOvertimePositive : styles.weekOvertimeNegative
            ]}>
              {week.totalOvertimeText} {i18n.t('minuteShort')}
            </Text>
          )}
        </View>
      </View>

      {/* Tablo Başlıkları */}
      <View style={styles.tableHeader}>
        <View style={styles.headerDayName}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('day')}</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('entry')}</Text>
        </View>
        <View style={styles.headerTimeCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('exit')}</Text>
        </View>
        <View style={styles.headerDurationCell}>
          <Text style={styles.headerText} numberOfLines={1}>{i18n.t('duration')}</Text>
        </View>
        <View style={styles.headerOvertimeCell}>
          <Text style={styles.headerText} numberOfLines={1}>±</Text>
        </View>
      </View>

      {/* Günler - Satır bazlı görünüm */}
      <View style={styles.daysContainer}>
        {week.days.slice().reverse().map((day, i) => {
          const isLateEntry = day.giris && getTimeColor(day.giris, 'giris') === '#ef4444';
          const isEarlyExit = day.cikis && getTimeColor(day.cikis, 'cikis') === '#ef4444';

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayRow,
                i < week.days.length - 1 && styles.dayRowBorder,
                day.isHoliday && styles.holidayRow
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              {/* Gün adı - Sol */}
              <View style={styles.dayNameContainer}>
                <Text style={styles.dayName}>
                  {new Date(day.date).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' })} {day.shortName}
                </Text>
                {day.isHoliday && (
                  <View style={styles.holidayTag}>
                    <Ionicons name="sunny-outline" size={12} color="#10b981" />
                  </View>
                )}
              </View>

              {/* Giriş saati */}
              <View style={styles.timeCell}>
                {day.giris ? (
                  <View style={[
                    styles.timeBadge,
                    isLateEntry && styles.timeBadgeError,
                    !isLateEntry && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      isLateEntry && styles.timeTextError,
                      !isLateEntry && styles.timeTextSuccess
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
                    isEarlyExit && styles.timeBadgeError,
                    !isEarlyExit && styles.timeBadgeSuccess
                  ]}>
                    <Text style={[
                      styles.timeText,
                      isEarlyExit && styles.timeTextError,
                      !isEarlyExit && styles.timeTextSuccess
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

      {/* Alt başlık */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          {summaries.length} {i18n.t('daysRecorded')}
        </Text>
      </View>

      {/* Aylık Bakiye */}
      {lastMonthBalance && (
        <View style={styles.totalBalanceContainer}>
          <View style={styles.totalBalanceHeaderRow}>
            <View style={styles.totalBalanceHeader}>
              <Text style={styles.totalBalanceTitle}>{i18n.t('monthlyBalance')}</Text>
              <Text style={styles.totalBalanceDesc}>{lastMonthBalance.monthName} {lastMonthBalance.year}</Text>
            </View>
            <TouchableOpacity
              style={styles.detailsHeaderButton}
              onPress={() => setDetailsModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsHeaderButtonText}>{i18n.t('details')}</Text>
              <Ionicons name="chevron-forward" size={14} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          </View>
          <View style={styles.totalBalanceContent}>
            <View style={styles.totalBalanceValueContainer}>
              <Text style={[
                styles.totalBalanceValue,
                lastMonthBalance.balance >= 0 ? styles.totalBalancePositive : styles.totalBalanceNegative
              ]}>
                {lastMonthBalance.balanceText} {i18n.t('minuteShort')}
              </Text>
              <Text style={styles.totalBalanceLabel}>
                {lastMonthBalance.balance >= 0 ? i18n.t('inPlus') : i18n.t('inMinus')}
              </Text>
            </View>
            <View style={styles.totalBalanceDetails}>
              <Text style={styles.totalBalanceDetailText}>
                {formatDuration(lastMonthBalance.totalMinutes)} / {formatDuration(lastMonthBalance.targetMinutes)}
              </Text>
              <Text style={styles.totalBalanceDetailSubtext}>
                {lastMonthBalance.dayCount} {i18n.t('day')}
              </Text>
            </View>
          </View>
        </View>
      )}

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
              <Text style={styles.detailsModalTitle}>{i18n.t('monthlyDetails')}</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.detailsModalClose}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              style={styles.detailsModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {monthlyBalances.map((m) => (
                <View key={m.key} style={styles.detailsMonthCard}>
                  {/* Ay başlığı */}
                  <View style={styles.detailsMonthHeader}>
                    <Text style={styles.detailsMonthTitle}>{m.monthName} {m.year}</Text>
                    <Text style={[
                      styles.detailsMonthBalance,
                      m.balance >= 0 ? styles.totalBalancePositive : styles.totalBalanceNegative
                    ]}>
                      {m.balanceText} {i18n.t('minuteShort')}
                    </Text>
                  </View>

                  {/* Ay detayları */}
                  <View style={styles.detailsMonthBody}>
                    <View style={styles.detailsMonthStat}>
                      <Text style={styles.detailsMonthStatLabel}>{i18n.t('worked')}</Text>
                      <Text style={styles.detailsMonthStatValue}>{formatDuration(m.totalMinutes)}</Text>
                    </View>
                    <View style={styles.detailsMonthStat}>
                      <Text style={styles.detailsMonthStatLabel}>{i18n.t('target')}</Text>
                      <Text style={styles.detailsMonthStatValue}>{formatDuration(m.targetMinutes)}</Text>
                    </View>
                    <View style={styles.detailsMonthStat}>
                      <Text style={styles.detailsMonthStatLabel}>{i18n.t('day')}</Text>
                      <Text style={styles.detailsMonthStatValue}>{m.dayCount}</Text>
                    </View>
                  </View>

                  {/* 20:00 sonrası çalışma */}
                  {m.eveningMinutes > 0 && (
                    <View style={styles.detailsEveningRow}>
                      <View style={styles.detailsEveningIcon}>
                        <Ionicons name="moon-outline" size={14} color="#f59e0b" />
                      </View>
                      <Text style={styles.detailsEveningLabel}>{Math.floor(eveningThresholdMinutes / 60)}:{String(eveningThresholdMinutes % 60).padStart(2, '0')} {i18n.t('eveningWork')}</Text>
                      <Text style={styles.detailsEveningValue}>{m.eveningText}</Text>
                    </View>
                  )}
                </View>
              ))}
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

      {/* Haftalık Görünüm */}
      <ScrollView
        style={styles.weeklyContainer}
        contentContainerStyle={styles.weeklyContent}
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

      {/* Custom Modal */}
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
                    onValueChange={setEditingIsHoliday}
                    trackColor={{ false: isDark ? '#333' : '#ddd', true: '#10b981' }}
                    thumbColor={editingIsHoliday ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {!editingIsHoliday && (
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

                  {/* Mola Sayılıyor Toggle */}
                  <View style={styles.modalSection}>
                    <View style={styles.modalRow}>
                      <View style={styles.modalRowContent}>
                        <Text style={styles.modalLabel}>{i18n.t('breakCounted')}</Text>
                        <Text style={styles.modalDesc}>{i18n.t('breakCountedDesc')}</Text>
                      </View>
                      <Switch
                        value={editingBreakCounted}
                        onValueChange={setEditingBreakCounted}
                        trackColor={{ false: isDark ? '#333' : '#ddd', true: '#10b981' }}
                        thumbColor={editingBreakCounted ? '#fff' : '#f4f3f4'}
                      />
                    </View>
                  </View>

                  {/* Mola Süresi */}
                  <View style={styles.modalSection}>
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
                onPress={async () => {
                  if (editingDate) {
                    if (editingIsHoliday) {
                      // Tatil olarak işaretle
                      await addHolidayRecord(editingDate);
                    } else {
                      // Normal gün - tatil değilse tatil kaydını kaldır
                      await removeHolidayRecord(editingDate);

                      // Giriş/çıkış kayıtlarını güncelle
                      if (editingGiris) {
                        await upsertRecordByDateType(editingDate, 'giris', editingGiris);
                      }
                      if (editingCikis) {
                        await upsertRecordByDateType(editingDate, 'cikis', editingCikis);
                      }

                      // Mola bilgilerini kaydet
                      const duration = parseInt(editingBreakDuration, 10) || breakMinutes;
                      await setBreakCounted(editingDate, editingBreakCounted);
                      await setBreakDuration(editingDate, duration);

                      // Mola kayıtlarını güncelle (eğer varsa)
                      // Not: Şu an mola kayıtlarını düzenleme özelliği yok, sadece gösteriliyor
                    }

                    await loadSummaries();
                    setEditDayModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalButtonSaveText}>{i18n.t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    totalBalanceContainer: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    totalBalanceHeader: {
      marginBottom: 12,
    },
    totalBalanceTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
      marginBottom: 4,
    },
    totalBalanceDesc: {
      fontSize: 12,
      color: isDark ? '#888' : '#999',
    },
    totalBalanceContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalBalanceValueContainer: {
      alignItems: 'flex-start',
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
    },
    detailsMonthCard: {
      backgroundColor: isDark ? '#222' : '#f8f8f8',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    detailsMonthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    detailsMonthTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a1a',
    },
    detailsMonthBalance: {
      fontSize: 14,
      fontWeight: '700',
    },
    detailsMonthBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailsMonthStat: {
      alignItems: 'center',
      flex: 1,
    },
    detailsMonthStatLabel: {
      fontSize: 11,
      color: isDark ? '#888' : '#999',
      marginBottom: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    detailsMonthStatValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#e5e5e5' : '#1a1a1a',
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
    weekLabel: {
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
    timeCell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
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
  });
