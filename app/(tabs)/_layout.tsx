import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';

export default function TabLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { forceUpdate, language } = useLanguage();
  
  // Her render'da yeniden hesaplanacak
  const tabRecordLabel = i18n.t('tabRecord');
  const tabHistoryLabel = i18n.t('tabHistory');

  return (
    <Tabs
      key={`tabs-${language}-${forceUpdate}`}
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          backgroundColor: isDark ? '#1e1e1e' : '#fff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: tabRecordLabel,
          tabBarLabel: tabRecordLabel,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: tabHistoryLabel,
          tabBarLabel: tabHistoryLabel,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet.rectangle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
