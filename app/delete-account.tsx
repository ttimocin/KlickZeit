import { useModal } from '@/components/custom-modal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import i18n from '@/i18n';
import { deleteUserData } from '@/services/data-deletion';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeleteAccountScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { forceUpdate } = useLanguage();
  const { user, logout } = useAuth();
  const { showModal, ModalComponent } = useModal();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const requiredText = 'DELETE';

  const handleDeleteAccount = async () => {
    if (confirmationText !== requiredText) {
      showModal({
        title: i18n.t('error'),
        message: i18n.t('deleteAccountConfirmationError'),
        icon: '⚠️',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    showModal({
      title: i18n.t('deleteAccount'),
      message: i18n.t('deleteAccountFinalWarning'),
      icon: '🗑️',
      buttons: [
        { text: i18n.t('cancel'), style: 'cancel' },
        {
          text: i18n.t('deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteUserData();
            setIsDeleting(false);

            if (result.success) {
              showModal({
                title: i18n.t('accountDeleted'),
                message: i18n.t('accountDeletedMessage'),
                icon: '✅',
                buttons: [
                  {
                    text: 'OK',
                    style: 'default',
                    onPress: async () => {
                      await logout();
                      router.replace('/(tabs)');
                    },
                  },
                ],
              });
            } else {
              showModal({
                title: i18n.t('error'),
                message: result.error || i18n.t('deleteAccountError'),
                icon: '❌',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const styles = createStyles(isDark);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{i18n.t('deleteAccount')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <Text style={styles.loginRequired}>{i18n.t('loginRequired')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View key={`delete-account-${forceUpdate}`} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{i18n.t('deleteAccount')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={48} color="#FF5252" />
          <Text style={styles.warningTitle}>{i18n.t('deleteAccountWarning')}</Text>
          <Text style={styles.warningText}>{i18n.t('deleteAccountWarningText')}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{i18n.t('whatWillBeDeleted')}</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#888' : '#666'} />
            <Text style={styles.infoText}>{i18n.t('allWorkRecords')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#888' : '#666'} />
            <Text style={styles.infoText}>{i18n.t('cloudBackupData')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#888' : '#666'} />
            <Text style={styles.infoText}>{i18n.t('localStorageData')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#888' : '#666'} />
            <Text style={styles.infoText}>{i18n.t('userAccount')}</Text>
          </View>
        </View>

        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationLabel}>
            {i18n.t('typeToConfirm')}: <Text style={styles.confirmationRequired}>{requiredText}</Text>
          </Text>
          <TextInput
            style={styles.confirmationInput}
            value={confirmationText}
            onChangeText={setConfirmationText}
            placeholder={requiredText}
            placeholderTextColor={isDark ? '#666' : '#999'}
            autoCapitalize="characters"
            editable={!isDeleting}
          />
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting || confirmationText !== requiredText}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>{i18n.t('deleteAccount')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalComponent />
    </View>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    loginRequired: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      marginTop: 40,
    },
    warningBox: {
      backgroundColor: isDark ? '#2a1a1a' : '#fff3cd',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#FF5252',
    },
    warningTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FF5252',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    warningText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#856404',
      textAlign: 'center',
      lineHeight: 20,
    },
    infoBox: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
      marginBottom: 16,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginLeft: 12,
      flex: 1,
    },
    confirmationBox: {
      marginBottom: 24,
    },
    confirmationLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#fff' : '#333',
      marginBottom: 8,
    },
    confirmationRequired: {
      fontWeight: '700',
      color: '#FF5252',
    },
    confirmationInput: {
      backgroundColor: isDark ? '#1e1e1e' : '#fff',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#333',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    deleteButton: {
      backgroundColor: '#FF5252',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    deleteButtonDisabled: {
      opacity: 0.5,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: isDark ? '#888' : '#666',
      fontSize: 16,
    },
  });

