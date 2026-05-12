import { useAppTheme } from '@/context/AppThemeContext';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import AppText from './AppText';

type Props = TextInputProps & {
  label?: string;
};

export default function AppInput({ label, style, ...rest }: Props) {
  const { theme } = useAppTheme();

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
            borderColor: theme.colors.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            minHeight: theme.density === 'COMPACT' ? 46 : 54,
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.inputText,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.placeholderText}
        selectionColor={theme.colors.accent}
        {...rest}
      />
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
  },
});
