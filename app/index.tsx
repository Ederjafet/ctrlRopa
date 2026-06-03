import AppShell from '@/components/layout/AppShell';
import { SidebarSection } from '@/components/layout/Sidebar';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import ActionTile from '@/components/ui/ActionTile';
import EmptyState from '@/components/ui/EmptyState';
import EntitySummaryCard from '@/components/ui/EntitySummaryCard';
import MetricCard from '@/components/ui/MetricCard';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccess, canAccessByPermission, isAdmin, isNoAccess } from '@/services/accessControl';
import { getUserDashboard, UserDashboard } from '@/services/dashboardService';
import { canViewLive } from '@/services/livePermissionGuards';
import { resolveLiveActorContext } from '@/services/liveActorResolver';
import { ensureSessionActive, getSession, UserSession } from '@/services/sessionStorage';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type QuickAction = {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  allowed: boolean;
};

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function buildNavSections(session: UserSession | null): SidebarSection[] {
  const liveAllowed = canViewLive(session);
  const customersAllowed = canAccessByPermission(session, 'VIEW_CUSTOMERS');
  const reservationsAllowed =
    canAccess(session, 'DOOR_RESERVATION', 'DO_DOOR_RESERVATION') || liveAllowed;
  const usersAllowed = canAccessByPermission(session, 'MANAGE_USERS') || isAdmin(session);
  const systemAllowed =
    canAccessByPermission(session, 'MANAGE_ROLES') ||
    canAccessByPermission(session, 'MANAGE_BRANCH_CHANNELS') ||
    isAdmin(session);
  const reportsAllowed = canAccessByPermission(session, 'VIEW_REPORTS') || isAdmin(session);
  const appearanceAllowed = isAdmin(session);

  const primaryItems = [
    {
      key: 'home',
      label: 'Inicio',
      route: '/',
      icon: 'space-dashboard' as const,
    },
    liveAllowed
      ? {
          key: 'live',
          label: 'LIVE',
          route: '/live',
          icon: 'live-tv' as const,
        }
      : null,
    customersAllowed
      ? {
          key: 'customers',
          label: 'Clientes',
          route: '/customers',
          icon: 'groups' as const,
        }
      : null,
    reservationsAllowed
      ? {
          key: 'reservations',
          label: 'Reservas',
          route: '/reservations',
          icon: 'bookmark' as const,
        }
      : null,
  ].filter(Boolean);

  const controlItems = [
    usersAllowed
      ? {
          key: 'users',
          label: 'Usuarios',
          route: '/users',
          icon: 'manage-accounts' as const,
        }
      : null,
    systemAllowed
      ? {
          key: 'system',
          label: 'Sistema',
          route: '/system',
          icon: 'settings' as const,
        }
      : null,
    reportsAllowed
      ? {
          key: 'reports',
          label: 'Reportes',
          route: '/reports',
          icon: 'analytics' as const,
        }
      : null,
    appearanceAllowed
      ? {
          key: 'appearance',
          label: 'Configuracion',
          route: '/appearance',
          icon: 'palette' as const,
        }
      : null,
  ].filter(Boolean);
  const developmentItems = [
    appearanceAllowed
      ? {
          key: 'ui-kit',
          label: 'UI Kit',
          route: '/ui-kit',
          icon: 'dashboard-customize' as const,
        }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Operacion', items: primaryItems },
    { title: 'Control', items: controlItems },
    { title: 'Desarrollo', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

function buildQuickActions(session: UserSession | null): QuickAction[] {
  return [
    {
      title: 'Ir a LIVE',
      subtitle: 'Prenda al aire, reservas y seguimiento',
      route: '/live',
      icon: 'live-tv',
      allowed: canViewLive(session),
    },
    {
      title: 'Reservas',
      subtitle: 'Apartados y seguimiento operativo',
      route: '/reservations',
      icon: 'bookmark',
      allowed: canAccess(session, 'DOOR_RESERVATION', 'DO_DOOR_RESERVATION') || canViewLive(session),
    },
    {
      title: 'Clientes',
      subtitle: 'Seguimiento y datos de contacto',
      route: '/customers',
      icon: 'groups',
      allowed: canAccessByPermission(session, 'VIEW_CUSTOMERS'),
    },
    {
      title: 'Usuarios',
      subtitle: 'Administracion de equipo',
      route: '/users',
      icon: 'manage-accounts',
      allowed: canAccessByPermission(session, 'MANAGE_USERS') || isAdmin(session),
    },
    {
      title: 'Sistema',
      subtitle: 'Configuracion operativa',
      route: '/system',
      icon: 'settings',
      allowed:
        canAccessByPermission(session, 'MANAGE_ROLES') ||
        canAccessByPermission(session, 'MANAGE_BRANCH_CHANNELS') ||
        isAdmin(session),
    },
    {
      title: 'Reportes',
      subtitle: 'Lectura de indicadores y movimientos',
      route: '/reports',
      icon: 'analytics',
      allowed: canAccessByPermission(session, 'VIEW_REPORTS') || isAdmin(session),
    },
  ];
}

export default function HomeDashboard() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [loadIssue, setLoadIssue] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const active = await ensureSessionActive();
      const currentSession = await getSession();

      if (cancelled) return;

      setIsLogged(Boolean(active && currentSession));
      setMustChangePassword(Boolean(currentSession?.passwordChangeRequired));
      setSession(currentSession);

      if (active && currentSession && !isNoAccess(currentSession)) {
        try {
          setDashboard(await getUserDashboard());
        } catch (error: any) {
          setLoadIssue(error?.message ?? 'No se pudo cargar el resumen operativo.');
        }
      }

      if (!cancelled) setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const actorContext = useMemo(() => resolveLiveActorContext(session), [session]);
  const navSections = useMemo(() => buildNavSections(session), [session]);
  const quickActions = useMemo(
    () => buildQuickActions(session).filter((action) => action.allowed),
    [session]
  );
  const selectedBranch = dashboard?.branches[0] ?? null;
  const roles = session?.roles.map((role) => role.code).join(', ') || 'Sin rol';

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
        <AppText color={theme.colors.mutedText}>Cargando inicio...</AppText>
      </View>
    );
  }

  if (!isLogged) {
    return <Redirect href="/login" />;
  }

  if (mustChangePassword) {
    return <Redirect href={'/change-password' as any} />;
  }

  if (session && isNoAccess(session)) {
    return (
      <AppShell
        title="Acceso restringido"
        subtitle="Tu usuario no tiene permisos operativos asignados."
        activeRoute="home"
        session={session}
        navSections={[]}
      >
        <EmptyState
          title="Sin acceso operativo"
          message="No se muestra dashboard ni navegacion lateral util para usuarios sin permisos."
          icon="lock"
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Inicio"
      subtitle="Resumen operativo"
      activeRoute="home"
      session={session}
      navSections={navSections}
    >
      <DashboardTemplate
        header={
          <EntitySummaryCard
            title={session?.name || session?.email || 'Usuario'}
            subtitle={session?.email}
            badge={actorContext.actor}
            meta={[
              { label: 'Rol', value: roles },
              { label: 'Empresa', value: session?.companyCode || 'No capturada' },
              { label: 'Sucursal', value: session?.branchName || 'No capturada' },
              { label: 'Estado', value: 'Acceso activo' },
            ]}
          />
        }
        metrics={
          <>

      <SectionHeader
        title="Resumen operativo"
        subtitle={
          selectedBranch
            ? `${selectedBranch.branchName} - ${dashboard?.date}`
            : 'Datos reales disponibles del dashboard actual'
        }
      />
      {loadIssue ? (
        <EmptyState title="Resumen no disponible" message={loadIssue} icon="error-outline" />
      ) : selectedBranch ? (
        <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
          <MetricCard
            label="Reservas de hoy"
            value={money(selectedBranch.money.todayReservations)}
            helper={`${selectedBranch.operations.todayReservationsCount} apartados`}
          />
          <MetricCard
            label="Pendiente por cobrar"
            value={money(selectedBranch.money.pendingCollections)}
            accent={theme.colors.warning}
            helper="Dato operativo existente"
          />
          <MetricCard
            label="Lives activas"
            value={String(selectedBranch.operations.activeLives ?? 0)}
            helper="Sesiones en curso"
          />
          <MetricCard
            label="Inventario disponible"
            value={String(selectedBranch.inventory.availableItems ?? 0)}
            helper="Prendas disponibles"
          />
        </AppResponsiveGrid>
      ) : (
        <EmptyState
          title="Sin resumen por ahora"
          message="No hay sucursales activas asignadas o no hay datos disponibles para este rol."
        />
      )}
          </>
        }
        pendingSections={
          <>
      <SectionHeader title="Pendientes operativos" subtitle="Acciones derivadas de datos reales del dashboard" />
      {selectedBranch?.actions?.length ? (
        <View style={styles.pendingList}>
          {selectedBranch.actions.slice(0, 5).map((action) => (
            <EntitySummaryCard
              key={`${action.label}-${action.route}`}
              title={action.label}
              subtitle={action.route?.startsWith('metric:') ? 'Ver pendientes' : 'Abrir modulo'}
              badge={String(action.count)}
            />
          ))}
        </View>
      ) : (
        <EmptyState title="Sin pendientes por ahora" message="No hay acciones criticas registradas para tu usuario." />
      )}
          </>
        }
        followUpSection={
          <>
      <SectionHeader title="Clientes para seguimiento" subtitle="Se mostraran clientes reales cuando exista una fuente segura para esta vista" />
      <EmptyState
        title="No hay clientes para seguimiento"
        message="PRODUCT-B no crea endpoints nuevos; esta seccion queda lista para datos reales en una fase posterior."
        icon="groups"
      />
          </>
        }
        quickActions={
          <>
      <SectionHeader title="Accesos rapidos" subtitle="Solo se muestran modulos permitidos para tu usuario" />
      {quickActions.length > 0 ? (
        <AppResponsiveGrid tabletColumns={1} desktopColumns={1}>
          {quickActions.map((action) => (
            <ActionTile
              key={action.route}
              title={action.title}
              subtitle={action.subtitle}
              icon={action.icon}
              onPress={() => router.push(action.route as any)}
            />
          ))}
        </AppResponsiveGrid>
      ) : (
        <EmptyState
          title="Sin accesos disponibles"
          message="No hay modulos habilitados para el rol actual."
          icon="lock"
        />
      )}

      <View style={styles.roleSummary}>
        <StatusBadge
          label={
            actorContext.actor === 'SUPERVISOR'
              ? 'Inicio de supervision'
              : actorContext.actor === 'SELLER'
                ? 'Inicio de vendedor'
                : actorContext.actor === 'OPERATOR'
                  ? 'Inicio operativo'
                  : 'Inicio limitado'
          }
          tone={actorContext.actor === 'NO_ACCESS' ? 'danger' : 'info'}
        />
        <AppText variant="caption" color={theme.colors.mutedText}>
          La experiencia visual se deriva de AUTH real y permisos existentes.
        </AppText>
      </View>
          </>
        }
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  pendingList: {
    marginBottom: 8,
  },
  roleSummary: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 24,
    marginTop: 4,
  },
});
