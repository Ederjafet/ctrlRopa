import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  BranchFormPayload,
  BranchStatus,
  createBranch,
  getBranch,
  updateBranch,
} from '@/services/branchAdminService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const emptyForm: BranchFormPayload = {
  code: '',
  name: '',
  status: 'ACTIVE',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'México',
};

function cleanError(error: any) {
  if (!error?.message) return 'Ocurrió un error inesperado.';
  return String(error.message).replace(/^"|"$/g, '');
}

export default function BranchesFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { theme } = useAppTheme();

  const branchId = id ? Number(id) : null;
  const isEditing = Number.isFinite(branchId) && !!branchId;

  const [form, setForm] = useState<BranchFormPayload>(emptyForm);
  const [loading, setLoading] = useState(!!isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const title = isEditing ? 'Editar sucursal' : 'Nueva sucursal';

  useEffect(() => {
    if (!isEditing || !branchId) return;

    let mounted = true;
    const idToLoad = branchId;

    async function loadBranch() {
      setLoading(true);
      setError('');

      try {
        const branch = await getBranch(idToLoad);

        if (!mounted) return;

        setForm({
          code: branch.code ?? '',
          name: branch.name ?? '',
          status: branch.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          addressLine1: branch.addressLine1 ?? '',
          addressLine2: branch.addressLine2 ?? '',
          city: branch.city ?? '',
          state: branch.state ?? '',
          postalCode: branch.postalCode ?? '',
          country: branch.country ?? 'México',
        });
      } catch (err: any) {
        if (mounted) {
          setError(cleanError(err));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBranch();

    return () => {
      mounted = false;
    };
  }, [branchId, isEditing]);

  const validationMessage = useMemo(() => {
    if (!form.code.trim()) return 'El código es obligatorio.';
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.addressLine1.trim()) return 'La dirección principal es obligatoria.';
    if (!form.city.trim()) return 'La ciudad es obligatoria.';
    if (!form.state.trim()) return 'El estado es obligatorio.';
    if (!form.postalCode.trim()) return 'El código postal es obligatorio.';
    if (!form.country.trim()) return 'El país es obligatorio.';
    return '';
  }, [form]);

  const updateField = (field: keyof BranchFormPayload, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'code' ? value.toUpperCase() : value,
    }));
  };

  const setStatus = (status: BranchStatus) => {
    setForm((current) => ({ ...current, status }));
  };

  const handleSave = async () => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing && branchId) {
        await updateBranch(branchId, form);
      } else {
        await createBranch(form);
      }

      router.replace('/branches');
    } catch (err: any) {
      setError(cleanError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/branches" />

      <AppText variant="title" bold>
        {title}
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Datos de la sucursal
        </AppText>
        <AppText color={theme.colors.mutedText}>
          Estos datos se usan para operación, usuarios, inventario y canales
          habilitados por sucursal.
        </AppText>
      </AppCard>

      {loading ? <AppText>Cargando sucursal...</AppText> : null}

      {!loading ? (
        <>
          <AppCard>
            <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
          <AppInput
            label="Código"
            value={form.code}
            onChangeText={(value) => updateField('code', value)}
            placeholder="CENTRO"
            autoCapitalize="characters"
          />

          <AppInput
            label="Nombre"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Sucursal Centro"
          />

          <AppInput
            label="Dirección principal"
            value={form.addressLine1}
            onChangeText={(value) => updateField('addressLine1', value)}
            placeholder="Calle y número"
          />

          <AppInput
            label="Dirección adicional"
            value={form.addressLine2 ?? ''}
            onChangeText={(value) => updateField('addressLine2', value)}
            placeholder="Colonia, referencia, interior (opcional)"
          />

          <AppInput
            label="Ciudad"
            value={form.city}
            onChangeText={(value) => updateField('city', value)}
            placeholder="Ciudad"
          />

          <AppInput
            label="Estado"
            value={form.state}
            onChangeText={(value) => updateField('state', value)}
            placeholder="Estado"
          />

          <AppInput
            label="Código postal"
            value={form.postalCode}
            onChangeText={(value) => updateField('postalCode', value)}
            placeholder="00000"
            keyboardType="number-pad"
          />

          <AppInput
            label="País"
            value={form.country}
            onChangeText={(value) => updateField('country', value)}
            placeholder="México"
          />
            </AppResponsiveGrid>
          </AppCard>

          <AppCard>
            <AppText variant="subtitle" bold>
              Estado
            </AppText>

            <View style={styles.statusRow}>
              <Pressable
                onPress={() => setStatus('ACTIVE')}
                style={({ pressed }) => [
                  styles.statusOption,
                  {
                    borderColor:
                      form.status === 'ACTIVE'
                        ? theme.colors.success
                        : theme.colors.border,
                    backgroundColor:
                      form.status === 'ACTIVE'
                        ? theme.colors.successBackground
                        : theme.colors.surface,
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
                  Activa
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => setStatus('INACTIVE')}
                style={({ pressed }) => [
                  styles.statusOption,
                  {
                    borderColor:
                      form.status === 'INACTIVE'
                        ? theme.colors.warning
                        : theme.colors.border,
                    backgroundColor:
                      form.status === 'INACTIVE'
                        ? theme.colors.warningBackground
                        : theme.colors.surface,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <AppText
                  bold
                  color={
                    form.status === 'INACTIVE'
                      ? theme.colors.warning
                      : theme.colors.text
                  }
                >
                  Inactiva
                </AppText>
              </Pressable>
            </View>

            <AppText variant="caption" color={theme.colors.mutedText}>
              Para reactivar una sucursal inactiva, cambia su estado a Activa y
              guarda los cambios.
            </AppText>
          </AppCard>

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
    marginBottom: 10,
  },
  statusOption: {
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
