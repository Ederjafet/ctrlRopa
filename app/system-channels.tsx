import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getAllSalesChannels,
  SalesChannel,
  updateSalesChannelGlobalEnabled,
} from '@/services/branchChannelService';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, View } from 'react-native';

const CHANNEL_DESCRIPTION_KEYS: Record<string, string> = {
  LIVE: 'systemChannels.liveDescription',
  DOOR_SALE: 'systemChannels.doorSaleDescription',
  DOOR_RESERVATION: 'systemChannels.doorReservationDescription',
  CONSIGNMENT: 'systemChannels.consignmentDescription',
};

function sortChannels(channels: SalesChannel[]) {
  const order = ['LIVE', 'DOOR_SALE', 'DOOR_RESERVATION', 'CONSIGNMENT'];

  return [...channels].sort((a, b) => {
    const aIndex = order.indexOf(a.code);
    const bIndex = order.indexOf(b.code);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}

export default function SystemChannelsScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [originalChannels, setOriginalChannels] = useState<SalesChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    if (channels.length !== originalChannels.length) return true;

    return channels.some((channel) => {
      const original = originalChannels.find((item) => item.id === channel.id);
      return Boolean(original?.globalEnabled) !== Boolean(channel.globalEnabled);
    });
  }, [channels, originalChannels]);

  const saveBlockedReason = useMemo(() => {
    if (loading) return t('systemChannels.waitLoad');
    if (saving) return t('systemChannels.saving');
    if (!hasChanges) return t('systemChannels.noPendingSave');
    return undefined;
  }, [loading, saving, hasChanges, t]);

  const discardBlockedReason = useMemo(() => {
    if (loading) return t('systemChannels.waitLoad');
    if (saving) return 'Se esta guardando la configuración.';
    if (!hasChanges) return t('systemChannels.noPendingDiscard');
    return undefined;
  }, [loading, saving, hasChanges, t]);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = sortChannels(await getAllSalesChannels());
      setChannels(data);
      setOriginalChannels(data.map((channel) => ({ ...channel })));
    } catch (err) {
      console.log(err);
      setError(t('systemChannels.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (id: number) => {
    setChannels((current) =>
      current.map((channel) =>
        channel.id === id
          ? { ...channel, globalEnabled: !Boolean(channel.globalEnabled) }
          : channel
      )
    );
  };

  const resetChanges = () => {
    setChannels(originalChannels.map((channel) => ({ ...channel })));
  };

  const saveChanges = async () => {
    const changedChannels = channels.filter((channel) => {
      const original = originalChannels.find((item) => item.id === channel.id);
      return Boolean(original?.globalEnabled) !== Boolean(channel.globalEnabled);
    });

    if (changedChannels.length === 0) {
      Alert.alert(t('systemChannels.noChangesTitle'), t('systemChannels.noChangesMessage'));
      return;
    }

    setSaving(true);

    try {
      await Promise.all(
        changedChannels.map((channel) =>
          updateSalesChannelGlobalEnabled(channel.id, Boolean(channel.globalEnabled))
        )
      );

      await loadChannels();
      Alert.alert(t('systemChannels.savedTitle'), t('systemChannels.savedMessage'));
    } catch (err) {
      console.log(err);
      Alert.alert(t('systemChannels.saveErrorTitle'), t('systemChannels.saveErrorMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/system" />

      <AppText variant="title" bold>
        {t('systemChannels.title')}
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('systemChannels.globalRuleTitle')}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {t('systemChannels.globalRuleHelp')}
        </AppText>
      </AppCard>

      {error ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{error}</AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('systemChannels.availabilityTitle')}
        </AppText>

        {loading ? (
          <AppText color={theme.colors.mutedText}>{t('systemChannels.loading')}</AppText>
        ) : channels.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{t('systemChannels.empty')}</AppText>
        ) : (
          <View style={styles.channelList}>
            {channels.map((channel) => {
              const enabled = Boolean(channel.globalEnabled);
              const inactive = Boolean(channel.status && channel.status !== 'ACTIVE');

              return (
                <View
                  key={channel.id}
                  style={[
                    styles.channelRow,
                    {
                      borderColor: enabled ? theme.colors.primary : theme.colors.border,
                      backgroundColor: enabled ? theme.colors.infoCardBackground : theme.colors.surface,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                      opacity: inactive ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={styles.channelInfo}>
                    <AppText bold>{channel.name}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {channel.code}
                    </AppText>
                    <AppText color={theme.colors.mutedText}>
                      {t(CHANNEL_DESCRIPTION_KEYS[channel.code] ?? 'systemChannels.defaultDescription')}
                    </AppText>
                    {inactive ? (
                      <AppText variant="caption" color={theme.colors.danger}>
                        {t('systemChannels.inactive')}
                      </AppText>
                    ) : null}
                  </View>

                  <Switch
                    value={enabled}
                    onValueChange={() => toggleChannel(channel.id)}
                    disabled={saving || inactive}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.primary,
                    }}
                    thumbColor={enabled ? theme.colors.accent : theme.colors.surface}
                  />
                </View>
              );
            })}
          </View>
        )}
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={t('systemChannels.saveChanges')}
          onPress={saveChanges}
          loading={saving}
          disabled={loading || saving || !hasChanges}
          disabledReason={saveBlockedReason}
        />

        <AppButton
          title={t('systemChannels.discardChanges')}
          variant="secondary"
          onPress={resetChanges}
          disabled={loading || saving || !hasChanges}
          disabledReason={discardBlockedReason}
          style={{ marginTop: 10 }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  channelList: {
    marginTop: 6,
  },
  channelRow: {
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
    paddingRight: 12,
  },
  actions: {
    marginBottom: 12,
  },
});
