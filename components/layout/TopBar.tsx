import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { UserSession } from '@/services/sessionStorage';
import { designTokens } from '@/theme/designTokens';
import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  session?: UserSession | null;
  rightContent?: ReactNode;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
};

export default function TopBar({
  title,
  subtitle,
  session,
  rightContent,
  onMenuPress,
  showMenuButton,
}: Props) {
  const { theme } = useAppTheme();
  const { isPhone, isWideDesktop } = useResponsiveLayout();
  const roleLabel = session?.roles?.map((role) => role.code).join(', ') || 'Sin rol';

  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: designTokens.radius.lg,
          ...designTokens.shadows.card,
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
              borderColor: theme.colors.infoCardBorder,
              borderRadius: designTokens.radius.md,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <MaterialIcons name="menu" size={22} color={theme.colors.accent} />
        </Pressable>
      ) : null}
      <View style={styles.titleBlock}>
        <AppText variant="title" bold>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color={theme.colors.mutedText} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={[styles.userBlock, isPhone ? styles.userBlockCompact : null]}>
        {session ? (
          <>
            <StatusBadge label={roleLabel} tone="info" />
            {isWideDesktop ? (
              <>
                <AppText bold numberOfLines={1}>
                  {session.name || session.email}
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText} numberOfLines={1}>
                  {session.companyCode || 'Empresa'} / {session.branchName}
                </AppText>
              </>
            ) : null}
          </>
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
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  topBar: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.md,
    padding: designTokens.spacing.md,
  },
  userBlock: {
    alignItems: 'flex-end',
    maxWidth: 280,
  },
  userBlockCompact: {
    maxWidth: 120,
  },
});
