import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import ActionTile from '@/components/ui/ActionTile';
import AppButton from '@/components/ui/AppButton';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasPermission, hasRole } from '@/services/accessControl';
import { changeAppLanguage } from '@/services/i18n';
import { canConfigureSystem } from '@/services/livePermissionGuards';
import {
  DEFAULT_LIVE_LAYOUT_PREFERENCES,
  getLiveLayoutPreferences,
  LiveLayoutPreferences,
  setLiveLayoutPreference,
} from '@/services/liveLayoutPreferences';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

type SystemTileProps = {
  title: string;
  description: string;
  onPress: () => void;
};

export default function SystemScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { i18n, t } = useTranslation('common');
  const [user, setUser] = useState<UserSession | null>(null);
  const [livePreferences, setLivePreferences] = useState<LiveLayoutPreferences>(
    DEFAULT_LIVE_LAYOUT_PREFERENCES
  );
  const navSections = useMemo(() => buildMainNavSections(user), [user]);

  useEffect(() => {
    getSession().then((currentUser) => {
      if (!canConfigureSystem(currentUser)) {
        router.replace('/access-denied');
        return;
      }

      setUser(currentUser);
      getLiveLayoutPreferences(currentUser?.userId).then(setLivePreferences);
    });
  }, [router]);

  const toggleLivePreference = async (key: keyof LiveLayoutPreferences) => {
    const nextValue = !livePreferences[key];
    const nextPreferences = await setLiveLayoutPreference(
      key,
      nextValue,
      user?.userId
    );
    setLivePreferences(nextPreferences);
  };

  return (
    <AppShell
      title={t('system.title')}
      subtitle={t('system.subtitle')}
      contextTitle={t('system.contextTitle')}
      contextSubtitle={getSessionScopeLabel(user)}
      activeRoute="system"
      session={user}
      navSections={navSections}
    >
      <AppInfoCard title={t('system.sensitiveTitle')}>
        <AppText>{t('system.sensitiveHelp')}</AppText>
      </AppInfoCard>

      <AppInfoCard title={t('system.languageTitle')}>
        <AppText>{t('system.languageHelp')}</AppText>
        <View style={styles.languageRow}>
          <Pressable
            onPress={() => void changeAppLanguage('es')}
            style={({ pressed }) => [
              styles.languageOption,
              {
                backgroundColor: pressed
                  ? theme.colors.optionPressedBackground
                  : theme.colors.surface,
                borderColor: i18n.language.startsWith('es')
                  ? theme.colors.accent
                  : theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText bold={i18n.language.startsWith('es')}>
              {t('language.spanish')}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => void changeAppLanguage('en')}
            style={({ pressed }) => [
              styles.languageOption,
              {
                backgroundColor: pressed
                  ? theme.colors.optionPressedBackground
                  : theme.colors.surface,
                borderColor: i18n.language.startsWith('en')
                  ? theme.colors.accent
                  : theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText bold={i18n.language.startsWith('en')}>
              {t('language.english')}
            </AppText>
          </Pressable>
        </View>
      </AppInfoCard>

      <AppInfoCard title={t('system.liveExperienceTitle')}>
        <AppText>{t('system.liveExperienceHelp')}</AppText>
        <LivePreferenceRow
          title={t('system.liveWidgetProductSpotlight')}
          enabled={livePreferences.showProductSpotlight}
          onPress={() => void toggleLivePreference('showProductSpotlight')}
        />
        <LivePreferenceRow
          title={t('system.liveWidgetPresenterView')}
          enabled={livePreferences.showPresenterView}
          onPress={() => void toggleLivePreference('showPresenterView')}
        />
        <LivePreferenceRow
          title={t('system.liveWidgetOperationalState')}
          enabled={livePreferences.showOperationalState}
          onPress={() => void toggleLivePreference('showOperationalState')}
        />
        <LivePreferenceRow
          title={t('system.liveWidgetRoles')}
          enabled={livePreferences.showRoles}
          onPress={() => void toggleLivePreference('showRoles')}
        />
        <LivePreferenceRow
          title={t('system.liveWidgetAnalytics')}
          enabled={livePreferences.showAnalytics}
          onPress={() => void toggleLivePreference('showAnalytics')}
        />
        <LivePreferenceRow
          title={t('system.liveWidgetActivity')}
          enabled={livePreferences.showActivityFeed}
          onPress={() => void toggleLivePreference('showActivityFeed')}
        />
      </AppInfoCard>

      <View style={styles.grid}>
        <SystemTile
          title={t('system.rolesTileTitle')}
          description={t('system.rolesTileHelp')}
          onPress={() => router.push('/system-roles' as any)}
        />
        <SystemTile
          title={t('system.channelsTileTitle')}
          description={t('system.channelsTileHelp')}
          onPress={() => router.push('/system-channels' as any)}
        />
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title={t('system.supportLogsTileTitle')}
            description={t('system.supportLogsTileHelp')}
            onPress={() => router.push('/system-logs' as any)}
          />
        ) : null}
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title={t('system.securityTileTitle')}
            description={t('system.securityTileHelp')}
            onPress={() => router.push('/system-security' as any)}
          />
        ) : null}
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title={t('system.sessionsTileTitle')}
            description={t('system.sessionsTileHelp')}
            onPress={() => router.push('/system-sessions' as any)}
          />
        ) : null}
        {hasPermission(user, 'VIEW_SECURITY_AUDIT') ? (
          <SystemTile
            title={t('system.securityAuditTileTitle')}
            description={t('system.securityAuditTileHelp')}
            onPress={() => router.push('/system-security-audit' as any)}
          />
        ) : null}
      </View>
    </AppShell>
  );
}

function LivePreferenceRow({
  title,
  enabled,
  onPress,
}: {
  title: string;
  enabled: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <AppText bold>{title}</AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {enabled ? t('system.liveWidgetVisible') : t('system.liveWidgetHidden')}
        </AppText>
      </View>
      <AppButton
        title={enabled ? t('system.liveWidgetHide') : t('system.liveWidgetShow')}
        variant={enabled ? 'secondary' : 'operation'}
        onPress={onPress}
        style={styles.settingButton}
      />
    </View>
  );
}

function SystemTile({ title, description, onPress }: SystemTileProps) {
  return (
    <ActionTile title={title} subtitle={description} icon="settings" onPress={onPress} />
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  languageOption: {
    borderWidth: 1,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  settingButton: {
    minWidth: 180,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  settingText: {
    flex: 1,
    minWidth: 220,
  },
  tile: {
    borderWidth: 1,
  },
});
