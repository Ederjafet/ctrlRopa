import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppScreen from '@/components/ui/AppScreen';
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
      Alert.alert('Sesiónes y bloqueos', err?.message || 'No se pudo cargar la información.');
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
      Alert.alert('No se pudo desbloquear', err?.message || 'Intenta de nuevo.');
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
      Alert.alert('No se pudieron revocar sesiónes', err?.message || 'Intenta de nuevo.');
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
      Alert.alert('No se pudo cerrar la sesión', err?.message || 'Intenta de nuevo.');
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
      Alert.alert('No se pudieron cerrar las sesiónes', err?.message || 'Intenta de nuevo.');
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/system" />

      <AppText variant="title" bold>
        Sesiónes y bloqueos
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Estado de seguridad
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Vista de soporte para desbloquear usuarios y cerrar sesiónes activas.
        </AppText>
      </AppCard>

      <AppButton
        title={loading ? 'Actualizando...' : 'Actualizar'}
        onPress={loadState}
        loading={loading}
        disabled={loading}
      />

      <AppButton
        title="Cerrar todas las sesiónes"
        variant="danger"
        onPress={revokeAllSessions}
        loading={workingUserId === 0}
        disabled={loading || workingUserId !== null || sessions.length === 0}
      />

      <AppCard>
        <AppText variant="subtitle" bold>
          Usuarios con actividad de login ({users.length})
        </AppText>

        {loading ? (
          <ActivityIndicator />
        ) : users.length === 0 ? (
          <AppText color={theme.colors.mutedText}>No hay bloqueos ni intentos recientes.</AppText>
        ) : (
          users.map((line) => (
            <View key={line.userId} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowText}>
                  <AppText bold>{line.userName}</AppText>
                  <AppText color={theme.colors.mutedText}>{line.email}</AppText>
                </View>
                <AppText bold color={isLocked(line) ? theme.colors.danger : theme.colors.mutedText}>
                  {isLocked(line) ? 'Bloqueado' : `${line.failedLoginAttempts} fallos`}
                </AppText>
              </View>

              <AppText color={theme.colors.mutedText}>Sucursal: {line.branchName || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>Bloqueado hasta: {formatDate(line.lockedUntil)}</AppText>
              <AppText color={theme.colors.mutedText}>Ultimo fallo: {formatDate(line.lastFailedLoginAt)}</AppText>
              <AppText color={theme.colors.mutedText}>Ultimo acceso: {formatDate(line.lastSuccessLoginAt)}</AppText>
              <AppText color={theme.colors.mutedText}>IP ultimo acceso: {line.lastLoginIp || '-'}</AppText>

              <View style={styles.inlineActions}>
                <AppButton
                  title="Desbloquear"
                  variant="secondary"
                  onPress={() => unlockUser(line.userId)}
                  loading={workingUserId === line.userId}
                  disabled={workingUserId !== null}
                  style={styles.smallAction}
                />
                <AppButton
                  title="Cerrar sesiónes"
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
          Sesiónes activas ({sessions.length})
        </AppText>

        {loading ? (
          <ActivityIndicator />
        ) : sessions.length === 0 ? (
          <AppText color={theme.colors.mutedText}>No hay sesiónes activas.</AppText>
        ) : (
          sessions.map((line) => (
            <View key={line.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.rowHeader}>
                <View style={styles.rowText}>
                  <AppText bold>{line.userName}</AppText>
                  <AppText color={theme.colors.mutedText}>{line.email}</AppText>
                </View>
                <AppButton
                  title="Cerrar"
                  variant="danger"
                  onPress={() => revokeSession(line.id)}
                  loading={workingUserId === line.id * -1}
                  disabled={workingUserId !== null}
                  style={styles.closeAction}
                />
              </View>
              <AppText color={theme.colors.mutedText}>Sucursal: {line.branchName || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>Ultima actividad: {formatDate(line.lastSeenAt)}</AppText>
              <AppText color={theme.colors.mutedText}>Expira: {formatDate(line.expiresAt)}</AppText>
              <AppText color={theme.colors.mutedText}>Expira maximo: {formatDate(line.absoluteExpiresAt)}</AppText>
              <AppText color={theme.colors.mutedText}>IP: {line.ipAddress || '-'}</AppText>
              <AppText color={theme.colors.mutedText}>Dispositivo: {line.userAgent || '-'}</AppText>
            </View>
          ))
        )}
      </AppCard>
    </AppScreen>
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
