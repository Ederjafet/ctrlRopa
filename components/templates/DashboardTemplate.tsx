import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  header?: ReactNode;
  summary?: ReactNode;
  metrics?: ReactNode;
  pendingSections?: ReactNode;
  followUpSection?: ReactNode;
  quickActions?: ReactNode;
};

export default function DashboardTemplate({
  header,
  summary,
  metrics,
  pendingSections,
  followUpSection,
  quickActions,
}: Props) {
  return (
    <View style={styles.root}>
      {header ? <View style={styles.header}>{header}</View> : null}
      {summary ? <View style={styles.section}>{summary}</View> : null}
      <View style={styles.body}>
        <View style={styles.mainColumn}>
          {metrics ? <View style={styles.section}>{metrics}</View> : null}
          {pendingSections ? <View style={styles.section}>{pendingSections}</View> : null}
        </View>
        <View style={styles.sideColumn}>
          {followUpSection ? <View style={styles.section}>{followUpSection}</View> : null}
          {quickActions ? <View style={styles.section}>{quickActions}</View> : null}
        </View>
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
  header: {
    marginBottom: designTokens.spacing.md,
  },
  mainColumn: {
    flex: 2,
    minWidth: 360,
  },
  root: {
    width: '100%',
  },
  section: {
    marginBottom: designTokens.spacing.md,
  },
  sideColumn: {
    flex: 1,
    minWidth: 300,
  },
});
