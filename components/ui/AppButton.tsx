import { useAppTheme } from '@/context/AppThemeContext';
import { ActivityIndicator, Alert, Pressable, PressableProps, StyleSheet, Text } from 'react-native';

type Props = PressableProps & {
  title: string;
  variant?:
    | 'primary'
    | 'cta'
    | 'secondary'
    | 'neutral'
    | 'warning'
    | 'operation'
    | 'danger'
    | 'cancel'
    | 'back'
    | 'menu'
    | 'ghost';
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
    isBlocked
      ? theme.colors.disabledButtonBackground
      : variant === 'ghost'
        ? 'transparent'
      : variant === 'danger'
      ? theme.colors.dangerButtonBackground
      : variant === 'cancel'
        ? theme.colors.cancelButtonBackground
        : variant === 'back'
          ? theme.colors.backButtonBackground
          : variant === 'menu'
          ? theme.colors.menuButtonBackground
          : variant === 'warning'
            ? theme.colors.warning
          : variant === 'operation'
            ? theme.colors.operationButtonBackground
            : variant === 'neutral'
              ? theme.colors.neutralButtonBackground
      : variant === 'secondary'
        ? theme.colors.secondaryButtonBackground
        : theme.colors.primaryButtonBackground;

  const textColor =
    isBlocked
      ? theme.colors.disabledButtonText
      : variant === 'ghost'
        ? theme.colors.accent
      : variant === 'danger'
      ? theme.colors.dangerButtonText
      : variant === 'cancel'
        ? theme.colors.cancelButtonText
        : variant === 'back'
          ? theme.colors.backButtonText
          : variant === 'menu'
            ? theme.colors.menuButtonText
            : variant === 'warning'
              ? theme.colors.surface
            : variant === 'operation'
              ? theme.colors.operationButtonText
              : variant === 'neutral'
                ? theme.colors.neutralButtonText
      : variant === 'secondary'
        ? theme.colors.secondaryButtonText
        : theme.colors.primaryButtonText;
  const hasSubtleBorder = variant === 'neutral' || variant === 'secondary' || variant === 'ghost';
  const borderColor =
    variant === 'secondary' || variant === 'ghost'
      ? theme.colors.accent
      : theme.colors.neutralButtonBorder;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: hasSubtleBorder ? borderColor : backgroundColor,
          borderWidth: hasSubtleBorder ? StyleSheet.hairlineWidth : 0,
          borderRadius: theme.radius.md,
          paddingVertical: theme.density === 'COMPACT' ? 11 : 15,
          paddingHorizontal: theme.spacing.md,
          opacity: loading ? 0.55 : pressed ? 0.85 : 1,
        },
        style as any,
      ]}
      disabled={loading}
      onPress={
        isBlocked
          ? () =>
              Alert.alert(
                'Accion no disponible',
                disabledReason || 'Revisa los datos requeridos antes de continuar.',
                [{ text: 'Entendido' }]
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
