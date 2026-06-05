import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type Props = ViewProps & {
  children: ReactNode;
};

export default function AppCard({ children, style, ...rest }: Props) {
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.radius.lg,
          padding: isPhone ? theme.spacing.md : theme.spacing.lg,
          shadowColor: theme.isDark ? theme.colors.overlay : theme.colors.primary,
          shadowOpacity: theme.isDark ? 0.18 : 0.08,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    elevation: 2,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
});
