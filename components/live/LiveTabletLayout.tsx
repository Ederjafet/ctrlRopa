import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function LiveTabletLayout({ children }: Props) {
  const [left, center, right] = Children.toArray(children);

  return (
    <View style={styles.container}>
      <View style={styles.productColumn}>{left}</View>
      <View style={styles.operationColumn}>
        {center}
        {right}
      </View>
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
    flex: 1.15,
    gap: 12,
    minWidth: 0,
  },
  productColumn: {
    flex: 0.9,
    gap: 12,
    minWidth: 0,
  },
});
