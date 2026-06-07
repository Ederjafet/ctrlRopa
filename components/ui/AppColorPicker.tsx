import { useAppTheme } from '@/context/AppThemeContext';
import {
  generateShades,
  generateTints,
  generateTones,
  isValidHexColor,
  normalizeHexColor,
} from '@/theme/colorUtils';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from './AppButton';
import AppInput from './AppInput';
import AppText from './AppText';

type Props = {
  colorName?: string;
  visible: boolean;
  title?: string;
  value: string;
  originalValue?: string;
  suggestedColors?: string[];
  onApply: (value: string) => void;
  onCancel: () => void;
};

type PickerSection = 'swatches' | 'tints' | 'shades' | 'tones';

const DEFAULT_SWATCHES = [
  '#2563EB',
  '#0F766E',
  '#7C3AED',
  '#DB2777',
  '#EA580C',
  '#15803D',
  '#B91C1C',
  '#0F172A',
  '#F8FAFC',
];

export default function AppColorPicker({
  colorName,
  visible,
  title,
  value,
  originalValue,
  suggestedColors = DEFAULT_SWATCHES,
  onApply,
  onCancel,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const [draftColor, setDraftColor] = useState(normalizeHexColor(value));
  const [activeSection, setActiveSection] = useState<PickerSection>('swatches');

  useEffect(() => {
    if (visible) {
      setDraftColor(normalizeHexColor(value));
      setActiveSection('swatches');
    }
  }, [value, visible]);

  const normalizedDraft = normalizeHexColor(draftColor);
  const draftIsValid = isValidHexColor(draftColor);
  const tints = useMemo(() => {
    const base = normalizeHexColor(draftColor);
    return generateTints(base, 5);
  }, [draftColor]);
  const shades = useMemo(() => {
    const base = normalizeHexColor(draftColor);
    return generateShades(base, 5);
  }, [draftColor]);
  const tones = useMemo(() => {
    const base = normalizeHexColor(draftColor);
    return generateTones(base, 5);
  }, [draftColor]);
  const swatches = useMemo(
    () => Array.from(new Set(suggestedColors.map((color) => normalizeHexColor(color)))),
    [suggestedColors],
  );
  const colorSections = useMemo(
    () => ({
      swatches,
      tints: dedupeColors(tints),
      shades: dedupeColors(shades),
      tones: dedupeColors(tones),
    }),
    [shades, swatches, tints, tones],
  );
  const activeColors = colorSections[activeSection];
  const tabs: { key: PickerSection; label: string }[] = [
    { key: 'swatches', label: t('paletteGenerator.swatchesTab') },
    { key: 'tints', label: t('paletteGenerator.tints') },
    { key: 'shades', label: t('paletteGenerator.shades') },
    { key: 'tones', label: t('paletteGenerator.tones') },
  ];

  const apply = () => {
    if (!draftIsValid) return;
    onApply(normalizedDraft);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.colors.modalBackground,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.textBlock}>
              <AppText variant="subtitle" bold>
                {title ?? t('paletteGenerator.chooseColor')}
              </AppText>
              {colorName ? (
                <AppText variant="caption" bold color={theme.colors.textSecondary}>
                  {colorName}
                </AppText>
              ) : null}
              <AppText variant="caption" color={theme.colors.mutedText}>
                {t('paletteGenerator.chooseColorHelp')}
              </AppText>
            </View>
            <View
              style={[
                styles.largePreview,
                {
                  backgroundColor: draftIsValid ? normalizedDraft : theme.colors.surfaceMuted,
                  borderColor: theme.colors.borderStrong,
                },
              ]}
            />
          </View>

          <View style={styles.body}>
            <AppInput
              label="HEX"
              value={draftColor}
              onChangeText={setDraftColor}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="#2563EB"
              error={draftColor && !draftIsValid ? t('paletteGenerator.invalidHex') : undefined}
            />

            <View style={styles.tabRow}>
              {tabs.map((tab) => {
                const selected = activeSection === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveSection(tab.key)}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: selected ? theme.colors.primaryButtonBackground : theme.colors.surfaceMuted,
                        borderColor: selected ? theme.colors.primaryButtonBackground : theme.colors.borderSubtle,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      bold={selected}
                      color={selected ? theme.colors.primaryButtonText : theme.colors.textSecondary}
                    >
                      {tab.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.swatchScroll}>
              <View style={styles.swatchGrid}>
                {activeColors.map((color, index) => (
                  <ColorTile
                    key={`${activeSection}-${color}-${index}`}
                    color={color}
                    selected={color === normalizedDraft}
                    onPress={() => setDraftColor(color)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.actions}>
            {originalValue ? (
              <AppButton
                title={t('paletteGenerator.restoreOriginalColor')}
                variant="neutral"
                onPress={() => setDraftColor(normalizeHexColor(originalValue))}
                style={styles.actionButton}
              />
            ) : null}
            <AppButton
              title={t('common.cancel')}
              variant="neutral"
              onPress={onCancel}
              style={styles.actionButton}
            />
            <AppButton
              title={t('paletteGenerator.applyColor')}
              variant="primary"
              disabled={!draftIsValid}
              disabledReason={t('paletteGenerator.invalidHex')}
              onPress={apply}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ColorTile({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={color}
      onPress={onPress}
      style={[
        styles.swatch,
        {
          backgroundColor: color,
          borderColor: selected ? theme.colors.accent : theme.colors.borderStrong,
          borderWidth: selected ? 3 : 1,
        },
      ]}
    />
  );
}

function dedupeColors(colors: string[]) {
  return Array.from(new Set(colors.map((color) => normalizeHexColor(color))));
}

const styles = StyleSheet.create({
  actionButton: {
    minWidth: 140,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  body: {
    gap: 12,
    paddingTop: 14,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  largePreview: {
    borderRadius: 18,
    borderWidth: 1,
    height: 76,
    width: 112,
  },
  panel: {
    borderWidth: 1,
    elevation: 8,
    maxHeight: '86%',
    maxWidth: 560,
    padding: 18,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: '100%',
  },
  swatch: {
    borderRadius: 12,
    height: 44,
    width: 58,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchScroll: {
    paddingBottom: 2,
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
