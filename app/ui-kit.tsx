import AppShell from '@/components/layout/AppShell';
import { SidebarSection } from '@/components/layout/Sidebar';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import DetailTemplate from '@/components/templates/DetailTemplate';
import ListTemplate from '@/components/templates/ListTemplate';
import MonitoringTemplate from '@/components/templates/MonitoringTemplate';
import OperationalTemplate from '@/components/templates/OperationalTemplate';
import ActionTile from '@/components/ui/ActionTile';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppNoticeDropdown from '@/components/ui/AppNoticeDropdown';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import EntitySummaryCard from '@/components/ui/EntitySummaryCard';
import MetricCard from '@/components/ui/MetricCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccess, canAccessByPermission, isAdmin, isNoAccess } from '@/services/accessControl';
import { canViewLive } from '@/services/livePermissionGuards';
import { ensureSessionActive, getSession, UserSession } from '@/services/sessionStorage';
import { designTokens, viewVariants } from '@/theme/designTokens';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

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
  const adminAllowed = isAdmin(session);

  const primaryItems = [
    { key: 'home', label: 'Inicio', route: '/', icon: 'space-dashboard' as const },
    liveAllowed ? { key: 'live', label: 'LIVE', route: '/live', icon: 'live-tv' as const } : null,
    customersAllowed
      ? { key: 'customers', label: 'Clientes', route: '/customers', icon: 'groups' as const }
      : null,
    reservationsAllowed
      ? { key: 'reservations', label: 'Reservas', route: '/reservations', icon: 'bookmark' as const }
      : null,
  ].filter(Boolean);

  const controlItems = [
    usersAllowed
      ? { key: 'users', label: 'Usuarios', route: '/users', icon: 'manage-accounts' as const }
      : null,
    systemAllowed
      ? { key: 'system', label: 'Sistema', route: '/system', icon: 'settings' as const }
      : null,
    reportsAllowed
      ? { key: 'reports', label: 'Reportes', route: '/reports', icon: 'analytics' as const }
      : null,
  ].filter(Boolean);
  const developmentItems = [
    adminAllowed
      ? { key: 'ui-kit', label: 'UI Kit', route: '/ui-kit', icon: 'dashboard-customize' as const }
      : null,
  ].filter(Boolean);

  return [
    { title: 'Operacion', items: primaryItems },
    { title: 'Control', items: controlItems },
    { title: 'Desarrollo', items: developmentItems },
  ].filter((section) => section.items.length > 0) as SidebarSection[];
}

export default function UiKitPreview() {
  const {
    theme,
    themeMode,
    toggleThemeMode,
    visualPresetId,
    designPresets,
    setVisualPresetId,
  } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const active = await ensureSessionActive();
      const currentSession = await getSession();

      if (cancelled) return;

      setIsLogged(Boolean(active && currentSession));
      setSession(currentSession);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const navSections = useMemo(() => buildNavSections(session), [session]);

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
        <AppText color={theme.colors.mutedText}>Cargando UI Kit...</AppText>
      </View>
    );
  }

  if (!isLogged) {
    return <Redirect href="/login" />;
  }

  if (!isAdmin(session) || isNoAccess(session)) {
    return (
      <AppShell
        title="UI Kit"
        subtitle="Catalogo interno de componentes y templates"
        contextTitle="Catalogo UI"
        contextSubtitle="Componentes, tokens y templates internos"
        activeRoute="ui-kit"
        session={session}
        navSections={navSections}
      >
        <EmptyState
          title="Acceso restringido"
          message="El catalogo UI Kit es una vista interna para administracion y desarrollo."
          icon="lock"
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="UI Kit"
      subtitle="Catalogo interno de componentes y templates"
      contextTitle="Catalogo UI"
      contextSubtitle="Componentes, tokens y templates internos"
      activeRoute="ui-kit"
      session={session}
      navSections={navSections}
    >
      <SectionHeader
        title="Datos de ejemplo para preview visual"
        subtitle="Estos datos solo viven en /ui-kit; no se usan en pantallas reales."
      />

      <SectionHeader
        title="Identidad visual"
        subtitle="Selector local de plantilla visual. Persistencia por cliente/tenant queda pendiente."
      />
      <View style={styles.previewCard}>
        <View style={styles.themePreviewHeader}>
          <View style={styles.previewTextBlock}>
            <AppText bold>Plantilla visual activa</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Esta configuracion se guarda localmente en esta fase.
            </AppText>
          </View>
          <StatusBadge
            label={designPresets.find((preset) => preset.id === visualPresetId)?.label ?? 'Preset'}
            tone="role"
          />
        </View>
        <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
          {designPresets
            .filter((preset) => preset.active)
            .map((preset) => (
              <AppCard
                key={preset.id}
                variant={preset.id === visualPresetId ? 'selected' : 'subtle'}
                style={styles.presetCard}
              >
                <View style={styles.themePreviewHeader}>
                  <View style={styles.previewTextBlock}>
                    <AppText bold>{preset.label}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {preset.description}
                    </AppText>
                  </View>
                  {preset.id === visualPresetId ? <StatusBadge label="Activo" tone="success" /> : null}
                </View>
                <View style={styles.presetSwatches}>
                  {[
                    preset.colors[theme.isDark ? 'dark' : 'light'].primary,
                    preset.colors[theme.isDark ? 'dark' : 'light'].accent,
                    preset.colors[theme.isDark ? 'dark' : 'light'].success,
                    preset.colors[theme.isDark ? 'dark' : 'light'].danger,
                  ].map((color) => (
                    <View key={color} style={[styles.presetSwatch, { backgroundColor: color }]} />
                  ))}
                </View>
                <AppButton
                  title={preset.id === visualPresetId ? 'Plantilla activa' : 'Usar plantilla'}
                  variant={preset.id === visualPresetId ? 'neutral' : 'secondary'}
                  onPress={() => setVisualPresetId(preset.id)}
                />
              </AppCard>
            ))}
        </AppResponsiveGrid>
      </View>

      <SectionHeader title="Design tokens" subtitle="Colores, radios, sombras y spacing base" />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={4}>
        {Object.entries(designTokens.colors).slice(0, 12).map(([name, color]) => (
          <AppCard key={name} style={styles.tokenCard}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <AppText bold>{name}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {color}
            </AppText>
          </AppCard>
        ))}
      </AppResponsiveGrid>

      <SectionHeader
        title="Tokens semanticos del tema activo"
        subtitle="Superficies, texto, inputs y estados usados por AppShell, LIVE y detalle"
      />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={4}>
        {[
          ['background', theme.colors.background],
          ['surface', theme.colors.surface],
          ['surfaceAlt', theme.colors.surfaceAlt],
          ['surfaceMuted', theme.colors.surfaceMuted],
          ['textPrimary', theme.colors.textPrimary],
          ['textSecondary', theme.colors.textSecondary],
          ['textMuted', theme.colors.textMuted],
          ['inputBackground', theme.colors.inputBackground],
          ['inputText', theme.colors.inputText],
          ['inputPlaceholder', theme.colors.inputPlaceholder],
          ['disabledBackground', theme.colors.disabledBackground],
          ['disabledText', theme.colors.disabledText],
        ].map(([name, color]) => (
          <AppCard key={name} style={styles.tokenCard}>
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: color,
                  borderColor: theme.colors.borderStrong,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            />
            <AppText bold>{name}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {color}
            </AppText>
          </AppCard>
        ))}
      </AppResponsiveGrid>

      <SectionHeader
        title="Comparativo claro / oscuro"
        subtitle="Referencia rapida para detectar contraste bajo antes de migrar pantallas"
      />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
        {[
          { label: 'Light', palette: designTokens.colors },
          { label: 'Dark', palette: designTokens.darkColors },
        ].map(({ label, palette }) => (
          <AppCard key={label} style={styles.previewCard}>
            <View style={styles.themePreviewHeader}>
              <AppText bold>{label}</AppText>
              <StatusBadge label={label === 'Dark' ? 'dark' : 'light'} tone="info" />
            </View>
            <View style={[styles.themePreviewCanvas, { backgroundColor: palette.background }]}>
              <View
                style={[
                  styles.themePreviewPanel,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <AppText color={palette.textPrimary} bold>
                  Card premium
                </AppText>
                <AppText variant="caption" color={palette.textSecondary}>
                  Texto secundario legible y con menor jerarquia.
                </AppText>
                <View style={styles.inlineList}>
                  <StatusBadge label="Disponible" tone="success" />
                  <StatusBadge label="Reservada" tone="reserved" />
                  <StatusBadge label="Bloqueada" />
                </View>
              </View>
            </View>
          </AppCard>
        ))}
      </AppResponsiveGrid>

      <AppResponsiveGrid tabletColumns={3} desktopColumns={3}>
        <EntitySummaryCard
          title="Radius"
          subtitle="Escala visual"
          meta={Object.entries(designTokens.radius).map(([label, value]) => ({
            label,
            value: String(value),
          }))}
        />
        <EntitySummaryCard
          title="Spacing"
          subtitle="Ritmo de layout"
          meta={Object.entries(designTokens.spacing).map(([label, value]) => ({
            label,
            value: String(value),
          }))}
        />
        <EntitySummaryCard
          title="Layout"
          subtitle="Admin shell"
          meta={[
            { label: 'Sidebar', value: String(designTokens.layout.sidebarWidth) },
            { label: 'Max width', value: String(designTokens.layout.contentMaxWidth) },
            { label: 'Gap', value: String(designTokens.layout.cardGap) },
          ]}
        />
      </AppResponsiveGrid>

      <SectionHeader title="Componentes UI" subtitle="Piezas base del UI Kit interno" />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        <AppCard style={styles.previewCard}>
          <SectionHeader
            title="Tema activo"
            subtitle="El toggle vive en el TopBar y se guarda localmente"
          />
          <StatusBadge label={themeMode === 'DARK' ? 'Dark theme' : 'Light theme'} tone="info" />
          <AppButton
            title={themeMode === 'DARK' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
            variant="neutral"
            onPress={toggleThemeMode}
          />
        </AppCard>
        <AppCard style={styles.previewCard}>
          <SectionHeader title="Button variants" subtitle="Jerarquia visual base" />
          <AppButton title="Primary" variant="primary" onPress={() => undefined} />
          <AppButton title="Secondary" variant="secondary" onPress={() => undefined} />
          <AppButton title="Neutral" variant="neutral" onPress={() => undefined} />
          <AppButton title="Ghost" variant="ghost" onPress={() => undefined} />
          <AppButton title="Danger" variant="danger" onPress={() => undefined} />
          <AppButton
            title="Disabled"
            variant="primary"
            disabled
            disabledReason="Preview de accion bloqueada."
            onPress={() => undefined}
          />
        </AppCard>
        <AppCard>
          <SectionHeader title="StatusBadge" />
          <View style={styles.inlineList}>
            <StatusBadge label="Neutral" />
            <StatusBadge label="Success" tone="success" />
            <StatusBadge label="Warning" tone="warning" />
            <StatusBadge label="Danger" tone="danger" />
            <StatusBadge label="Info" tone="info" />
          </View>
        </AppCard>
        <AppCard variant="elevated" style={styles.previewCard}>
          <SectionHeader title="Card variants" subtitle="Superficies listas para pantallas reales" />
          <View
            style={[
              styles.surfacePreview,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <AppText bold>Subtle</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Contexto de baja prioridad.
            </AppText>
          </View>
          <View
            style={[
              styles.surfacePreview,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.accent,
                borderLeftColor: theme.colors.accent,
                borderLeftWidth: 4,
              },
            ]}
          >
            <AppText bold>Selected</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Registro o modulo activo.
            </AppText>
          </View>
          <View style={styles.inlineList}>
            <StatusBadge label="warning" tone="warning" />
            <StatusBadge label="success" tone="success" />
            <StatusBadge label="danger" tone="danger" />
          </View>
        </AppCard>
        <AppCard variant="elevated" style={styles.previewCard}>
          <SectionHeader title="Notices" subtitle="Mensajes operativos con jerarquia" />
          <AppNoticeDropdown
            title="Autorizacion pendiente"
            message="La solicitud requiere integracion backend antes de ejecutar la accion."
            tone="warning"
            defaultExpanded={false}
          />
          <AppNoticeDropdown
            title="Operacion lista"
            message="Los datos requeridos estan completos para continuar."
            tone="success"
            defaultExpanded={false}
          />
        </AppCard>
        <MetricCard label="MetricCard" value="$12,450" helper="Dato de ejemplo para preview" />
        <AppCard style={styles.previewCard}>
          <SectionHeader title="Inputs" subtitle="Texto, placeholder y readonly en claro/oscuro" />
          <AppInput label="Precio LIVE" value="1299.00" onChangeText={() => undefined} />
          <AppInput label="Precio solo lectura" value="1299.00" editable={false} />
        </AppCard>
        <ActionTile
          title="ActionTile"
          subtitle="Accion compacta reutilizable"
          icon="open-in-new"
          onPress={() => undefined}
        />
        <EntitySummaryCard
          title="EntitySummaryCard"
          subtitle="Resumen de entidad"
          badge="Preview"
          meta={[
            { label: 'Estado', value: 'Activo' },
            { label: 'Modulo', value: 'UI Kit' },
          ]}
        />
        <EmptyState title="EmptyState" message="Estado vacio profesional y reutilizable." />
      </AppResponsiveGrid>

      <SectionHeader title="Panel LIVE premium" subtitle="Referencia visual usada por consola operativa" />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        <AppCard variant="danger" style={styles.previewCard}>
          <View style={styles.themePreviewHeader}>
            <StatusBadge label="Preparada" tone="warning" />
            <AppText variant="caption" color={theme.colors.mutedText}>
              Secundaria
            </AppText>
          </View>
          <AppText bold>Prenda lista para pasar al aire</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Aun no se usa para reservas.
          </AppText>
          <AppButton title="Poner al aire" variant="primary" onPress={() => undefined} />
        </AppCard>
        <AppCard variant="success" style={styles.previewCard}>
          <View style={styles.themePreviewHeader}>
            <StatusBadge label="Al aire" tone="success" />
            <StatusBadge label="Disponible" tone="success" />
          </View>
          <AppText bold>Prenda protagonista</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Esta es la prenda que se reservara.
          </AppText>
          <AppButton title="Reservar ahora" variant="primary" onPress={() => undefined} />
        </AppCard>
        <AppCard variant="warning" style={styles.previewCard}>
          <View style={styles.themePreviewHeader}>
            <StatusBadge label="Al aire" tone="success" />
            <StatusBadge label="Reservada" tone="reserved" />
          </View>
          <AppText bold>Prenda reservada</AppText>
          <AppText variant="caption" color={theme.colors.warning}>
            Cambia o sacala del aire para continuar.
          </AppText>
          <AppButton
            title="Reservar ahora"
            variant="neutral"
            disabled
            disabledReason="La prenda ya tiene una reserva activa."
            onPress={() => undefined}
          />
        </AppCard>
      </AppResponsiveGrid>

      <SectionHeader title="Templates" subtitle="Previews estructurales para fases futuras" />
      <DashboardTemplate
        header={<EntitySummaryCard title="DashboardTemplate" subtitle="Inicio o resumen operativo" badge="Preview" />}
        metrics={
          <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
            <MetricCard label="Reservas" value="8" helper="Preview" />
            <MetricCard label="Pendientes" value="3" helper="Preview" />
            <MetricCard label="Eventos" value="21" helper="Preview" />
          </AppResponsiveGrid>
        }
        pendingSections={<EmptyState title="Pendientes" message="Lista de acciones reales en pantallas productivas." />}
        followUpSection={<EmptyState title="Seguimiento" message="Clientes o entidades por revisar." />}
        quickActions={<ActionTile title="Acceso rapido" subtitle="Preview" icon="bolt" onPress={() => undefined} />}
      />

      <OperationalTemplate
        title="OperationalTemplate"
        status={<StatusBadge label="Operacion activa" tone="success" />}
        steps={<EmptyState title="Pasos tactiles" message="Preparado para LIVE u operaciones guiadas." icon="touch-app" />}
        primaryAction={<ActionTile title="Accion principal" subtitle="Touch-first" icon="play-arrow" onPress={() => undefined} />}
      />

      <MonitoringTemplate
        title="MonitoringTemplate"
        status={<StatusBadge label="Supervisor" tone="warning" />}
        metrics={[
          <MetricCard key="m1" label="Eventos" value="12" helper="Preview" />,
          <MetricCard key="m2" label="Reservas" value="4" helper="Preview" />,
        ]}
        recentItems={<EmptyState title="Recientes" message="Lista compacta de entidades." />}
        activity={<EmptyState title="Actividad" message="Timeline operacional." icon="timeline" />}
      />

      <DetailTemplate
        header={<SectionHeader title="DetailTemplate" subtitle="Detalle de reserva, cliente, prenda o usuario" />}
        primaryInfo={<EntitySummaryCard title="Informacion principal" subtitle="Preview" badge="Activo" />}
        secondaryInfo={<EntitySummaryCard title="Informacion secundaria" subtitle="Preview" />}
        restrictedSections={<EmptyState title="Seccion restringida" message="Aqui puede ir RestrictedSection." icon="lock" />}
      />

      <ListTemplate
        header={<SectionHeader title="ListTemplate" subtitle="Listados con filtros y acciones" />}
        filters={<EmptyState title="Filtros" message="Controles de busqueda o estado." icon="filter-list" />}
        actions={<ActionTile title="Nueva entidad" subtitle="Accion contextual" icon="add" onPress={() => undefined} />}
        list={<EntitySummaryCard title="Fila / card de lista" subtitle="Preview de registro" badge="Disponible" />}
      />

      <SectionHeader title="Variantes visuales" subtitle="Presentacion por contexto; no reemplaza AUTH/RBAC" />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        {Object.entries(viewVariants).map(([name, variant]) => (
          <EntitySummaryCard
            key={name}
            title={name}
            subtitle="Variante visual"
            badge={variant.tone}
            meta={[
              { label: 'Densidad', value: variant.density },
              { label: 'Enfasis', value: variant.emphasis },
            ]}
          />
        ))}
      </AppResponsiveGrid>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  inlineList: {
    alignItems: 'flex-start',
    gap: designTokens.spacing.sm,
  },
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: designTokens.spacing.md,
    justifyContent: 'center',
  },
  previewCard: {
    gap: designTokens.spacing.sm,
  },
  previewTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  presetCard: {
    gap: designTokens.spacing.sm,
  },
  presetSwatches: {
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
  },
  presetSwatch: {
    borderRadius: designTokens.radius.full,
    height: 20,
    width: 20,
  },
  swatch: {
    borderRadius: designTokens.radius.md,
    height: 42,
    width: '100%',
  },
  surfacePreview: {
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    gap: designTokens.spacing.xs,
    padding: designTokens.spacing.md,
  },
  themePreviewCanvas: {
    borderRadius: designTokens.radius.lg,
    padding: designTokens.spacing.lg,
  },
  themePreviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
    justifyContent: 'space-between',
  },
  themePreviewPanel: {
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    gap: designTokens.spacing.sm,
    padding: designTokens.spacing.md,
  },
  tokenCard: {
    gap: designTokens.spacing.sm,
  },
});
