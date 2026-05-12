import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getIncidentById,
  getIncidentStatusLabel,
  getIncidentTypeLabel,
  Incident,
  IncidentStatus,
  isIncidentFinal,
  updateIncidentStatus,
} from '@/services/incidentService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function getStatusColor(theme: any, status?: string | null) {
  if (status === 'RESOLVED') return theme.colors.success;
  if (status === 'CANCELLED') return theme.colors.danger;
  if (status === 'IN_PROGRESS') return theme.colors.accent;
  return theme.colors.danger;
}

export default function IncidentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const incidentId = Number(id);

  const [session, setSession] = useState<UserSession | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nextStatus, setNextStatus] = useState<IncidentStatus | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    if (!incidentId || Number.isNaN(incidentId)) {
      Alert.alert('Incidencia', 'Incidencia no válida.');
      router.replace('/incidents');
      return;
    }

    setLoading(true);

    try {
      const [currentSession, data] = await Promise.all([
        getSession(),
        getIncidentById(incidentId),
      ]);

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);
      setIncident(data);
      setDescription(data.description ?? '');
      setEvidenceUrl(data.evidenceUrl ?? '');
    } catch (err: any) {
      Alert.alert(
        'Incidencia',
        err?.message || 'No se pudo cargar la incidencia.'
      );
    } finally {
      setLoading(false);
    }
  };

  const availableTransitions = useMemo(() => {
    if (!incident || isIncidentFinal(incident.status)) return [];

    if (incident.status === 'OPEN') {
      return [
        {
          status: 'IN_PROGRESS' as IncidentStatus,
          label: 'Marcar en seguimiento',
          variant: 'secondary' as const,
        },
        {
          status: 'RESOLVED' as IncidentStatus,
          label: 'Resolver',
          variant: 'primary' as const,
        },
        {
          status: 'CANCELLED' as IncidentStatus,
          label: 'Cancelar',
          variant: 'danger' as const,
        },
      ];
    }

    if (incident.status === 'IN_PROGRESS') {
      return [
        {
          status: 'RESOLVED' as IncidentStatus,
          label: 'Resolver',
          variant: 'primary' as const,
        },
        {
          status: 'CANCELLED' as IncidentStatus,
          label: 'Cancelar',
          variant: 'danger' as const,
        },
      ];
    }

    return [];
  }, [incident]);

  const openStatusModal = (status: IncidentStatus, label: string) => {
    setNextStatus(status);
    setModalTitle(label);
    setDescription(incident?.description ?? '');
    setEvidenceUrl(incident?.evidenceUrl ?? '');
    setIsStatusModalVisible(true);
  };

  const handleUpdateStatus = async () => {
    if (!incident || !session || !nextStatus) return;

    if (
      (nextStatus === 'RESOLVED' || nextStatus === 'CANCELLED') &&
      !description.trim()
    ) {
      Alert.alert(
        'Incidencia',
        'Captura una descripción o nota de resolución/cancelación.'
      );
      return;
    }

    setSaving(true);

    try {
      const updated = await updateIncidentStatus(incident.id, {
        status: nextStatus,
        description,
        evidenceUrl,
        actedByUserId: session.userId,
      });

      setIncident(updated);
      setIsStatusModalVisible(false);
      setNextStatus(null);
      await load();
    } catch (err: any) {
      Alert.alert(
        'Incidencia',
        err?.message || 'No se pudo actualizar la incidencia.'
      );
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

  if (!incident) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/incidents" />
        <AppText>No se encontró la incidencia.</AppText>
      </AppScreen>
    );
  }

  const statusColor = getStatusColor(theme, incident.status);
  const finalIncident = isIncidentFinal(incident.status);

  return (
    <>
      <AppScreen>
        <AppBackButton fallbackRoute="/incidents" />

        <AppText variant="title" bold>
          Incidencia #{incident.id}
        </AppText>

        <AppCard>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <AppText variant="subtitle" bold>
                {getIncidentTypeLabel(incident.type)}
              </AppText>
              <AppText color={theme.colors.mutedText}>
                {getIncidentStatusLabel(incident.status)}
              </AppText>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  borderColor: statusColor,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppText variant="caption" bold color={statusColor}>
                {getIncidentStatusLabel(incident.status)}
              </AppText>
            </View>
          </View>

          {incident.description ? (
            <AppText style={styles.description}>{incident.description}</AppText>
          ) : (
            <AppText color={theme.colors.mutedText}>
              Sin descripción registrada.
            </AppText>
          )}

          {incident.evidenceUrl ? (
            <AppButton
              title="Abrir evidencia"
              variant="secondary"
              onPress={() => Linking.openURL(incident.evidenceUrl!)}
            />
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Relación operativa
          </AppText>

          <InfoLine label="Sucursal" value={`#${incident.branchId}`} />

          {incident.customerId ? (
            <InfoLine label="Cliente" value={`#${incident.customerId}`} />
          ) : null}

          {incident.itemId ? <InfoLine label="Item" value={`#${incident.itemId}`} /> : null}

          {incident.customerOrderId ? (
            <InfoLine label="Pedido" value={`#${incident.customerOrderId}`} />
          ) : null}

          {incident.shipmentId ? (
            <View style={styles.linkRow}>
              <View style={styles.headerText}>
                <InfoLine label="Envío" value={`#${incident.shipmentId}`} />
              </View>
              <AppButton
                title="Ver envío"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/shipment-detail',
                    params: {
                      id: String(incident.shipmentId),
                      returnTo: `/incident-detail?id=${incident.id}`,
                    },
                  })
                }
              />
            </View>
          ) : null}

          {incident.shipmentPackageId ? (
            <InfoLine
              label="Paquete de envío"
              value={`#${incident.shipmentPackageId}`}
            />
          ) : null}
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Montos
          </AppText>

          <InfoLine
            label="Monto esperado"
            value={formatMoney(incident.expectedAmount)}
          />
          <InfoLine
            label="Monto recibido"
            value={formatMoney(incident.receivedAmount)}
          />
          <InfoLine
            label="Diferencia"
            value={formatMoney(incident.differenceAmount)}
            color={
              Number(incident.differenceAmount ?? 0) === 0
                ? theme.colors.text
                : theme.colors.danger
            }
          />
        </AppCard>

        <AppCard>
          <AppText variant="subtitle" bold>
            Trazabilidad
          </AppText>

          <InfoLine label="Creada" value={formatDate(incident.createdAt)} />
          <InfoLine
            label="Usuario creador"
            value={
              incident.createdByUserId ? `#${incident.createdByUserId}` : '—'
            }
          />
          <InfoLine
            label="En seguimiento"
            value={formatDate(incident.inProgressAt)}
          />
          <InfoLine label="Resuelta" value={formatDate(incident.resolvedAt)} />
          <InfoLine
            label="Usuario que resolvió"
            value={
              incident.resolvedByUserId ? `#${incident.resolvedByUserId}` : '—'
            }
          />
          <InfoLine label="Cancelada" value={formatDate(incident.cancelledAt)} />
          <InfoLine
            label="Usuario que canceló"
            value={
              incident.cancelledByUserId ? `#${incident.cancelledByUserId}` : '—'
            }
          />
        </AppCard>

        {finalIncident ? (
          <AppCard>
            <AppText color={theme.colors.mutedText}>
              Esta incidencia ya está finalizada y no puede cambiar de estado.
            </AppText>
          </AppCard>
        ) : (
          <AppCard>
            <AppText variant="subtitle" bold>
              Acciones
            </AppText>

            <View style={styles.buttonGroup}>
              {availableTransitions.map((transition) => (
                <AppButton
                  key={transition.status}
                  title={transition.label}
                  variant={transition.variant}
                  onPress={() =>
                    openStatusModal(transition.status, transition.label)
                  }
                  disabled={saving}
                />
              ))}
            </View>
          </AppCard>
        )}
      </AppScreen>

      <AppBottomModal
        visible={isStatusModalVisible}
        title={modalTitle}
        onClose={() => setIsStatusModalVisible(false)}
      >
        <AppInput
          label="Descripción / seguimiento"
          placeholder="Agrega nota de seguimiento, resolución o cancelación"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <AppInput
          label="Evidencia URL"
          placeholder="URL opcional de evidencia"
          value={evidenceUrl}
          onChangeText={setEvidenceUrl}
          autoCapitalize="none"
        />

        <AppButton
          title={saving ? 'Guardando...' : 'Guardar cambio'}
          onPress={handleUpdateStatus}
          loading={saving}
          disabled={saving}
          variant={nextStatus === 'CANCELLED' ? 'danger' : 'primary'}
        />
      </AppBottomModal>
    </>
  );
}

function InfoLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.infoLine}>
      <AppText color={theme.colors.mutedText}>{label}</AppText>
      <AppText bold color={color}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    gap: 10,
  },
  description: {
    marginTop: 8,
    marginBottom: 10,
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
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
