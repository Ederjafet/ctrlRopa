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
    flex: 1.28,
    gap: 12,
    maxWidth: '62%',
    minWidth: 0,
  },
  productColumn: {
    flex: 0.72,
    gap: 12,
    maxWidth: '38%',
    minWidth: 0,
  },
});
