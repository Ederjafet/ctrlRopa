import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasRole } from '@/services/accessControl';
import { changeAppLanguage } from '@/services/i18n';
import {
  getLiveAnalyticsEnabled,
  setLiveAnalyticsEnabled,
} from '@/services/liveAnalyticsPreference';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
  const [liveAnalyticsEnabled, setLiveAnalyticsEnabledState] = useState(true);

  useEffect(() => {
    getSession().then(setUser);
    getLiveAnalyticsEnabled().then(setLiveAnalyticsEnabledState);
  }, []);

  const toggleLiveAnalytics = async () => {
    const nextValue = !liveAnalyticsEnabled;
    setLiveAnalyticsEnabledState(nextValue);
    await setLiveAnalyticsEnabled(nextValue);
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        {t('system.title')}
      </AppText>

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

      <AppInfoCard title={t('system.liveAnalyticsTitle')}>
        <AppText>{t('system.liveAnalyticsHelp')}</AppText>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <AppText bold>
              {liveAnalyticsEnabled
                ? t('system.liveAnalyticsEnabled')
                : t('system.liveAnalyticsDisabled')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {liveAnalyticsEnabled
                ? t('system.liveAnalyticsEnabledHelp')
                : t('system.liveAnalyticsDisabledHelp')}
            </AppText>
          </View>
          <AppButton
            title={
              liveAnalyticsEnabled
                ? t('system.liveAnalyticsDisable')
                : t('system.liveAnalyticsEnable')
            }
            variant={liveAnalyticsEnabled ? 'secondary' : 'operation'}
            onPress={toggleLiveAnalytics}
            style={styles.settingButton}
          />
        </View>
      </AppInfoCard>

      <View style={styles.grid}>
        <SystemTile
          title="Roles"
          description="Crea roles y define que permisos existentes incluye cada uno."
          onPress={() => router.push('/system-roles' as any)}
        />
        <SystemTile
          title="Canales operativos"
          description="Activa o apaga globalmente En vivo, Venta puerta, Apartado puerta y Consignación."
          onPress={() => router.push('/system-channels' as any)}
        />
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title="Logs de soporte"
            description="Consulta bitácora técnica de configuración, rutas, usuarios y respuestas HTTP."
            onPress={() => router.push('/system-logs' as any)}
          />
        ) : null}
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title="Seguridad dev"
            description="Parametriza cierre de sesión, intentos fallidos y bloqueo temporal."
            onPress={() => router.push('/system-security' as any)}
          />
        ) : null}
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title="Sesiones y bloqueos"
            description="Desbloquea usuarios y cierra sesiones activas desde soporte."
            onPress={() => router.push('/system-sessions' as any)}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

function SystemTile({ title, description, onPress }: SystemTileProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: pressed ? theme.colors.optionPressedBackground : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}
    >
      <AppText bold>{title}</AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {description}
      </AppText>
    </Pressable>
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
