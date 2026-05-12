import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  addCashExpense,
  cancelCashClosure,
  cancelCashExpense,
  CashClosure,
  CashExpenseLine,
  closeCashClosure,
  getCashClosure,
  getCashClosureStatusLabel,
  isCashClosureOpen,
  isExpenseActive,
  updateCashClosure,
} from '@/services/cashClosureService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

function formatMoney(value?: number | null) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function statusColor(theme: any, status?: string | null) {
  if (status === 'CLOSED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  return theme.colors.accent;
}

export default function CashClosureDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const closureId = Number(id);

  const [session, setSession] = useState<UserSession | null>(null);
  const [closure, setClosure] = useState<CashClosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deliveredCashText, setDeliveredCashText] = useState('');
  const [notes, setNotes] = useState('');

  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseAmountText, setExpenseAmountText] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const [cancelReason, setCancelReason] = useState('');
  const [expenseToCancel, setExpenseToCancel] = useState<CashExpenseLine | null>(null);

  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isCancelExpenseModalVisible, setIsCancelExpenseModalVisible] = useState(false);
  const [isCancelClosureModalVisible, setIsCancelClosureModalVisible] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    if (!closureId || Number.isNaN(closureId)) {
      Alert.alert('Cierre de caja', 'Cierre no válido.');
      router.replace('/cash-closures');
      return;
    }

    setLoading(true);

    try {
      const [currentSession, data] = await Promise.all([
        getSession(),
        getCashClosure(closureId),
      ]);

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);
      setClosure(data);
      setDeliveredCashText(String(data.deliveredCash ?? 0));
      setNotes(data.notes ?? '');
    } catch (err: any) {
      Alert.alert('Cierre de caja', err?.message || 'No se pudo cargar el cierre.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!closure) return;

    const deliveredCash = Number(deliveredCashText || 0);

    if (Number.isNaN(deliveredCash) || deliveredCash < 0) {
      Alert.alert('Cierre de caja', 'Captura efectivo entregado válido.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateCashClosure(closure.id, {
        deliveredCash,
        notes,
      });
      setClosure(updated);
      await load();
    } catch (err: any) {
      Alert.alert('Cierre de caja', err?.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const openExpenseModal = () => {
    setExpenseConcept('');
    setExpenseAmountText('');
    setExpenseNotes('');
    setIsExpenseModalVisible(true);
  };

  const handleAddExpense = async () => {
    if (!closure) return;

    const amount = Number(expenseAmountText);

    if (!expenseConcept.trim()) {
      Alert.alert('Gasto', 'Captura el concepto.');
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Gasto', 'Captura un monto válido.');
      return;
    }

    setSaving(true);

    try {
      const updated = await addCashExpense(closure.id, {
        concept: expenseConcept,
        amount,
        notes: expenseNotes,
      });

      setClosure(updated);
      setIsExpenseModalVisible(false);
      await load();
    } catch (err: any) {
      Alert.alert('Gasto', err?.message || 'No se pudo agregar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  const openCancelExpense = (expense: CashExpenseLine) => {
    setExpenseToCancel(expense);
    setCancelReason('');
    setIsCancelExpenseModalVisible(true);
  };

  const handleCancelExpense = async () => {
    if (!closure || !expenseToCancel) return;

    if (!cancelReason.trim()) {
      Alert.alert('Gasto', 'Captura el motivo de cancelación.');
      return;
    }

    setSaving(true);

    try {
      const updated = await cancelCashExpense(
        closure.id,
        expenseToCancel.id,
        cancelReason
      );
      setClosure(updated);
      setIsCancelExpenseModalVisible(false);
      setExpenseToCancel(null);
      await load();
    } catch (err: any) {
      Alert.alert('Gasto', err?.message || 'No se pudo cancelar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!closure || !session) return;

    const deliveredCash = Number(deliveredCashText || 0);

    if (Number.isNaN(deliveredCash) || deliveredCash < 0) {
      Alert.alert('Cierre de caja', 'Captura efectivo entregado válido.');
      return;
    }

    Alert.alert(
      'Cerrar caja',
      'Al cerrar la caja ya no podrás modificar gastos ni efectivo entregado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar caja',
          onPress: async () => {
            setSaving(true);

            try {
              const updated = await closeCashClosure(closure.id, {
                deliveredCash,
                closedByUserId: session.userId,
                notes,
              });
              setClosure(updated);
              await load();
            } catch (err: any) {
              Alert.alert('Cierre de caja', err?.message || 'No se pudo cerrar.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelClosure = async () => {
    if (!closure) return;

    if (!cancelReason.trim()) {
      Alert.alert('Cancelar cierre', 'Captura el motivo de cancelación.');
      return;
    }

    setSaving(true);

    try {
      const updated = await cancelCashClosure(closure.id, cancelReason);
      setClosure(updated);
      setIsCancelClosureModalVisible(false);
      await load();
    } catch (err: any) {
      Alert.alert('Cancelar cierre', err?.message || 'No se pudo cancelar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  if (!closure) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/cash-closures" />
        <AppText>No se encontró el cierre de caja.</AppText>
      </AppScreen>
    );
  }

  const open = isCashClosureOpen(closure);
  const color = statusColor(theme, closure.status);

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/cash-closures" />

        <AppText variant="title" bold>
          Cierre {closure.closureDate}
        </AppText>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                {closure.branchName || closure.branchCode || 'Sucursal'}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Estado: {getCashClosureStatusLabel(closure.status)}
              </AppText>
            </View>

            <View style={[styles.statusPill, { borderColor: color }]}>
              <AppText variant="caption" bold color={color}>
                {getCashClosureStatusLabel(closure.status)}
              </AppText>
            </View>
          </View>

          <View style={styles.amountGrid}>
            <AmountBlock label="Efectivo esperado" value={closure.expectedCash} />
            <AmountBlock label="Gastos" value={closure.expensesTotal} />
            <AmountBlock label="Entregado" value={closure.deliveredCash} />
            <AmountBlock label="Diferencia" value={closure.difference} highlight />
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Efectivo y notas
          </AppText>

          <AppInput
            label="Efectivo entregado"
            value={deliveredCashText}
            onChangeText={setDeliveredCashText}
            keyboardType="numeric"
            editable={open}
          />

          <AppInput
            label="Notas"
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={open}
          />

          {open ? (
            <AppButton
              title="Guardar cambios"
              onPress={handleUpdate}
              loading={saving}
              disabled={saving}
            />
          ) : null}
        </AppCard>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                Gastos
              </AppText>
              <AppText color={theme.colors.mutedText}>
                Solo los gastos activos descuentan del efectivo esperado.
              </AppText>
            </View>

            {open ? (
              <View style={styles.smallButton}>
                <AppButton title="Agregar" variant="secondary" onPress={openExpenseModal} />
              </View>
            ) : null}
          </View>

          {closure.expenses.length === 0 ? (
            <AppText color={theme.colors.mutedText}>No hay gastos registrados.</AppText>
          ) : (
            closure.expenses.map((expense) => {
              const active = isExpenseActive(expense);

              return (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.headerText}>
                    <AppText bold>{expense.concept}</AppText>
                    <AppText>{formatMoney(expense.amount)}</AppText>
                    {expense.notes ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {expense.notes}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {active ? 'Activo' : `Cancelado: ${expense.cancelReason || 'sin motivo'}`}
                    </AppText>
                  </View>

                  {open && active ? (
                    <Pressable onPress={() => openCancelExpense(expense)}>
                      <AppText color={theme.colors.danger} bold>
                        Cancelar
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Trazabilidad
          </AppText>
          <InfoLine label="Creado" value={formatDate(closure.createdAt)} />
          <InfoLine label="Usuario creador" value={closure.createdByUserId ? `#${closure.createdByUserId}` : '—'} />
          <InfoLine label="Cerrado" value={formatDate(closure.closedAt)} />
          <InfoLine label="Usuario cierre" value={closure.closedByUserId ? `#${closure.closedByUserId}` : '—'} />
          <InfoLine label="Cancelado" value={formatDate(closure.cancelledAt)} />
          <InfoLine label="Usuario cancelación" value={closure.cancelledByUserId ? `#${closure.cancelledByUserId}` : '—'} />
          {closure.cancelReason ? <InfoLine label="Motivo" value={closure.cancelReason} /> : null}
        </AppCard>

        {open ? (
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones
            </AppText>

            <View style={styles.buttonGroup}>
              <AppButton
                title="Cerrar caja"
                onPress={handleClose}
                loading={saving}
                disabled={saving}
              />

              <AppButton
                title="Cancelar cierre"
                variant="danger"
                onPress={() => {
                  setCancelReason('');
                  setIsCancelClosureModalVisible(true);
                }}
                disabled={saving}
              />
            </View>
          </AppCard>
        ) : null}
      </AppScreen>

      <AppBottomModal
        visible={isExpenseModalVisible}
        title="Agregar gasto"
        onClose={() => setIsExpenseModalVisible(false)}
      >
        <AppInput
          label="Concepto"
          value={expenseConcept}
          onChangeText={setExpenseConcept}
          placeholder="Ej. gasolina, envío, material"
        />

        <AppInput
          label="Monto"
          value={expenseAmountText}
          onChangeText={setExpenseAmountText}
          placeholder="0.00"
          keyboardType="numeric"
        />

        <AppInput
          label="Notas"
          value={expenseNotes}
          onChangeText={setExpenseNotes}
          placeholder="Notas opcionales"
          multiline
        />

        <AppButton
          title={saving ? 'Guardando...' : 'Agregar gasto'}
          onPress={handleAddExpense}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isCancelExpenseModalVisible}
        title="Cancelar gasto"
        onClose={() => setIsCancelExpenseModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Motivo de cancelación"
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancelExpense}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>

      <AppBottomModal
        visible={isCancelClosureModalVisible}
        title="Cancelar cierre"
        onClose={() => setIsCancelClosureModalVisible(false)}
      >
        <AppInput
          label="Motivo"
          value={cancelReason}
          onChangeText={setCancelReason}
          placeholder="Motivo de cancelación"
          multiline
        />

        <AppButton
          title="Confirmar cancelación"
          variant="danger"
          onPress={handleCancelClosure}
          loading={saving}
          disabled={saving}
        />
      </AppBottomModal>
    </>
  );
}

function AmountBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const { theme } = useAppTheme();
  const numeric = Number(value ?? 0);

  return (
    <View style={styles.amountBlock}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText bold color={highlight && numeric !== 0 ? theme.colors.danger : theme.colors.text}>
        {formatMoney(value)}
      </AppText>
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
  amountBlock: {
    flex: 1,
    minWidth: 130,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 10,
  },
  expenseRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  infoLine: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  smallButton: {
    minWidth: 110,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
