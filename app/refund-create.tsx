import QRScannerModal from '@/components/qr/QRScannerModal';
import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  createRefund,
  getRefundMethodLabel,
  lookupRefundByCode,
  lookupRefundByQr,
  RefundLookup,
  RefundMethod,
} from '@/services/refundService';
import { getSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const methods: Array<{ label: string; value: RefundMethod }> = [
  { label: 'Efectivo', value: 'CASH' },
  { label: 'Método original', value: 'ORIGINAL_METHOD' },
  { label: 'Saldo a favor', value: 'STORE_CREDIT' },
];

type LookupMode = 'RETURN_ID' | 'ITEM_CODE' | 'QR';

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

export default function RefundCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnId?: string }>();
  const { theme } = useAppTheme();

  const [mode, setMode] = useState<LookupMode>('RETURN_ID');
  const [returnId, setReturnId] = useState(params.returnId ?? '');
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState<RefundLookup | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<RefundMethod>('STORE_CREDIT');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (params.returnId) {
      setMode('RETURN_ID');
      setReturnId(String(params.returnId));
    }
  }, [params.returnId]);

  const applyLookup = (data: RefundLookup) => {
    setLookup(data);

    if (data.returnId) {
      setReturnId(String(data.returnId));
    }

    if (data.refundableAvailable !== null && data.refundableAvailable !== undefined) {
      setAmount(String(data.refundableAvailable));
    }
  };

  const handleLookup = async () => {
    if (mode === 'RETURN_ID') {
      Alert.alert(
        'Refund',
        'Con Return ID no se consulta disponibilidad. Captura el monto manualmente.'
      );
      return;
    }

    if (!code.trim()) {
      Alert.alert('Refund', 'Captura o escanea el código/QR del item.');
      return;
    }

    setLoadingLookup(true);

    try {
      const data = mode === 'QR' ? await lookupRefundByQr(code) : await lookupRefundByCode(code);
      applyLookup(data);
    } catch (err: any) {
      Alert.alert('Refund', err?.message || 'No se pudo consultar disponibilidad.');
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleScan = (value: string) => {
    setScannerVisible(false);
    setMode('QR');
    setCode(value);
  };

  const validate = () => {
    const parsedReturnId = Number(returnId);
    const parsedAmount = Number(amount);

    if (!returnId.trim() || Number.isNaN(parsedReturnId) || parsedReturnId <= 0) {
      Alert.alert('Refund', 'Captura un Return ID válido.');
      return false;
    }

    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Refund', 'Captura un monto válido.');
      return false;
    }

    if (lookup?.refundableAvailable !== undefined && lookup.refundableAvailable !== null) {
      if (parsedAmount > Number(lookup.refundableAvailable)) {
        Alert.alert(
          'Refund',
          'El monto no puede exceder el disponible para refund.'
        );
        return false;
      }
    }

    if (!reason.trim()) {
      Alert.alert('Refund', 'Captura el motivo.');
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
      const created = await createRefund({
        returnId: Number(returnId),
        amount: Number(amount),
        method,
        reason,
        notes,
        createdByUserId: session.userId,
      });

      Alert.alert('Refund', 'Refund creado correctamente.');
      router.replace({
        pathname: '/refund-detail',
        params: { id: String(created.id) },
      });
    } catch (err: any) {
      Alert.alert('Refund', err?.message || 'No se pudo crear el refund.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/refunds" />

        <AppText variant="title" bold>
          Nuevo refund
        </AppText>

        <AppCard>
          <AppText variant="subtitle" bold>
            Origen del refund
          </AppText>
          <SegmentedOptions
            options={[
              { label: 'Return ID', value: 'RETURN_ID' },
              { label: 'Código item', value: 'ITEM_CODE' },
              { label: 'QR', value: 'QR' },
            ]}
            selected={mode}
            onSelect={(value) => {
              setMode(value as LookupMode);
              setLookup(null);
            }}
          />
        </AppCard>

        {mode === 'RETURN_ID' ? (
          <AppInput
            label="Return ID"
            placeholder="Ej. 123"
            value={returnId}
            onChangeText={setReturnId}
            keyboardType="number-pad"
          />
        ) : (
          <>
            <AppInput
              label={mode === 'QR' ? 'QR del item' : 'Código del item'}
              placeholder="Captura o escanea"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <View style={styles.buttonRow}>
              <View style={styles.buttonFill}>
                <AppButton
                  title="Consultar"
                  variant="secondary"
                  onPress={handleLookup}
                  loading={loadingLookup}
                />
              </View>

              {mode === 'QR' ? (
                <View style={styles.buttonFill}>
                  <AppButton
                    title="Escanear QR"
                    variant="secondary"
                    onPress={() => setScannerVisible(true)}
                  />
                </View>
              ) : null}
            </View>
          </>
        )}

        {lookup ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Disponibilidad
            </AppText>
            <InfoLine label="Item" value={`${lookup.itemCode} (#${lookup.itemId})`} />
            <InfoLine label="Venta" value={`#${lookup.saleId}`} />
            <InfoLine label="Pagado" value={formatMoney(lookup.totalPaid)} />
            <InfoLine label="Ya reembolsado" value={formatMoney(lookup.totalRefunded)} />
            <InfoLine
              label="Disponible"
              value={formatMoney(lookup.refundableAvailable)}
            />
            <InfoLine
              label="Return"
              value={lookup.returnId ? `#${lookup.returnId} · ${lookup.returnStatus}` : 'Sin return procesado'}
            />
          </AppCard>
        ) : null}

        <AppInput
          label="Monto"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <AppCard>
          <AppText variant="subtitle" bold>
            Método
          </AppText>
          <SegmentedOptions
            options={methods}
            selected={method}
            onSelect={(value) => setMethod(value as RefundMethod)}
          />
          <AppText variant="caption" color={theme.colors.mutedText}>
            {method === 'STORE_CREDIT'
              ? 'Saldo a favor impacta el balance del cliente al procesar.'
              : `Método seleccionado: ${getRefundMethodLabel(method)}`}
          </AppText>
        </AppCard>

        <AppInput
          label="Motivo"
          placeholder="Motivo del refund"
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
          title={saving ? 'Creando...' : 'Crear refund'}
          onPress={handleCreate}
          loading={saving}
          disabled={saving}
        />
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

function InfoLine({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.infoLine}>
      <AppText color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonFill: {
    flex: 1,
    minWidth: 130,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  infoLine: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
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
