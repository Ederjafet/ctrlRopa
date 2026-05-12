import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import {
  Batch,
  Brand,
  ProductType,
  Size,
  StorageLocation,
  getBatches,
  getBootstrap,
} from '@/services/catalogService';
import { createItem } from '@/services/itemService';
import {
  appendPendingQuickItems,
  QuickItemTarget,
} from '@/services/pendingQuickItems';
import { getSession } from '@/services/sessionStorage';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

type CatalogOption = {
  id: number;
  code?: string;
  name: string;
  subtitle?: string;
};

type SelectorConfig = {
  title: string;
  options: CatalogOption[];
  onSelect: (option: CatalogOption | null) => void;
  allowClear?: boolean;
};

const mapBatchToOption = (batch: Batch): CatalogOption => ({
  id: batch.id,
  code: batch.folio,
  name: batch.folio,
  subtitle: batch.status
    ? `Estado: ${batch.status}${
        batch.receivedQuantity !== undefined && batch.receivedQuantity !== null
          ? ` · Recibido: ${batch.receivedQuantity}`
          : ''
      }`
    : undefined,
});

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesOption(option: CatalogOption, search: string) {
  const term = normalizeSearch(search);
  if (!term) return true;

  return normalizeSearch(`${option.name} ${option.code ?? ''} ${option.subtitle ?? ''} ${option.id}`)
    .includes(term);
}

export default function ItemsCreateScreen() {
  const router = useRouter();
  const { returnTo, batchId, batchFolio } = useLocalSearchParams();
  const { theme } = useAppTheme();

  const returnRoute = typeof returnTo === 'string' ? returnTo : '/items';
  const preselectedBatchId = typeof batchId === 'string' ? Number(batchId) : null;
  const preselectedBatchFolio = typeof batchFolio === 'string' ? batchFolio : null;
  const quickItemTarget: QuickItemTarget | null =
    returnRoute === '/door-sale'
      ? 'door-sale'
      : returnRoute === '/door-reservation'
        ? 'door-reservation'
        : returnRoute === '/live'
          ? 'live'
          : null;
  const requiresPrice = quickItemTarget !== null;

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [selectedBatch, setSelectedBatch] = useState<CatalogOption | null>(null);
  const [selectedProductType, setSelectedProductType] =
    useState<CatalogOption | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<CatalogOption | null>(null);
  const [selectedSize, setSelectedSize] = useState<CatalogOption | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<CatalogOption | null>(null);

  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [comments, setComments] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [selector, setSelector] = useState<SelectorConfig | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    const session = await getSession();
    if (!session) return;

    try {
      const [bootstrapResult, batchResult] = await Promise.allSettled([
        getBootstrap(session.branchId),
        getBatches(session.branchId),
      ]);

      if (bootstrapResult.status === 'fulfilled') {
        const bootstrap = bootstrapResult.value;
        setProductTypes(bootstrap.productTypes ?? []);
        setBrands(bootstrap.brands ?? []);
        setSizes(bootstrap.sizes ?? []);
        setLocations(bootstrap.storageLocations ?? []);
      }

      const batchData = batchResult.status === 'fulfilled' ? batchResult.value : [];
      setBatches(batchData);

      if (preselectedBatchId) {
        const matchedBatch = batchData.find((batch) => batch.id === preselectedBatchId);
        if (matchedBatch) {
          setSelectedBatch(mapBatchToOption(matchedBatch));
        } else if (preselectedBatchFolio) {
          setSelectedBatch({ id: preselectedBatchId, name: preselectedBatchFolio });
        }
      }

      const errors = [bootstrapResult, batchResult]
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.status === 'rejected'
            ? result.reason?.message || 'No se pudo cargar un catálogo.'
            : ''
        )
        .filter(Boolean);

      if (errors.length > 0) {
        Alert.alert('Catálogos', errors.join('\n'));
      }
    } catch (e: any) {
      Alert.alert('Catálogos', e.message || 'No se pudieron cargar los catálogos.');
    }
  };

  const resetForm = () => {
    if (!preselectedBatchId) {
      setSelectedBatch(null);
    }
    setSelectedProductType(null);
    setSelectedBrand(null);
    setSelectedSize(null);
    setSelectedLocation(null);
    setPrice('');
    setQuantity('1');
    setComments('');
  };

  const openSelector = (config: SelectorConfig) => {
    setSelector(config);
    setSelectorSearch('');
  };

  const closeSelector = () => {
    setSelector(null);
    setSelectorSearch('');
  };

  const handleCreate = async () => {
    if (!selectedProductType) {
      Alert.alert('Validación', 'Selecciona el tipo de prenda.');
      return;
    }

    if (!selectedSize) {
      Alert.alert('Validación', 'Selecciona la talla.');
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      Alert.alert('Validación', 'La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    if (requiresPrice && !price.trim()) {
      Alert.alert('Validación', 'Captura el precio para agregar la prenda al flujo.');
      return;
    }

    const parsedPrice = price.trim() ? Number(price) : null;

    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      Alert.alert('Validación', 'El precio sugerido no es válido.');
      return;
    }

    if (requiresPrice && (!parsedPrice || parsedPrice <= 0)) {
      Alert.alert('Validación', 'El precio debe ser mayor a cero.');
      return;
    }

    const session = await getSession();
    if (!session) return;

    try {
      setIsSaving(true);
      setSuccessMessage('');

      const createdItemIds: number[] = [];

      for (let i = 0; i < qty; i++) {
        const code = `ITEM-${Date.now()}-${i}`;

        const created = await createItem({
          code,
          qrCode: code,
          branchId: session.branchId,
          batchId: selectedBatch?.id ?? null,
          productTypeId: selectedProductType.id,
          brandId: selectedBrand?.id ?? null,
          sizeId: selectedSize.id,
          comments: comments.trim() || null,
          price: parsedPrice,
          status: 'AVAILABLE',
          storageLocationId: selectedLocation?.id ?? null,
          createdByUserId: session.userId,
        });

        createdItemIds.push(created.id);
      }

      const message =
        qty === 1
          ? 'Se creó 1 prenda correctamente.'
          : `Se crearon ${qty} prendas correctamente.`;

      setSuccessMessage(message);
      resetForm();

      if (quickItemTarget) {
        await appendPendingQuickItems(quickItemTarget, createdItemIds);
        Alert.alert('Alta de prendas', `${message} Se agregara al flujo actual.`);
        router.replace(returnRoute as any);
        return;
      }

      Alert.alert('Alta de prendas', message);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron crear las prendas.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSelectorOptions =
    selector?.options.filter((option) => matchesOption(option, selectorSearch)) ?? [];

  return (
    <AppScreen>
        <AppBackButton fallbackRoute={returnRoute} />
        <AppText variant="title" bold>
          Alta masiva de prendas
        </AppText>

        <AppText variant="caption" style={styles.intro}>
          Crea una o varias prendas disponibles para inventario. El tipo de
          prenda y la talla son obligatorios; lote, marca, ubicación y precio
          sugerido son opcionales.
        </AppText>

        {successMessage ? (
          <View
            style={[
              styles.successBox,
              { backgroundColor: theme.colors.success, borderRadius: theme.radius.md },
            ]}
          >
            <AppText>{successMessage}</AppText>
          </View>
        ) : null}

        <AppCard>
          <AppResponsiveGrid>
          <AppSelectorField
            label="Lote"
            value={selectedBatch?.name}
            placeholder={
              batches.length > 0
                ? 'Seleccionar lote'
                : 'No hay lotes disponibles'
            }
            onPress={() =>
              openSelector({
                title: 'Seleccionar lote',
                options: batches.map(mapBatchToOption),
                onSelect: setSelectedBatch,
                allowClear: true,
              })
            }
          />

          <AppSelectorField
            label="Tipo de prenda *"
            value={selectedProductType?.name}
            placeholder="Seleccionar tipo"
            onPress={() =>
              openSelector({
                title: 'Seleccionar tipo de prenda',
                options: productTypes,
                onSelect: setSelectedProductType,
              })
            }
          />

          <AppSelectorField
            label="Marca"
            value={selectedBrand?.name}
            placeholder="Sin marca"
            onPress={() =>
              openSelector({
                title: 'Seleccionar marca',
                options: brands,
                onSelect: setSelectedBrand,
                allowClear: true,
              })
            }
          />

          <AppSelectorField
            label="Talla *"
            value={selectedSize?.name}
            placeholder="Seleccionar talla"
            onPress={() =>
              openSelector({
                title: 'Seleccionar talla',
                options: sizes,
                onSelect: setSelectedSize,
              })
            }
          />

          <AppSelectorField
            label="Ubicación"
            value={selectedLocation?.name}
            placeholder="Sin ubicación"
            onPress={() =>
              openSelector({
                title: 'Seleccionar ubicación',
                options: locations,
                onSelect: setSelectedLocation,
                allowClear: true,
              })
            }
          />
          </AppResponsiveGrid>
        </AppCard>

        <AppCard>
          <AppResponsiveGrid>
          <AppInput
            label={requiresPrice ? 'Precio *' : 'Precio sugerido'}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder={requiresPrice ? 'Obligatorio' : 'Opcional'}
          />

          <AppInput
            label="Cantidad *"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Ej. 1"
          />

          <AppInput
            label="Comentarios"
            value={comments}
            onChangeText={setComments}
            placeholder="Opcional"
          />
          </AppResponsiveGrid>
        </AppCard>

        <AppButton
          title="Generar prendas"
          onPress={handleCreate}
          loading={isSaving}
        />
      <AppBottomModal
        visible={!!selector}
        title={selector?.title ?? ''}
        onClose={closeSelector}
        scroll={false}
      >
        <AppInput
          placeholder="Buscar..."
          value={selectorSearch}
          onChangeText={setSelectorSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {selector?.allowClear ? (
          <AppOptionRow
            title="Sin selección"
            onPress={() => {
              selector.onSelect(null);
              closeSelector();
            }}
          />
        ) : null}

        <FlatList
          style={styles.selectorList}
          keyboardShouldPersistTaps="handled"
          data={filteredSelectorOptions}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppOptionRow
              title={item.name}
              subtitle={item.subtitle}
              onPress={() => {
                selector?.onSelect(item);
                closeSelector();
              }}
            />
          )}
          ListEmptyComponent={
            <AppText variant="caption" color={theme.colors.mutedText}>
              No hay resultados.
            </AppText>
          }
        />
      </AppBottomModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: 12,
  },
  successBox: {
    padding: 12,
    marginBottom: 10,
  },
  selectorList: {
    maxHeight: 360,
  },
});
