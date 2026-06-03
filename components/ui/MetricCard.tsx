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
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
          {label}
        </AppText>
        {icon}
      </View>
      <AppText bold style={[styles.value, { color: resolvedAccent }]} numberOfLines={2}>
        {value}
      </AppText>
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
    minHeight: 92,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 24,
    marginBottom: designTokens.spacing.xs,
    marginTop: designTokens.spacing.sm,
  },
});
