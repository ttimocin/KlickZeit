import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { syncToFirebase } from '@/services/firebase-sync';
import {
    requestNotificationPermissions,
    setupNotificationChannel,
    showCheckInNotification,
    showCheckOutNotification,
} from '@/services/notifications';
import { addRecord, getLastRecord } from '@/services/storage';
import { WorkRecord } from '@/types';
import { displayDate, formatDate, formatTime, generateId, getDayName } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate } = useLanguage(); // Dil değişince yenile
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRecord, setLastRecord] = useState<WorkRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Saati güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Bildirim ayarları
  useEffect(() => {
    const setup = async () => {
      await requestNotificationPermissions();
      await setupNotificationChannel();
    };
    setup();
  }, []);
  
  // Son kaydı yükle
  const loadRecords = useCallback(async () => {
    const last = await getLastRecord();
    setLastRecord(last);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );
  
  // Sonraki kayıt türü
  const nextType = lastRecord?.type === 'giris' ? 'cikis' : 'giris';
  const isCheckIn = nextType === 'giris';
  
  // Çalışma süresi hesapla
  const getWorkDuration = () => {
    if (!lastRecord || lastRecord.type !== 'giris') return null;
    const elapsed = currentTime.getTime() - lastRecord.timestamp;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, total: elapsed };
  };
  
  const workDuration = getWorkDuration();
  
  // Kayıt yap
  const handleRecord = async () => {
    setIsLoading(true);
    
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const now = new Date();
    const record: WorkRecord = {
      id: generateId(),
      type: nextType,
      timestamp: now.getTime(),
      date: formatDate(now),
      time: formatTime(now),
      synced: false,
    };
    
    const success = await addRecord(record);
    
    if (success) {
      // Firebase'e senkronize et
      await syncToFirebase(record);
      
      // Bildirim gönder (sadece telefon/saat bildirimi, popup yok)
      if (isCheckIn) {
        await showCheckInNotification(record.time, record.timestamp);
      } else {
        await showCheckOutNotification(record.time);
      }
      
      await loadRecords();
    }
    
    setIsLoading(false);
  };
  
  const insets = useSafeAreaInsets();
  const styles = createStyles(isDark);
  
  return (
    <View key={`home-${forceUpdate}`} style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>{i18n.t('appTitle')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <View style={styles.settingsIconContainer}>
            <Ionicons name="settings-outline" size={22} color={isDark ? '#fff' : '#333'} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Card */}
      <View style={styles.timeCard}>
        <Text style={styles.clock}>
          {currentTime.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </Text>
        <View style={styles.dateRow}>
          <Text style={styles.dayName}>{getDayName(formatDate(currentTime))}</Text>
          <View style={styles.dateDot} />
          <Text style={styles.dateText}>{displayDate(formatDate(currentTime))}</Text>
        </View>
      </View>
      
      {/* Main Action Button */}
      <View style={styles.buttonContainer}>
        {/* Work Timer - Giriş yapıldıysa göster */}
        {workDuration && (
          <View style={styles.timerContainer}>
            <View style={styles.timerBadge}>
              <View style={styles.timerDotPulse} />
              <Text style={styles.timerLabel}>{i18n.t('workingTime')}</Text>
            </View>
            <Text style={styles.timerText}>
              {String(workDuration.hours).padStart(2, '0')}:
              {String(workDuration.minutes).padStart(2, '0')}:
              {String(workDuration.seconds).padStart(2, '0')}
            </Text>
            <Text style={styles.checkInTime}>
              {i18n.t('entryAt')} {lastRecord?.time}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.mainButton, isCheckIn ? styles.checkInButton : styles.checkOutButton]}
          onPress={handleRecord}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <View style={styles.buttonInner}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <View style={styles.buttonIconContainer}>
                  <Ionicons 
                    name={isCheckIn ? "log-in-outline" : "log-out-outline"} 
                    size={40} 
                    color="#fff" 
                  />
                </View>
                <Text style={styles.buttonText}>
                  {isCheckIn ? i18n.t('checkIn') : i18n.t('checkOut')}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        
        {!workDuration && (
          <Text style={styles.tapHint}>{i18n.t('tapToRecord')}</Text>
        )}
      </View>
    </View>
  );
  
  function getGreeting() {
    const hour = currentTime.getHours();
    if (hour >= 22 || hour < 5) return i18n.t('goodNight');
    if (hour < 12) return i18n.t('goodMorning');
    if (hour < 18) return i18n.t('goodAfternoon');
    return i18n.t('goodEvening');
  }
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 20,
    },
    greeting: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginBottom: 2,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      letterSpacing: -0.5,
    },
    settingsButton: {
      padding: 4,
    },
    settingsIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    timeCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    clock: {
      fontSize: 72,
      fontWeight: '200',
      color: isDark ? '#fff' : '#1a1a2e',
      letterSpacing: -2,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 8,
    },
    dayName: {
      fontSize: 15,
      color: isDark ? '#888' : '#666',
      textTransform: 'capitalize',
      fontWeight: '500',
    },
    dateDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#444' : '#ccc',
      marginHorizontal: 10,
    },
    dateText: {
      fontSize: 15,
      color: isDark ? '#888' : '#666',
    },
    buttonContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingBottom: 40,
    },
    timerContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    timerDotPulse: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22c55e',
    },
    timerLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    timerText: {
      fontSize: 42,
      fontWeight: '300',
      color: isDark ? '#fff' : '#1a1a2e',
      fontVariant: ['tabular-nums'],
      letterSpacing: 2,
    },
    checkInTime: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
      marginTop: 4,
    },
    mainButton: {
      width: 180,
      height: 180,
      borderRadius: 90,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
    },
    buttonInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkInButton: {
      backgroundColor: '#22c55e',
    },
    checkOutButton: {
      backgroundColor: '#f97316',
    },
    buttonIconContainer: {
      marginBottom: 8,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 1,
    },
    tapHint: {
      marginTop: 16,
      fontSize: 13,
      color: isDark ? '#555' : '#999',
    },
  });
