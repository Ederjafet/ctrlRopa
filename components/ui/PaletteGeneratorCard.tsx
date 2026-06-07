import { useAppTheme } from '@/context/AppThemeContext';
import { EditableVisualTokenKey } from '@/theme/designPresets';
import {
  HarmonyType,
  SemanticPalette,
  generateHarmonyColors,
  generateSemanticPalette,
  generateShades,
  generateTints,
  generateTones,
  getContrastRatio,
  getContrastStatus,
  getReadableTextColor,
  hexToHsl,
  hexToRgb,
  isValidHexColor,
  normalizeHexColor,
} from '@/theme/colorUtils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import AppButton from './AppButton';
import AppCard from './AppCard';
import AppInput from './AppInput';
import AppText from './AppText';

type Props = {
  activeScheme: 'light' | 'dark';
  advancedMode?: boolean;
  baseColor: string;
  harmony: HarmonyType;
  onApplyPalette: (palette: SemanticPalette) => void;
  onBaseColorChange: (value: string) => void;
  onHarmonyChange: (harmony: HarmonyType) => void;
  onTokenChange: (key: EditableVisualTokenKey, value: string) => void;
};

type ContrastStatus = ReturnType<typeof getContrastStatus>;

const HARMONIES: HarmonyType[] = ['monochromatic', 'complementary', 'analogous', 'triadic', 'tetradic'];
const QUICK_SWATCHES = ['#2563EB', '#0F766E', '#7C3AED', '#DB2777', '#EA580C', '#15803D', '#0F172A'];
const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#0F172A';

export default function PaletteGeneratorCard({
  activeScheme,
  advancedMode = false,
  baseColor,
  harmony,
  onApplyPalette,
  onBaseColorChange,
  onHarmonyChange,
  onTokenChange,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const normalizedBase = normalizeHexColor(baseColor);
  const baseIsValid = isValidHexColor(baseColor);

  const palette = useMemo(
    () => generateSemanticPalette(normalizedBase, harmony, activeScheme),
    [activeScheme, harmony, normalizedBase],
  );
  const tints = useMemo(() => generateTints(normalizedBase, 7), [normalizedBase]);
  const shades = useMemo(() => generateShades(normalizedBase, 7), [normalizedBase]);
  const tones = useMemo(() => generateTones(normalizedBase, 7), [normalizedBase]);
  const harmonyColors = useMemo(
    () => generateHarmonyColors(normalizedBase, harmony),
    [harmony, normalizedBase],
  );
  const baseRgb = hexToRgb(normalizedBase);
  const baseHsl = hexToHsl(normalizedBase);

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

  const webColorInput =
    Platform.OS === 'web'
      ? React.createElement('input', {
          'aria-label': t('paletteGenerator.baseColor'),
          onChange: (event: { target?: { value?: string } }) => {
            const nextValue = event.target?.value;
            if (nextValue) onBaseColorChange(normalizeHexColor(nextValue));
          },
          style: {
            background: 'transparent',
            border: '0',
            cursor: 'pointer',
            height: 46,
            padding: 0,
            width: 72,
          },
          type: 'color',
          value: normalizedBase,
        })
      : null;

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flexBlock}>
          <AppText variant="subtitle" bold>
            {t('paletteGenerator.title')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {t('paletteGenerator.subtitle')}
          </AppText>
        </View>
        <View
          style={[
            styles.basePreview,
            {
              backgroundColor: normalizedBase,
              borderColor: theme.colors.borderStrong,
            },
          ]}
        />
      </View>

      <View style={styles.generatorGrid}>
        <View style={styles.controlColumn}>
          <AppText bold>{t('paletteGenerator.baseColor')}</AppText>
          <View style={styles.baseInputRow}>
            {webColorInput}
            <AppInput
              value={baseColor}
              onChangeText={(value) => onBaseColorChange(value)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="#2563EB"
              error={baseColor && !baseIsValid ? t('paletteGenerator.invalidHex') : undefined}
              style={styles.hexInput}
            />
          </View>

          {advancedMode ? (
            <>
              <View style={styles.colorMetaRow}>
                <MetaPill label="HEX" value={normalizedBase} />
                <MetaPill
                  label="RGB"
                  value={baseRgb ? `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}` : '-'}
                />
                <MetaPill
                  label="HSL"
                  value={baseHsl ? `${Math.round(baseHsl.h)}, ${baseHsl.s}%, ${baseHsl.l}%` : '-'}
                />
              </View>

              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('paletteGenerator.quickSwatches')}
              </AppText>
              <View style={styles.swatchRow}>
                {QUICK_SWATCHES.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    label={color}
                    onPress={() => onBaseColorChange(color)}
                    selected={normalizedBase === color}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>

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
          {advancedMode ? (
            <>
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('paletteGenerator.harmonyHelp')}
              </AppText>
              <View style={styles.swatchRow}>
                {harmonyColors.map((color) => (
                  <ColorSwatch key={color} color={color} label={color} onPress={() => onBaseColorChange(color)} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      </View>

      {advancedMode ? (
        <>
          <VariationBlock title={t('paletteGenerator.tints')} colors={tints} onPick={onBaseColorChange} />
          <VariationBlock title={t('paletteGenerator.shades')} colors={shades} onPick={onBaseColorChange} />
          <VariationBlock title={t('paletteGenerator.tones')} colors={tones} onPick={onBaseColorChange} />
        </>
      ) : null}

      <View style={styles.sectionBlock}>
        <View style={styles.headerRow}>
          <View style={styles.flexBlock}>
            <AppText bold>{t('paletteGenerator.suggestedPalette')}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('paletteGenerator.suggestedPaletteHelp')}
            </AppText>
          </View>
          <AppButton
            title={t('paletteGenerator.applyLocal')}
            variant="primary"
            onPress={() => onApplyPalette(palette)}
          />
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
            {advancedMode ? t('paletteGenerator.contrastTitle') : t('paletteGenerator.mainContrast')}
          </AppText>
          <AppText variant="caption" color={theme.colors.mutedText}>
            {advancedMode ? t('paletteGenerator.contrastHelp') : t('paletteGenerator.mainContrastHelp')}
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
                {t('paletteGenerator.reviewBeforeApply')}
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
    </AppCard>
  );
}

function VariationBlock({
  colors,
  onPick,
  title,
}: {
  colors: string[];
  onPick: (color: string) => void;
  title: string;
}) {
  return (
    <View style={styles.sectionBlock}>
      <AppText bold>{title}</AppText>
      <View style={styles.scaleRow}>
        {colors.map((color) => (
          <Pressable key={color} onPress={() => onPick(color)} style={styles.scaleSwatchWrap}>
            <View style={[styles.scaleSwatch, { backgroundColor: color }]} />
            <AppText variant="caption" style={styles.hexText}>
              {color}
            </AppText>
          </Pressable>
        ))}
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
      <AppText bold>{t('paletteGenerator.previewTitle')}</AppText>
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
  baseInputRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
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
  hexInput: {
    minWidth: 160,
  },
  hexText: {
    textAlign: 'center',
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
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleSwatch: {
    borderRadius: 8,
    height: 42,
    width: 74,
  },
  scaleSwatchWrap: {
    alignItems: 'center',
    gap: 4,
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
