import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { ApiError } from '@/services/apiClient';
import { getAppearanceSettings } from '@/services/appearanceService';
import { login } from '@/services/authService';
import { consumeAuthNotice } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    getAppearanceSettings()
      .then((settings) => {
        if (!cancelled) setLogoUrl(settings.loginLogoUrl || settings.logoUrl || null);
      })
      .catch(() => {
        if (!cancelled) setLogoUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    consumeAuthNotice().then((notice) => {
      if (!notice) return;
      setMessage(notice);
      Alert.alert('Sesión cerrada', notice);
    });
  }, []);

  const handleLogin = async () => {
    if (isSubmitting) return;

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage('Captura correo y contraseña.');
      return;
    }

    try {
      setMessage('');
      setIsSubmitting(true);

      const session = await login(cleanEmail, password);

      router.replace((session.passwordChangeRequired ? '/change-password' : '/') as any);
    } catch (e: unknown) {
      const friendlyError = getFriendlyError(e);
      setMessage(friendlyError);
      Alert.alert('No se pudo iniciar sesión', friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppScreen style={styles.container}>
      <View style={styles.content}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} resizeMode="contain" style={styles.logo} />
        ) : null}

        <AppText variant="title" bold>
          Iniciar sesión
        </AppText>

        <AppInput
          label="Correo electronico"
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isSubmitting}
        />

        <AppInput
          label="Contraseña"
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />

        <AppButton
          title="Iniciar sesión"
          onPress={handleLogin}
          loading={isSubmitting}
          disabled={isSubmitting}
        />

        {message ? (
          <AppText color="#b00020" style={styles.message}>
            {message}
          </AppText>
        ) : null}
      </View>
    </AppScreen>
  );
}

function getFriendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.message) {
      return error.message;
    }

    if (error.status === 401 || error.status === 403) {
      return 'Credenciales invalidas.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema. Intenta de nuevo.';
    }
  }

  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Revisa que el backend este encendido.';
  }

  return 'No se pudo iniciar sesión.';
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  logo: {
    alignSelf: 'center',
    height: 96,
    marginBottom: 20,
    width: '80%',
  },
  message: {
    marginTop: 20,
  },
});
