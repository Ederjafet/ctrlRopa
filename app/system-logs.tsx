import AppBackButton from '@/components/ui/AppBackButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { getSystemLogs, SystemLogLine } from '@/services/systemLogService';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

const EVENT_LABELS: Record<string, string> = {
  SYSTEM_USERS_CREATE: 'Usuario creado',
  SYSTEM_USERS_UPDATE: 'Usuario actualizado',
  SYSTEM_BRANCHES_CREATE: 'Sucursal creada',
  SYSTEM_BRANCHES_UPDATE: 'Sucursal actualizada',
  SYSTEM_SALES_CHANNELS_UPDATE: 'Canal actualizado',
  SYSTEM_APPEARANCE_UPDATE: 'Apariencia actualizada',
  SYSTEM_ROLES_CREATE: 'Rol creado',
  SYSTEM_ROLES_UPDATE: 'Rol actualizado',
};

function normalize(value?: string | number | null) {
  return String(value ?? '').toLowerCase().trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function getLogLabel(line: SystemLogLine) {
  return EVENT_LABELS[line.eventType] ?? line.eventType ?? 'Movimiento de sistema';
}

function getStatusColor(line: SystemLogLine, theme: ReturnType<typeof useAppTheme>['theme']) {
  const status = Number(line.statusCode ?? 0);

  if (status >= 500) return theme.colors.danger;
  if (status >= 400) return theme.colors.warning;
  if (status >= 200) return theme.colors.accent;

  return theme.colors.mutedText;
}

function LogRow({ line }: { line: SystemLogLine }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.logRow, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.logHeader}>
        <View style={styles.logTitle}>
          <AppText bold>{getLogLabel(line)}</AppText>
          <AppText color={theme.colors.mutedText}>
            {line.httpMethod} {line.requestPath}
          </AppText>
        </View>
        <AppText bold color={getStatusColor(line, theme)}>
          HTTP {line.statusCode ?? '-'}
        </AppText>
      </View>

      <View style={styles.meta}>
        <AppText color={theme.colors.mutedText}>
          Sucursal: {line.branchName || 'Sin sucursal'}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Usuario: {line.userName || (line.userId ? `Usuario ${line.userId}` : 'Sin usuario')}
        </AppText>
        {line.detail ? (
          <AppText color={theme.colors.mutedText}>Detalle: {line.detail}</AppText>
        ) : null}
        <AppText variant="caption" color={theme.colors.mutedText}>
          {formatDateTime(line.createdAt)}
        </AppText>
      </View>
    </View>
  );
}

export default function SystemLogsScreen() {
  const { theme } = useAppTheme();
  const [lines, setLines] = useState<SystemLogLine[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);

    try {
      const data = await getSystemLogs(150);
      setLines(data.lines ?? []);
    } catch (err: any) {
      Alert.alert('Logs de soporte', err?.message || 'No se pudieron cargar los logs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    const term = normalize(search);

    if (!term) return lines;

    return lines.filter((line) =>
      [
        line.eventType,
        getLogLabel(line),
        line.httpMethod,
        line.requestPath,
        line.statusCode,
        line.branchName,
        line.userName,
        line.detail,
      ]
        .map((value) => normalize(value))
        .join(' ')
        .includes(term)
    );
  }, [lines, search]);

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/system" />

      <AppText variant="title" bold>
        Logs de soporte
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Bitacora tecnica
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Vista para soporte. Sirve para rastrear cambios de configuración, usuario,
          sucursal, catálogos y respuestas HTTP recientes.
        </AppText>
      </AppCard>

      <AppInput
        label="Buscar"
        placeholder="Usuario, ruta, sucursal, evento o HTTP"
        value={search}
        onChangeText={setSearch}
      />

      <AppCard>
        <AppText variant="subtitle" bold>
          Eventos ({filteredLines.length})
        </AppText>

        {loading ? (
          <ActivityIndicator />
        ) : filteredLines.length === 0 ? (
          <AppText color={theme.colors.mutedText}>No hay eventos para mostrar.</AppText>
        ) : (
          filteredLines.map((line) => <LogRow key={line.id} line={line} />)
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  logHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  logRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  logTitle: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    gap: 3,
    marginTop: 8,
  },
});
