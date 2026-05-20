import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function LiveTabletLayout({ children }: Props) {
  const [left, center, right] = Children.toArray(children);

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
  productColumn: {
    flex: 0.92,
    gap: 12,
    maxWidth: '44%',
    minWidth: 0,
  },
});
