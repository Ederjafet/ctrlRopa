import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { StyleSheet, View } from 'react-native';

export type EntitySummaryMeta = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: EntitySummaryMeta[];
};

export default function EntitySummaryCard({ title, subtitle, badge, meta = [] }: Props) {
  const { theme } = useAppTheme();

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <AppText bold numberOfLines={2}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {badge ? <StatusBadge label={badge} tone="info" /> : null}
      </View>
      {meta.length > 0 ? (
        <View style={styles.metaGrid}>
          {meta.map((item) => (
            <View key={`${item.label}-${item.value}`} style={styles.metaItem}>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {item.label}
              </AppText>
              <AppText bold numberOfLines={1}>
                {item.value}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    gap: designTokens.spacing.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md,
  },
  metaItem: {
    minWidth: 108,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
