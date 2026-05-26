import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  canAccess,
  canAccessByPermission,
  hasRole,
  isAdmin,
} from '@/services/accessControl';
import { logout as logoutSession, refreshSession } from '@/services/authService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type DashboardAccess = {
  label: string;
  route?: string;
  channelCode?: string;
  permissionCode?: string;
  adminOnly?: boolean;
  pending?: boolean;
};

type DashboardAccessGroup = {
  title: string;
  accesses: DashboardAccess[];
};

const adminMainAccesses: DashboardAccess[] = [
  {
    label: 'Sistema',
    route: '/system',
    permissionCode: 'MANAGE_ROLES',
  },
  {
    label: 'Usuarios',
    route: '/users',
    permissionCode: 'MANAGE_USERS',
  },
  {
    label: 'Sucursales',
    route: '/branches',
    permissionCode: 'MANAGE_BRANCHES',
    adminOnly: true,
  },
  {
    label: 'Catálogos',
    route: '/catalogs',
    permissionCode: 'MANAGE_CATALOGS',
  },
  {
    label: 'Canales / sucursales',
    route: '/channels',
    permissionCode: 'MANAGE_BRANCH_CHANNELS',
  },
  {
    label: 'Apariencia / Branding',
    route: '/appearance',
    adminOnly: true,
  },
];

const operationAccessGroups: DashboardAccessGroup[] = [
  {
    title: 'Inicio',
    accesses: [
      {
        label: 'Mi panel',
        route: '/dashboard',
      },
    ],
  },
  {
    title: 'Venta y Atencion',
    accesses: [
      {
        label: 'En vivo',
        channelCode: 'LIVE',
        permissionCode: 'DO_LIVE_RESERVATION',
        route: '/live',
      },
      {
        label: 'Venta puerta',
        channelCode: 'DOOR_SALE',
        permissionCode: 'DO_DOOR_SALE',
        route: '/door-sale',
      },
      {
        label: 'Crear apartado',
        channelCode: 'DOOR_RESERVATION',
        permissionCode: 'DO_DOOR_RESERVATION',
        route: '/door-reservation',
      },
      {
        label: 'Consultar apartados',
        channelCode: 'DOOR_RESERVATION',
        permissionCode: 'DO_DOOR_RESERVATION',
        route: '/reservations',
      },
      {
        label: 'Clientes',
        permissionCode: 'VIEW_CUSTOMERS',
        route: '/customers',
      },
      {
        label: 'Pagos / Cobros',
        permissionCode: 'VIEW_PAYMENTS',
        route: '/payments',
      },
    ],
  },
  {
    title: 'Inventario y Mercancia',
    accesses: [
      {
        label: 'Inventario',
        permissionCode: 'VIEW_INVENTORY',
        route: '/items',
      },
      {
        label: 'Lotes',
        permissionCode: 'VIEW_INVENTORY',
        route: '/batches',
      },
      {
        label: 'Consignacion',
        channelCode: 'CONSIGNMENT',
        permissionCode: 'MANAGE_CONSIGNMENTS',
        route: '/consignments',
      },
      {
        label: 'Transferencias',
        permissionCode: 'MANAGE_TRANSFERS',
        route: '/transfers',
      },
      {
        label: 'Devoluciones',
        permissionCode: 'MANAGE_RETURNS',
        route: '/returns',
      },
      {
        label: 'Paquetes',
        permissionCode: 'CREATE_CLOSE_CUSTOMER_PACKAGE',
        route: '/customer-packages',
      },
    ],
  },
  {
    title: 'Logistica',
    accesses: [
      {
        label: 'Pedidos',
        permissionCode: 'VIEW_CUSTOMER_ORDERS',
        route: '/customer-orders',
      },
      {
        label: 'Envíos',
        permissionCode: 'MANAGE_SHIPMENTS',
        route: '/shipments',
      },
      {
        label: 'Incidencias',
        permissionCode: 'MANAGE_INCIDENTS',
        route: '/incidents',
      },
    ],
  },
  {
    title: 'Caja y Control',
    accesses: [
      {
        label: 'Cierres de caja',
        permissionCode: 'MANAGE_CASH_CLOSURES',
        route: '/cash-closures',
      },
      {
        label: 'Reembolsos',
        permissionCode: 'MANAGE_REFUNDS',
        route: '/refunds',
      },
      {
        label: 'Historico de movimientos',
        permissionCode: 'VIEW_REPORTS',
        route: '/movement-history',
      },
      {
        label: 'Historial de transmisiones',
        permissionCode: 'VIEW_REPORTS',
        route: '/report-live',
      },
      {
        label: 'Reportes',
        permissionCode: 'VIEW_REPORTS',
        route: '/reports',
      },
    ],
  },
];

function canShowAccess(user: UserSession | null, access: DashboardAccess) {
  if (access.adminOnly) {
    return isAdmin(user);
  }

  if (access.channelCode && access.permissionCode) {
    return canAccess(user, access.channelCode, access.permissionCode);
  }

  if (access.permissionCode) {
    return canAccessByPermission(user, access.permissionCode) || isAdmin(user);
  }

  return true;
}

function DashboardAccessItem({ access }: { access: DashboardAccess }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const disabled = access.pending || !access.route;

  const handlePress = () => {
    if (disabled || !access.route) return;
    router.push(access.route as any);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.accessItem,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
          padding: theme.spacing.md,
        },
      ]}
    >
      <AppText bold>{access.label}</AppText>
      {access.pending ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          Pendiente de construir
        </AppText>
      ) : null}
    </Pressable>
  );
}

function AccessSection({
  title,
  accesses,
  emptyText,
}: {
  title: string;
  accesses: DashboardAccess[];
  emptyText: string;
}) {
  const { theme } = useAppTheme();

  return (
    <AppCard>
      <AppText variant="subtitle" bold>
        {title}
      </AppText>

      <AppResponsiveGrid tabletColumns={2} desktopColumns={3} style={styles.accessList}>
        {accesses.length === 0 ? (
          <AppText color={theme.colors.mutedText}>{emptyText}</AppText>
        ) : (
          accesses.map((access) => (
            <DashboardAccessItem key={access.label} access={access} />
          ))
        )}
      </AppResponsiveGrid>
    </AppCard>
  );
}

function OperationAccessSections({
  groups,
  emptyText,
}: {
  groups: DashboardAccessGroup[];
  emptyText: string;
}) {
  const { theme } = useAppTheme();
  const visibleGroups = groups.filter((group) => group.accesses.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <AppCard>
        <AppText color={theme.colors.mutedText}>{emptyText}</AppText>
      </AppCard>
    );
  }

  return (
    <>
      {visibleGroups.map((group) => (
        <AccessSection
          key={group.title}
          title={group.title}
          accesses={group.accesses}
          emptyText={emptyText}
        />
      ))}
    </>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [user, setUser] = useState<UserSession | null>(null);

  const loadSession = useCallback(async () => {
    const session = await getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    if (session.passwordChangeRequired) {
      router.replace('/change-password' as any);
      return;
    }

    try {
      setUser(await refreshSession());
    } catch (err) {
      console.log(err);
      setUser(session);
    }
  }, [router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const logout = async () => {
    await logoutSession();
    router.replace('/login');
  };

  const isAdminUser = isAdmin(user);
  const canSeeConfiguration = isAdminUser || hasRole(user, 'SUPPORT_TECH');

  const visibleAdminMainAccesses = useMemo(
    () => adminMainAccesses.filter((access) => canShowAccess(user, access)),
    [user]
  );

  const visibleOperationAccessGroups = useMemo(
    () =>
      operationAccessGroups.map((group) => ({
        ...group,
        accesses: group.accesses.filter((access) => canShowAccess(user, access)),
      })),
    [user]
  );

  if (!user) {
    return (
      <AppScreen>
        <AppText>Cargando...</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppText variant="title" bold>
        {canSeeConfiguration ? 'Panel administrador' : 'Panel operativo'}
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Usuario
        </AppText>
        <AppText>{user.name || 'Sin nombre'}</AppText>

        <AppText variant="subtitle" bold style={{ marginTop: 10 }}>
          Sucursal
        </AppText>
        <AppText>{user.branchName || 'Sin sucursal'}</AppText>
      </AppCard>

      {canSeeConfiguration ? (
        <AccessSection
          title="Configuración"
          accesses={visibleAdminMainAccesses}
          emptyText="No hay accesos de configuración disponibles."
        />
      ) : null}

      <AppText variant="subtitle" bold>
        {canSeeConfiguration ? 'Operacion' : 'Accesos rapidos'}
      </AppText>

      <OperationAccessSections
        groups={visibleOperationAccessGroups}
        emptyText="No tienes accesos disponibles para esta sucursal."
      />

      <View style={styles.sessionActions}>
        <AppButton
          title="Cambiar contraseña"
          variant="secondary"
          onPress={() => router.push('/change-password' as any)}
          style={styles.sessionActionButton}
        />
        <AppButton
          title="Cerrar sesión"
          variant="secondary"
          onPress={logout}
          style={styles.sessionActionButton}
        />
      </View>

      <AppText
        variant="caption"
        color={theme.colors.mutedText}
        style={styles.footerNote}
      >
        Los accesos visibles dependen de permisos, canales disponibles en Sistema y canales activos de la sucursal.
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  accessList: {
    marginTop: 10,
  },
  accessItem: {
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 58,
  },
  footerNote: {
    marginTop: 8,
    textAlign: 'center',
  },
  sessionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sessionActionButton: {
    flex: 1,
    minWidth: 180,
  },
});
