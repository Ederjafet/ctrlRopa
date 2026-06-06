import { useAppTheme } from '@/context/AppThemeContext';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import AppText from './AppText';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export default function AppInput({ label, error, style, ...rest }: Props) {
  const { theme } = useAppTheme();
  const isReadonly = rest.editable === false;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
          {label}
        </AppText>
      ) : null}

      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.danger : theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            minHeight: theme.density === 'COMPACT' ? 46 : 54,
            backgroundColor: isReadonly
              ? theme.colors.disabledBackground
              : theme.colors.inputBackground,
            color: isReadonly ? theme.colors.textSecondary : theme.colors.inputText,
            shadowColor: theme.isDark ? theme.colors.overlay : theme.colors.primary,
            shadowOpacity: isReadonly ? 0 : 0.04,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.placeholderText}
        selectionColor={theme.colors.accent}
        {...rest}
      />
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
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  errorText: {
    marginTop: 6,
  },
});
