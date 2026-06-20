import SidebarNavItem, { SidebarNavItemConfig } from '@/components/layout/SidebarNavItem';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  contextContent?: ReactNode;
  scrollStorageKey?: string;
  onClose?: () => void;
  onSignOut?: () => void;
};

export default function Sidebar({
  sections,
  activeRoute,
  onNavigate,
  session,
  contextContent,
  scrollStorageKey,
  onClose,
  onSignOut,
}: Props) {
  const { theme, toggleThemeMode } = useAppTheme();
  const { t } = useTranslation('common');
  const roleLabel = session?.roles?.map((role) => role.code).join(', ') || t('navigation.noRole');
  const nextThemeLabel = theme.isDark ? t('theme.light') : t('theme.dark');
  const normalizedActiveRoute = activeRoute?.replace(/^\//, '');
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollYRef = useRef(0);
  const contentHeightRef = useRef(0);
  const navViewportHeightRef = useRef(0);
  const groupOffsetsRef = useRef<Record<number, number>>({});
  const itemLayoutsRef = useRef<Record<string, { groupIndex: number; y: number; height: number }>>({});
  const pendingRestoreYRef = useRef<number | null>(null);
  const activeScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restoreSidebarScroll = useCallback((nextY: number) => {
    const safeY = Math.max(0, Math.round(nextY));
    scrollYRef.current = safeY;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: safeY, animated: false });
    }, 0);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: safeY, animated: false });
    }, 80);
  }, []);

  const persistSidebarScroll = useCallback(() => {
    if (!scrollStorageKey) return;

    const safeY = Math.max(0, Math.round(scrollYRef.current));
    void AsyncStorage.setItem(scrollStorageKey, String(safeY));
  }, [scrollStorageKey]);

  useEffect(() => {
    if (!scrollStorageKey) return undefined;

    let mounted = true;
    pendingRestoreYRef.current = null;

    AsyncStorage.getItem(scrollStorageKey).then((value) => {
      if (!mounted) return;

      const savedY = Number(value ?? 0);
      if (!Number.isFinite(savedY) || savedY <= 0) return;

      pendingRestoreYRef.current = savedY;
      restoreSidebarScroll(savedY);
    });

    return () => {
      mounted = false;
      const safeY = Math.max(0, Math.round(scrollYRef.current));
      void AsyncStorage.setItem(scrollStorageKey, String(safeY));
    };
  }, [restoreSidebarScroll, scrollStorageKey]);

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
  const activeItemKey = sections.flatMap((section) => section.items).find(isActiveItem)?.key;

  const ensureActiveItemVisible = useCallback((animated = false) => {
    if (!activeItemKey) return;

    const layout = itemLayoutsRef.current[activeItemKey];
    const viewportHeight = navViewportHeightRef.current;
    if (!layout || viewportHeight <= 0) return;

    const groupOffset = groupOffsetsRef.current[layout.groupIndex] ?? 0;
    const itemTop = groupOffset + layout.y;
    const itemBottom = itemTop + layout.height;
    const margin = designTokens.spacing.md;
    const visibleTop = scrollYRef.current + margin;
    const visibleBottom = scrollYRef.current + viewportHeight - margin;
    let targetY: number | null = null;

    if (itemTop < visibleTop) {
      targetY = itemTop - margin;
    } else if (itemBottom > visibleBottom) {
      targetY = itemBottom - viewportHeight + margin;
    }

    if (targetY === null) return;

    const maxScrollY = Math.max(0, contentHeightRef.current - viewportHeight);
    const safeY = Math.max(0, Math.min(Math.round(targetY), maxScrollY));
    scrollYRef.current = safeY;
    scrollRef.current?.scrollTo({ y: safeY, animated });

    if (scrollStorageKey) {
      void AsyncStorage.setItem(scrollStorageKey, String(safeY));
    }
  }, [activeItemKey, scrollStorageKey]);

  const queueEnsureActiveItemVisible = useCallback((animated = false) => {
    if (activeScrollTimeoutRef.current) {
      clearTimeout(activeScrollTimeoutRef.current);
    }

    activeScrollTimeoutRef.current = setTimeout(() => {
      ensureActiveItemVisible(animated);
      setTimeout(() => ensureActiveItemVisible(false), 80);
    }, 0);
  }, [ensureActiveItemVisible]);

  useEffect(() => {
    queueEnsureActiveItemVisible(false);
  }, [activeItemKey, queueEnsureActiveItemVisible]);

  useEffect(() => () => {
    if (activeScrollTimeoutRef.current) {
      clearTimeout(activeScrollTimeoutRef.current);
    }
  }, []);

  const handleNavigate = useCallback((item: SidebarNavItemConfig) => {
    persistSidebarScroll();
    onNavigate?.(item);
  }, [onNavigate, persistSidebarScroll]);

  const handleGroupLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    groupOffsetsRef.current[index] = event.nativeEvent.layout.y;
    queueEnsureActiveItemVisible(false);
  }, [queueEnsureActiveItemVisible]);

  const handleItemLayout = useCallback((
    item: SidebarNavItemConfig,
    groupIndex: number,
    event: LayoutChangeEvent
  ) => {
    itemLayoutsRef.current[item.key] = {
      groupIndex,
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };

    if (item.key === activeItemKey) {
      queueEnsureActiveItemVisible(false);
    }
  }, [activeItemKey, queueEnsureActiveItemVisible]);

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
        ref={scrollRef}
        style={styles.navArea}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={80}
        onLayout={(event) => {
          navViewportHeightRef.current = event.nativeEvent.layout.height;
          queueEnsureActiveItemVisible(false);
        }}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        onContentSizeChange={(_width, height) => {
          contentHeightRef.current = height;

          if (pendingRestoreYRef.current !== null) {
            restoreSidebarScroll(pendingRestoreYRef.current);
            pendingRestoreYRef.current = null;
          }

          queueEnsureActiveItemVisible(false);
        }}
        onMomentumScrollEnd={persistSidebarScroll}
        onScrollEndDrag={persistSidebarScroll}
      >
        {sections.map((section, index) => (
          <View
            key={`${section.title ?? 'section'}-${index}`}
            onLayout={(event) => handleGroupLayout(index, event)}
          >
            <View style={styles.section}>
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
                <View
                  key={item.key}
                  onLayout={(event) => handleItemLayout(item, index, event)}
                >
                  <SidebarNavItem
                    item={item}
                    active={isActiveItem(item)}
                    onPress={handleNavigate}
                  />
                </View>
              ))}
            </View>
            {index === 0 && contextContent ? <View style={styles.contextContent}>{contextContent}</View> : null}
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
          <View style={styles.sessionActions}>
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
                size={16}
                color={theme.colors.neutralButtonText}
              />
              <AppText color={theme.colors.neutralButtonText} bold numberOfLines={1}>
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
              <MaterialIcons name="logout" size={16} color={theme.colors.danger} />
              <AppText color={theme.colors.danger} bold numberOfLines={1}>
                {t('navigation.signOut')}
              </AppText>
            </Pressable>
          </View>
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
    flexShrink: 0,
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  contextContent: {
    marginBottom: designTokens.spacing.md,
  },
  navArea: {
    flex: 1,
    flexShrink: 1,
    marginBottom: designTokens.spacing.md,
    minHeight: 0,
  },
  navContent: {
    paddingBottom: designTokens.spacing.lg,
  },
  section: {
    marginBottom: designTokens.spacing.lg,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: designTokens.spacing.sm,
    textTransform: 'uppercase',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
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
    flexShrink: 0,
    padding: designTokens.spacing.sm,
  },
  sidebar: {
    borderRightWidth: 1,
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    padding: designTokens.spacing.lg,
    width: '100%',
  },
  signOutButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 0,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
  },
  themeToggleButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 0,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
  },
});
