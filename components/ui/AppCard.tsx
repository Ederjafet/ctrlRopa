import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type Props = ViewProps & {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'warning' | 'success' | 'danger' | 'info' | 'selected';
};

export default function AppCard({ children, style, variant = 'default', ...rest }: Props) {
  const { theme } = useAppTheme();
  const { isPhone } = useResponsiveLayout();
  const isSubtle = variant === 'subtle';
  const toneColor =
    variant === 'warning'
      ? theme.colors.warning
      : variant === 'success'
        ? theme.colors.success
        : variant === 'danger'
          ? theme.colors.danger
          : variant === 'info'
            ? theme.colors.info
            : variant === 'selected'
              ? theme.colors.accent
              : theme.colors.borderSubtle;
  const backgroundColor =
    variant === 'warning'
        ? theme.isDark
          ? theme.colors.surfaceElevated
          : theme.colors.warningBackground
      : variant === 'success'
        ? theme.isDark
          ? theme.colors.surfaceElevated
          : theme.colors.successBackground
        : variant === 'danger'
          ? theme.isDark
            ? theme.colors.surfaceElevated
            : theme.colors.dangerBackground
          : variant === 'info'
            ? theme.isDark
              ? theme.colors.surfaceElevated
              : theme.colors.infoSoft
            : isSubtle
              ? theme.colors.surfaceAlt
              : theme.colors.surfaceElevated;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: toneColor,
          borderLeftColor: variant === 'default' || isSubtle ? toneColor : toneColor,
          borderLeftWidth: variant === 'default' || isSubtle ? 1 : 4,
          borderRadius: variant === 'elevated' || variant === 'selected' ? theme.radius.xl : theme.radius.lg,
          padding: isPhone ? theme.spacing.md : theme.spacing.lg,
          shadowColor: theme.colors.shadow,
          shadowOpacity: isSubtle ? 0.03 : theme.isDark ? 0.18 : 0.08,
          elevation: isSubtle ? 0 : variant === 'elevated' || variant === 'selected' ? 3 : 2,
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
