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
  visible: boolean;
  title?: string;
  value: string;
  originalValue?: string;
  suggestedColors?: string[];
  onApply: (value: string) => void;
  onCancel: () => void;
};

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

  useEffect(() => {
    if (visible) {
      setDraftColor(normalizeHexColor(value));
    }
  }, [value, visible]);

  const normalizedDraft = normalizeHexColor(draftColor);
  const draftIsValid = isValidHexColor(draftColor);
  const variations = useMemo(() => {
    const base = normalizeHexColor(draftColor);
    return [
      ...generateTints(base, 4),
      base,
      ...generateShades(base, 4),
      ...generateTones(base, 3),
    ];
  }, [draftColor]);
  const swatches = useMemo(() => {
    const merged = [...suggestedColors, ...variations].map((color) => normalizeHexColor(color));
    return Array.from(new Set(merged));
  }, [suggestedColors, variations]);

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

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <AppInput
              label="HEX"
              value={draftColor}
              onChangeText={setDraftColor}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="#2563EB"
              error={draftColor && !draftIsValid ? t('paletteGenerator.invalidHex') : undefined}
            />

            <View style={styles.section}>
              <AppText bold>{t('paletteGenerator.suggestedSwatches')}</AppText>
              <View style={styles.swatchGrid}>
                {suggestedColors.map((color) => (
                  <ColorTile
                    key={color}
                    color={normalizeHexColor(color)}
                    selected={normalizeHexColor(color) === normalizedDraft}
                    onPress={() => setDraftColor(normalizeHexColor(color))}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText bold>{t('paletteGenerator.colorVariations')}</AppText>
              <View style={styles.swatchGrid}>
                {swatches.map((color) => (
                  <ColorTile
                    key={color}
                    color={color}
                    selected={color === normalizedDraft}
                    onPress={() => setDraftColor(color)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

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
    height: 92,
    width: 140,
  },
  panel: {
    borderWidth: 1,
    elevation: 8,
    maxHeight: '88%',
    maxWidth: 620,
    padding: 18,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: '100%',
  },
  scrollContent: {
    gap: 16,
    paddingTop: 16,
  },
  section: {
    gap: 10,
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
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
});
