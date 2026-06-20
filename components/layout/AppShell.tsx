import Sidebar, { SidebarSection } from '@/components/layout/Sidebar';
import { SidebarNavItemConfig } from '@/components/layout/SidebarNavItem';
import TopBar from '@/components/layout/TopBar';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { logout } from '@/services/authService';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  subtitle?: string;
  metadata?: string;
  eyebrow?: string;
  contextTitle?: string;
  contextSubtitle?: string;
  contextMetadata?: string;
  activeRoute?: string;
  session?: UserSession | null;
  navSections: SidebarSection[];
  rightContent?: ReactNode;
  sidebarContext?: ReactNode;
  sidebarScrollStorageKey?: string;
  compactHeader?: boolean;
  children: ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  metadata,
  eyebrow,
  contextTitle,
  contextSubtitle,
  contextMetadata,
  activeRoute,
  session,
  navSections,
  rightContent,
  sidebarContext,
  sidebarScrollStorageKey,
  compactHeader,
  children,
}: Props) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { width, isPhone, isWideDesktop, contentMaxWidth } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const showSidebar = isWideDesktop;
  const resolvedContentMaxWidth = contentMaxWidth ?? designTokens.layout.contentMaxWidth;
  const drawerWidth = isPhone
    ? Math.min(width * 0.85, designTokens.layout.drawerWidthMobile)
    : designTokens.layout.drawerWidthTablet;
  const topBarTitle = showSidebar && contextTitle ? contextTitle : title;
  const topBarSubtitle = showSidebar && contextTitle ? contextSubtitle : subtitle;
  const topBarMetadata = showSidebar && contextTitle ? contextMetadata : metadata;
  const resolvedSidebarScrollStorageKey = sidebarScrollStorageKey
    ?? (session?.userId ? `appmoda.sidebar.scroll.${session.userId}` : undefined);

  const navigate = (item: SidebarNavItemConfig) => {
    if (!item.route || item.disabled) return;
    setMenuOpen(false);
    router.push(item.route as any);
  };

  const handleSignOut = async () => {
    await logout();
    setMenuOpen(false);
    router.replace('/login');
  };

  const renderSidebar = (mobile = false) => (
    <Sidebar
      sections={navSections}
      activeRoute={activeRoute}
      onNavigate={navigate}
      session={session}
      contextContent={sidebarContext}
      scrollStorageKey={resolvedSidebarScrollStorageKey}
      onClose={mobile ? () => setMenuOpen(false) : undefined}
      onSignOut={handleSignOut}
    />
  );

  return (
    <View style={[styles.shell, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.ambientPanel,
          {
            backgroundColor: theme.colors.backgroundElevated,
            borderColor: theme.colors.borderSubtle,
          },
        ]}
      />
      {showSidebar ? <View style={styles.fixedSidebar}>{renderSidebar(false)}</View> : null}
      <View style={styles.mainPane}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              maxWidth: showSidebar ? resolvedContentMaxWidth : contentMaxWidth,
              paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + theme.spacing.lg,
              paddingHorizontal: showSidebar
                ? designTokens.layout.pagePaddingDesktop
                : isPhone
                  ? designTokens.layout.pagePaddingMobile
                  : designTokens.layout.pagePaddingTablet,
              paddingTop: Math.max(insets.top, theme.spacing.lg) + theme.spacing.md,
            },
          ]}
        >
          <TopBar
            title={topBarTitle}
            subtitle={topBarSubtitle}
            metadata={topBarMetadata}
            eyebrow={eyebrow}
            session={session}
            rightContent={rightContent}
            showMenuButton={!showSidebar}
            onMenuPress={() => setMenuOpen(true)}
            compact={compactHeader}
          />
          {children}
        </ScrollView>
      </View>
      <Modal visible={!showSidebar && menuOpen} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}
            onPress={() => setMenuOpen(false)}
          />
          <View style={[styles.mobileSidebar, { width: drawerWidth }]}>{renderSidebar(true)}</View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    width: '100%',
  },
  fixedSidebar: {
    alignSelf: 'stretch',
    flexShrink: 0,
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    width: designTokens.layout.sidebarWidth,
  },
  ambientPanel: {
    borderBottomWidth: 1,
    height: 188,
    left: 0,
    opacity: 0.82,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mainPane: {
    flex: 1,
    minWidth: 0,
  },
  mobileSidebar: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalRoot: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
});
