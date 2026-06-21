import AppShellPage from '@/components/layout/AppShellPage';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppText from '@/components/ui/AppText';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import { useAppTheme } from '@/context/AppThemeContext';
import { getActionableApiErrorMessage } from '@/services/apiError';
import { createBatch } from '@/services/batchService';
import { getSession, UserSession } from '@/services/sessionStorage';
import { getActiveSuppliers, getSuppliers, Supplier } from '@/services/supplierService';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

export default function BatchFormScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [notes, setNotes] = useState('');
  const [session, setSession] = useState<UserSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [canManageInventory, setCanManageInventory] = useState<boolean | null>(null);
  const [canManageCatalogs, setCanManageCatalogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSupplierModalVisible, setIsSupplierModalVisible] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadAccess = async () => {
        const currentSession = await getSession();
        setSession(currentSession);
        const allowed =
          currentSession?.effectivePermissions?.some(
            (permission) => permission.code === 'MANAGE_INVENTORY'
          ) ?? false;
        const catalogsAllowed =
          currentSession?.effectivePermissions?.some(
            (permission) => permission.code === 'MANAGE_CATALOGS'
          ) ?? false;
        setCanManageInventory(allowed);
        setCanManageCatalogs(catalogsAllowed);
        try {
          const supplierData = await getSuppliers();
          setSuppliers(getActiveSuppliers(supplierData));
        } catch (error) {
          setErrorMessage(getActionableApiErrorMessage(error));
        }
      };

      loadAccess();
    }, [])
  );

  const validationMessage = useMemo(() => {
    const qty = Number(expectedQuantity);

    if (!expectedQuantity.trim()) return 'La cantidad esperada es obligatoria.';
    if (!Number.isInteger(qty) || qty <= 0) {
      return 'La cantidad esperada debe ser un entero mayor a cero.';
    }
    if (!selectedSupplier) return 'Selecciona el proveedor del lote.';

    return '';
  }, [expectedQuantity, selectedSupplier]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierSearch.trim().toLowerCase();
    if (!query) return suppliers;

    return suppliers.filter((supplier) => {
      const text = `${supplier.code} ${supplier.name} ${supplier.description ?? ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [supplierSearch, suppliers]);

  const handleSave = async () => {
    if (validationMessage) {
      Alert.alert('Validación', validationMessage);
      return;
    }

    const session = await getSession();
    if (!session) return;

    setSaving(true);

    try {
      const batch = await createBatch(session.branchId, {
        expectedQuantity: Number(expectedQuantity),
        supplierId: selectedSupplier?.id ?? null,
        notes,
      });

      Alert.alert('Lotes', 'Lote creado correctamente.');
      router.replace({ pathname: '/batch-detail', params: { id: String(batch.id) } });
    } catch (err: any) {
      const message = getActionableApiErrorMessage(err);
      setErrorMessage(message);
      Alert.alert('Lotes', message || 'No se pudo crear el lote.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppShellPage
        title="Nuevo lote"
        subtitle="Registro de recepcion y clasificacion"
        activeRoute="batches"
        rightContent={
          <View style={styles.headerActions}>
            <ScreenPermissionHeaderAction screenKey="batchForm" screenTitle="Nuevo lote" session={session} />
            <AppButton
              title="Volver"
              variant="secondary"
              onPress={() => router.replace('/batches' as any)}
            />
          </View>
        }
      >

      {canManageInventory === false ? (
        <AppCard style={{ borderColor: theme.colors.warning }}>
          <AppText color={theme.colors.warning} bold>
            Acceso restringido
          </AppText>
          <AppText>
            Tu rol puede consultar lotes, pero no crear nuevos. Pide a soporte
            asignar MANAGE_INVENTORY si este usuario debe operar recepcion.
          </AppText>
        </AppCard>
      ) : null}

      {errorMessage ? (
        <AppCard style={{ borderColor: theme.colors.danger }}>
          <AppText color={theme.colors.danger}>{errorMessage}</AppText>
        </AppCard>
      ) : null}

      {canManageInventory === true ? (
      <AppCard>
        <AppText variant="subtitle" bold>
          Datos del lote
        </AppText>
        <AppText variant="caption" color={theme.colors.mutedText} style={styles.helpText}>
          El sistema generará el folio automáticamente. Registra la cantidad esperada
          para controlar recepción y clasificación.
        </AppText>

        <AppInput
          label="Cantidad esperada *"
          value={expectedQuantity}
          onChangeText={setExpectedQuantity}
          keyboardType="number-pad"
          placeholder="Ej. 100"
        />

          <View style={styles.helpText}>
            <AppText color={theme.colors.mutedText}>
            Proveedor: {selectedSupplier ? selectedSupplier.name : 'Pendiente por seleccionar'}
            </AppText>
          </View>

        <AppButton
          title={selectedSupplier ? 'Cambiar proveedor' : 'Seleccionar proveedor'}
          variant="operation"
          onPress={() => setIsSupplierModalVisible(true)}
        />

        {suppliers.length === 0 ? (
          <AppCard style={{ borderColor: theme.colors.warning }}>
            <AppText color={theme.colors.warning} bold>
              Se requiere proveedor para crear lote.
            </AppText>
            <AppText>
              Para crear un lote primero necesitas registrar un proveedor activo.
            </AppText>
            <View style={styles.ctaRow}>
              <AppButton
                title="Crear proveedor"
                variant="operation"
                disabled={!canManageCatalogs}
                disabledReason="Tu usuario necesita MANAGE_CATALOGS."
                onPress={() => router.push('/suppliers' as any)}
              />
            </View>
          </AppCard>
        ) : null}

        <AppInput
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas opcionales"
          multiline
        />
      </AppCard>
      ) : null}

      {canManageInventory === true ? (
      <AppButton
        title={saving ? 'Guardando...' : 'Guardar lote'}
        onPress={handleSave}
        loading={saving}
        disabled={saving || suppliers.length === 0}
        disabledReason={suppliers.length === 0 ? 'Registra un proveedor activo antes de crear el lote.' : undefined}
      />
      ) : null}
      </AppShellPage>

      <AppBottomModal
        visible={isSupplierModalVisible}
        title="Seleccionar proveedor"
        onClose={() => setIsSupplierModalVisible(false)}
        scroll={false}
      >
        <AppInput
          label="Buscar proveedor"
          value={supplierSearch}
          onChangeText={setSupplierSearch}
          placeholder="Nombre, código o descripcion"
        />
        <FlatList
          data={filteredSuppliers}
          style={styles.modalList}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={item.description || item.code}
              onPress={() => {
                setSelectedSupplier(item);
                setSupplierSearch('');
                setIsSupplierModalVisible(false);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptySupplierState}>
            <AppText>No hay proveedores activos con esa búsqueda. Alta proveedores desde Catálogos.</AppText>
              <AppButton
                title="Crear proveedor"
                variant="operation"
                disabled={!canManageCatalogs}
                disabledReason="Tu usuario necesita MANAGE_CATALOGS."
                onPress={() => {
                  setIsSupplierModalVisible(false);
                  router.push('/suppliers' as any);
                }}
              />
            </View>
          }
        />
      </AppBottomModal>
    </>
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  emptySupplierState: {
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  helpText: {
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 420,
  },
});
