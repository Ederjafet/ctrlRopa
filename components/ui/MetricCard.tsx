import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  helper?: string;
  accent?: string;
  icon?: ReactNode;
};

export default function MetricCard({ label, value, helper, accent, icon }: Props) {
  const { theme } = useAppTheme();
  const resolvedAccent = accent ?? theme.colors.dashboardAccent;

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1} style={styles.label}>
          {label}
        </AppText>
        {icon}
      </View>
      <AppText bold style={[styles.value, { color: resolvedAccent }]} numberOfLines={2}>
        {value}
      </AppText>
      <View style={[styles.accentLine, { backgroundColor: resolvedAccent }]} />
      {helper ? (
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
          {helper}
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: designTokens.spacing.xs,
    minHeight: 92,
  },
  accentLine: {
    borderRadius: designTokens.radius.full,
    height: 3,
    opacity: 0.9,
    width: 44,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    marginTop: designTokens.spacing.sm,
  },
});
