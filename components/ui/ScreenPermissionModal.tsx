import AppBottomModal from '@/components/ui/AppBottomModal';
import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { ScreenPermissionEvaluation } from '@/services/screenPermissions';
import { StyleSheet, View } from 'react-native';

type Props = {
  visible: boolean;
  screenTitle: string;
  evaluations: ScreenPermissionEvaluation[];
  showTechnicalDetails?: boolean;
  onClose: () => void;
};

export default function ScreenPermissionModal({
  visible,
  screenTitle,
  evaluations,
  showTechnicalDetails = false,
  onClose,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <AppBottomModal
      visible={visible}
      title="Permisos de esta pantalla"
      onClose={onClose}
      cancelTitle="Cerrar"
      maxHeight="88%"
    >
      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="caption" color={theme.colors.mutedText} bold>
            Pantalla
          </AppText>
          <AppText variant="subtitle" bold>
            {screenTitle}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Este resumen explica que acciones puede realizar tu usuario aqui.
          </AppText>
        </View>

        <AppCard variant="subtle" style={styles.sectionCard}>
          <AppText variant="subtitle" bold>
            Acciones y permisos
          </AppText>
          <View style={styles.list}>
            {evaluations.map((item) => (
              <View
                key={item.key}
                style={[styles.permissionRow, { borderBottomColor: theme.colors.border }]}
              >
                <View style={styles.rowStatus}>
                  <StatusBadge
                    label={item.allowed ? 'Permitido' : 'Bloqueado'}
                    tone={item.allowed ? 'success' : 'warning'}
                  />
                </View>
                <View style={styles.permissionText}>
                  <AppText bold>{item.label}</AppText>
                  <AppText variant="caption" color={theme.colors.mutedText}>
                    {item.userMessage}
                  </AppText>
                  {showTechnicalDetails ? (
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      Permiso requerido: {item.permissionCode}
                    </AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </AppCard>
      </View>
    </AppBottomModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  heading: {
    gap: 3,
  },
  list: {
    gap: 10,
    marginTop: 12,
  },
  permissionRow: {
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 10,
  },
  permissionText: {
    flex: 1,
    minWidth: 0,
  },
  rowStatus: {
    minWidth: 92,
  },
  sectionCard: {
    marginBottom: 0,
  },
});
