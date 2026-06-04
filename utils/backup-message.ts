import i18n from '@/i18n';
import type { SyncAllRecordsResult, SyncStandardsResult } from '@/services/firebase-sync';

const fill = (text: string, count: number) => text.replace(/\{\{count\}\}/g, String(count));

export const formatRecordsBackupMessage = (result: SyncAllRecordsResult): string => {
  if (result.nothingToSync) {
    return i18n.t('cloudBackupNoNewDays');
  }

  if (result.success > 0 && result.failed > 0) {
    return `${fill(i18n.t('cloudBackupNewDays'), result.success)}\n${fill(i18n.t('cloudBackupDaysFailed'), result.failed)}`;
  }
  if (result.success > 0) {
    return fill(i18n.t('cloudBackupNewDays'), result.success);
  }
  if (result.failed > 0) {
    return fill(i18n.t('cloudBackupDaysFailed'), result.failed);
  }
  return i18n.t('noRecordsToSync');
};

export const formatSettingsSyncNote = (result: SyncStandardsResult): string => {
  if (!result.ok) {
    if (result.errorCode === 'permission-denied') return i18n.t('settingsSyncPermissionDenied');
    if (result.errorCode === 'verify-failed') return i18n.t('settingsSyncVerifyFailed');
    if (result.errorCode === 'not-logged-in') return i18n.t('loginToSync');
    return i18n.t('settingsSyncFailed');
  }
  if (result.skipped) {
    return i18n.t('settingsSyncUnchanged');
  }
  return i18n.t('settingsSyncOk');
};

export const formatBackupCompleteMessage = (
  records: SyncAllRecordsResult,
  standards: SyncStandardsResult
): { title: string; message: string; isWarning: boolean } => {
  const recordsPart = formatRecordsBackupMessage(records);
  const settingsPart = formatSettingsSyncNote(standards);

  const allUpToDate = records.nothingToSync && standards.ok && standards.skipped;
  const title = allUpToDate || records.nothingToSync
    ? i18n.t('cloudBackupUpToDateTitle')
    : i18n.t('syncComplete');

  const message =
    records.nothingToSync && standards.ok && standards.skipped
      ? settingsPart
      : `${recordsPart}\n\n${settingsPart}`;

  return {
    title,
    message,
    isWarning: records.failed > 0 || !standards.ok,
  };
};
