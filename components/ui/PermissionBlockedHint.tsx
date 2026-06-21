import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { ScreenPermissionEvaluation, getMissingPermissionMessage } from '@/services/screenPermissions';
import { StyleSheet, View } from 'react-native';

type Props = {
  action?: ScreenPermissionEvaluation | null;
  message?: string;
};

export default function PermissionBlockedHint({ action, message }: Props) {
  const { theme } = useAppTheme();
  const resolvedMessage = message ?? getMissingPermissionMessage(action);

  if (!resolvedMessage) return null;

  return (
    <View
      style={[
        styles.hint,
        {
          backgroundColor: theme.colors.warningBackground,
          borderColor: theme.colors.warning,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <AppText variant="caption" color={theme.colors.text}>
        {resolvedMessage}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
