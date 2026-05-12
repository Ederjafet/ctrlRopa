import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onPress: () => void;
};

export default function AppOptionRow({ title, subtitle, children, onPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: pressed
            ? theme.colors.optionPressedBackground
            : theme.colors.optionBackground,
          borderBottomColor: theme.colors.optionBorder,
          paddingVertical: theme.density === 'COMPACT' ? 11 : 14,
        },
      ]}
    >
      <AppText bold>{title}</AppText>
      {subtitle ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          {subtitle}
        </AppText>
      ) : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    borderBottomWidth: 1,
  },
  children: {
    marginTop: 4,
  },
});
