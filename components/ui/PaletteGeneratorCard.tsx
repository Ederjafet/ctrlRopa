import { useAppTheme } from '@/context/AppThemeContext';
import { EditableVisualTokenKey } from '@/theme/designPresets';
import {
  BrandColorInputs,
  HarmonyType,
  SemanticPalette,
  generateHarmonyColors,
  generateSemanticPalette,
  getContrastRatio,
  getContrastStatus,
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  isValidHexColor,
  normalizeHexColor,
} from '@/theme/colorUtils';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import AppColorPicker from './AppColorPicker';
import AppButton from './AppButton';
import AppCard from './AppCard';
import AppText from './AppText';

type BrandColorKey = 'primary' | 'secondary' | 'accent';

type Props = {
  activeScheme: 'light' | 'dark';
  advancedMode?: boolean;
  brandColors: BrandColorInputs;
  harmony: HarmonyType;
  onApplyPalette: (palette: SemanticPalette) => void;
  onBrandColorChange: (key: BrandColorKey, value: string) => void;
  onHarmonyChange: (harmony: HarmonyType) => void;
  onTokenChange: (key: EditableVisualTokenKey, value: string) => void;
  showApplyAction?: boolean;
};

type ContrastStatus = ReturnType<typeof getContrastStatus>;

const HARMONIES: HarmonyType[] = ['monochromatic', 'complementary', 'analogous', 'triadic', 'tetradic'];
const QUICK_SWATCHES = ['#2563EB', '#0F766E', '#7C3AED', '#DB2777', '#EA580C', '#15803D', '#0F172A'];
const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#0F172A';

export default function PaletteGeneratorCard({
  activeScheme,
  advancedMode = false,
  brandColors,
  harmony,
  onApplyPalette,
  onBrandColorChange,
  onHarmonyChange,
  onTokenChange,
  showApplyAction = true,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [activePicker, setActivePicker] = useState<BrandColorKey | null>(null);
  const normalizedPrimary = normalizeHexColor(brandColors.primary);
  const normalizedSecondary = brandColors.secondary && isValidHexColor(brandColors.secondary)
    ? normalizeHexColor(brandColors.secondary)
    : '';
  const normalizedAccent = brandColors.accent && isValidHexColor(brandColors.accent)
    ? normalizeHexColor(brandColors.accent)
    : '';

  const palette = useMemo(
    () => generateSemanticPalette(normalizedPrimary, harmony, activeScheme, brandColors),
    [activeScheme, brandColors, harmony, normalizedPrimary],
  );
  const harmonyColors = useMemo(
    () => generateHarmonyColors(normalizedPrimary, harmony),
    [harmony, normalizedPrimary],
  );
  const baseRgb = hexToRgb(normalizedPrimary);
  const baseHsl = hexToHsl(normalizedPrimary);

  const contrastRows = useMemo(() => {
    const textOnBackground = activeScheme === 'dark' ? '#F8FAFC' : DARK_TEXT;
    const textOnSurface = activeScheme === 'dark' ? '#F8FAFC' : DARK_TEXT;
    return [
      {
        key: 'primaryLight',
        label: t('paletteGenerator.contrast.primaryLight'),
        foreground: LIGHT_TEXT,
        background: palette.primary,
      },
      {
        key: 'primaryDark',
        label: t('paletteGenerator.contrast.primaryDark'),
        foreground: DARK_TEXT,
        background: palette.primary,
      },
      {
        key: 'secondary',
        label: t('paletteGenerator.contrast.secondary'),
        foreground: getReadableTextColor(palette.secondary),
        background: palette.secondary,
      },
      {
        key: 'accent',
        label: t('paletteGenerator.contrast.accent'),
        foreground: getReadableTextColor(palette.accent),
        background: palette.accent,
      },
      {
        key: 'danger',
        label: t('paletteGenerator.contrast.danger'),
        foreground: getReadableTextColor(palette.danger),
        background: palette.danger,
      },
      {
        key: 'background',
        label: t('paletteGenerator.contrast.background'),
        foreground: textOnBackground,
        background: palette.background,
      },
      {
        key: 'surface',
        label: t('paletteGenerator.contrast.surface'),
        foreground: textOnSurface,
        background: palette.surface,
      },
      {
        key: 'button',
        label: t('paletteGenerator.contrast.button'),
        foreground: getReadableTextColor(palette.primary),
        background: palette.primary,
      },
    ].map((row) => {
      const ratio = getContrastRatio(row.foreground, row.background);
      return {
        ...row,
        ratio,
        status: getContrastStatus(ratio),
        recommendedText: getReadableTextColor(row.background) === LIGHT_TEXT ? ('light' as const) : ('dark' as const),
      };
    });
  }, [activeScheme, palette, t]);

  const hasLowContrast = contrastRows.some((row) => row.status === 'low');
  const visibleContrastRows = advancedMode
    ? contrastRows
    : contrastRows.filter((row) => ['button', 'background', 'danger'].includes(row.key));
  const tokenEntries = Object.entries(palette) as [EditableVisualTokenKey, string][];
  const customBrandColorCount = [normalizedSecondary, normalizedAccent].filter(Boolean).length;
  const harmonyNoteKey = customBrandColorCount > 0
    ? 'paletteGenerator.usingDefinedBrandColors'
    : 'paletteGenerator.harmonySuggestionHelp';
  const brandColorRows = [
    {
      key: 'primary' as const,
      label: t('paletteGenerator.brandColorPrimary'),
      description: t('paletteGenerator.brandColorPrimaryHelp'),
      value: normalizedPrimary,
      resolvedColor: palette.primary,
      optional: false,
    },
    {
      key: 'secondary' as const,
      label: t('paletteGenerator.brandColorSecondary'),
      description: t('paletteGenerator.brandColorSecondaryHelp'),
      value: normalizedSecondary,
      resolvedColor: palette.secondary,
      optional: true,
    },
    {
      key: 'accent' as const,
      label: t('paletteGenerator.brandColorAccent'),
      description: t('paletteGenerator.brandColorAccentHelp'),
      value: normalizedAccent,
      resolvedColor: palette.accent,
      optional: true,
    },
  ];
  const pickerRow = brandColorRows.find((row) => row.key === activePicker);
  const suggestedColors = useMemo(
    () => Array.from(new Set([normalizedPrimary, normalizedSecondary, normalizedAccent, ...QUICK_SWATCHES, ...harmonyColors].filter(Boolean))),
    [harmonyColors, normalizedAccent, normalizedPrimary, normalizedSecondary],
  );

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flexBlock}>
          <AppText variant="subtitle" bold>
            {t('paletteGenerator.brandColorsTitle')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('paletteGenerator.brandColorsHelp')}
          </AppText>
        </View>
        <View
          style={[
            styles.basePreview,
            {
              backgroundColor: normalizedPrimary,
              borderColor: theme.colors.borderStrong,
            },
          ]}
        />
      </View>

      <View style={styles.generatorGrid}>
        <View style={styles.controlColumnWide}>
          <AppText bold>{t('paletteGenerator.brandColorsTitle')}</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('paletteGenerator.brandColorsHelp')}
          </AppText>
          <View style={styles.brandColorGrid}>
            {brandColorRows.map((row) => (
              <BrandColorCard
                key={row.key}
                label={row.label}
                description={row.description}
                value={row.value}
                resolvedColor={row.resolvedColor}
                optional={row.optional}
                onClear={() => onBrandColorChange(row.key, '')}
                onOpen={() => setActivePicker(row.key)}
              />
            ))}
          </View>

          {advancedMode ? (
            <View style={styles.colorMetaRow}>
              <MetaPill label="HEX" value={normalizedPrimary} />
              <MetaPill
                label="RGB"
                value={baseRgb ? `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}` : '-'}
              />
              <MetaPill
                label="HSL"
                value={baseHsl ? `${Math.round(baseHsl.h)}, ${baseHsl.s}%, ${baseHsl.l}%` : '-'}
              />
            </View>
          ) : null}
          <View
            style={[
              styles.helperPanel,
              {
                backgroundColor: theme.colors.infoCardBackground,
                borderColor: theme.colors.info,
              },
            ]}
          >
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {t(harmonyNoteKey)}
            </AppText>
          </View>
        </View>

        {advancedMode ? (
          <View style={styles.controlColumn}>
            <AppText bold>{t('paletteGenerator.harmony')}</AppText>
            <View style={styles.harmonyGrid}>
              {HARMONIES.map((option) => (
                <AppButton
                  key={option}
                  title={t(`paletteGenerator.harmonies.${option}`)}
                  variant={harmony === option ? 'secondary' : 'neutral'}
                  onPress={() => onHarmonyChange(option)}
                  style={styles.harmonyButton}
                />
              ))}
            </View>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('paletteGenerator.harmonyHelp')}
            </AppText>
            <View style={styles.swatchRow}>
              {harmonyColors.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  label={color}
                  onPress={() => onBrandColorChange('primary', color)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.headerRow}>
          <View style={styles.flexBlock}>
            <AppText bold>{t('paletteGenerator.appPaletteTitle')}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('paletteGenerator.appPaletteHelp')}
            </AppText>
          </View>
          {showApplyAction ? (
            <AppButton
              title={t('paletteGenerator.applyLocal')}
              variant="primary"
              onPress={() => onApplyPalette(palette)}
            />
          ) : null}
        </View>
        <View style={styles.tokenGrid}>
          {tokenEntries.map(([key, color]) => (
            <Pressable key={key} onPress={() => onTokenChange(key, color)} style={styles.tokenSwatch}>
              <View
                style={[
                  styles.tokenColor,
                  {
                    backgroundColor: color,
                    borderColor: theme.colors.borderStrong,
                  },
                ]}
              />
              <AppText variant="caption" bold>
                {t(`paletteGenerator.tokens.${key}`)}
              </AppText>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {color}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.generatorGrid}>
        <View style={styles.controlColumn}>
          <AppText bold>
            {advancedMode ? t('paletteGenerator.contrastTitle') : t('paletteGenerator.legibilityTitle')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {advancedMode ? t('paletteGenerator.contrastHelp') : t('paletteGenerator.legibilityHelp')}
          </AppText>
          {hasLowContrast ? (
            <View
              style={[
                styles.warningPanel,
                {
                  backgroundColor: theme.colors.warningBackground,
                  borderColor: theme.colors.warning,
                },
              ]}
            >
            <AppText bold color={theme.colors.warning}>
              {t('paletteGenerator.lowContrast')}
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary}>
                {t('paletteGenerator.lowContrastActionHelp')}
            </AppText>
          </View>
        ) : null}
          <View style={styles.contrastList}>
            {visibleContrastRows.map((row) => (
              <ContrastRow
                key={row.key}
                label={row.label}
                ratio={row.ratio}
                status={row.status}
                recommendedText={row.recommendedText}
              />
            ))}
          </View>
        </View>

        <UiPreview palette={palette} activeScheme={activeScheme} />
      </View>

      {pickerRow ? (
        <AppColorPicker
          visible={Boolean(activePicker)}
          title={t('paletteGenerator.chooseColor')}
          value={pickerRow.value || pickerRow.resolvedColor}
          originalValue={pickerRow.resolvedColor}
          suggestedColors={suggestedColors}
          onApply={(value) => {
            onBrandColorChange(pickerRow.key, value);
            setActivePicker(null);
          }}
          onCancel={() => setActivePicker(null)}
        />
      ) : null}
    </AppCard>
  );
}

function BrandColorCard({
  description,
  label,
  onClear,
  onOpen,
  optional,
  resolvedColor,
  value,
}: {
  description: string;
  label: string;
  onClear: () => void;
  onOpen: () => void;
  optional: boolean;
  resolvedColor: string;
  value: string;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const displayValue = value || t('paletteGenerator.automaticColor');

  return (
    <View
      style={[
        styles.brandColorCard,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.flexBlock}>
          <AppText bold>{label}</AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {description}
          </AppText>
        </View>
        <View
          style={[
            styles.brandColorPreview,
            {
              backgroundColor: resolvedColor,
              borderColor: theme.colors.borderStrong,
            },
          ]}
        />
      </View>
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {displayValue}
      </AppText>
      <View style={styles.brandActions}>
        <AppButton title={t('paletteGenerator.changeColor')} variant="secondary" onPress={onOpen} />
        {optional && value ? (
          <AppButton title={t('paletteGenerator.useAutomaticColor')} variant="neutral" onPress={onClear} />
        ) : null}
      </View>
    </View>
  );
}

function ColorSwatch({
  color,
  label,
  onPress,
  selected,
}: {
  color: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.roundSwatch,
        {
          backgroundColor: color,
          borderColor: selected ? theme.colors.accent : theme.colors.borderStrong,
          borderWidth: selected ? 3 : 1,
        },
      ]}
    />
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.metaPill,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <AppText variant="caption" bold>
        {label}
      </AppText>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {value}
      </AppText>
    </View>
  );
}

function ContrastRow({
  label,
  ratio,
  recommendedText,
  status,
}: {
  label: string;
  ratio: number | null;
  recommendedText: 'light' | 'dark';
  status: ContrastStatus;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const toneColor =
    status === 'ok'
      ? theme.colors.success
      : status === 'low'
        ? theme.colors.danger
        : theme.colors.warning;

  return (
    <View style={[styles.contrastRow, { borderColor: theme.colors.borderSubtle }]}>
      <View style={styles.flexBlock}>
        <AppText variant="caption" bold>
          {label}
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {t('paletteGenerator.recommendedText')}{' '}
          {recommendedText === 'light' ? t('paletteGenerator.lightText') : t('paletteGenerator.darkText')}
        </AppText>
      </View>
      <View style={styles.contrastMetric}>
        <AppText variant="caption" bold color={toneColor}>
          {t(`paletteGenerator.contrastStatuses.${status}`)}
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {ratio === null ? '-' : ratio.toFixed(2)}
        </AppText>
      </View>
    </View>
  );
}

function UiPreview({ activeScheme, palette }: { activeScheme: 'light' | 'dark'; palette: SemanticPalette }) {
  const { t } = useTranslation();
  const textColor = activeScheme === 'dark' ? '#F8FAFC' : '#0F172A';
  const mutedColor = activeScheme === 'dark' ? '#CBD5E1' : '#475569';
  const primaryText = getReadableTextColor(palette.primary);
  const accentText = getReadableTextColor(palette.accent);
  const dangerText = getReadableTextColor(palette.danger);

  return (
    <View style={styles.controlColumn}>
      <AppText bold>{t('paletteGenerator.appPreviewTitle')}</AppText>
      <AppText variant="caption" color={mutedColor}>
        {t('paletteGenerator.appPreviewHelp')}
      </AppText>
      <View style={[styles.uiPreviewCanvas, { backgroundColor: palette.background }]}>
        <View style={[styles.previewSidebar, { backgroundColor: palette.primary }]}>
          <View style={[styles.previewSidebarLine, { backgroundColor: primaryText }]} />
          <View style={[styles.previewSidebarLineShort, { backgroundColor: primaryText }]} />
          <View style={[styles.previewSidebarPill, { backgroundColor: palette.accent }]} />
        </View>
        <View style={styles.previewContent}>
          <View style={[styles.previewPanel, { backgroundColor: palette.surface, borderColor: palette.secondary }]}>
            <AppText bold color={textColor}>
              {t('paletteGenerator.previewCardTitle')}
            </AppText>
            <AppText variant="caption" color={mutedColor}>
              {t('paletteGenerator.previewCardText')}
            </AppText>
            <View style={styles.previewButtonRow}>
              <View style={[styles.previewButton, { backgroundColor: palette.primary }]}>
                <AppText variant="caption" bold color={primaryText}>
                  {t('paletteGenerator.previewPrimaryButton')}
                </AppText>
              </View>
              <View style={[styles.previewButton, { backgroundColor: palette.accent }]}>
                <AppText variant="caption" bold color={accentText}>
                  {t('paletteGenerator.previewSecondaryButton')}
                </AppText>
              </View>
            </View>
            <View style={[styles.previewInput, { borderColor: palette.secondary }]}>
              <AppText variant="caption" color={mutedColor}>
                {t('paletteGenerator.previewInput')}
              </AppText>
            </View>
            <View style={styles.previewButtonRow}>
              <View style={[styles.previewBadge, { backgroundColor: palette.success }]}>
                <AppText variant="caption" bold color={getReadableTextColor(palette.success)}>
                  {t('paletteGenerator.previewActiveBadge')}
                </AppText>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: palette.danger }]}>
                <AppText variant="caption" bold color={dangerText}>
                  {t('paletteGenerator.previewReservedBadge')}
                </AppText>
              </View>
            </View>
            <View style={[styles.previewNotice, { borderColor: palette.warning }]}>
              <AppText variant="caption" color={textColor}>
                {t('paletteGenerator.previewNotice')}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandColorCard: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    minWidth: 220,
    padding: 12,
  },
  brandColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  brandColorPreview: {
    borderRadius: 12,
    borderWidth: 1,
    height: 52,
    width: 70,
  },
  basePreview: {
    borderRadius: 14,
    borderWidth: 1,
    height: 74,
    width: 112,
  },
  card: {
    gap: 16,
  },
  colorMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contrastList: {
    gap: 8,
  },
  contrastMetric: {
    alignItems: 'flex-end',
    minWidth: 86,
  },
  contrastRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  controlColumn: {
    flex: 1,
    gap: 10,
    minWidth: 260,
  },
  controlColumnWide: {
    flex: 1.5,
    gap: 10,
    minWidth: 320,
  },
  flexBlock: {
    flex: 1,
    minWidth: 0,
  },
  generatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  harmonyButton: {
    minHeight: 44,
  },
  harmonyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  helperPanel: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaPill: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  previewButton: {
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  previewButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewContent: {
    flex: 1,
    padding: 12,
  },
  previewInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  previewNotice: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 9,
  },
  previewPanel: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 9,
    padding: 12,
  },
  previewSidebar: {
    gap: 8,
    padding: 10,
    width: 74,
  },
  previewSidebarLine: {
    borderRadius: 999,
    height: 8,
    opacity: 0.92,
  },
  previewSidebarLineShort: {
    borderRadius: 999,
    height: 8,
    opacity: 0.72,
    width: '68%',
  },
  previewSidebarPill: {
    borderRadius: 999,
    height: 28,
    marginTop: 8,
  },
  roundSwatch: {
    borderRadius: 999,
    height: 36,
    width: 36,
  },
  sectionBlock: {
    gap: 8,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenColor: {
    borderRadius: 10,
    borderWidth: 1,
    height: 44,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tokenSwatch: {
    gap: 5,
    minWidth: 126,
  },
  uiPreviewCanvas: {
    borderRadius: 14,
    flexDirection: 'row',
    minHeight: 276,
    overflow: 'hidden',
  },
  warningPanel: {
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 10,
  },
});
