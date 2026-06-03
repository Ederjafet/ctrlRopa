import EmptyState from '@/components/ui/EmptyState';
import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  header?: ReactNode;
  filters?: ReactNode;
  list?: ReactNode;
  emptyState?: ReactNode;
  actions?: ReactNode;
};

export default function ListTemplate({ header, filters, list, emptyState, actions }: Props) {
  return (
    <View style={styles.root}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={styles.toolbar}>
        {filters ? <View style={styles.filters}>{filters}</View> : null}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {list ?? emptyState ?? (
        <EmptyState title="Sin datos disponibles" message="No hay registros para mostrar." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'flex-end',
  },
  filters: {
    flex: 1,
    minWidth: 260,
  },
  header: {
    marginBottom: designTokens.spacing.lg,
  },
  root: {
    width: '100%',
  },
  toolbar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
  },
});
