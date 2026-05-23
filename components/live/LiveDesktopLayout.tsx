import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export default function LiveDesktopLayout({ children, compact = false }: Props) {
  const [left, center, right] = Children.toArray(children);

  if (compact) {
    return (
      <View style={styles.container}>
        <View style={styles.compactMainColumn}>{center}</View>
        <View style={styles.compactSideColumn}>{right}</View>
      </View>
    );
  }

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
  compactMainColumn: {
    flex: 1.45,
    gap: 10,
    minWidth: 0,
  },
  compactSideColumn: {
    flex: 0.85,
    gap: 10,
    minWidth: 0,
  },
  sideColumn: {
    flex: 0.92,
    gap: 12,
    minWidth: 0,
  },
});
