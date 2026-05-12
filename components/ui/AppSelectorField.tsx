import { useAppTheme } from '@/context/AppThemeContext';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';

type Props = {
  label: string;
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function AppSelectorField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
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
            borderColor: theme.colors.inputBorder,
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
});
