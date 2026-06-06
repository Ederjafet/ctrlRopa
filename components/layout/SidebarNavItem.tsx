import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

export type SidebarNavItemConfig = {
  key: string;
  label: string;
  labelKey?: string;
  route?: string;
  activeFor?: string[];
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  helper?: string;
  helperKey?: string;
};

type Props = {
  item: SidebarNavItemConfig;
  active?: boolean;
  onPress?: (item: SidebarNavItemConfig) => void;
};

export default function SidebarNavItem({ item, active, onPress }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const disabled = item.disabled || !item.route;
  const iconColor = active ? theme.colors.accent : theme.colors.mutedText;
  const label = item.labelKey ? t(item.labelKey) : item.label;
  const helper = item.helperKey ? t(item.helperKey) : item.helper;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: active ? theme.colors.accentSoft : 'transparent',
          borderColor: active ? theme.colors.accent : theme.colors.borderSubtle,
          borderRadius: designTokens.radius.md,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
      ]}
    >
      <MaterialIcons name={item.icon ?? 'chevron-right'} size={20} color={iconColor} />
      <View style={styles.textBlock}>
        <AppText
          bold={active}
          color={active ? theme.colors.textPrimary : theme.colors.text}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {helper ? (
          <AppText
            variant="caption"
            color={active ? theme.colors.textSecondary : theme.colors.mutedText}
            numberOfLines={1}
          >
            {helper}
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
