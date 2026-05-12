import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  createReturn,
  createReturnByItemCode,
  createReturnByQr,
  ReturnItemCondition,
  ReturnType,
} from '@/services/returnService';
import { getSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const types: Array<{ label: string; value: ReturnType }> = [
  { label: 'Total', value: 'TOTAL' },
  { label: 'Parcial', value: 'PARTIAL' },
];

const conditions: Array<{ label: string; value: ReturnItemCondition }> = [
  { label: 'Buen estado', value: 'GOOD' },
  { label: 'Dañada', value: 'DAMAGED' },
  { label: 'Defectuosa', value: 'DEFECTIVE' },
  { label: 'No vendible', value: 'UNSELLABLE' },
];

type Mode = 'ITEM_CODE' | 'QR' | 'SALE_ID';

export default function ReturnCreateScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [mode, setMode] = useState<Mode>('ITEM_CODE');
  const [code, setCode] = useState('');
  const [saleId, setSaleId] = useState('');
  const [type, setType] = useState<ReturnType>('PARTIAL');
  const [condition, setCondition] = useState<ReturnItemCondition>('GOOD');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const validate = () => {
    if (!reason.trim()) {
      Alert.alert('Devolución', 'Captura el motivo.');
      return false;
    }

    if (mode === 'SALE_ID') {
      const sale = Number(saleId);
      if (!saleId.trim() || Number.isNaN(sale) || sale <= 0) {
        Alert.alert('Devolución', 'Captura un ID de venta válido.');
        return false;
      }
      return true;
    }

    if (!code.trim()) {
      Alert.alert('Devolución', 'Captura o escanea el código/QR del item.');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    const session = await getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    setSaving(true);

    try {
      const basePayload = {
        type,
        reason,
        notes,
        createdByUserId: session.userId,
      };

      const created =
        mode === 'SALE_ID'
          ? await createReturn({
              saleId: Number(saleId),
              ...basePayload,
            })
          : mode === 'QR'
            ? await createReturnByQr(code, {
                ...basePayload,
                condition,
              })
            : await createReturnByItemCode(code, {
                ...basePayload,
                condition,
              });

      Alert.alert('Devolución', 'Devolución creada correctamente.');
      router.replace({
        pathname: '/return-detail',
        params: { id: String(created.id) },
      });
    } catch (err: any) {
      Alert.alert('Devolución', err?.message || 'No se pudo crear.');
    } finally {
      setSaving(false);
    }
  };

  const handleScan = (value: string) => {
    setScannerVisible(false);
    setMode('QR');
    setCode(value);
  };

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/returns" />

        <AppText variant="title" bold>
          Nueva devolución
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Forma de captura
          </AppText>

          <SegmentedOptions
            options={[
              { label: 'Código item', value: 'ITEM_CODE' },
              { label: 'QR', value: 'QR' },
              { label: 'Venta ID', value: 'SALE_ID' },
            ]}
            selected={mode}
            onSelect={(value) => setMode(value as Mode)}
          />
        </AppCard>

        {mode === 'SALE_ID' ? (
          <AppInput
            label="ID de venta"
            placeholder="Ej. 123"
            value={saleId}
            onChangeText={setSaleId}
            keyboardType="number-pad"
          />
        ) : (
          <>
            <AppInput
              label={mode === 'QR' ? 'QR del item' : 'Código del item'}
              placeholder="Escanea o captura el código"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            {mode === 'QR' ? (
              <AppButton
                title="Escanear QR"
                variant="secondary"
                onPress={() => setScannerVisible(true)}
              />
            ) : null}
          </>
        )}

        <AppCard>
          <AppText variant="subtitle" bold>
            Tipo de devolución
          </AppText>

          <SegmentedOptions
            options={types}
            selected={type}
            onSelect={(value) => setType(value as ReturnType)}
          />
        </AppCard>

        {mode !== 'SALE_ID' ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Condición física
            </AppText>

            <SegmentedOptions
              options={conditions}
              selected={condition}
              onSelect={(value) => setCondition(value as ReturnItemCondition)}
            />
          </AppCard>
        ) : null}

        <AppInput
          label="Motivo"
          placeholder="Motivo de la devolución"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        <AppInput
          label="Notas"
          placeholder="Notas opcionales"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <AppButton
          title={saving ? 'Creando...' : 'Crear devolución'}
          onPress={handleCreate}
          loading={saving}
          disabled={saving}
        />

        <AppText variant="caption" color={theme.colors.mutedText}>
          Si capturas por código o QR, el backend localiza la venta asociada al
          item y registra la condición física.
        </AppText>
      </AppScreen>

      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleScan}
      />
    </>
  );
}

function SegmentedOptions({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ label: string; value: string }>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.options}>
      {options.map((option) => {
        const active = selected === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: active ? theme.colors.accent : theme.colors.border,
                backgroundColor: active
                  ? theme.colors.optionPressedBackground
                  : theme.colors.surface,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppText bold={active}>{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
