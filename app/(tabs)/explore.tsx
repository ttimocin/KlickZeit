import { useModal } from '@/components/custom-modal';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { exportToCSV, getDailySummaries, importFromCSV } from '@/services/export';
import { syncAllPendingRecords } from '@/services/firebase-sync';
import { addHolidayRecord, removeHolidayRecord } from '@/services/storage';
import { DailySummary } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Günlük çalışma süresi (dakika) - 7 saat (net çalışma, mola hariç)
const DAILY_WORK_MINUTES = 420;

// Haftalık çalışma süresi (dakika) - 35 saat
const WEEKLY_WORK_MINUTES = 2100;

// Mola süresi (dakika) - 30 dakika
const BREAK_MINUTES = 30;

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

// Kısa gün adları
const shortDayNames: Record<string, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr'],
};

const fullDayNames: Record<string, string[]> = {
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'],
};

export default function RecordsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate, language } = useLanguage();
  const { showModal, showWarning, showError, showInfo, ModalComponent } = useModal();
  
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const loadSummaries = useCallback(async () => {
    const data = await getDailySummaries();
    setSummaries(data);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadSummaries();
    }, [loadSummaries])
  );
  
  // Çalışma süresini hesapla (mola dahil)
  const calculateDuration = (giris: string | null, cikis: string | null, isHoliday: boolean = false): { duration: number; netDuration: number; overtime: number } => {
    if (!giris || !cikis) return { duration: 0, netDuration: 0, overtime: 0 };
    const [girisH, girisM] = giris.split(':').map(Number);
    const [cikisH, cikisM] = cikis.split(':').map(Number);
    const grossDuration = (cikisH * 60 + cikisM) - (girisH * 60 + girisM);
    
    if (grossDuration <= 0) return { duration: 0, netDuration: 0, overtime: 0 };
    
    // Tatil günlerinde mola düşme (zaten 7 saat net olarak ekleniyor)
    const netDuration = isHoliday ? grossDuration : grossDuration - BREAK_MINUTES;
    const overtime = netDuration - DAILY_WORK_MINUTES;
    
    return { duration: grossDuration, netDuration: netDuration > 0 ? netDuration : 0, overtime };
  };
  
  // Güne tıklama - tatil ekleme/kaldırma
  const handleDayPress = (day: WeekDayData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Gelecek tarihler için işlem yapma
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(day.date);
    if (dayDate > today) {
      return;
    }
    
    if (day.isHoliday) {
      // Tatil kaldır
      showModal({
        title: i18n.t('removeHoliday'),
        message: i18n.t('removeHolidayConfirm'),
        icon: '🗑️',
        buttons: [
          { text: i18n.t('cancel'), style: 'cancel' },
          {
            text: i18n.t('remove'),
            style: 'destructive',
            onPress: async () => {
              await removeHolidayRecord(day.date);
              await loadSummaries();
            },
          },
        ],
      });
    } else if (!day.giris && !day.cikis) {
      // Boş gün - tatil ekle
      showModal({
        title: i18n.t('addHoliday'),
        message: i18n.t('addHolidayConfirm'),
        icon: '🏖️',
        buttons: [
          { text: i18n.t('cancel'), style: 'cancel' },
          {
            text: i18n.t('addHolidayBtn'),
            style: 'default',
            onPress: async () => {
              await addHolidayRecord(day.date);
              await loadSummaries();
            },
          },
        ],
      });
    }
  };
  
  // Haftalık verileri hesapla
  const weeklyData = useMemo((): WeekData[] => {
    const weeks: Map<string, WeekData> = new Map();
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const lang = language || 'tr';
    
    // Summaries'den haftalık veri oluştur
    for (const summary of summaries) {
      const date = new Date(summary.date);
      const weekStart = getWeekStart(date);
      const weekKey = formatDateStr(weekStart);
      
      if (!weeks.has(weekKey)) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 4);
        
        const isCurrentWeek = weekKey === formatDateStr(currentWeekStart);
        
        weeks.set(weekKey, {
          weekStart: weekKey,
          weekEnd: formatDateStr(weekEnd),
          weekLabel: isCurrentWeek ? i18n.t('thisWeek') : `${weekStart.getDate()}.${weekStart.getMonth() + 1} - ${weekEnd.getDate()}.${weekEnd.getMonth() + 1}`,
          days: Array(5).fill(null).map((_, i) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            return {
              dayName: fullDayNames[lang]?.[i] || fullDayNames.tr[i],
              shortName: shortDayNames[lang]?.[i] || shortDayNames.tr[i],
              date: formatDateStr(dayDate),
              giris: null,
              cikis: null,
              duration: 0,
              durationText: '-',
              overtime: 0,
              overtimeText: '-',
              isHoliday: false,
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
      const dayIndex = dayOfWeek === 0 ? -1 : dayOfWeek - 1;
      
      if (dayIndex >= 0 && dayIndex < 5) {
        week.days[dayIndex].giris = summary.giris || null;
        week.days[dayIndex].cikis = summary.cikis || null;
        week.days[dayIndex].isHoliday = summary.isHoliday || false;
        
        const { netDuration, overtime } = calculateDuration(
          summary.giris || null, 
          summary.cikis || null, 
          summary.isHoliday || false
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
    
    // Toplamları güncelle (haftalık 35 saat = 2100 dakika baz alınarak)
    for (const week of weeks.values()) {
      if (week.totalMinutes > 0) {
        week.totalText = formatDuration(week.totalMinutes);
        week.totalOvertime = week.totalMinutes - WEEKLY_WORK_MINUTES;
        week.totalOvertimeText = formatOvertime(week.totalOvertime);
      }
    }
    
    // Güncel hafta yoksa ekle
    const currentWeekKey = formatDateStr(currentWeekStart);
    if (!weeks.has(currentWeekKey)) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);
      
      weeks.set(currentWeekKey, {
        weekStart: currentWeekKey,
        weekEnd: formatDateStr(weekEnd),
        weekLabel: i18n.t('thisWeek'),
        days: Array(5).fill(null).map((_, i) => {
          const dayDate = new Date(currentWeekStart);
          dayDate.setDate(dayDate.getDate() + i);
          return {
            dayName: fullDayNames[lang]?.[i] || fullDayNames.tr[i],
            shortName: shortDayNames[lang]?.[i] || shortDayNames.tr[i],
            date: formatDateStr(dayDate),
            giris: null,
            cikis: null,
            duration: 0,
            durationText: '-',
            overtime: 0,
            overtimeText: '-',
            isHoliday: false,
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
  }, [summaries, language]);
  
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
  
  const styles = createStyles(isDark);
  
  const renderWeekCard = (week: WeekData) => (
    <View key={week.weekStart} style={[styles.weekCard, week.isCurrentWeek && styles.currentWeekCard]}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekLabel}>{week.weekLabel}</Text>
        <View style={styles.weekTotalContainer}>
          <View style={styles.weekTotal}>
            <Text style={styles.weekTotalLabel}>{i18n.t('total')}</Text>
            <Text style={styles.weekTotalValue}>{week.totalText}</Text>
          </View>
          {week.totalMinutes > 0 && (
            <Text style={[
              styles.weekTotalOvertime,
              week.totalOvertime >= 0 ? styles.overtimeTextPositive : styles.overtimeTextNegative
            ]}>
              {week.totalOvertimeText} {i18n.t('minuteShort')}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.weekTable}>
        {/* Header - Gün adları (tıklanabilir) */}
        <View style={styles.weekTableHeader}>
          <View style={styles.weekLabelCell} />
          {week.days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.weekTableCell, day.isHoliday && styles.holidayCell]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekDayShort, day.isHoliday && styles.holidayText]}>
                {day.isHoliday ? '🏖️' : day.shortName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Giriş saatleri */}
        <View style={styles.weekTableRow}>
          <View style={styles.weekLabelCell}>
            <Text style={styles.weekRowLabel}>↓</Text>
          </View>
          {week.days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.weekTableCell, day.isHoliday && styles.holidayCell]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekTime, styles.weekTimeIn, day.isHoliday && styles.holidayTimeText]}>
                {day.giris || '-'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Çıkış saatleri */}
        <View style={styles.weekTableRow}>
          <View style={styles.weekLabelCell}>
            <Text style={styles.weekRowLabel}>↑</Text>
          </View>
          {week.days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.weekTableCell, day.isHoliday && styles.holidayCell]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekTime, styles.weekTimeOut, day.isHoliday && styles.holidayTimeText]}>
                {day.cikis || '-'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Çalışma süreleri */}
        <View style={[styles.weekTableRow, styles.weekTableRowBorder]}>
          <View style={styles.weekLabelCell}>
            <Text style={styles.weekRowLabel}>⏱</Text>
          </View>
          {week.days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.weekTableCell, day.isHoliday && styles.holidayCell]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.weekDuration,
                day.duration > 0 && styles.weekDurationFilled,
                day.isHoliday && styles.holidayTimeText
              ]}>
                {day.durationText}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Fazla/Eksik */}
        <View style={styles.weekTableRow}>
          <View style={styles.weekLabelCell}>
            <Text style={styles.weekRowLabel}>±</Text>
          </View>
          {week.days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.weekTableCell, day.isHoliday && styles.holidayCell]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.weekOvertime,
                day.overtime > 0 && styles.weekOvertimePositive,
                day.overtime < 0 && styles.weekOvertimeNegative,
                day.isHoliday && styles.holidayTimeText
              ]}>
                {day.duration > 0 ? day.overtimeText : '-'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
      
      {/* Aksiyon Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.syncButton]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.actionIcon}>☁️</Text>
          <Text style={styles.actionText}>
            {syncing ? i18n.t('syncing') : i18n.t('syncronize')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>{i18n.t('downloadCSV')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.importButton]}
          onPress={handleImport}
        >
          <Text style={styles.actionIcon}>📥</Text>
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
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      gap: 2,
    },
    syncButton: {
      backgroundColor: isDark ? '#1a4a1a' : '#e8f5e9',
    },
    exportButton: {
      backgroundColor: isDark ? '#1a3a4a' : '#e3f2fd',
    },
    importButton: {
      backgroundColor: isDark ? '#4a3a1a' : '#fff3e0',
    },
    actionIcon: {
      fontSize: 16,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
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
      paddingTop: 10,
    },
    weekCard: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    currentWeekCard: {
      borderWidth: 2,
      borderColor: '#4CAF50',
    },
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    weekLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
    },
    weekTotalContainer: {
      alignItems: 'flex-end',
    },
    weekTotal: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    weekTotalLabel: {
      fontSize: 11,
      color: isDark ? '#888' : '#999',
    },
    weekTotalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#4CAF50',
    },
    weekTotalOvertime: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    overtimeTextPositive: {
      color: '#4CAF50',
    },
    overtimeTextNegative: {
      color: '#f44336',
    },
    weekTable: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 12,
      overflow: 'hidden',
    },
    weekTableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    weekTableRow: {
      flexDirection: 'row',
    },
    weekTableRowBorder: {
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    },
    weekLabelCell: {
      width: 28,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekRowLabel: {
      fontSize: 12,
      color: isDark ? '#666' : '#999',
    },
    weekTableCell: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
    },
    holidayCell: {
      backgroundColor: isDark ? '#2d4a2d' : '#e8f5e9',
    },
    holidayText: {
      color: '#4CAF50',
    },
    holidayTimeText: {
      color: isDark ? '#81c784' : '#2e7d32',
    },
    weekDayShort: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
    },
    weekTime: {
      fontSize: 11,
      fontWeight: '500',
    },
    weekTimeIn: {
      color: '#4CAF50',
    },
    weekTimeOut: {
      color: '#FF5722',
    },
    weekDuration: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#555' : '#999',
    },
    weekDurationFilled: {
      color: isDark ? '#fff' : '#333',
    },
    weekOvertime: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#555' : '#999',
    },
    weekOvertimePositive: {
      color: '#4CAF50',
    },
    weekOvertimeNegative: {
      color: '#f44336',
    },
  });
