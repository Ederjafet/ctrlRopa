import { useAppTheme } from '@/context/AppThemeContext';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import AppButton from './AppButton';
import AppText from './AppText';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

const COLOR_OPTIONS = [
  '#111111',
  '#1f2937',
  '#374151',
  '#4b5563',
  '#666666',
  '#ffffff',
  '#f3f4f6',
  '#ef4444',
  '#b00020',
  '#dc2626',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#16a34a',
  '#10b981',
  '#06b6d4',
  '#0a7ea4',
  '#0284c7',
  '#2563eb',
  '#60a5fa',
  '#4f46e5',
  '#7c3aed',
  '#a855f7',
  '#c026d3',
  '#ec4899',
  '#f43f5e',
];

const normalizeHex = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

const isValidHex = (value: string) => /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(value.trim());

export default function ColorField({ label, value, onChangeText }: Props) {
  const { theme } = useAppTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(value || '#111111');

  const normalizedValue = useMemo(() => normalizeHex(value || ''), [value]);
  const valueIsValid = normalizedValue ? isValidHex(normalizedValue) : false;
  const previewColor = valueIsValid ? normalizedValue : theme.colors.inputBackground;

  const selectColor = (color: string) => {
    setDraftColor(color);
  };

  const applyColor = () => {
    const normalized = normalizeHex(draftColor || '');
    if (isValidHex(normalized)) {
      onChangeText(normalized.toUpperCase());
      setPickerOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>

      <View style={styles.row}>
        <Pressable
          onPress={() => {
            setDraftColor(valueIsValid ? normalizedValue : '#111111');
            setPickerOpen(true);
          }}
          style={[
            styles.preview,
            {
              backgroundColor: previewColor,
              borderColor: theme.colors.inputBorder,
            },
          ]}
        />

        <TextInput
          value={value || ''}
          onChangeText={(text) => onChangeText(normalizeHex(text))}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="#000000"
          placeholderTextColor={theme.colors.placeholderText}
          style={[
            styles.input,
            {
              borderColor: value && !valueIsValid ? theme.colors.danger : theme.colors.inputBorder,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.inputText,
            },
          ]}
        />

        <AppButton
          title="Color"
          variant="secondary"
          onPress={() => {
            setDraftColor(valueIsValid ? normalizedValue : '#111111');
            setPickerOpen(true);
          }}
          style={styles.colorButton}
        />
      </View>

      {value && !valueIsValid ? (
        <AppText variant="caption" color={theme.colors.danger}>
          Usa un color HEX válido. Ejemplo: #2563EB
        </AppText>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.backdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.modalBackground }]}> 
            <AppText variant="subtitle" bold>
              Seleccionar color
            </AppText>

            <View style={styles.selectedRow}>
              <View
                style={[
                  styles.selectedPreview,
                  {
                    backgroundColor: isValidHex(normalizeHex(draftColor))
                      ? normalizeHex(draftColor)
                      : theme.colors.inputBackground,
                    borderColor: theme.colors.inputBorder,
                  },
                ]}
              />
              <TextInput
                value={draftColor}
                onChangeText={(text) => setDraftColor(normalizeHex(text))}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="#000000"
                placeholderTextColor={theme.colors.placeholderText}
                style={[
                  styles.modalInput,
                  {
                    borderColor: theme.colors.inputBorder,
                    backgroundColor: theme.colors.inputBackground,
                    color: theme.colors.inputText,
                  },
                ]}
              />
            </View>

            <View style={styles.palette}>
              {COLOR_OPTIONS.map((color) => {
                const selected = normalizeHex(draftColor).toUpperCase() === color.toUpperCase();

                return (
                  <Pressable
                    key={color}
                    onPress={() => selectColor(color)}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: color,
                        borderColor: selected ? theme.colors.accent : theme.colors.optionBorder,
                        borderWidth: selected ? 3 : 1,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <AppButton title="Aplicar color" onPress={applyColor} />
              <AppButton title="Cancelar" variant="cancel" onPress={() => setPickerOpen(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  preview: {
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  colorButton: {
    minWidth: 86,
  },
  modalBackdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxWidth: 520,
    padding: 16,
    width: '100%',
  },
  selectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  selectedPreview: {
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    width: 48,
  },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  swatch: {
    borderRadius: 9,
    height: 38,
    width: 38,
  },
  modalActions: {
    gap: 10,
  },
});
