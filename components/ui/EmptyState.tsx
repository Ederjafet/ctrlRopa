import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  message?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export default function EmptyState({ title, message, icon = 'inbox' }: Props) {
  const { theme } = useAppTheme();

  return (
    <AppCard style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.accentSoft }]}>
        <MaterialIcons name={icon} size={24} color={theme.colors.accent} />
      </View>
      <View style={styles.textBlock}>
        <AppText bold>{title}</AppText>
        {message ? (
          <AppText variant="caption" color={theme.colors.mutedText}>
            {message}
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    minHeight: 72,
  },
  iconWrap: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    borderRadius: designTokens.radius.md,
    width: 44,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
