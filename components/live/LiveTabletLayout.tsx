import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export default function LiveTabletLayout({ children, compact = false }: Props) {
  const [left, center, right] = Children.toArray(children);

  if (compact) {
    return (
      <View style={styles.container}>
        <View style={styles.compactOperationColumn}>
          {center}
          {right}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.operationColumn}>
        {center}
        {right}
      </View>
      <View style={styles.productColumn}>{left}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  operationColumn: {
    flex: 1.08,
    gap: 12,
    maxWidth: '56%',
    minWidth: 0,
  },
  compactOperationColumn: {
    flex: 1,
    gap: 10,
    maxWidth: '100%',
    minWidth: 0,
  },
  productColumn: {
    flex: 0.92,
    gap: 12,
    maxWidth: '44%',
    minWidth: 0,
  },
});
