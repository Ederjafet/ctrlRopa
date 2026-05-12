import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  createConsignee,
  EntityStatus,
  getConsigneeById,
  updateConsignee,
} from '@/services/consignmentService';
import { getSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type FormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: EntityStatus;
};

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
  notes: '',
  status: 'ACTIVE',
};

function cleanError(error: any) {
  return String(error?.message || 'Ocurrió un error inesperado.').replace(/^"|"$/g, '');
}

export default function ConsigneeFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const consigneeId = id ? Number(id) : null;
  const isEditing = Number.isFinite(consigneeId) && !!consigneeId;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [consigneeId]);

  const loadInitialData = async () => {
    const session = await getSession();

    if (!session) {
      router.replace('/login');
      return;
    }

    setBranchId(session.branchId);

    if (!isEditing || !consigneeId) return;

    setLoading(true);
    setError('');

    try {
      const consignee = await getConsigneeById(consigneeId);
      setForm({
        name: consignee.name ?? '',
        phone: consignee.phone ?? '',
        email: consignee.email ?? '',
        notes: consignee.notes ?? '',
        status: consignee.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
    } catch (err: any) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  };

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.phone.trim()) return 'El teléfono es obligatorio.';
    return '';
  }, [form]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!branchId) {
      setError('No hay sucursal activa en sesión.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing && consigneeId) {
        await updateConsignee(consigneeId, {
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          notes: form.notes || null,
          status: form.status,
        });
      } else {
        await createConsignee({
          branchId,
          name: form.name,
          phone: form.phone,
          email: form.email || null,
          notes: form.notes || null,
        });
      }

      router.replace('/consignees');
    } catch (err: any) {
      setError(cleanError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/consignees" />

      <AppText variant="title" bold>
        {isEditing ? 'Editar consignatario' : 'Nuevo consignatario'}
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Datos del tercero
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Los consignatarios se usan para entregar prendas en el canal de
          consignación.
        </AppText>
      </AppCard>

      {loading ? <AppText>Cargando...</AppText> : null}

      {!loading ? (
        <>
          <AppInput
            label="Nombre"
            value={form.name}
            onChangeText={(value) => setField('name', value)}
            placeholder="Nombre del consignatario"
          />

          <AppInput
            label="Teléfono"
            value={form.phone}
            onChangeText={(value) => setField('phone', value)}
            placeholder="Teléfono"
            keyboardType="phone-pad"
          />

          <AppInput
            label="Email"
            value={form.email}
            onChangeText={(value) => setField('email', value)}
            placeholder="correo@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <AppInput
            label="Notas"
            value={form.notes}
            onChangeText={(value) => setField('notes', value)}
            placeholder="Notas internas"
            multiline
          />

          {isEditing ? (
            <AppCard>
              <AppText variant="subtitle" bold>
                Estado
              </AppText>

              <View style={styles.statusRow}>
                <Pressable
                  onPress={() => setField('status', 'ACTIVE')}
                  style={({ pressed }) => [
                    styles.statusOption,
                    {
                      borderColor:
                        form.status === 'ACTIVE'
                          ? theme.colors.success
                          : theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText
                    bold
                    color={
                      form.status === 'ACTIVE'
                        ? theme.colors.success
                        : theme.colors.text
                    }
                  >
                    Activo
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={() => setField('status', 'INACTIVE')}
                  style={({ pressed }) => [
                    styles.statusOption,
                    {
                      borderColor:
                        form.status === 'INACTIVE'
                          ? theme.colors.danger
                          : theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText
                    bold
                    color={
                      form.status === 'INACTIVE'
                        ? theme.colors.danger
                        : theme.colors.text
                    }
                  >
                    Inactivo
                  </AppText>
                </Pressable>
              </View>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard style={{ borderColor: theme.colors.danger }}>
              <AppText color={theme.colors.danger}>{error}</AppText>
            </AppCard>
          ) : null}

          <AppButton
            title={saving ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statusOption: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
