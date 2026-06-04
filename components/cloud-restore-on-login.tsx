import { useModal } from '@/components/custom-modal';
import { SyncProgressModal, SyncProgressState } from '@/components/sync-progress-modal';
import { useAuth } from '@/context/AuthContext';
import i18n from '@/i18n';
import { cloudHasWorkBackup, loadFromFirebase, loadStandardsFromFirebase } from '@/services/firebase-sync';
import { hasLocalWorkRecords } from '@/services/storage';
import { User } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';

const isRealUser = (user: User | null): user is User =>
  user !== null && !user.isAnonymous;

/** Yalnızca anonim → hesaplı giriş veya hesap değişimi (uygulama açılışında değil) */
const didJustSignIn = (prev: User | null, next: User | null): boolean => {
  if (!isRealUser(next)) return false;
  if (!prev) return false;
  if (prev.isAnonymous) return true;
  return !prev.isAnonymous && prev.uid !== next.uid;
};

export function CloudRestoreOnLoginPrompt() {
  const { user, isLoading } = useAuth();
  const { showModal, showInfo, ModalComponent } = useModal();
  const prevUserRef = useRef<User | null>(null);
  const checkingRef = useRef(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgressState & { title: string }>({
    visible: false,
    current: 0,
    total: 0,
    title: '',
  });

  useEffect(() => {
    if (isLoading) return;

    const prev = prevUserRef.current;
    prevUserRef.current = user;

    if (!didJustSignIn(prev, user)) return;

    const run = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const [localHasData, cloudHasData] = await Promise.all([
          hasLocalWorkRecords(),
          cloudHasWorkBackup(),
        ]);

        if (localHasData || !cloudHasData) return;

        showModal({
          title: i18n.t('cloudRestorePromptTitle'),
          message: i18n.t('cloudRestorePromptMessage'),
          icon: '☁️',
          buttons: [
            { text: i18n.t('cloudRestoreNo'), style: 'cancel' },
            {
              text: i18n.t('cloudRestoreYes'),
              style: 'default',
              onPress: () => {
                void performRestore();
              },
            },
          ],
        });
      } finally {
        checkingRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      void run();
    }, 400);

    return () => clearTimeout(timer);
  }, [user, isLoading, showModal]);

  const performRestore = async () => {
    setSyncProgress({
      visible: true,
      current: 0,
      total: 0,
      title: i18n.t('restoreInProgress'),
    });
    try {
      const result = await loadFromFirebase({ replaceLocal: true }, (current, total) => {
        setSyncProgress({
          visible: true,
          current,
          total,
          title: i18n.t('restoreInProgress'),
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

      const standardsLoaded = await loadStandardsFromFirebase();

      showInfo(
        i18n.t('info'),
        result.loaded > 0 || standardsLoaded
          ? `${result.loaded} ${i18n.t('recordsLoaded')}${standardsLoaded ? ` & ${i18n.t('settingsRestored')}` : ''}`
          : i18n.t('noNewRecords')
      );
    } finally {
      setSyncProgress((p) => ({ ...p, visible: false }));
    }
  };

  return (
    <>
      <SyncProgressModal
        visible={syncProgress.visible}
        title={syncProgress.title}
        current={syncProgress.current}
        total={syncProgress.total}
      />
      <ModalComponent />
    </>
  );
}
