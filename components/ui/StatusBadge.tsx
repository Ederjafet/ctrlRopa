import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { StyleSheet, View, ViewStyle } from 'react-native';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'role' | 'live' | 'reserved';

type Props = {
  label: string;
  tone?: StatusTone;
  style?: ViewStyle;
};

export default function StatusBadge({ label, tone = 'neutral', style }: Props) {
  const { theme } = useAppTheme();
  const color =
    tone === 'reserved'
      ? theme.colors.danger
      : tone === 'success'
      ? theme.colors.success
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'danger'
          ? theme.colors.danger
          : tone === 'info' || tone === 'role' || tone === 'live'
            ? theme.colors.accent
            : theme.colors.textSecondary;
  const backgroundColor =
    tone === 'reserved'
      ? theme.colors.dangerSoft
      : tone === 'success'
      ? theme.colors.successBackground
      : tone === 'warning'
        ? theme.colors.warningBackground
        : tone === 'danger'
          ? theme.colors.dangerBackground
          : tone === 'info' || tone === 'role' || tone === 'live'
            ? theme.colors.infoCardBackground
            : theme.colors.surfaceMuted;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor: tone === 'neutral' ? theme.colors.borderStrong : color,
          borderRadius: designTokens.radius.full,
        },
        style,
      ]}
    >
      <AppText variant="caption" color={color} bold numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
  },
});
