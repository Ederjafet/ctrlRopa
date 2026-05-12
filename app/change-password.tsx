import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { changePassword, logout } from '@/services/authService';
import { getPublicSecuritySettings, SecuritySettings } from '@/services/securitySettingsService';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPublicSecuritySettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const policyLines = useMemo(() => {
    if (!settings) return [];

    const lines = [`Minimo ${settings.passwordMinLength} caracteres`];
    if (settings.passwordRequireUppercase) lines.push('Una mayuscula');
    if (settings.passwordRequireLowercase) lines.push('Una minuscula');
    if (settings.passwordRequireNumber) lines.push('Un numero');
    if (settings.passwordRequireSymbol) lines.push('Un simbolo');
    if (settings.passwordHistoryCount > 0) {
      lines.push(`No repetir las ultimas ${settings.passwordHistoryCount}`);
    }

    return lines;
  }, [settings]);

  const save = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Contraseña', 'Captura todos los campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Contraseña', 'La confirmacion no coincide.');
      return;
    }

    setSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Contraseña actualizada', 'Tu contraseña se cambio correctamente.');
      router.replace('/');
    } catch (err: any) {
      Alert.alert('No se pudo cambiar', err?.message || 'Revisa los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const exit = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <AppScreen>
      <AppText variant="title" bold>
        Cambiar contraseña
      </AppText>

      <AppCard>
        <AppText color={theme.colors.mutedText}>
          Debes actualizar tu contraseña para continuar usando el sistema.
        </AppText>
      </AppCard>

      <AppCard>
        <AppInput
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          editable={!saving}
        />

        <AppInput
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          editable={!saving}
        />

        <AppInput
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!saving}
        />

        {policyLines.length > 0 ? (
          <AppText color={theme.colors.mutedText}>{policyLines.join(', ')}</AppText>
        ) : null}
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Guardar contraseña" onPress={save} loading={saving} disabled={saving} />
        <AppButton
          title="Salir"
          variant="secondary"
          onPress={exit}
          disabled={saving}
          style={styles.secondaryAction}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginBottom: 12,
  },
  secondaryAction: {
    marginTop: 10,
  },
});
