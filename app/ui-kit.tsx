import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections } from '@/components/layout/appNavigation';
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
import PaletteGeneratorCard from '@/components/ui/PaletteGeneratorCard';
import SectionHeader from '@/components/ui/SectionHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { isAdmin, isNoAccess } from '@/services/accessControl';
import { ensureSessionActive, getSession, UserSession } from '@/services/sessionStorage';
import { HarmonyType, SemanticPalette } from '@/theme/colorUtils';
import { designTokens, viewVariants } from '@/theme/designTokens';
import {
  DesignPresetColors,
  EditableVisualTokenKey,
  ThemeScheme,
  editableVisualTokenKeys,
  getContrastRatio,
  isHexColor,
  visualTokenLabels,
} from '@/theme/designPresets';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function UiKitPreview() {
  const {
    theme,
    themeMode,
    toggleThemeMode,
    visualPresetId,
    customVisualIdentity,
    designPresets,
    setVisualPresetId,
    setCustomVisualIdentity,
    resetCustomVisualIdentity,
  } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [editorValues, setEditorValues] = useState<Record<EditableVisualTokenKey, string>>({
    primary: '',
    secondary: '',
    accent: '',
    success: '',
    warning: '',
    danger: '',
    background: '',
    surface: '',
  });
  const [editorRadius, setEditorRadius] = useState<'standard' | 'soft' | 'compact'>('soft');
  const [editorDensity, setEditorDensity] = useState<'NORMAL' | 'COMPACT'>('NORMAL');
  const [paletteBaseColor, setPaletteBaseColor] = useState('#2563EB');
  const [paletteHarmony, setPaletteHarmony] = useState<HarmonyType>('complementary');
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [identityFeedback, setIdentityFeedback] = useState<string | null>(null);
  const { t } = useTranslation();

  const activePreset = useMemo(
    () => designPresets.find((preset) => preset.id === visualPresetId) ?? designPresets[0],
    [designPresets, visualPresetId],
  );
  const activeScheme: ThemeScheme = theme.isDark ? 'dark' : 'light';
  const activeOverrides = useMemo(
    () =>
      customVisualIdentity?.presetId === visualPresetId
        ? customVisualIdentity.colors[activeScheme] ?? {}
        : {},
    [activeScheme, customVisualIdentity, visualPresetId],
  );
  const editorErrors = useMemo(() => {
    return editableVisualTokenKeys.reduce<Partial<Record<EditableVisualTokenKey, string>>>(
      (acc, key) => {
        const value = editorValues[key]?.trim();
        if (!value || !isHexColor(value)) {
          acc[key] = 'Usa formato #RRGGBB.';
        }
        return acc;
      },
      {},
    );
  }, [editorValues]);
  const hasEditorErrors = Object.keys(editorErrors).length > 0;
  const contrastWarnings = useMemo(() => {
    const warnings: string[] = [];
    const backgroundContrast = getContrastRatio(theme.colors.textPrimary, editorValues.background);
    const surfaceContrast = getContrastRatio(theme.colors.textPrimary, editorValues.surface);

    if (backgroundContrast !== null && backgroundContrast < 3) {
      warnings.push('El fondo puede tener bajo contraste con el texto principal.');
    }
    if (surfaceContrast !== null && surfaceContrast < 3) {
      warnings.push('La superficie/cards puede tener bajo contraste con el texto principal.');
    }
    return warnings;
  }, [editorValues.background, editorValues.surface, theme.colors.textPrimary]);

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

  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useEffect(() => {
    const baseColors = activePreset.colors[activeScheme];
    const nextValues = editableVisualTokenKeys.reduce<Record<EditableVisualTokenKey, string>>(
      (acc, key) => {
        acc[key] = activeOverrides[key] ?? baseColors[key];
        return acc;
      },
      {
        primary: '',
        secondary: '',
        accent: '',
        success: '',
        warning: '',
        danger: '',
        background: '',
        surface: '',
      },
    );

    setEditorValues(nextValues);
    setPaletteBaseColor(nextValues.primary);
    setEditorRadius(customVisualIdentity?.radius ?? activePreset.radius);
    setEditorDensity(customVisualIdentity?.density ?? activePreset.density);
    setIdentityFeedback(null);
  }, [activeOverrides, activePreset, activeScheme, customVisualIdentity, visualPresetId]);

  const updateEditorToken = (key: EditableVisualTokenKey, value: string) => {
    setEditorValues((current) => ({ ...current, [key]: value.trim() }));
    setIdentityFeedback(null);
  };

  const applyGeneratedPalette = async (palette: SemanticPalette) => {
    const nextValues = {
      ...editorValues,
      ...palette,
    };

    setEditorValues(nextValues);
    setPaletteBaseColor(palette.primary);

    await setCustomVisualIdentity({
      presetId: visualPresetId,
      colors: {
        ...(customVisualIdentity?.colors ?? {}),
        [activeScheme]: nextValues,
      },
      radius: editorRadius,
      density: editorDensity,
    });
    setIdentityFeedback(t('paletteGenerator.appliedFeedback'));
  };

  const applyVisualIdentityChanges = async () => {
    if (hasEditorErrors) {
      setIdentityFeedback(t('paletteGenerator.invalidColorsFeedback'));
      return;
    }

    await setCustomVisualIdentity({
      presetId: visualPresetId,
      colors: {
        ...(customVisualIdentity?.colors ?? {}),
        [activeScheme]: editorValues,
      },
      radius: editorRadius,
      density: editorDensity,
    });
    setIdentityFeedback(t('paletteGenerator.manualAppliedFeedback'));
  };

  const restoreActivePreset = async () => {
    await resetCustomVisualIdentity();
    setIdentityFeedback(t('paletteGenerator.restoreFeedback'));
  };

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
        title={t('paletteGenerator.flowTitle')}
        subtitle={t('paletteGenerator.flowSubtitle')}
      />
      <AppCard variant="info" style={styles.guidedFlowCard}>
        {[
          t('paletteGenerator.flowSteps.template'),
          t('paletteGenerator.flowSteps.baseColor'),
          t('paletteGenerator.flowSteps.palette'),
          t('paletteGenerator.flowSteps.contrast'),
          t('paletteGenerator.flowSteps.preview'),
          t('paletteGenerator.flowSteps.apply'),
        ].map((step, index) => (
          <View key={step} style={styles.flowStep}>
            <View
              style={[
                styles.flowStepIndex,
                {
                  backgroundColor: theme.colors.primaryButtonBackground,
                },
              ]}
            >
              <AppText variant="caption" bold color={theme.colors.primaryButtonText}>
                {String(index + 1)}
              </AppText>
            </View>
            <AppText variant="caption" bold>
              {step}
            </AppText>
          </View>
        ))}
      </AppCard>

      <View style={styles.previewCard}>
        <View style={styles.themePreviewHeader}>
          <View style={styles.previewTextBlock}>
            <AppText bold>{t('paletteGenerator.activeTemplate')}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('paletteGenerator.localConfigHelp')}
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
                  {preset.id === visualPresetId ? (
                    <StatusBadge label={t('paletteGenerator.templateActive')} tone="success" />
                  ) : null}
                </View>
                <PresetMiniPreview colors={preset.colors[theme.isDark ? 'dark' : 'light']} />
                <AppButton
                  title={
                    preset.id === visualPresetId
                      ? t('paletteGenerator.activeTemplateButton')
                      : t('paletteGenerator.useTemplate')
                  }
                  variant={preset.id === visualPresetId ? 'neutral' : 'secondary'}
                  onPress={() => setVisualPresetId(preset.id)}
                />
              </AppCard>
            ))}
        </AppResponsiveGrid>
      </View>

      <SectionHeader
        title={t('paletteGenerator.sectionTitle')}
        subtitle={t('paletteGenerator.sectionSubtitle')}
      />
      <PaletteGeneratorCard
        activeScheme={activeScheme}
        advancedMode={showAdvancedDetails}
        baseColor={paletteBaseColor}
        harmony={paletteHarmony}
        onApplyPalette={applyGeneratedPalette}
        onBaseColorChange={(value) => {
          setPaletteBaseColor(value);
          setIdentityFeedback(null);
        }}
        onHarmonyChange={setPaletteHarmony}
        onTokenChange={updateEditorToken}
      />

      {identityFeedback ? (
        <AppCard variant={hasEditorErrors ? 'danger' : 'info'} style={styles.compactNotice}>
          <AppText color={hasEditorErrors ? theme.colors.danger : theme.colors.info}>
            {identityFeedback}
          </AppText>
        </AppCard>
      ) : null}

      <View style={styles.buttonRow}>
        <AppButton
          title={t('paletteGenerator.restoreTemplate')}
          variant="neutral"
          onPress={restoreActivePreset}
        />
        <AppButton
          title={
            showAdvancedDetails
              ? t('paletteGenerator.hideTechnicalDetails')
              : t('paletteGenerator.showTechnicalDetails')
          }
          variant="secondary"
          onPress={() => setShowAdvancedDetails((current) => !current)}
        />
      </View>

      {showAdvancedDetails ? (
        <>
      <SectionHeader
        title={t('paletteGenerator.controlledEditorTitle')}
        subtitle={t('paletteGenerator.controlledEditorSubtitle')}
      />
      <AppCard variant="elevated" style={styles.previewCard}>
        <View style={styles.themePreviewHeader}>
          <View style={styles.previewTextBlock}>
            <AppText bold>Identidad visual local</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Editando modo {activeScheme === 'dark' ? 'oscuro' : 'claro'} sobre{' '}
              {activePreset.label}. No modifica backend ni tenant.
            </AppText>
          </View>
          <StatusBadge
            label={customVisualIdentity?.presetId === visualPresetId ? 'Personalizada' : 'Base'}
            tone={customVisualIdentity?.presetId === visualPresetId ? 'warning' : 'info'}
          />
        </View>

        <AppResponsiveGrid tabletColumns={2} desktopColumns={4}>
          {editableVisualTokenKeys.map((key) => (
            <View key={key} style={styles.editorField}>
              <View style={styles.editorLabelRow}>
                <View
                  style={[
                    styles.editorSwatch,
                    {
                      backgroundColor: isHexColor(editorValues[key])
                        ? editorValues[key]
                        : theme.colors.surfaceMuted,
                      borderColor: theme.colors.borderStrong,
                    },
                  ]}
                />
                <AppText variant="caption" color={theme.colors.textSecondary} style={styles.editorLabel}>
                  {t(`paletteGenerator.tokens.${key}`, visualTokenLabels[key])}
                </AppText>
              </View>
              <AppInput
                value={editorValues[key]}
                onChangeText={(value) => updateEditorToken(key, value)}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="#RRGGBB"
              />
              {editorErrors[key] ? (
                <AppText variant="caption" color={theme.colors.danger}>
                  {editorErrors[key]}
                </AppText>
              ) : null}
            </View>
          ))}
        </AppResponsiveGrid>

        <View style={styles.segmentedRow}>
          <View style={styles.previewTextBlock}>
            <AppText bold>Radio visual</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Ajusta la suavidad global sin editar componentes individuales.
            </AppText>
          </View>
          {(['standard', 'soft', 'compact'] as const).map((radius) => (
            <AppButton
              key={radius}
              title={radius}
              variant={editorRadius === radius ? 'secondary' : 'neutral'}
              onPress={() => setEditorRadius(radius)}
            />
          ))}
        </View>

        <View style={styles.segmentedRow}>
          <View style={styles.previewTextBlock}>
            <AppText bold>Densidad visual</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Controla spacing global soportado por el tema.
            </AppText>
          </View>
          {(['NORMAL', 'COMPACT'] as const).map((density) => (
            <AppButton
              key={density}
              title={density === 'NORMAL' ? 'Normal' : 'Compacta'}
              variant={editorDensity === density ? 'secondary' : 'neutral'}
              onPress={() => setEditorDensity(density)}
            />
          ))}
        </View>

        {contrastWarnings.length > 0 ? (
          <AppCard variant="warning" style={styles.compactNotice}>
            <AppText bold color={theme.colors.warning}>
              Revisar contraste
            </AppText>
            {contrastWarnings.map((warning) => (
              <AppText key={warning} variant="caption" color={theme.colors.textSecondary}>
                {warning}
              </AppText>
            ))}
          </AppCard>
        ) : null}

        <View style={styles.buttonRow}>
          <AppButton
            title="Aplicar cambios localmente"
            variant="primary"
            disabled={hasEditorErrors}
            disabledReason="Corrige los colores invalidos antes de aplicar."
            onPress={applyVisualIdentityChanges}
          />
        </View>

        <AppText variant="caption" color={theme.colors.mutedText}>
          Esta personalizacion se guarda localmente en esta fase. La persistencia por cliente/tenant
          queda pendiente.
        </AppText>
      </AppCard>

      <SectionHeader
        title="Preview de identidad"
        subtitle="Referencia en vivo de botones, cards, badges, inputs y estado reservado."
      />
      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        <AppCard variant="selected" style={styles.previewCard}>
          <StatusBadge label="Activo" tone="live" />
          <AppText bold>Panel operativo</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            Mini preview con el preset y overrides actuales.
          </AppText>
          <AppButton title="Boton primario" variant="primary" onPress={() => undefined} />
          <AppButton title="Boton secundario" variant="secondary" onPress={() => undefined} />
        </AppCard>
        <AppCard variant="danger" style={styles.previewCard}>
          <View style={styles.themePreviewHeader}>
            <StatusBadge label="Reservada" tone="reserved" />
            <StatusBadge label="Al aire" tone="live" />
          </View>
          <AppText bold color={theme.colors.danger}>
            Prenda reservada
          </AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            El estado reservado deriva de danger/dangerSoft.
          </AppText>
          <AppButton title="Boton danger" variant="danger" onPress={() => undefined} />
        </AppCard>
        <AppCard style={styles.previewCard}>
          <AppInput
            label="Input premium"
            value="Preview de identidad"
            onChangeText={() => undefined}
          />
          <AppButton
            title="Accion bloqueada"
            variant="primary"
            disabled
            disabledReason="Preview de estado disabled."
            onPress={() => undefined}
          />
        </AppCard>
      </AppResponsiveGrid>

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
        </>
      ) : null}
    </AppShell>
  );
}

function PresetMiniPreview({ colors }: { colors: DesignPresetColors }) {
  return (
    <View style={[styles.presetMiniCanvas, { backgroundColor: colors.background }]}>
      <View style={[styles.presetMiniSidebar, { backgroundColor: colors.primary }]}>
        <View style={[styles.presetMiniLine, { backgroundColor: colors.textOnPrimary }]} />
        <View style={[styles.presetMiniLineShort, { backgroundColor: colors.textOnPrimary }]} />
      </View>
      <View style={styles.presetMiniContent}>
        <View
          style={[
            styles.presetMiniCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.presetMiniHeading, { backgroundColor: colors.textPrimary }]} />
          <View style={[styles.presetMiniSubline, { backgroundColor: colors.textMuted }]} />
          <View style={styles.presetMiniControls}>
            <View style={[styles.presetMiniButton, { backgroundColor: colors.primary }]} />
            <View style={[styles.presetMiniBadge, { backgroundColor: colors.success }]} />
            <View style={[styles.presetMiniBadge, { backgroundColor: colors.danger }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  compactNotice: {
    gap: designTokens.spacing.xs,
    marginBottom: 0,
  },
  editorField: {
    gap: designTokens.spacing.xs,
  },
  editorLabel: {
    flex: 1,
    minWidth: 0,
  },
  editorLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  editorSwatch: {
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  flowStep: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
  },
  flowStepIndex: {
    alignItems: 'center',
    borderRadius: designTokens.radius.full,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  guidedFlowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
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
  presetMiniBadge: {
    borderRadius: 999,
    height: 14,
    width: 34,
  },
  presetMiniButton: {
    borderRadius: 8,
    height: 22,
    width: 74,
  },
  presetMiniCanvas: {
    borderRadius: 14,
    flexDirection: 'row',
    minHeight: 116,
    overflow: 'hidden',
  },
  presetMiniCard: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  presetMiniContent: {
    flex: 1,
    padding: 10,
  },
  presetMiniControls: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  presetMiniHeading: {
    borderRadius: 999,
    height: 8,
    width: '72%',
  },
  presetMiniLine: {
    borderRadius: 999,
    height: 7,
    opacity: 0.92,
  },
  presetMiniLineShort: {
    borderRadius: 999,
    height: 7,
    opacity: 0.68,
    width: '62%',
  },
  presetMiniSidebar: {
    gap: 8,
    padding: 10,
    width: 58,
  },
  presetMiniSubline: {
    borderRadius: 999,
    height: 7,
    opacity: 0.72,
    width: '52%',
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
  segmentedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
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
