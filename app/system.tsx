import AppBackButton from '@/components/ui/AppBackButton';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { hasRole } from '@/services/accessControl';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type SystemTileProps = {
  title: string;
  description: string;
  onPress: () => void;
};

export default function SystemScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    getSession().then(setUser);
  }, []);

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Sistema
      </AppText>

      <AppInfoCard title="Configuración sensible">
        <AppText>
          Se usa para roles, permisos asignables y parametros base. Los permisos no se crean desde la app.
        </AppText>
      </AppInfoCard>

      <View style={styles.grid}>
        <SystemTile
          title="Roles"
          description="Crea roles y define que permisos existentes incluye cada uno."
          onPress={() => router.push('/system-roles' as any)}
        />
        <SystemTile
          title="Canales operativos"
          description="Activa o apaga globalmente Live, Venta puerta, Apartado puerta y Consignacion."
          onPress={() => router.push('/system-channels' as any)}
        />
        {hasRole(user, 'SUPPORT_TECH') ? (
          <SystemTile
            title="Logs de soporte"
            description="Consulta bitacora tecnica de configuración, rutas, usuarios y respuestas HTTP."
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
            title="Sesiónes y bloqueos"
            description="Desbloquea usuarios y cierra sesiónes activas desde soporte."
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
  tile: {
    borderWidth: 1,
  },
});
