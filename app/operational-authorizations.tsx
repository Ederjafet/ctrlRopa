import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppText from '@/components/ui/AppText';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { getActionableApiError, getActionableApiErrorMessage } from '@/services/apiError';
import { hasAnyPermission, hasPermission } from '@/services/accessControl';
import {
  applyOperationalAuthorization,
  approveOperationalAuthorization,
  createOperationalAuthorization,
  getMyOperationalAuthorizations,
  getOperationalAuthorizationsByBranch,
  type OperationalAuthorization,
  type OperationalAuthorizationStatus,
  type OperationalAuthorizationTargetType,
  type OperationalAuthorizationType,
  rejectOperationalAuthorization,
} from '@/services/operationalAuthorizationService';
import { getSession, type UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

const OPERATION_OPTIONS: OperationalAuthorizationType[] = [
  'UNDO_LIVE_OPERATIONAL_SALE',
  'LIVE_PRICE_CHANGE',
  'CANCEL_RESERVATION_WITH_PAYMENT',
  'RELEASE_RESERVED_ITEM',
  'REASSIGN_RESERVATION',
  'EDIT_LOCKED_ITEM',
];

const TARGET_OPTIONS: OperationalAuthorizationTargetType[] = [
  'RESERVATION',
  'LIVE',
  'ITEM',
  'PAYMENT',
  'SALE',
];

const OPERATION_PERMISSION: Record<OperationalAuthorizationType, string> = {
  CANCEL_RESERVATION_WITH_PAYMENT: 'CANCEL_RESERVATION_WITH_PAYMENT',
  RELEASE_RESERVED_ITEM: 'RELEASE_RESERVED_ITEM',
  UNDO_LIVE_OPERATIONAL_SALE: 'UNDO_LIVE_OPERATIONAL_SALE',
  LIVE_PRICE_CHANGE: 'REQUEST_LIVE_PRICE_CHANGE',
  REASSIGN_RESERVATION: 'REASSIGN_RESERVATION',
  EDIT_LOCKED_ITEM: 'EDIT_LOCKED_ITEM',
};

type DecisionAction = 'approve' | 'reject' | 'apply';

type CreateForm = {
  operationType: OperationalAuthorizationType;
  targetType: OperationalAuthorizationTargetType;
  targetId: string;
  requestedPrice: string;
  reason: string;
};

function statusTone(status: OperationalAuthorizationStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REQUESTED':
      return 'warning';
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    case 'APPLIED':
      return 'info';
    default:
      return 'neutral';
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function canOpenScreen(session: UserSession | null) {
  return hasAnyPermission(session, [
    'VIEW_LIVE_OPERATION_AUTHORIZATIONS',
    'REQUEST_LIVE_OPERATION_AUTHORIZATION',
  ]);
}

export default function OperationalAuthorizationsScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { theme } = useAppTheme();
  const [session, setSession] = useState<UserSession | null>(null);
  const [items, setItems] = useState<OperationalAuthorization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selected, setSelected] = useState<OperationalAuthorization | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [decisionAction, setDecisionAction] = useState<DecisionAction | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [form, setForm] = useState<CreateForm>({
    operationType: 'UNDO_LIVE_OPERATIONAL_SALE',
    targetType: 'RESERVATION',
    targetId: '',
    requestedPrice: '',
    reason: '',
  });
  const navSections = useMemo(() => buildMainNavSections(session), [session]);
  const canViewQueue = hasPermission(session, 'VIEW_LIVE_OPERATION_AUTHORIZATIONS');
  const canRequest = hasPermission(session, 'REQUEST_LIVE_OPERATION_AUTHORIZATION');
  const canApprove = hasPermission(session, 'APPROVE_LIVE_OPERATION_AUTHORIZATION');
  const canApply = hasPermission(session, 'APPLY_LIVE_OPERATION_AUTHORIZATION');
  const canApplyPrice = hasPermission(session, 'APPLY_APPROVED_LIVE_PRICE_CHANGE');
  const availableOperationOptions = useMemo(
    () =>
      OPERATION_OPTIONS.filter((operationType) =>
        hasPermission(session, OPERATION_PERMISSION[operationType])
      ),
    [session]
  );

  const load = useCallback(
    async (refreshing = false) => {
      const currentSession = await getSession();

      if (!canOpenScreen(currentSession)) {
        router.replace('/access-denied');
        return;
      }

      setSession(currentSession);

      if (!currentSession?.branchId) {
        setErrorMessage(t('liveAuth.branchMissing'));
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      try {
        setErrorMessage('');
        if (refreshing) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = hasPermission(currentSession, 'VIEW_LIVE_OPERATION_AUTHORIZATIONS')
          ? await getOperationalAuthorizationsByBranch(currentSession.branchId)
          : await getMyOperationalAuthorizations(currentSession.branchId);
        setItems(data);
      } catch (error) {
        setErrorMessage(getActionableApiErrorMessage(error, t));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router, t]
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const submitCreate = async () => {
    if (!session?.branchId) return;

    const targetId = Number(form.targetId);
    const requestedPrice = Number(form.requestedPrice);
    if (!Number.isFinite(targetId) || targetId <= 0 || !form.reason.trim()) {
      Alert.alert(t('liveAuth.validationTitle'), t('liveAuth.validationMessage'));
      return;
    }
    if (
      form.operationType === 'LIVE_PRICE_CHANGE' &&
      (!Number.isFinite(requestedPrice) || requestedPrice <= 0)
    ) {
      Alert.alert(t('liveAuth.validationTitle'), t('liveAuth.priceValidationMessage'));
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createOperationalAuthorization({
        operationType: form.operationType,
        targetType: form.operationType === 'LIVE_PRICE_CHANGE' ? 'RESERVATION' : form.targetType,
        targetId,
        branchId: session.branchId,
        reason: form.reason.trim(),
        liveId:
          form.operationType !== 'LIVE_PRICE_CHANGE' && form.targetType === 'LIVE'
            ? targetId
            : undefined,
        reservationId:
          form.operationType === 'LIVE_PRICE_CHANGE' || form.targetType === 'RESERVATION'
            ? targetId
            : undefined,
        itemId:
          form.operationType !== 'LIVE_PRICE_CHANGE' && form.targetType === 'ITEM'
            ? targetId
            : undefined,
        paymentId:
          form.operationType !== 'LIVE_PRICE_CHANGE' && form.targetType === 'PAYMENT'
            ? targetId
            : undefined,
        saleId:
          form.operationType !== 'LIVE_PRICE_CHANGE' && form.targetType === 'SALE'
            ? targetId
            : undefined,
        payloadJson:
          form.operationType === 'LIVE_PRICE_CHANGE'
            ? JSON.stringify({ requestedPrice })
            : undefined,
      });
      setCreateVisible(false);
      setSelected(created);
      setForm({
        operationType: 'UNDO_LIVE_OPERATIONAL_SALE',
        targetType: 'RESERVATION',
        targetId: '',
        requestedPrice: '',
        reason: '',
      });
      await load(true);
    } catch (error) {
      const copy = getActionableApiError(error, t);
      Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDecision = async () => {
    if (!selected || !decisionAction) return;

    try {
      setIsSubmitting(true);
      const payload = decisionReason.trim() ? { reason: decisionReason.trim() } : {};
      const updated =
        decisionAction === 'approve'
          ? await approveOperationalAuthorization(selected.id, payload)
          : decisionAction === 'reject'
            ? await rejectOperationalAuthorization(selected.id, payload)
            : await applyOperationalAuthorization(selected.id, payload);
      setSelected(updated);
      setDecisionAction(null);
      setDecisionReason('');
      await load(true);
    } catch (error) {
      const copy = getActionableApiError(error, t);
      Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: OperationalAuthorization }) => (
    <AppCard style={styles.card}>
      <Pressable onPress={() => setSelected(item)} style={styles.cardPressable}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <AppText bold>{t(`liveAuth.operations.${item.operationType}`)}</AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              {t('liveAuth.targetSummary', {
                target: t(`liveAuth.targets.${item.targetType}`),
                id: item.targetId,
              })}
            </AppText>
          </View>
          <StatusBadge
            label={t(`liveAuth.statuses.${item.status}`)}
            tone={statusTone(item.status)}
          />
        </View>
        <AppText numberOfLines={2}>{item.reason}</AppText>
        <AppText variant="caption" color={theme.colors.mutedText}>
          {t('liveAuth.requestedAt', { value: formatDate(item.requestedAt) })}
        </AppText>
      </Pressable>
    </AppCard>
  );

  if (isLoading) {
    return (
      <AppShell
        title={t('liveAuth.title')}
        subtitle={t('liveAuth.subtitle')}
        contextTitle={t('liveAuth.contextTitle')}
        contextSubtitle={getSessionScopeLabel(session)}
        activeRoute="operational-authorizations"
        session={session}
        navSections={navSections}
      >
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
          <AppText>{t('liveAuth.loading')}</AppText>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={t('liveAuth.title')}
      subtitle={t('liveAuth.subtitle')}
      contextTitle={t('liveAuth.contextTitle')}
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="operational-authorizations"
      session={session}
      navSections={navSections}
    >
      <View style={styles.toolbar}>
        <AppButton
          title={t('liveAuth.refresh')}
          variant="secondary"
          loading={isRefreshing}
          onPress={() => void load(true)}
          style={styles.toolbarButton}
        />
        {canRequest ? (
          <AppButton
            title={t('liveAuth.newRequest')}
            variant="operation"
            onPress={() => setCreateVisible(true)}
            style={styles.toolbarButton}
          />
        ) : null}
      </View>

      {errorMessage ? (
        <AppText color={theme.colors.danger} style={styles.errorText}>
          {errorMessage}
        </AppText>
      ) : null}

      {!canViewQueue ? (
        <AppText variant="caption" color={theme.colors.mutedText}>
          {t('liveAuth.mineOnly')}
        </AppText>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title={t('liveAuth.emptyTitle')}
            message={t('liveAuth.emptyMessage')}
          />
        }
      />

      <CreateRequestModal
        form={form}
        operationOptions={availableOperationOptions}
        visible={createVisible}
        isSubmitting={isSubmitting}
        onChange={setForm}
        onClose={() => setCreateVisible(false)}
        onSubmit={submitCreate}
      />

      <DetailModal
        item={selected}
        canApprove={canApprove}
        canApply={canApply}
        canApplyPrice={canApplyPrice}
        onClose={() => setSelected(null)}
        onDecision={(action) => {
          setDecisionAction(action);
          setDecisionReason('');
        }}
      />

      <DecisionModal
        action={decisionAction}
        visible={Boolean(decisionAction)}
        reason={decisionReason}
        isSubmitting={isSubmitting}
        onChangeReason={setDecisionReason}
        onClose={() => {
          if (isSubmitting) return;
          setDecisionAction(null);
          setDecisionReason('');
        }}
        onSubmit={submitDecision}
      />
    </AppShell>
  );
}

function CreateRequestModal({
  visible,
  form,
  operationOptions,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  form: CreateForm;
  operationOptions: OperationalAuthorizationType[];
  isSubmitting: boolean;
  onChange: (form: CreateForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <AppBottomModal
      visible={visible}
      title={t('liveAuth.createTitle')}
      onClose={onClose}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title={t('common.cancel')} variant="cancel" onPress={onClose} />
          <AppButton
            title={t('liveAuth.submitRequest')}
            variant="operation"
            loading={isSubmitting}
            onPress={onSubmit}
          />
        </View>
      }
    >
      <AppText>{t('liveAuth.createHelp')}</AppText>
      <OptionGroup
        title={t('liveAuth.operationType')}
        options={operationOptions}
        value={form.operationType}
        labelPrefix="liveAuth.operations"
        onSelect={(operationType) => onChange({ ...form, operationType })}
      />
      {form.operationType === 'LIVE_PRICE_CHANGE' ? (
        <AppText variant="caption">{t('liveAuth.priceReservationOnly')}</AppText>
      ) : (
        <OptionGroup
          title={t('liveAuth.targetType')}
          options={TARGET_OPTIONS}
          value={form.targetType}
          labelPrefix="liveAuth.targets"
          onSelect={(targetType) => onChange({ ...form, targetType })}
        />
      )}
      <AppInput
        label={
          form.operationType === 'LIVE_PRICE_CHANGE'
            ? t('liveAuth.reservationId')
            : t('liveAuth.targetId')
        }
        keyboardType="numeric"
        value={form.targetId}
        onChangeText={(targetId) => onChange({ ...form, targetId })}
      />
      {form.operationType === 'LIVE_PRICE_CHANGE' ? (
        <AppInput
          label={t('liveAuth.requestedPrice')}
          keyboardType="decimal-pad"
          value={form.requestedPrice}
          onChangeText={(requestedPrice) => onChange({ ...form, requestedPrice })}
        />
      ) : null}
      <AppInput
        label={t('liveAuth.reason')}
        multiline
        value={form.reason}
        onChangeText={(reason) => onChange({ ...form, reason })}
        style={styles.textArea}
      />
    </AppBottomModal>
  );
}

function DetailModal({
  item,
  canApprove,
  canApply,
  canApplyPrice,
  onClose,
  onDecision,
}: {
  item: OperationalAuthorization | null;
  canApprove: boolean;
  canApply: boolean;
  canApplyPrice: boolean;
  onClose: () => void;
  onDecision: (action: DecisionAction) => void;
}) {
  const { t } = useTranslation('common');
  const { theme } = useAppTheme();

  if (!item) return null;

  const canDecide = item.status === 'REQUESTED' && canApprove;
  const canApplySupported =
    item.status === 'APPROVED' &&
    canApply &&
    (item.operationType === 'UNDO_LIVE_OPERATIONAL_SALE' ||
      (item.operationType === 'LIVE_PRICE_CHANGE' && canApplyPrice));
  const applyPending =
    item.status === 'APPROVED' &&
    item.operationType !== 'UNDO_LIVE_OPERATIONAL_SALE' &&
    item.operationType !== 'LIVE_PRICE_CHANGE';

  return (
    <AppBottomModal visible title={t('liveAuth.detailTitle')} onClose={onClose}>
      <View style={styles.detailHeader}>
        <AppText variant="subtitle" bold>
          {t(`liveAuth.operations.${item.operationType}`)}
        </AppText>
        <StatusBadge
          label={t(`liveAuth.statuses.${item.status}`)}
          tone={statusTone(item.status)}
        />
      </View>
      <DetailRow label={t('liveAuth.id')} value={`#${item.id}`} />
      <DetailRow
        label={t('liveAuth.target')}
        value={t('liveAuth.targetSummary', {
          target: t(`liveAuth.targets.${item.targetType}`),
          id: item.targetId,
        })}
      />
      <DetailRow label={t('liveAuth.reason')} value={item.reason} />
      <DetailRow label={t('liveAuth.requestedAtLabel')} value={formatDate(item.requestedAt)} />
      <DetailRow label={t('liveAuth.expiresAt')} value={formatDate(item.expiresAt)} />
      {item.decisionReason ? (
        <DetailRow label={t('liveAuth.decisionReason')} value={item.decisionReason} />
      ) : null}
      {applyPending ? (
        <AppText color={theme.colors.warning} style={styles.pendingText}>
          {t('liveAuth.applyPending')}
        </AppText>
      ) : null}
      <View style={styles.actionRow}>
        {canDecide ? (
          <>
            <AppButton
              title={t('liveAuth.approve')}
              variant="operation"
              onPress={() => onDecision('approve')}
              style={styles.actionButton}
            />
            <AppButton
              title={t('liveAuth.reject')}
              variant="danger"
              onPress={() => onDecision('reject')}
              style={styles.actionButton}
            />
          </>
        ) : null}
        {canApplySupported ? (
          <AppButton
            title={t('liveAuth.apply')}
            variant="warning"
            onPress={() => onDecision('apply')}
            style={styles.actionButton}
          />
        ) : null}
      </View>
    </AppBottomModal>
  );
}

function DecisionModal({
  visible,
  action,
  reason,
  isSubmitting,
  onChangeReason,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  action: DecisionAction | null;
  reason: string;
  isSubmitting: boolean;
  onChangeReason: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation('common');
  if (!action) return null;

  return (
    <AppBottomModal
      visible={visible}
      title={t(`liveAuth.${action}Title`)}
      onClose={onClose}
      footer={
        <View style={styles.modalFooter}>
          <AppButton title={t('common.cancel')} variant="cancel" onPress={onClose} />
          <AppButton
            title={t(`liveAuth.${action}`)}
            variant={action === 'reject' ? 'danger' : action === 'apply' ? 'warning' : 'operation'}
            loading={isSubmitting}
            onPress={onSubmit}
          />
        </View>
      }
    >
      <AppInput
        label={t('liveAuth.decisionReason')}
        value={reason}
        onChangeText={onChangeReason}
        multiline
        style={styles.textArea}
      />
    </AppBottomModal>
  );
}

function OptionGroup<T extends string>({
  title,
  options,
  value,
  labelPrefix,
  onSelect,
}: {
  title: string;
  options: T[];
  value: T;
  labelPrefix: string;
  onSelect: (value: T) => void;
}) {
  const { t } = useTranslation('common');
  const { theme } = useAppTheme();

  return (
    <View style={styles.optionGroup}>
      <AppText variant="subtitle">{title}</AppText>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.optionButton,
                {
                  backgroundColor: selected
                    ? theme.colors.operationButtonBackground
                    : pressed
                      ? theme.colors.optionPressedBackground
                      : theme.colors.surface,
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <AppText
                bold={selected}
                color={selected ? theme.colors.operationButtonText : theme.colors.text}
              >
                {t(`${labelPrefix}.${option}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flexGrow: 1,
    minWidth: 140,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  card: {
    marginBottom: 10,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardPressable: {
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    gap: 4,
    minWidth: 180,
  },
  centered: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailRow: {
    gap: 3,
    marginTop: 10,
  },
  errorText: {
    marginBottom: 10,
  },
  listContent: {
    paddingTop: 10,
  },
  modalFooter: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionGroup: {
    gap: 10,
    marginTop: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pendingText: {
    marginTop: 12,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  toolbarButton: {
    minWidth: 150,
  },
});
