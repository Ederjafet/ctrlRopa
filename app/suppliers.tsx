import AppShellPage from '@/components/layout/AppShellPage';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppTheme } from '@/context/AppThemeContext';
import { canAccessByPermission, hasAnyPermission } from '@/services/accessControl';
import { getActionableApiErrorMessage } from '@/services/apiError';
import { createSupplier, getSuppliers, Supplier, updateSupplier } from '@/services/supplierService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  status: 'ACTIVE',
};

export default function SuppliersScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [session, setSession] = useState<UserSession | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canViewSuppliers = hasAnyPermission(session, ['VIEW_INVENTORY', 'MANAGE_CATALOGS']);
  const canManageSuppliers = canAccessByPermission(session, 'MANAGE_CATALOGS');

  const loadSuppliers = useCallback(async () => {
    const currentSession = await getSession();
    setSession(currentSession);

    if (!hasAnyPermission(currentSession, ['VIEW_INVENTORY', 'MANAGE_CATALOGS'])) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuppliers(await getSuppliers());
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSuppliers();
    }, [loadSuppliers])
  );

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;

    return suppliers.filter((supplier) =>
      `${supplier.code} ${supplier.name} ${supplier.description ?? ''} ${supplier.status ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [search, suppliers]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingSupplierId(null);
    setShowForm(false);
  };

  const openEditor = (supplier: Supplier) => {
    setForm({
      code: supplier.code,
      name: supplier.name,
      description: supplier.description ?? '',
      status: supplier.status ?? 'ACTIVE',
    });
    setEditingSupplierId(supplier.id);
    setShowForm(true);
    setMessage('');
    setErrorMessage('');
  };

  const handleSave = async () => {
    const code = form.code.trim();
    const name = form.name.trim();

    if (!canManageSuppliers) {
      setErrorMessage('No tienes permiso para crear proveedores. Permiso requerido: MANAGE_CATALOGS.');
      return;
    }

    if (!code || !name) {
      setErrorMessage('Captura codigo y nombre del proveedor.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setMessage('');

      if (editingSupplierId) {
        const updated = await updateSupplier(editingSupplierId, {
          code,
          name,
          description: form.description,
          status: form.status,
        });
        setMessage(`Proveedor actualizado: ${updated.name}.`);
      } else {
        const created = await createSupplier({
          code,
          name,
          description: form.description,
        });
        setMessage(`Proveedor creado: ${created.name}. Ahora puedes usarlo al crear lote.`);
      }

      resetForm();
      await loadSuppliers();
    } catch (error) {
      setErrorMessage(getActionableApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShellPage
        title="Proveedores"
        subtitle="Catalogo operativo para lotes y recepcion"
        activeRoute="suppliers"
        rightContent={<ScreenPermissionHeaderAction screenKey="suppliers" screenTitle="Proveedores" session={session} />}
      >
        <ActivityIndicator />
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title="Proveedores"
      subtitle="Catalogo operativo para lotes y recepcion"
      activeRoute="suppliers"
      rightContent={
        <View style={styles.actionsRow}>
          <ScreenPermissionHeaderAction screenKey="suppliers" screenTitle="Proveedores" session={session} />
          <AppButton
            title="Volver a lotes"
            variant="secondary"
            onPress={() => router.push('/batches' as any)}
          />
        </View>
      }
    >
      {!canViewSuppliers ? (
        <AppCard variant="danger">
          <AppText bold>Acceso restringido</AppText>
          <AppText>
            No tienes permiso para consultar proveedores. Permiso requerido: VIEW_INVENTORY o MANAGE_CATALOGS.
          </AppText>
        </AppCard>
      ) : null}

      {message ? (
        <AppCard variant="success">
          <AppText>{message}</AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard variant="danger">
          <AppText>{errorMessage}</AppText>
        </AppCard>
      ) : null}

      {canViewSuppliers ? (
        <>
          <AppCard>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <AppText variant="subtitle" bold>
                  Proveedores
                </AppText>
                <AppText variant="caption" color={theme.colors.mutedText}>
                  Registra proveedores antes de crear lotes cuando la recepcion requiere identificar origen.
                </AppText>
              </View>
              <AppButton
                title={showForm ? 'Cancelar' : 'Crear proveedor'}
                variant="operation"
                disabled={!canManageSuppliers}
                disabledReason="Tu usuario necesita MANAGE_CATALOGS."
                onPress={() => {
                  if (showForm) {
                    resetForm();
                    return;
                  }
                  setForm(EMPTY_FORM);
                  setEditingSupplierId(null);
                  setShowForm(true);
                }}
              />
            </View>

            {showForm ? (
              <View style={styles.form}>
                <AppText bold>{editingSupplierId ? 'Editar proveedor' : 'Nuevo proveedor'}</AppText>
                <AppResponsiveGrid tabletColumns={2} desktopColumns={2}>
                  <AppInput
                    label="Codigo *"
                    placeholder="PROV-001"
                    autoCapitalize="characters"
                    value={form.code}
                    onChangeText={(value) => setForm((current) => ({ ...current, code: value }))}
                    editable={!saving && canManageSuppliers}
                  />
                  <AppInput
                    label="Nombre *"
                    placeholder="Proveedor local"
                    value={form.name}
                    onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
                    editable={!saving && canManageSuppliers}
                  />
                </AppResponsiveGrid>
                <AppInput
                  label="Notas"
                  placeholder="Contacto, telefono o referencia"
                  value={form.description}
                  onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                  editable={!saving && canManageSuppliers}
                  multiline
                />
                {editingSupplierId ? (
                  <View style={styles.actionsRow}>
                    {['ACTIVE', 'INACTIVE'].map((status) => (
                      <AppButton
                        key={status}
                        title={status}
                        variant={form.status === status ? 'primary' : 'secondary'}
                        onPress={() => setForm((current) => ({ ...current, status }))}
                        style={styles.compactButton}
                      />
                    ))}
                  </View>
                ) : null}
                <AppButton
                  title={editingSupplierId ? 'Guardar cambios' : 'Crear proveedor'}
                  loading={saving}
                  disabled={saving || !canManageSuppliers}
                  disabledReason="Tu usuario necesita MANAGE_CATALOGS."
                  onPress={handleSave}
                  style={styles.actionButton}
                />
              </View>
            ) : null}
          </AppCard>

          <AppInput
            placeholder="Buscar por codigo, nombre o notas"
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filteredSuppliers}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <AppCard style={styles.listCard}>
                <View style={styles.headerRow}>
                  <View style={styles.flex}>
                    <AppText bold>{item.name}</AppText>
                    <AppText variant="caption" color={theme.colors.mutedText}>
                      {item.code}
                    </AppText>
                    {item.description ? (
                      <AppText variant="caption" color={theme.colors.mutedText}>
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.actionsRow}>
                    <StatusBadge label={item.status ?? 'ACTIVE'} tone={(item.status ?? 'ACTIVE') === 'ACTIVE' ? 'success' : 'neutral'} />
                    <AppButton
                      title="Editar"
                      variant="secondary"
                      disabled={!canManageSuppliers}
                      disabledReason="Tu usuario necesita MANAGE_CATALOGS."
                      onPress={() => openEditor(item)}
                      style={styles.compactButton}
                    />
                  </View>
                </View>
              </AppCard>
            )}
            ListEmptyComponent={
              <AppCard>
                <AppText>No hay proveedores con los filtros actuales.</AppText>
                {canManageSuppliers ? (
                  <View style={styles.emptyAction}>
                    <AppButton title="Crear proveedor" onPress={() => setShowForm(true)} />
                  </View>
                ) : null}
              </AppCard>
            }
          />
        </>
      ) : null}
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  emptyAction: {
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  form: {
    gap: 12,
    marginTop: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  listCard: {
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
});
