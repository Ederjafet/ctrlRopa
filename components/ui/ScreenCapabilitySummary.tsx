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
  showPermissionButton?: boolean;
  permissionButtonTitle?: string;
  onOpenPermissions?: () => void;
};

export default function ScreenCapabilitySummary({
  title = 'Capacidades',
  evaluations,
  showPermissionButton = false,
  permissionButtonTitle = 'Ver permisos',
  onOpenPermissions,
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
        {showPermissionButton && onOpenPermissions ? (
          <AppButton
            title={permissionButtonTitle}
            variant="secondary"
            onPress={onOpenPermissions}
            style={styles.permissionButton}
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
  permissionButton: {
    minHeight: 32,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
