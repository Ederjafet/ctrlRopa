import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  header?: ReactNode;
  primaryInfo?: ReactNode;
  secondaryInfo?: ReactNode;
  actions?: ReactNode;
  restrictedSections?: ReactNode;
};

export default function DetailTemplate({
  header,
  primaryInfo,
  secondaryInfo,
  actions,
  restrictedSections,
}: Props) {
  return (
    <View style={styles.root}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={styles.grid}>
        {primaryInfo ? <View style={styles.mainColumn}>{primaryInfo}</View> : null}
        {secondaryInfo ? <View style={styles.sideColumn}>{secondaryInfo}</View> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
      {restrictedSections ? <View style={styles.restricted}>{restrictedSections}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: designTokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.layout.cardGap,
  },
  header: {
    marginBottom: designTokens.spacing.lg,
  },
  mainColumn: {
    flex: 2,
    minWidth: 320,
  },
  restricted: {
    marginTop: designTokens.spacing.md,
  },
  root: {
    width: '100%',
  },
  sideColumn: {
    flex: 1,
    minWidth: 280,
  },
});
