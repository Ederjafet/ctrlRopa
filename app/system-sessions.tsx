import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  ApiSessionLine,
  getSecuritySessions,
  revokeAllSecuritySessions,
  revokeSecuritySession,
  revokeSecurityUserSessions,
  unlockSecurityUser,
  UserLoginSecurityLine,
} from '@/services/securitySessionsService';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function isLocked(line: UserLoginSecurityLine) {
  return line.lockedUntil ? new Date(line.lockedUntil).getTime() > Date.now() : false;
}

export default function SystemSessionsScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<UserLoginSecurityLine[]>([]);
  const [sessions, setSessions] = useState<ApiSessionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingUserId, setWorkingUserId] = useState<number | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    setLoading(true);

    try {
      const data = await getSecuritySessions();
      setUsers(data.users ?? []);
      setSessions(data.sessions ?? []);
    } catch (err: any) {
      Alert.alert(t('securitySessions.loadErrorTitle'), err?.message || t('securitySessions.loadErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const unlockUser = async (userId: number) => {
    setWorkingUserId(userId);

    try {
      await unlockSecurityUser(userId);
      await loadState();
    } catch (err: any) {
      Alert.alert(t('securitySessions.unlockErrorTitle'), err?.message || t('securitySessions.actionErrorMessage'));
    } finally {
      setWorkingUserId(null);
    }
  };

  const revokeSessions = async (userId: number) => {
    setWorkingUserId(userId);

    try {
      await revokeSecurityUserSessions(userId);
      await loadState();
    } catch (err: any) {
      Alert.alert(t('securitySessions.revokeUserErrorTitle'), err?.message || t('securitySessions.actionErrorMessage'));
    } finally {
      setWorkingUserId(null);
    }
  };

  const revokeSession = async (sessionId: number) => {
    setWorkingUserId(sessionId * -1);

    try {
      await revokeSecuritySession(sessionId);
      await loadState();
    } catch (err: any) {
      Alert.alert(t('securitySessions.revokeSessionErrorTitle'), err?.message || t('securitySessions.actionErrorMessage'));
    } finally {
      setWorkingUserId(null);
    }
  };

  const revokeAllSessions = async () => {
    setWorkingUserId(0);

    try {
      await revokeAllSecuritySessions();
      await loadState();
    } catch (err: any) {
      Alert.alert(t('securitySessions.revokeAllErrorTitle'), err?.message || t('securitySessions.actionErrorMessage'));
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <AppShellPage
      title={t('securitySessions.title')}
      subtitle={t('securitySessions.subtitle')}
      activeRoute="system-sessions"
    >

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('securitySessions.statusTitle')}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {t('securitySessions.statusHelp')}
        </AppText>
      </AppCard>

      <AppButton
        title={t('securitySessions.closeAll')}
        variant="danger"
        onPress={revokeAllSessions}
        loading={workingUserId === 0}
        disabled={loading || workingUserId !== null || sessions.length === 0}
      />

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('securitySessions.usersWithLoginActivity', { count: users.length })}
        </AppText>

        {loading ? (
          <ActivityIndicator />
        ) : users.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('securitySessions.noLoginActivity')}</AppText>
        ) : (
          users.map((line) => (
            <View key={line.userId} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowText}>
                  <AppText bold>{line.userName}</AppText>
                  <AppText color={theme.colors.mutedText}>{line.email}</AppText>
                </View>
                <AppText bold color={isLocked(line) ? theme.colors.danger : theme.colors.mutedText}>
                  {isLocked(line)
                    ? t('securitySessions.locked')
                    : t('securitySessions.failedAttempts', { count: line.failedLoginAttempts })}
                </AppText>
              </View>

              <AppText color={theme.colors.mutedText}>{t('securitySessions.branch')}: {line.branchName || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.lockedUntil')}: {formatDate(line.lockedUntil)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.lastFailed')}: {formatDate(line.lastFailedLoginAt)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.lastSuccess')}: {formatDate(line.lastSuccessLoginAt)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.lastLoginIp')}: {line.lastLoginIp || '-'}</AppText>

              <View style={styles.inlineActions}>
                <AppButton
                  title={t('securitySessions.unlock')}
                  variant="secondary"
                  onPress={() => unlockUser(line.userId)}
                  loading={workingUserId === line.userId}
                  disabled={workingUserId !== null}
                  style={styles.smallAction}
                />
                <AppButton
                  title={t('securitySessions.closeSessions')}
                  variant="danger"
                  onPress={() => revokeSessions(line.userId)}
                  disabled={workingUserId !== null}
                  style={styles.smallAction}
                />
              </View>
            </View>
          ))
        )}
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('securitySessions.activeSessions', { count: sessions.length })}
        </AppText>

        {loading ? (
          <ActivityIndicator />
        ) : sessions.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('securitySessions.noActiveSessions')}</AppText>
        ) : (
          sessions.map((line) => (
            <View key={line.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowText}>
                  <AppText bold>{line.userName}</AppText>
                  <AppText color={theme.colors.mutedText}>{line.email}</AppText>
                </View>
                <AppButton
                  title={t('securitySessions.close')}
                  variant="danger"
                  onPress={() => revokeSession(line.id)}
                  loading={workingUserId === line.id * -1}
                  disabled={workingUserId !== null}
                  style={styles.closeAction}
                />
              </View>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.branch')}: {line.branchName || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.lastActivity')}: {formatDate(line.lastSeenAt)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.expires')}: {formatDate(line.expiresAt)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.absoluteExpires')}: {formatDate(line.absoluteExpiresAt)}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.ip')}: {line.ipAddress || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>{t('securitySessions.device')}: {line.userAgent || '-'}</AppText>
            </View>
          ))
        )}
      </AppCard>
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  closeAction: {
    minWidth: 96,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  row: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  rowHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  smallAction: {
    flex: 1,
  },
});
