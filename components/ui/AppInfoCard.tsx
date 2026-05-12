import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import AppText from './AppText';

type Props = ViewProps & {
  title: string;
  children: ReactNode;
};

export default function AppInfoCard({ title, children, style, ...rest }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.infoCardBackground,
          borderColor: theme.colors.infoCardBorder,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      {...rest}
    >
      <AppText variant="subtitle" bold color={theme.colors.infoCardText}>
        {title}
      </AppText>
      {typeof children === 'string' ? (
        <AppText color={theme.colors.infoCardText}>{children}</AppText>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
});
