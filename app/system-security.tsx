import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getSecuritySettings,
  SecuritySettings,
  updateSecuritySettings,
} from '@/services/securitySettingsService';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, View } from 'react-native';

type FormState = {
  sessionTimeoutMinutes: string;
  maxLoginAttempts: string;
  loginLockoutMinutes: string;
  passwordMinLength: string;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
  passwordExpirationDays: string;
  passwordHistoryCount: string;
  absoluteSessionTimeoutHours: string;
};

function toForm(settings: SecuritySettings): FormState {
  return {
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes),
    maxLoginAttempts: String(settings.maxLoginAttempts),
    loginLockoutMinutes: String(settings.loginLockoutMinutes),
    passwordMinLength: String(settings.passwordMinLength),
    passwordRequireUppercase: settings.passwordRequireUppercase,
    passwordRequireLowercase: settings.passwordRequireLowercase,
    passwordRequireNumber: settings.passwordRequireNumber,
    passwordRequireSymbol: settings.passwordRequireSymbol,
    passwordExpirationDays: String(settings.passwordExpirationDays),
    passwordHistoryCount: String(settings.passwordHistoryCount),
    absoluteSessionTimeoutHours: String(settings.absoluteSessionTimeoutHours),
  };
}

function toNumber(value: string) {
  return Number(value.replace(/[^0-9]/g, ''));
}

export default function SystemSecurityScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const [form, setForm] = useState<FormState>({
    sessionTimeoutMinutes: '30',
    maxLoginAttempts: '5',
    loginLockoutMinutes: '15',
    passwordMinLength: '8',
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSymbol: true,
    passwordExpirationDays: '90',
    passwordHistoryCount: '5',
    absoluteSessionTimeoutHours: '12',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validationMessage = useMemo(() => {
    const timeout = toNumber(form.sessionTimeoutMinutes);
    const attempts = toNumber(form.maxLoginAttempts);
    const lockout = toNumber(form.loginLockoutMinutes);
    const passwordMinLength = toNumber(form.passwordMinLength);
    const expirationDays = toNumber(form.passwordExpirationDays);
    const historyCount = toNumber(form.passwordHistoryCount);
    const absoluteHours = toNumber(form.absoluteSessionTimeoutHours);

    if (timeout < 5 || timeout > 720) return t('securitySettings.validationSessionTimeout');
    if (attempts < 3 || attempts > 20) return t('securitySettings.validationMaxAttempts');
    if (lockout < 1 || lockout > 1440) return t('securitySettings.validationLockout');
    if (passwordMinLength < 6 || passwordMinLength > 64) return t('securitySettings.validationPasswordMin');
    if (expirationDays < 0 || expirationDays > 365) return t('securitySettings.validationExpiration');
    if (historyCount < 0 || historyCount > 20) return t('securitySettings.validationHistory');
    if (absoluteHours < 0 || absoluteHours > 720) return t('securitySettings.validationAbsolute');

    return null;
  }, [form, t]);

  const saveBlockedReason = useMemo(() => {
    if (loading) return t('securitySettings.waitLoading');
    if (saving) return t('securitySettings.savingReason');
    if (validationMessage) return validationMessage;
    return undefined;
  }, [loading, saving, validationMessage, t]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    try {
      const settings = await getSecuritySettings();
      setForm(toForm(settings));
    } catch (err: any) {
      Alert.alert(t('securitySettings.loadErrorTitle'), err?.message || t('securitySettings.loadErrorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value.replace(/[^0-9]/g, ''),
    }));
  };

  const toggleField = (field: keyof FormState) => {
    setForm((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const save = async () => {
    if (validationMessage) {
      Alert.alert(t('securitySettings.validationTitle'), validationMessage);
      return;
    }

    setSaving(true);

    try {
      const settings = await updateSecuritySettings({
        sessionTimeoutMinutes: toNumber(form.sessionTimeoutMinutes),
        maxLoginAttempts: toNumber(form.maxLoginAttempts),
        loginLockoutMinutes: toNumber(form.loginLockoutMinutes),
        passwordMinLength: toNumber(form.passwordMinLength),
        passwordRequireUppercase: form.passwordRequireUppercase,
        passwordRequireLowercase: form.passwordRequireLowercase,
        passwordRequireNumber: form.passwordRequireNumber,
        passwordRequireSymbol: form.passwordRequireSymbol,
        passwordExpirationDays: toNumber(form.passwordExpirationDays),
        passwordHistoryCount: toNumber(form.passwordHistoryCount),
        absoluteSessionTimeoutHours: toNumber(form.absoluteSessionTimeoutHours),
      });

      setForm(toForm(settings));
      Alert.alert(t('securitySettings.savedTitle'), t('securitySettings.savedMessage'));
    } catch (err: any) {
      Alert.alert(t('securitySettings.saveErrorTitle'), err?.message || t('securitySettings.saveErrorMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShellPage
      title={t('securitySettings.title')}
      subtitle={t('securitySettings.subtitle')}
      activeRoute="system-security"
    >

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('securitySettings.parametersTitle')}
        </AppText>
        <AppText color={theme.colors.mutedText}>
          {t('securitySettings.parametersHelp')}
        </AppText>
      </AppCard>

      <AppCard>
        <AppInput
          label={t('securitySettings.sessionTimeout')}
          value={form.sessionTimeoutMinutes}
          onChangeText={(value) => updateField('sessionTimeoutMinutes', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label={t('securitySettings.passwordMinLength')}
          value={form.passwordMinLength}
          onChangeText={(value) => updateField('passwordMinLength', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label={t('securitySettings.passwordExpirationDays')}
          value={form.passwordExpirationDays}
          onChangeText={(value) => updateField('passwordExpirationDays', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label={t('securitySettings.passwordHistoryCount')}
          value={form.passwordHistoryCount}
          onChangeText={(value) => updateField('passwordHistoryCount', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <PolicySwitch
          label={t('securitySettings.requireUppercase')}
          value={form.passwordRequireUppercase}
          onValueChange={() => toggleField('passwordRequireUppercase')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label={t('securitySettings.requireLowercase')}
          value={form.passwordRequireLowercase}
          onValueChange={() => toggleField('passwordRequireLowercase')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label={t('securitySettings.requireNumber')}
          value={form.passwordRequireNumber}
          onValueChange={() => toggleField('passwordRequireNumber')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label={t('securitySettings.requireSymbol')}
          value={form.passwordRequireSymbol}
          onValueChange={() => toggleField('passwordRequireSymbol')}
          disabled={loading || saving}
        />

        <AppInput
          label={t('securitySettings.maxLoginAttempts')}
          value={form.maxLoginAttempts}
          onChangeText={(value) => updateField('maxLoginAttempts', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label={t('securitySettings.loginLockoutMinutes')}
          value={form.loginLockoutMinutes}
          onChangeText={(value) => updateField('loginLockoutMinutes', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label={t('securitySettings.absoluteSessionTimeout')}
          value={form.absoluteSessionTimeoutHours}
          onChangeText={(value) => updateField('absoluteSessionTimeoutHours', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        {validationMessage ? (
          <AppText color={theme.colors.danger}>{validationMessage}</AppText>
        ) : null}
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title={saving ? t('securitySettings.saving') : t('securitySettings.save')}
          onPress={save}
          loading={saving}
          disabled={loading || saving || Boolean(validationMessage)}
          disabledReason={saveBlockedReason}
        />
        <AppButton
          title={t('securitySettings.reload')}
          variant="secondary"
          onPress={loadSettings}
          disabled={loading || saving}
          style={styles.secondaryAction}
        />
      </View>
    </AppShellPage>
  );
}

function PolicySwitch({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: () => void;
  disabled: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.switchRow}>
      <AppText>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={value ? theme.colors.accent : theme.colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginBottom: 12,
  },
  secondaryAction: {
    marginTop: 10,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
