import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Tone = 'neutral' | 'metric' | 'action' | 'status' | 'warning' | 'success';

type BaseProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type MetricProps = {
  label: string;
  value: string;
  helper?: string;
  compact?: boolean;
};

function LiveBaseCard({ title, subtitle, children, style, tone }: BaseProps & { tone: Tone }) {
  const { theme } = useAppTheme();

  const toneColor =
    tone === 'warning'
      ? theme.colors.warning
      : tone === 'success'
        ? theme.colors.success
        : theme.colors.accent;

  const backgroundColor =
    tone === 'warning'
      ? theme.isDark
        ? theme.colors.surfaceAlt
        : theme.colors.warningBackground
      : tone === 'success'
        ? theme.colors.successBackground
        : theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: tone === 'neutral' ? theme.colors.borderSubtle : toneColor,
          borderRadius: theme.radius.lg,
          shadowColor: theme.isDark ? theme.colors.overlay : theme.colors.primary,
          shadowOpacity: theme.isDark ? 0.18 : 0.08,
        },
        style,
      ]}
    >
      {title ? (
        <AppText variant="subtitle" bold numberOfLines={2}>
          {title}
        </AppText>
      ) : null}
      {subtitle ? (
        <AppText color={theme.colors.mutedText} numberOfLines={3}>
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

export function LiveInfoCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="neutral" />;
}

export function LiveActionCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="action" />;
}

export function LiveStatusCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="status" />;
}

export function LiveWarningCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="warning" />;
}

export function LiveSuccessCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="success" />;
}

export function LiveCompactCard(props: BaseProps) {
  return <LiveBaseCard {...props} tone="neutral" style={[styles.compact, props.style]} />;
}

export function LiveMetricCard({ label, value, helper, compact = false }: MetricProps) {
  const { theme } = useAppTheme();

  return (
    <LiveBaseCard tone="metric" style={compact ? styles.metricCompact : styles.metric}>
      <AppText
        variant="caption"
        color={theme.colors.mutedText}
        numberOfLines={1}
      >
        {label}
      </AppText>
      <AppText
        variant={compact ? 'subtitle' : 'title'}
        color={theme.colors.accent}
        bold
      >
        {value}
      </AppText>
      {!compact && helper ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          {helper}
        </AppText>
      ) : null}
    </LiveBaseCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    elevation: 2,
    gap: 8,
    padding: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  compact: {
    gap: 6,
    padding: 10,
  },
  metric: {
    minHeight: 118,
    padding: 12,
  },
  metricCompact: {
    gap: 2,
    minHeight: 70,
    padding: 10,
  },
});
