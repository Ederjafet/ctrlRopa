import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
};

export default function LiveDesktopLayout({ children }: Props) {
  const [left, center, right] = Children.toArray(children);

  return (
    <View style={styles.container}>
      <View style={styles.sideColumn}>{left}</View>
      <View style={styles.mainColumn}>{center}</View>
      <View style={styles.sideColumn}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  mainColumn: {
    flex: 1.32,
    gap: 12,
    minWidth: 0,
  },
  sideColumn: {
    flex: 0.92,
    gap: 12,
    minWidth: 0,
  },
});
