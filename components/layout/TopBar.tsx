import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  metadata?: string;
  eyebrow?: string;
  session?: UserSession | null;
  rightContent?: ReactNode;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  compact?: boolean;
};

export default function TopBar({
  title,
  subtitle,
  metadata,
  eyebrow,
  session,
  rightContent,
  onMenuPress,
  showMenuButton,
  compact = false,
}: Props) {
  const { theme } = useAppTheme();
  const { isPhone, isWideDesktop } = useResponsiveLayout();
  const { t } = useTranslation('common');
  const roleLabel = session?.roles?.map((role) => role.code).join(', ') || t('navigation.noRole');
  const showCompactRole = Boolean(session && !isWideDesktop);

  return (
    <View
      style={[
        styles.topBar,
        compact ? styles.topBarCompact : null,
        compact && isPhone ? styles.topBarCompactPhone : null,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderSubtle,
          borderRadius: compact ? designTokens.radius.lg : designTokens.radius.xl,
          shadowColor: theme.isDark ? theme.colors.overlay : theme.colors.primary,
          shadowOpacity: compact ? (theme.isDark ? 0.14 : 0.05) : theme.isDark ? 0.2 : 0.1,
        },
      ]}
    >
      {showMenuButton ? (
        <Pressable
          onPress={onMenuPress}
          style={({ pressed }) => [
            styles.menuButton,
            {
              backgroundColor: theme.colors.infoCardBackground,
              borderColor: theme.colors.borderSubtle,
              borderRadius: designTokens.radius.md,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <MaterialIcons name="menu" size={22} color={theme.colors.accent} />
        </Pressable>
      ) : null}
      <View style={[styles.titleBlock, compact ? styles.titleBlockCompact : null]}>
        <AppText
          variant="caption"
          color={theme.colors.accent}
          bold
          style={[styles.eyebrow, compact ? styles.eyebrowCompact : null]}
        >
          {eyebrow ?? t('topBar.operationalPanel')}
        </AppText>
        <AppText variant="title" bold style={[styles.title, compact ? styles.titleCompact : null]} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant={compact ? 'caption' : 'body'}
            color={theme.colors.mutedText}
            numberOfLines={compact ? 1 : 2}
            style={compact ? styles.subtitleCompact : null}
          >
            {subtitle}
          </AppText>
        ) : null}
        {metadata ? (
          <AppText
            variant="caption"
            color={theme.colors.mutedText}
            numberOfLines={1}
            style={compact ? styles.metadataCompact : null}
          >
            {metadata}
          </AppText>
        ) : null}
      </View>
      <View
        style={[
          styles.actionBlock,
          isPhone ? styles.actionBlockCompact : null,
          compact ? styles.actionBlockMinimal : null,
          compact && isPhone ? styles.actionBlockMinimalPhone : null,
        ]}
      >
        {showCompactRole ? (
          <StatusBadge label={roleLabel} tone="info" />
        ) : null}
        {rightContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  eyebrow: {
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  eyebrowCompact: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 1,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleBlockCompact: {
    gap: 1,
  },
  title: {
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 21,
    lineHeight: 26,
    marginBottom: 0,
  },
  subtitleCompact: {
    lineHeight: 17,
  },
  metadataCompact: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  topBar: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
  },
  topBarCompact: {
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  topBarCompactPhone: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  actionBlock: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
    justifyContent: 'flex-end',
    maxWidth: 280,
  },
  actionBlockMinimal: {
    gap: designTokens.spacing.xs,
    maxWidth: 240,
  },
  actionBlockMinimalPhone: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
    maxWidth: '100%',
    width: '100%',
  },
  actionBlockCompact: {
    maxWidth: 220,
  },
});
