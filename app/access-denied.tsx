import AppButton from '@/components/ui/AppButton';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function AccessDeniedScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <AppScreen>
      <View style={styles.content}>
        <AppText variant="title" bold color={theme.colors.danger}>
          Acceso denegado
        </AppText>

        <AppText style={styles.message}>
          No tienes permisos para acceder a esta pantalla o el canal no esta habilitado.
        </AppText>

        <AppButton title="Volver al inicio" variant="menu" onPress={() => router.replace('/')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
});
