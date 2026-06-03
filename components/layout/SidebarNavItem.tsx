import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

export type SidebarNavItemConfig = {
  key: string;
  label: string;
  route?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  helper?: string;
};

type Props = {
  item: SidebarNavItemConfig;
  active?: boolean;
  onPress?: (item: SidebarNavItemConfig) => void;
};

export default function SidebarNavItem({ item, active, onPress }: Props) {
  const { theme } = useAppTheme();
  const disabled = item.disabled || !item.route;
  const iconColor = active ? theme.colors.primaryButtonText : theme.colors.mutedText;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: active ? theme.colors.primaryButtonBackground : 'transparent',
          borderColor: active ? theme.colors.primaryButtonBackground : theme.colors.border,
          borderRadius: designTokens.radius.md,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
      ]}
    >
      <MaterialIcons name={item.icon ?? 'chevron-right'} size={20} color={iconColor} />
      <View style={styles.textBlock}>
        <AppText
          bold={active}
          color={active ? theme.colors.primaryButtonText : theme.colors.text}
          numberOfLines={1}
        >
          {item.label}
        </AppText>
        {item.helper ? (
          <AppText
            variant="caption"
            color={active ? theme.colors.primaryButtonText : theme.colors.mutedText}
            numberOfLines={1}
          >
            {item.helper}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
    minHeight: 42,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
