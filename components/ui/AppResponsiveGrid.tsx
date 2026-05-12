import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Children, ReactNode } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  phoneColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: number;
  style?: ViewStyle;
};

export default function AppResponsiveGrid({
  children,
  phoneColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 12,
  style,
}: Props) {
  const { isDesktop, isTablet } = useResponsiveLayout();
  const items = Children.toArray(children);
  const columns = isDesktop ? desktopColumns : isTablet ? tabletColumns : phoneColumns;
  const width: DimensionValue = columns <= 1 ? '100%' : `${100 / columns}%`;

  return (
    <View style={[styles.grid, { marginHorizontal: -gap / 2 }, style]}>
      {items.map((child, index) => (
          <View
            key={index}
            style={[
              styles.cell,
              {
                paddingHorizontal: gap / 2,
                width,
              },
            ]}
          >
            {child}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    minWidth: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
