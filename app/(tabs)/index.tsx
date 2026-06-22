import { HomeBannerAd } from '@/components/HomeBannerAd';
import { ProLottieButton } from '@/components/ProLottieButton';
import SnakeGame from '@/components/SnakeGame';
import SudokuGame from '@/components/SudokuGame';
import TetrisGame from '@/components/TetrisGame';
import { HOME_BANNER_HEIGHT, TAB_BAR_BASE_HEIGHT } from '@/config/ads';
import { useAdsFlow } from '@/context/AdsFlowContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePurchases } from '@/context/PurchasesContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { syncToFirebase } from '@/services/firebase-sync';
import { hasSeenNicknamePrompt, markNicknamePromptSeen, setGameNickname, syncNicknameFromFirestore } from '@/services/game-nickname';
import {
    requestNotificationPermissions,
    rescheduleRemindersAfterBreak,
    setupNotificationChannel,
    showCheckInNotification,
    showCheckOutNotification,
} from '@/services/notifications';
import { addRecord, getBreakDuration as getBreakDurationFromStorage, getLastBreakRecord, getLastRecord, getTodayBreakRecords, getTodayWorkRecords, setBreakDuration } from '@/services/storage';
import { sendEntryTimeToWear } from '@/services/wearable-sync';
import { WorkRecord } from '@/types';
import { displayDate, formatDate, formatTime, generateId, getDayName } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isPro } = usePurchases();
  const { shouldShowAds } = useAdsFlow();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { forceUpdate } = useLanguage(); // Dil değişince yenile

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRecord, setLastRecord] = useState<WorkRecord | null>(null);
  const [lastBreakRecord, setLastBreakRecord] = useState<WorkRecord | null>(null);
  const [todayBreakRecords, setTodayBreakRecords] = useState<WorkRecord[]>([]);
  const [todayWorkRecords, setTodayWorkRecords] = useState<WorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [gameVisible, setGameVisible] = useState(false);
  const [snakeVisible, setSnakeVisible] = useState(false);
  const [gameSelectVisible, setGameSelectVisible] = useState(false);
  const [tetrisVisible, setTetrisVisible] = useState(false);
  const [nicknamePromptVisible, setNicknamePromptVisible] = useState(false);
  const [pendingNickname, setPendingNickname] = useState('');



  // Nickname sync on login
  useEffect(() => {
    syncNicknameFromFirestore();
  }, [user]);

  // Oyun butonuna basınca — ilk kez ise takma ad sor
  const handleOpenGames = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const seen = await hasSeenNicknamePrompt();
    if (!seen) {
      setNicknamePromptVisible(true);
    } else {
      setGameSelectVisible(true);
    }
  };

  // Throttle için zaman kilidi
  const lastActionTime = useRef(0);

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
    const lastBreak = await getLastBreakRecord();
    setLastBreakRecord(lastBreak);
    const breakRecords = await getTodayBreakRecords();
    setTodayBreakRecords(breakRecords);
    const workRecords = await getTodayWorkRecords();
    setTodayWorkRecords(workRecords);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  // Sonraki kayıt türü
  const nextType = lastRecord?.type === 'giris' ? 'cikis' : 'giris';
  const isCheckIn = nextType === 'giris';

  // Mola durumu kontrolü
  const isOnBreak = lastBreakRecord?.type === 'molagiris';
  // Bugün giriş yapıldıysa ve henüz çıkış yapılmadıysa çalışıyor demektir
  // Son kayıt 'giris' olmalı (çıkış yapılmamış demektir)
  const isWorking = lastRecord?.type === 'giris';

  // Çalışma süresi hesapla (mola sırasında durur)
  const getWorkDuration = () => {
    if (!lastRecord || lastRecord.type !== 'giris') return null;
    if (todayWorkRecords.length === 0) return null;

    // Günün ilk girişi
    const firstGiris = todayWorkRecords.find(r => r.type === 'giris');
    if (!firstGiris) return null;

    // Toplam süre = Şimdi - İlk Giriş (aradaki yanlışlıkla çıkışlar sayılır)
    let elapsed = currentTime.getTime() - firstGiris.timestamp;

    // Tüm mola sürelerini (ilk girişten sonrakiler) çıkar
    const breaksSinceStart = todayBreakRecords.filter(
      r => r.timestamp >= firstGiris.timestamp
    );
    const sortedBreaks = [...breaksSinceStart].sort((a, b) => a.timestamp - b.timestamp);
    let totalBreakTime = 0;
    for (let i = 0; i < sortedBreaks.length; i += 2) {
      if (sortedBreaks[i].type === 'molagiris' && sortedBreaks[i + 1]?.type === 'molacikis') {
        totalBreakTime += sortedBreaks[i + 1].timestamp - sortedBreaks[i].timestamp;
      }
    }
    elapsed -= totalBreakTime;

    // Aktif mola varsa onu da çıkar
    if (isOnBreak && lastBreakRecord && lastBreakRecord.timestamp >= firstGiris.timestamp) {
      elapsed -= (currentTime.getTime() - lastBreakRecord.timestamp);
    }

    elapsed = Math.max(0, elapsed);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, total: elapsed };
  };


  const workDuration = getWorkDuration();

  // Mola süresi hesapla
  const getBreakDuration = () => {
    if (!isOnBreak || !lastBreakRecord) return null;
    const elapsed = currentTime.getTime() - lastBreakRecord.timestamp;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, total: elapsed };
  };

  const breakDuration = getBreakDuration();

  // Mola başlat
  const handleStartBreak = async () => {
    // Throttle: Hızlı tıklamaları engelle
    const throttleTime = Date.now();
    if (throttleTime - lastActionTime.current < 1000) return;
    lastActionTime.current = throttleTime;

    if (!isWorking) return;

    setIsBreakLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const record: WorkRecord = {
      id: generateId(),
      type: 'molagiris',
      timestamp: now.getTime(),
      date: formatDate(now),
      time: formatTime(now),
      synced: false,
    };

    const success = await addRecord(record);
    if (success) {
      if (user && !user.isAnonymous) {
        await syncToFirebase(record);
      }
      await loadRecords();
    }

    setIsBreakLoading(false);
  };

  // Mola bitir
  const handleEndBreak = async () => {
    // Throttle: Hızlı tıklamaları engelle
    const throttleTime = Date.now();
    if (throttleTime - lastActionTime.current < 1000) return;
    lastActionTime.current = throttleTime;

    if (!isOnBreak) return;

    setIsBreakLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const record: WorkRecord = {
      id: generateId(),
      type: 'molacikis',
      timestamp: now.getTime(),
      date: formatDate(now),
      time: formatTime(now),
      synced: false,
    };

    const success = await addRecord(record);
    if (success) {
      if (user && !user.isAnonymous) {
        await syncToFirebase(record);
      }

      // Mola süresini hesapla ve kaydet
      if (lastBreakRecord) {
        const breakDurationMinutes = Math.floor((now.getTime() - lastBreakRecord.timestamp) / (1000 * 60));
        const today = formatDate(now);
        const existingDuration = await getBreakDurationFromStorage(today);
        // Mevcut mola süresine ekle (birden fazla mola olabilir)
        const totalBreakMinutes = (existingDuration || 0) + breakDurationMinutes;
        await setBreakDuration(today, totalBreakMinutes);

        // Giriş kaydı varsa hatırlatmaları yeniden zamanla
        if (lastRecord && lastRecord.type === 'giris') {
          await rescheduleRemindersAfterBreak(
            lastRecord.timestamp,
            lastRecord.time,
            totalBreakMinutes,
          );
        }
      }

      await loadRecords();
    }

    setIsBreakLoading(false);
  };

  // Kayıt yap
  const handleRecord = async () => {
    // Throttle: Hızlı tıklamaları engelle
    const throttleTime = Date.now();
    if (throttleTime - lastActionTime.current < 1000) return;
    lastActionTime.current = throttleTime;

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
      if (user && !user.isAnonymous) {
        await syncToFirebase(record);
      }

      // Bildirim gönder (sadece telefon/saat bildirimi, popup yok)
      if (isCheckIn) {
        await showCheckInNotification(record.time, record.timestamp);
        // Wear OS'a giriş saatini gönder
        await sendEntryTimeToWear(record.time);
      } else {
        await showCheckOutNotification(record.time);
      }

      await loadRecords();
    }

    setIsLoading(false);
  };

  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenHeight < 700; // Küçük ekran kontrolü
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const showBannerSlot = shouldShowAds && !isPro;
  const bottomChromeHeight = tabBarHeight + (showBannerSlot ? HOME_BANNER_HEIGHT : 0);
  const styles = createStyles(isDark, isSmallScreen, screenHeight);

  return (
    <View key={`home-${forceUpdate}`} style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomChromeHeight }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>
          <View style={styles.headerActions}>
            <ProLottieButton />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Email Badge - Giriş yapıldıysa göster */}
        {user && (
          <View style={styles.userBadge}>
            <Ionicons name="person-circle-outline" size={14} color="#4CAF50" />
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
            {isPro && (
              <View style={styles.userProBadge}>
                <Text style={styles.userProBadgeText}>PRO</Text>
              </View>
            )}
          </View>
        )}

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
          {/* Work Timer - Giriş yapıldıysa göster (Absolute position) */}
          {workDuration && (
            <View style={styles.timerContainer}>
              <View style={styles.timerRow}>
                <View style={styles.timerBadge}>
                  <View style={styles.timerDotPulse} />
                  <Text style={styles.timerLabel}>{i18n.t('workingTime')}</Text>
                </View>
                <Text style={styles.timerText}>
                  {String(workDuration.hours).padStart(2, '0')}:
                  {String(workDuration.minutes).padStart(2, '0')}:
                  {String(workDuration.seconds).padStart(2, '0')}
                </Text>
              </View>
              <Text style={styles.checkInTime}>
                {i18n.t('entryAt')} {lastRecord?.time}
              </Text>
            </View>
          )}

          <View style={styles.buttonWrapper}>
            {isCheckIn ? (
              <View style={[styles.mainButtonGradient, styles.greenGlow]}>
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleRecord}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonInner}>
                      {isLoading ? (
                        <ActivityIndicator size="large" color="#fff" />
                      ) : (
                        <>
                          <View style={styles.buttonIconContainer}>
                            <Ionicons
                              name="log-in-outline"
                              size={isSmallScreen ? 36 : 42}
                              color="#fff"
                            />
                          </View>
                          <Text style={styles.buttonText} adjustsFontSizeToFit numberOfLines={1}>
                            {i18n.t('checkIn')}
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <View style={[styles.mainButtonGradient, styles.orangeGlow]}>
                <LinearGradient
                  colors={['#f97316', '#ea580c', '#c2410c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  <TouchableOpacity
                    style={styles.mainButton}
                    onPress={handleRecord}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <View style={styles.buttonInner}>
                      {isLoading ? (
                        <ActivityIndicator size="large" color="#fff" />
                      ) : (
                        <>
                          <View style={styles.buttonIconContainer}>
                            <Ionicons
                              name="log-out-outline"
                              size={isSmallScreen ? 36 : 42}
                              color="#fff"
                            />
                          </View>
                          <Text style={styles.buttonText} adjustsFontSizeToFit numberOfLines={1}>
                            {i18n.t('checkOut')}
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>

          {!workDuration && (
            <Text style={styles.tapHint}>{i18n.t('tapToRecord')}</Text>
          )}

          {/* Mola Bölümü - Giriş yapıldıysa göster */}
          {isWorking && (
            <View style={styles.breakContainer}>
              {isOnBreak && breakDuration ? (
                <>
                  <View style={styles.breakTimerContainer}>
                    <Text style={styles.breakTimerLabel}>{i18n.t('breakTime')}</Text>
                    <Text style={styles.breakTimerText}>
                      {String(breakDuration.hours).padStart(2, '0')}:
                      {String(breakDuration.minutes).padStart(2, '0')}:
                      {String(breakDuration.seconds).padStart(2, '0')}
                    </Text>
                  </View>

                  {/* Butonlar yan yana */}
                  <View style={styles.breakButtonsRow}>
                    {/* Oyun Butonu */}
                    <TouchableOpacity
                      style={styles.gameButtonSmall}
                      onPress={handleOpenGames}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="game-controller" size={18} color="#fff" />
                      <Text style={styles.gameButtonTextSmall} adjustsFontSizeToFit numberOfLines={1}>
                        {i18n.t('game') || 'Oyun'}
                      </Text>
                    </TouchableOpacity>

                    {/* Mola Bitir Butonu */}
                    <TouchableOpacity
                      style={styles.breakButtonSmall}
                      onPress={handleEndBreak}
                      disabled={isBreakLoading}
                      activeOpacity={0.8}
                    >
                      {isBreakLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="stop-circle" size={20} color="#fff" />
                          <Text style={styles.breakButtonTextSmall} adjustsFontSizeToFit numberOfLines={1}>
                            {i18n.t('endBreak')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.breakButton}
                  onPress={handleStartBreak}
                  disabled={isBreakLoading}
                  activeOpacity={0.8}
                >
                  {isBreakLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.breakButtonText} adjustsFontSizeToFit numberOfLines={1}>{i18n.t('startBreak')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bannerDock, { bottom: tabBarHeight }]}>
        <HomeBannerAd isDark={isDark} />
      </View>

      {/* Nickname Prompt Modal - ilk kez oyun alanına girişte */}
      <Modal
        visible={nicknamePromptVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          markNicknamePromptSeen();
          setNicknamePromptVisible(false);
          setGameSelectVisible(true);
        }}
      >
        <View style={styles.gameSelectOverlay}>
          <View style={styles.gameSelectContainer}>
            <Text style={styles.gameSelectTitle}>{i18n.t('gameNicknameTitle')}</Text>
            <Text style={{ color: isDark ? '#aaa' : '#666', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 }}>
              {i18n.t('gameNicknameHint')}
            </Text>

            <View style={{ borderWidth: 1, borderColor: isDark ? '#444' : '#ddd', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
              <TextInput
                style={{ fontSize: 16, color: isDark ? '#fff' : '#000' }}
                placeholder={i18n.t('gameNicknamePlaceholder')}
                placeholderTextColor={isDark ? '#555' : '#bbb'}
                maxLength={24}
                autoCapitalize="words"
                value={pendingNickname}
                onChangeText={setPendingNickname}
              />
            </View>

            <TouchableOpacity
              style={[styles.gameSelectCard, { backgroundColor: isDark ? '#7c3aed' : '#8b5cf6', marginBottom: 8 }]}
              onPress={async () => {
                const name = pendingNickname.trim();
                if (name) {
                  await setGameNickname(name);
                } else {
                  await markNicknamePromptSeen();
                }
                setPendingNickname('');
                setNicknamePromptVisible(false);
                setGameSelectVisible(true);
              }}
            >
              <View style={styles.gameSelectInfo}>
                <Text style={[styles.gameSelectName, { color: '#fff' }]}>
                  {pendingNickname.trim()
                    ? i18n.t('gameNicknameSaveContinue')
                    : i18n.t('gameNicknameContinueAnonymous')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sudoku Game Modal */}
      <SudokuGame visible={gameVisible} onClose={() => setGameVisible(false)} breakStartTime={isOnBreak && lastBreakRecord ? lastBreakRecord.timestamp : null} />
      {/* Snake Game Modal */}
      <SnakeGame visible={snakeVisible} onClose={() => setSnakeVisible(false)} breakStartTime={isOnBreak && lastBreakRecord ? lastBreakRecord.timestamp : null} />

      {/* Game Selection Modal */}
      <Modal visible={gameSelectVisible} animationType="fade" transparent onRequestClose={() => setGameSelectVisible(false)}>
        <View style={styles.gameSelectOverlay}>
          <View style={styles.gameSelectContainer}>
            <Text style={styles.gameSelectTitle}>{i18n.t('selectGame') || 'Oyun Seç'}</Text>

            <TouchableOpacity
              style={styles.gameSelectCard}
              onPress={() => {
                setGameSelectVisible(false);
                setGameVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.gameSelectEmoji}>🧩</Text>
              <View style={styles.gameSelectInfo}>
                <Text style={styles.gameSelectName}>Sudoku</Text>
                <Text style={styles.gameSelectDesc}>{i18n.t('sudokuDesc') || 'Sayı bulmaca oyunu'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gameSelectCard}
              onPress={() => {
                setGameSelectVisible(false);
                setSnakeVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.gameSelectEmoji}>🐍</Text>
              <View style={styles.gameSelectInfo}>
                <Text style={styles.gameSelectName}>Snake</Text>
                <Text style={styles.gameSelectDesc}>{i18n.t('snakeDesc') || 'Klasik yılan oyunu'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gameSelectCard}
              onPress={() => {
                setGameSelectVisible(false);
                setTetrisVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.gameSelectEmoji}>🧱</Text>
              <View style={styles.gameSelectInfo}>
                <Text style={styles.gameSelectName}>Block</Text>
                <Text style={styles.gameSelectDesc}>{i18n.t('tetrisDesc') || 'Klasik blok oyunu'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#666' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gameSelectClose}
              onPress={() => setGameSelectVisible(false)}
            >
              <Text style={styles.gameSelectCloseText}>{i18n.t('cancel') || 'İptal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Tetris Game Modal */}
      <TetrisGame visible={tetrisVisible} onClose={() => setTetrisVisible(false)} breakStartTime={isOnBreak && lastBreakRecord ? lastBreakRecord.timestamp : null} />
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

const createStyles = (isDark: boolean, isSmallScreen: boolean, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: isSmallScreen ? 8 : 12,
      paddingBottom: isSmallScreen ? 4 : 8,
      paddingHorizontal: 20,
    },
    headerLeft: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    greeting: {
      fontSize: isSmallScreen ? 13 : 15,
      color: isDark ? '#999' : '#888',
      fontWeight: '400',
    },
    title: {
      fontSize: isSmallScreen ? 26 : 32,
      fontWeight: '800',
      color: isDark ? '#fff' : '#1a1a2e',
      letterSpacing: -0.8,
    },
    settingsButton: {
      padding: 8,
    },
    timeCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isSmallScreen ? 8 : 10,
      paddingHorizontal: 20,
      marginHorizontal: 20,
      marginBottom: 4,
      borderRadius: 24,
      backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5',
      borderWidth: 1,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      shadowColor: isDark ? '#000' : '#1a1a2e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    clock: {
      fontSize: isSmallScreen ? 56 : 72,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      letterSpacing: -3,
      fontFamily: 'System',
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginTop: 4,
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
      color: isDark ? '#999' : '#aaa',
      fontWeight: '400',
    },
    userBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'center',
      marginBottom: 8,
      gap: 6,
      maxWidth: '80%',
    },
    userEmail: {
      fontSize: 13,
      color: '#4CAF50',
      fontWeight: '500',
      flexShrink: 1,
    },
    userProBadge: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(27, 94, 32, 0.25)',
    },
    userProBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#1B5E20',
      letterSpacing: 0.8,
    },
    buttonContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? 20 : 40,
      paddingBottom: isSmallScreen ? 8 : 16,
      position: 'relative',
    },
    bannerDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 5,
    },
    timerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingTop: 12,
      zIndex: 10,
      pointerEvents: 'none',
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timerDotPulse: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22c55e',
    },
    timerLabel: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      letterSpacing: 0.5,
    },
    timerText: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    checkInTime: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
      marginTop: 4,
    },
    buttonWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    mainButtonGradient: {
      width: isSmallScreen ? 120 : 150,
      height: isSmallScreen ? 120 : 150,
      borderRadius: isSmallScreen ? 60 : 75,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gradientInner: {
      width: isSmallScreen ? 120 : 150,
      height: isSmallScreen ? 120 : 150,
      borderRadius: isSmallScreen ? 60 : 75,
      justifyContent: 'center',
      alignItems: 'center',
    },
    greenGlow: {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 15,
    },
    orangeGlow: {
      shadowColor: '#f97316',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 15,
    },
    mainButton: {
      width: isSmallScreen ? 120 : 150,
      height: isSmallScreen ? 120 : 150,
      borderRadius: isSmallScreen ? 60 : 75,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonInner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonIconContainer: {
      marginBottom: isSmallScreen ? 6 : 10,
    },
    buttonText: {
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    tapHint: {
      marginTop: 20,
      fontSize: 13,
      color: isDark ? '#888' : '#aaa',
      fontWeight: '300',
      letterSpacing: 0.3,
    },
    breakContainer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 16,
    },
    breakTimerContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    breakTimerLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#888' : '#666',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    breakTimerText: {
      fontSize: isSmallScreen ? 20 : 24,
      fontWeight: '300',
      color: isDark ? '#fff' : '#1a1a2e',
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    breakButton: {
      backgroundColor: isDark ? '#3b82f6' : '#2563eb',
      paddingHorizontal: isSmallScreen ? 24 : 32,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderRadius: isSmallScreen ? 20 : 24,
      minWidth: isSmallScreen ? 140 : 160,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    breakButtonsRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      justifyContent: 'center',
    },
    gameButtonSmall: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: isDark ? '#8b5cf6' : '#7c3aed',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderRadius: isSmallScreen ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#8b5cf6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    gameButtonTextSmall: {
      fontSize: isSmallScreen ? 12 : 13,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    gameButtonSnake: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: isDark ? '#22c55e' : '#16a34a',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderRadius: isSmallScreen ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    breakButtonSmall: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: isDark ? '#3b82f6' : '#2563eb',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderRadius: isSmallScreen ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    breakButtonFull: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#3b82f6' : '#2563eb',
      paddingHorizontal: isSmallScreen ? 24 : 32,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderRadius: isSmallScreen ? 20 : 24,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      gap: 8,
      marginTop: 10,
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    breakButtonTextSmall: {
      fontSize: isSmallScreen ? 12 : 13,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    breakButtonText: {
      fontSize: isSmallScreen ? 13 : 14,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    // Game Selection Modal
    gameSelectOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    gameSelectContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    gameSelectTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      textAlign: 'center',
      marginBottom: 20,
    },
    gameSelectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    gameSelectEmoji: {
      fontSize: 36,
      marginRight: 14,
    },
    gameSelectInfo: {
      flex: 1,
    },
    gameSelectName: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    gameSelectDesc: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginTop: 2,
    },
    gameSelectClose: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    gameSelectCloseText: {
      fontSize: 16,
      color: isDark ? '#888' : '#999',
      fontWeight: '500',
    },
  });
