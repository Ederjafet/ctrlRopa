import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import AppCard from './AppCard';
import AppText from './AppText';

type Props = ViewProps & {
  title: string;
  children: ReactNode;
};

export default function AppInfoCard({ title, children, style, ...rest }: Props) {
  const { theme } = useAppTheme();

  return (
    <AppCard
      variant="info"
      style={[
        styles.card,
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
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
});
