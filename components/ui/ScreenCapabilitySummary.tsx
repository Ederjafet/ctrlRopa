import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { ScreenPermissionEvaluation } from '@/services/screenPermissions';
import { StyleSheet, View } from 'react-native';

type Props = {
  title?: string;
  evaluations: ScreenPermissionEvaluation[];
  showDiagnostics?: boolean;
  diagnosticsExpanded?: boolean;
  onToggleDiagnostics?: () => void;
};

export default function ScreenCapabilitySummary({
  title = 'Tu acceso en esta pantalla',
  evaluations,
  showDiagnostics = false,
  diagnosticsExpanded = false,
  onToggleDiagnostics,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <AppCard variant="subtle" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <AppText variant="subtitle" bold>
            {title}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Las acciones visibles dependen de permisos activos en tu usuario.
          </AppText>
        </View>
        {showDiagnostics && onToggleDiagnostics ? (
          <AppButton
            title={diagnosticsExpanded ? 'Ocultar diagnostico' : 'Ver diagnostico'}
            variant="secondary"
            onPress={onToggleDiagnostics}
            style={styles.diagnosticsButton}
          />
        ) : null}
      </View>

      <View style={styles.capabilityList}>
        {evaluations.map((item) => (
          <View key={item.key} style={styles.capabilityRow}>
            <StatusBadge label={item.allowed ? 'Puede' : 'No puede'} tone={item.allowed ? 'success' : 'warning'} />
            <View style={styles.capabilityText}>
              <AppText bold>{item.label}</AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {item.userMessage}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {showDiagnostics && diagnosticsExpanded ? (
        <View style={[styles.diagnosticsPanel, { borderTopColor: theme.colors.border }]}>
          {evaluations.map((item) => (
            <View key={item.key} style={styles.diagnosticRow}>
              <View style={styles.diagnosticAction}>
                <AppText bold>{item.label}</AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  {item.technicalMessage}
                </AppText>
              </View>
              <StatusBadge
                label={item.permissionCode}
                tone={item.allowed ? 'info' : 'warning'}
                style={styles.permissionBadge}
              />
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  capabilityList: {
    gap: 10,
  },
  capabilityRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  capabilityText: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginBottom: 12,
  },
  diagnosticAction: {
    flex: 1,
    minWidth: 0,
  },
  diagnosticRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  diagnosticsButton: {
    minHeight: 32,
  },
  diagnosticsPanel: {
    borderTopWidth: 1,
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  permissionBadge: {
    maxWidth: 220,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
