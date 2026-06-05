import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
};

export default function ActionTile({ title, subtitle, icon = 'chevron-right', disabled, onPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderSubtle,
          borderRadius: designTokens.radius.xl,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
          shadowColor: theme.isDark ? theme.colors.overlay : theme.colors.primary,
          shadowOpacity: theme.isDark ? 0.18 : 0.09,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentSoft }]}>
        <MaterialIcons name={icon} size={20} color={theme.colors.accent} />
      </View>
      <View style={styles.textBlock}>
        <AppText bold numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={theme.colors.mutedText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    borderRadius: designTokens.radius.md,
    width: 36,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  tile: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.sm,
    minHeight: 64,
    padding: designTokens.spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
});
