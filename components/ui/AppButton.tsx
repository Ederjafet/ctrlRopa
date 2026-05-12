import { useAppTheme } from '@/context/AppThemeContext';
import { ActivityIndicator, Alert, Pressable, PressableProps, StyleSheet, Text } from 'react-native';

type Props = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'operation' | 'danger' | 'cancel' | 'back' | 'menu';
  loading?: boolean;
  disabledReason?: string;
};

export default function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  disabledReason,
  style,
  onPress,
  ...rest
}: Props) {
  const { theme } = useAppTheme();
  const isBlocked = Boolean(disabled && !loading);

  const backgroundColor =
    variant === 'danger'
      ? theme.colors.dangerButtonBackground
      : variant === 'cancel'
        ? theme.colors.cancelButtonBackground
        : variant === 'back'
          ? theme.colors.backButtonBackground
          : variant === 'menu'
          ? theme.colors.menuButtonBackground
          : variant === 'operation'
            ? theme.colors.operationButtonBackground
      : variant === 'secondary'
        ? theme.colors.secondaryButtonBackground
        : theme.colors.primaryButtonBackground;

  const textColor =
    variant === 'danger'
      ? theme.colors.dangerButtonText
      : variant === 'cancel'
        ? theme.colors.cancelButtonText
        : variant === 'back'
          ? theme.colors.backButtonText
          : variant === 'menu'
            ? theme.colors.menuButtonText
            : variant === 'operation'
              ? theme.colors.operationButtonText
      : variant === 'secondary'
        ? theme.colors.secondaryButtonText
        : theme.colors.primaryButtonText;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderRadius: theme.radius.md,
          paddingVertical: theme.density === 'COMPACT' ? 11 : 15,
          paddingHorizontal: theme.spacing.md,
          opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1,
        },
        style as any,
      ]}
      disabled={loading}
      onPress={
        isBlocked
          ? () =>
              Alert.alert(
                'Falta completar información',
                disabledReason || 'Revisa los datos requeridos antes de continuar.',
                [{ text: 'Revisar' }]
              )
          : onPress
      }
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
});
