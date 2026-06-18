import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections } from '@/components/layout/appNavigation';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import ActionTile from '@/components/ui/ActionTile';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
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
import { getLiveEvents, getLivesByBranch, Live } from '@/services/liveService';
import { getReservationsByBranch, Reservation } from '@/services/reservationService';
import { resolveLiveActorContext } from '@/services/liveActorResolver';
import { ensureSessionActive, getSession, UserSession } from '@/services/sessionStorage';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type QuickAction = {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  allowed: boolean;
};

type ActiveLiveSummary = {
  live: Live;
  activeReservationCount?: number;
  operationalSoldCount?: number;
  lastActivityAt?: string | null;
  partialData: boolean;
};

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
}

function liveTimestamp(live: Live) {
  return new Date(live.startedAt || live.createdAt || 0).getTime();
}

function pickActiveLive(lives: Live[]) {
  return [...lives]
    .filter((live) => live.status === 'ACTIVE')
    .sort((a, b) => liveTimestamp(b) - liveTimestamp(a))[0] ?? null;
}

function reservationBelongsToLive(reservation: Reservation, liveId: number) {
  return reservation.liveId === liveId;
}

function getActiveLiveReservationCount(reservations: Reservation[]) {
  return reservations.filter(
    (reservation) =>
      reservation.status === 'ACTIVE' &&
      reservation.liveOperationalStatus !== 'CANCELLED' &&
      reservation.liveOperationalStatus !== 'OPERATIONAL_SOLD'
  ).length;
}

function getOperationalSoldCount(reservations: Reservation[]) {
  return reservations.filter(
    (reservation) => reservation.liveOperationalStatus === 'OPERATIONAL_SOLD'
  ).length;
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatActiveItem(live: Live, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!live.activeItemId) {
    return t('home.activeLiveCard.noActiveItem');
  }

  const name = live.activeItemProductTypeName || live.activeItemCode || `#${live.activeItemId}`;
  const meta = [live.activeItemBrandName, live.activeItemSizeName].filter(Boolean).join(' / ');
  return meta ? `${name} - ${meta}` : name;
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
  const { i18n, t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [loadIssue, setLoadIssue] = useState('');
  const [activeLiveLoading, setActiveLiveLoading] = useState(false);
  const [activeLiveIssue, setActiveLiveIssue] = useState(false);
  const [activeLiveSummary, setActiveLiveSummary] = useState<ActiveLiveSummary | null>(null);

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
  const navSections = useMemo(() => buildMainNavSections(session), [session]);
  const quickActions = useMemo(
    () => buildQuickActions(session).filter((action) => action.allowed),
    [session]
  );
  const selectedBranch = dashboard?.branches[0] ?? null;
  const roles = session?.roles.map((role) => role.code).join(', ') || 'Sin rol';

  useEffect(() => {
    let cancelled = false;

    const loadActiveLive = async () => {
      setActiveLiveIssue(false);
      setActiveLiveSummary(null);

      if (!session || !selectedBranch?.branchId || !canViewLive(session)) {
        return;
      }

      setActiveLiveLoading(true);

      try {
        const lives = await getLivesByBranch(selectedBranch.branchId);
        if (cancelled) return;

        const activeLive = pickActiveLive(lives);
        if (!activeLive) {
          setActiveLiveSummary(null);
          return;
        }

        const [reservationResult, eventResult] = await Promise.allSettled([
          getReservationsByBranch(selectedBranch.branchId),
          getLiveEvents(activeLive.id),
        ]);

        if (cancelled) return;

        const liveReservations =
          reservationResult.status === 'fulfilled'
            ? reservationResult.value.filter((reservation) =>
                reservationBelongsToLive(reservation, activeLive.id)
              )
            : [];
        const latestEvent =
          eventResult.status === 'fulfilled'
            ? [...eventResult.value].sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              )[0]
            : null;

        setActiveLiveSummary({
          live: activeLive,
          activeReservationCount:
            reservationResult.status === 'fulfilled'
              ? getActiveLiveReservationCount(liveReservations)
              : undefined,
          operationalSoldCount:
            reservationResult.status === 'fulfilled'
              ? getOperationalSoldCount(liveReservations)
              : undefined,
          lastActivityAt: latestEvent?.createdAt || activeLive.startedAt || activeLive.createdAt,
          partialData: reservationResult.status === 'rejected' || eventResult.status === 'rejected',
        });
      } catch {
        if (!cancelled) {
          setActiveLiveIssue(true);
        }
      } finally {
        if (!cancelled) {
          setActiveLiveLoading(false);
        }
      }
    };

    loadActiveLive();

    return () => {
      cancelled = true;
    };
  }, [selectedBranch?.branchId, session]);

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
      contextTitle="Resumen operativo"
      contextSubtitle={
        selectedBranch
          ? `${selectedBranch.branchName} · ${dashboard?.date ?? 'Hoy'} · Accesos y pendientes`
          : 'Actividad, pendientes y accesos permitidos para tu usuario'
      }
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
        summary={
          canViewLive(session) ? (
            <ActiveLiveHomeCard
              loading={activeLiveLoading}
              issue={activeLiveIssue}
              summary={activeLiveSummary}
              locale={i18n.language}
              onOpenLive={() => router.push('/live' as any)}
              t={t}
            />
          ) : null
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

function ActiveLiveHomeCard({
  loading,
  issue,
  summary,
  locale,
  onOpenLive,
  t,
}: {
  loading: boolean;
  issue: boolean;
  summary: ActiveLiveSummary | null;
  locale: string;
  onOpenLive: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const { theme } = useAppTheme();

  if (loading) {
    return (
      <AppCard variant="info" style={styles.activeLiveCard}>
        <View style={styles.activeLiveHeader}>
          <View style={styles.activeLiveTitleBlock}>
            <StatusBadge label={t('home.activeLiveCard.checkingStatus')} tone="live" />
            <AppText bold style={styles.activeLiveTitle}>
              {t('home.activeLiveCard.title')}
            </AppText>
          </View>
          <ActivityIndicator />
        </View>
      </AppCard>
    );
  }

  if (issue) {
    return (
      <AppCard variant="warning" style={styles.activeLiveCard}>
        <View style={styles.activeLiveHeader}>
          <View style={styles.activeLiveTitleBlock}>
            <StatusBadge label={t('home.activeLiveCard.unavailableStatus')} tone="warning" />
            <AppText bold style={styles.activeLiveTitle}>
              {t('home.activeLiveCard.title')}
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('home.activeLiveCard.loadError')}
            </AppText>
          </View>
          <AppButton
            title={t('home.activeLiveCard.openLive')}
            variant="secondary"
            onPress={onOpenLive}
            style={styles.activeLiveButton}
          />
        </View>
      </AppCard>
    );
  }

  if (!summary) {
    return null;
  }

  const liveName =
    summary.live.notes?.trim() ||
    t('home.activeLiveCard.liveIdentifier', { id: summary.live.id });
  const lastActivity = formatDateTime(summary.lastActivityAt, locale);

  return (
    <AppCard variant="info" style={styles.activeLiveCard}>
      <View style={styles.activeLiveHeader}>
        <View style={styles.activeLiveTitleBlock}>
          <StatusBadge label={t('home.activeLiveCard.liveStatus')} tone="live" />
          <AppText bold style={styles.activeLiveTitle} numberOfLines={2}>
            {liveName}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('home.activeLiveCard.subtitle')}
          </AppText>
        </View>
        <AppButton
          title={t('home.activeLiveCard.openLive')}
          variant="primary"
          onPress={onOpenLive}
          style={styles.activeLiveButton}
        />
      </View>

      <View style={styles.activeLiveFacts}>
        <View style={[styles.activeLiveFact, { borderColor: theme.colors.borderSubtle }]}>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('home.activeLiveCard.activeItemLabel')}
          </AppText>
          <AppText bold numberOfLines={2}>
            {formatActiveItem(summary.live, t)}
          </AppText>
        </View>
        {summary.activeReservationCount !== undefined ? (
          <View style={[styles.activeLiveFact, { borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('home.activeLiveCard.activeReservationsLabel')}
            </AppText>
            <AppText bold>{String(summary.activeReservationCount)}</AppText>
          </View>
        ) : null}
        {summary.operationalSoldCount !== undefined ? (
          <View style={[styles.activeLiveFact, { borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('home.activeLiveCard.operationalSoldLabel')}
            </AppText>
            <AppText bold>{String(summary.operationalSoldCount)}</AppText>
          </View>
        ) : null}
        {lastActivity ? (
          <View style={[styles.activeLiveFact, { borderColor: theme.colors.borderSubtle }]}>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('home.activeLiveCard.lastActivityLabel')}
            </AppText>
            <AppText bold numberOfLines={1}>
              {lastActivity}
            </AppText>
          </View>
        ) : null}
      </View>

      {summary.partialData ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          {t('home.activeLiveCard.partialData')}
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  activeLiveButton: {
    minWidth: 132,
  },
  activeLiveCard: {
    gap: 12,
  },
  activeLiveFact: {
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 150,
    padding: 12,
  },
  activeLiveFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activeLiveHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  activeLiveTitle: {
    fontSize: 20,
  },
  activeLiveTitleBlock: {
    flex: 1,
    gap: 6,
    minWidth: 220,
  },
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
