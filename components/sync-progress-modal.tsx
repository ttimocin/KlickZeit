import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type SyncProgressState = {
  visible: boolean;
  current: number;
  total: number;
};

type SyncProgressModalProps = SyncProgressState & {
  title: string;
};

export function SyncProgressModal({
  visible,
  title,
  current,
  total,
}: SyncProgressModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.title, isDark && styles.textDark]}>{title}</Text>
          <View style={[styles.track, isDark && styles.trackDark]}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <Text style={[styles.percent, isDark && styles.textDark]}>
            {total > 0 ? `%${percent}` : i18n.t('backupPreparing')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  cardDark: {
    backgroundColor: '#1e1e1e',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  textDark: {
    color: '#f5f5f5',
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  trackDark: {
    backgroundColor: '#333',
  },
  fill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  percent: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
});
