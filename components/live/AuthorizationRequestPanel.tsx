import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  actionLabel: string;
  requiredCapability: string;
  reason: string;
  entityContext?: string;
  onRequestAuthorization: () => void;
  requestLabel: string;
  pendingBackendLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function AuthorizationRequestPanel({
  actionLabel,
  requiredCapability,
  reason,
  entityContext,
  onRequestAuthorization,
  requestLabel,
  pendingBackendLabel,
  style,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.colors.infoCardBackground,
          borderColor: theme.colors.infoCardBorder,
          borderRadius: theme.radius.md,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <AppText bold>{actionLabel}</AppText>
        <StatusBadge label={requiredCapability} tone="warning" />
      </View>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {reason}
      </AppText>
      {entityContext ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          {entityContext}
        </AppText>
      ) : null}
      {pendingBackendLabel ? (
        <AppText variant="caption" color={theme.colors.warning}>
          {pendingBackendLabel}
        </AppText>
      ) : null}
      <AppButton
        title={requestLabel}
        variant="secondary"
        onPress={onRequestAuthorization}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
    justifyContent: 'space-between',
  },
  panel: {
    borderWidth: 1,
    gap: designTokens.spacing.sm,
    padding: designTokens.spacing.md,
  },
});
