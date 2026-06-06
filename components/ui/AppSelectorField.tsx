import { useAppTheme } from '@/context/AppThemeContext';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';

type Props = {
  label: string;
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  error?: string;
};

export default function AppSelectorField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  error,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <AppText variant="subtitle" bold>
        {label}
      </AppText>

      <Pressable
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            borderColor: error ? theme.colors.danger : theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            minHeight: theme.density === 'COMPACT' ? 46 : 54,
            opacity: disabled ? 0.65 : 1,
            backgroundColor: pressed
              ? theme.colors.optionPressedBackground
              : theme.colors.inputBackground,
          },
        ]}
        onPress={onPress}
      >
        <AppText color={value ? theme.colors.inputText : theme.colors.placeholderText}>
          {value || placeholder}
        </AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" color={theme.colors.danger} style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  button: {
    borderWidth: 1,
  },
  errorText: {
    marginTop: 6,
  },
});
