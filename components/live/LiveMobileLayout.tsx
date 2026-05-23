import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export default function LiveMobileLayout({ children, compact = false }: Props) {
  const childArray = Children.toArray(children);
  const visibleChildren = compact ? childArray.slice(1) : childArray;

  return <View style={styles.container}>{visibleChildren}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 12,
  },
});
