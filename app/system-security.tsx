import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getSecuritySettings,
  SecuritySettings,
  updateSecuritySettings,
} from '@/services/securitySettingsService';
import { useEffect, useMemo, useState } from 'react';
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

    if (timeout < 5 || timeout > 720) return 'El cierre de sesión debe estar entre 5 y 720 minutos.';
    if (attempts < 3 || attempts > 20) return 'Los intentos de login deben estar entre 3 y 20.';
    if (lockout < 1 || lockout > 1440) return 'El bloqueo temporal debe estar entre 1 y 1440 minutos.';
    if (passwordMinLength < 6 || passwordMinLength > 64) return 'La longitud minima de contraseña debe estar entre 6 y 64.';
    if (expirationDays < 0 || expirationDays > 365) return 'La expiracion de contraseña debe estar entre 0 y 365 dias.';
    if (historyCount < 0 || historyCount > 20) return 'El historial de contraseñas debe estar entre 0 y 20.';
    if (absoluteHours < 0 || absoluteHours > 720) return 'La sesión maxima absoluta debe estar entre 0 y 720 horas.';

    return null;
  }, [form]);

  const saveBlockedReason = useMemo(() => {
    if (loading) return 'Espera a que termine de cargar la configuración.';
    if (saving) return 'Se estan guardando los parametros.';
    if (validationMessage) return validationMessage;
    return undefined;
  }, [loading, saving, validationMessage]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);

    try {
      const settings = await getSecuritySettings();
      setForm(toForm(settings));
    } catch (err: any) {
      Alert.alert('Seguridad dev', err?.message || 'No se pudo cargar la configuración.');
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
      Alert.alert('Revisa los valores', validationMessage);
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
      Alert.alert('Seguridad actualizada', 'Los parametros se guardaron correctamente.');
    } catch (err: any) {
      Alert.alert('No se pudo guardar', err?.message || 'Revisa tu conexión o permisos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/system" />

      <AppText variant="title" bold>
        Seguridad dev
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Parametros operativos
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Solo soporte tecnico puede modificar estos valores. Aplican al cierre por
          inactividad y al bloqueo temporal por intentos fallidos.
        </AppText>
      </AppCard>

      <AppCard>
        <AppInput
          label="Cerrar sesión por inactividad (minutos)"
          value={form.sessionTimeoutMinutes}
          onChangeText={(value) => updateField('sessionTimeoutMinutes', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label="Longitud minima de contraseña"
          value={form.passwordMinLength}
          onChangeText={(value) => updateField('passwordMinLength', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label="Expirar contraseña cada (dias, 0 desactiva)"
          value={form.passwordExpirationDays}
          onChangeText={(value) => updateField('passwordExpirationDays', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label="No reutilizar ultimas contraseñas"
          value={form.passwordHistoryCount}
          onChangeText={(value) => updateField('passwordHistoryCount', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <PolicySwitch
          label="Requerir mayuscula"
          value={form.passwordRequireUppercase}
          onValueChange={() => toggleField('passwordRequireUppercase')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label="Requerir minuscula"
          value={form.passwordRequireLowercase}
          onValueChange={() => toggleField('passwordRequireLowercase')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label="Requerir numero"
          value={form.passwordRequireNumber}
          onValueChange={() => toggleField('passwordRequireNumber')}
          disabled={loading || saving}
        />
        <PolicySwitch
          label="Requerir simbolo"
          value={form.passwordRequireSymbol}
          onValueChange={() => toggleField('passwordRequireSymbol')}
          disabled={loading || saving}
        />

        <AppInput
          label="Intentos fallidos antes de bloquear"
          value={form.maxLoginAttempts}
          onChangeText={(value) => updateField('maxLoginAttempts', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label="Tiempo de bloqueo temporal (minutos)"
          value={form.loginLockoutMinutes}
          onChangeText={(value) => updateField('loginLockoutMinutes', value)}
          keyboardType="number-pad"
          editable={!loading && !saving}
        />

        <AppInput
          label="Sesión maxima absoluta (horas, 0 desactiva)"
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
          title={saving ? 'Guardando...' : 'Guardar parametros'}
          onPress={save}
          loading={saving}
          disabled={loading || saving || Boolean(validationMessage)}
          disabledReason={saveBlockedReason}
        />
        <AppButton
          title="Recargar"
          variant="secondary"
          onPress={loadSettings}
          disabled={loading || saving}
          style={styles.secondaryAction}
        />
      </View>
    </AppScreen>
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
