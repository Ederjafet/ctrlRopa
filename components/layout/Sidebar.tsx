import SidebarNavItem, { SidebarNavItemConfig } from '@/components/layout/SidebarNavItem';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export type SidebarSection = {
  title?: string;
  titleKey?: string;
  items: SidebarNavItemConfig[];
};

type Props = {
  sections: SidebarSection[];
  activeRoute?: string;
  onNavigate?: (item: SidebarNavItemConfig) => void;
  session?: UserSession | null;
  onClose?: () => void;
  onSignOut?: () => void;
};

export default function Sidebar({ sections, activeRoute, onNavigate, session, onClose, onSignOut }: Props) {
  const { theme, toggleThemeMode } = useAppTheme();
  const { t } = useTranslation('common');
  const roleLabel = session?.roles?.map((role) => role.code).join(', ') || t('navigation.noRole');
  const nextThemeLabel = theme.isDark ? t('theme.light') : t('theme.dark');
  const normalizedActiveRoute = activeRoute?.replace(/^\//, '');
  const isActiveItem = (item: SidebarNavItemConfig) => {
    const normalizedItemRoute = item.route?.replace(/^\//, '');
    const aliases = item.activeFor ?? [];

    return (
      activeRoute === item.key ||
      activeRoute === item.route ||
      normalizedActiveRoute === item.key ||
      normalizedActiveRoute === normalizedItemRoute ||
      aliases.some((alias) => alias === activeRoute || alias.replace(/^\//, '') === normalizedActiveRoute)
    );
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <View
          style={[
            styles.brand,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderSubtle,
              borderRadius: designTokens.radius.lg,
            },
          ]}
        >
          <View
            style={[
              styles.brandMark,
              {
                backgroundColor: theme.colors.accentSoft,
                borderColor: theme.colors.accent,
                borderRadius: designTokens.radius.md,
              },
            ]}
          >
            <MaterialIcons name="storefront" size={18} color={theme.colors.accent} />
          </View>
          <AppText variant="subtitle" bold>
            Ctrl Ropa
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('navigation.brandHelp')}
          </AppText>
        </View>
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('navigation.closeMenu')}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderColor: theme.colors.borderSubtle,
                borderRadius: designTokens.radius.md,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons name="close" size={20} color={theme.colors.accent} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        style={styles.navArea}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <View key={`${section.title ?? 'section'}-${index}`} style={styles.section}>
            {section.title || section.titleKey ? (
              <AppText
                variant="caption"
                color={theme.colors.mutedText}
                bold
                style={styles.sectionLabel}
              >
                {section.titleKey ? t(section.titleKey) : section.title}
              </AppText>
            ) : null}
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.key}
                item={item}
                active={isActiveItem(item)}
                onPress={onNavigate}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      {session ? (
        <View
          style={[
            styles.sessionPanel,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderSubtle,
              borderRadius: designTokens.radius.lg,
            },
          ]}
        >
          <View style={styles.sessionHeader}>
            <StatusBadge label={roleLabel} tone="info" />
          </View>
          <View style={styles.sessionIdentity}>
            <AppText bold numberOfLines={1}>
              {session.name || session.email}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
              {session.email}
            </AppText>
          </View>
          <Pressable
            onPress={toggleThemeMode}
            accessibilityRole="button"
            accessibilityLabel={nextThemeLabel}
            style={({ pressed }) => [
              styles.themeToggleButton,
              {
                backgroundColor: theme.colors.neutralButtonBackground,
                borderColor: theme.colors.borderStrong,
                borderRadius: designTokens.radius.md,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={theme.isDark ? 'light-mode' : 'dark-mode'}
              size={18}
              color={theme.colors.neutralButtonText}
            />
            <AppText color={theme.colors.neutralButtonText} bold>
              {nextThemeLabel}
            </AppText>
          </Pressable>
          <Pressable
            onPress={onSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.signOutButton,
              {
                backgroundColor: theme.isDark ? theme.colors.surfaceMuted : theme.colors.surface,
                borderColor: theme.isDark ? theme.colors.borderStrong : theme.colors.dangerBackground,
                borderRadius: designTokens.radius.md,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons name="logout" size={18} color={theme.colors.danger} />
            <AppText color={theme.colors.danger} bold>
              {t('navigation.signOut')}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  brandMark: {
    alignItems: 'center',
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
    width: 34,
  },
  brandRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
  },
  closeButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  navArea: {
    flex: 1,
    minHeight: 0,
  },
  navContent: {
    paddingBottom: designTokens.spacing.md,
  },
  section: {
    marginBottom: designTokens.spacing.lg,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: designTokens.spacing.sm,
    textTransform: 'uppercase',
  },
  sessionHeader: {
    alignItems: 'flex-start',
  },
  sessionIdentity: {
    gap: 2,
    minWidth: 0,
  },
  sessionPanel: {
    borderWidth: 1,
    gap: designTokens.spacing.xs,
    padding: designTokens.spacing.sm,
  },
  sidebar: {
    borderRightWidth: 1,
    flex: 1,
    minHeight: '100%',
    padding: designTokens.spacing.lg,
    width: '100%',
  },
  signOutButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  themeToggleButton: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
});
