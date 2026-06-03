import SidebarNavItem, { SidebarNavItemConfig } from '@/components/layout/SidebarNavItem';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export type SidebarSection = {
  title?: string;
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
  const { theme } = useAppTheme();
  const roleLabel = session?.roles?.map((role) => role.code).join(', ') || 'Sin rol';

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <AppText variant="subtitle" bold>
            Ctrl Ropa
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Operacion y control
          </AppText>
        </View>
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar menu"
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderColor: theme.colors.infoCardBorder,
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
            {section.title ? (
              <AppText
                variant="caption"
                color={theme.colors.mutedText}
                bold
                style={styles.sectionLabel}
              >
                {section.title}
              </AppText>
            ) : null}
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.key}
                item={item}
                active={activeRoute === item.key || activeRoute === item.route}
                onPress={onNavigate}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      {session ? (
        <View style={[styles.sessionPanel, { borderColor: theme.colors.border }]}>
          <StatusBadge label={roleLabel} tone="info" />
          <AppText bold numberOfLines={1}>
            {session.name || session.email}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
            {session.email}
          </AppText>
          <Pressable
            onPress={onSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.signOutButton,
              {
                backgroundColor: theme.colors.dangerBackground,
                borderColor: theme.colors.danger,
                borderRadius: designTokens.radius.md,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons name="logout" size={18} color={theme.colors.danger} />
            <AppText color={theme.colors.danger} bold>
              Cerrar sesion
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flex: 1,
    minWidth: 0,
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
    marginBottom: designTokens.spacing.md,
  },
  sectionLabel: {
    marginBottom: designTokens.spacing.xs,
    textTransform: 'uppercase',
  },
  sessionPanel: {
    borderTopWidth: 1,
    gap: designTokens.spacing.xs,
    paddingTop: designTokens.spacing.sm,
  },
  sidebar: {
    borderRightWidth: 1,
    flex: 1,
    minHeight: '100%',
    padding: designTokens.spacing.md,
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
});
