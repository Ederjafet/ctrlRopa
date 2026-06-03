import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import SectionHeader from '@/components/ui/SectionHeader';
import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  status?: ReactNode;
  metrics?: ReactNode;
  activity?: ReactNode;
  recentItems?: ReactNode;
};

export default function MonitoringTemplate({ title, status, metrics, activity, recentItems }: Props) {
  return (
    <View style={styles.root}>
      <SectionHeader title={title} rightContent={status} />
      {metrics ? (
        <AppResponsiveGrid tabletColumns={2} desktopColumns={4} gap={designTokens.layout.cardGap}>
          {metrics}
        </AppResponsiveGrid>
      ) : (
        <AppText variant="caption">Indicadores pendientes de datos reales.</AppText>
      )}
      <View style={styles.body}>
        <View style={styles.column}>{recentItems}</View>
        <View style={styles.column}>{activity}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.layout.cardGap,
  },
  column: {
    flex: 1,
    minWidth: 280,
  },
  root: {
    gap: designTokens.spacing.lg,
    width: '100%',
  },
});
