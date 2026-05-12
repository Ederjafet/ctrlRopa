import ItemLabel from '@/components/items/ItemLabel';
import AppBackButton from '@/components/ui/AppBackButton';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppScreen from '@/components/ui/AppScreen';
import AppSelectorField from '@/components/ui/AppSelectorField';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';

import {
  Brand,
  getBrands,
  getProductTypes,
  getSizes,
  getStorageLocations,
  ProductType,
  Size,
  StorageLocation,
} from '@/services/catalogService';

import {
  getItemById,
  Item,
  updateItem,
} from '@/services/itemService';

import { getItemStatusLabel } from '@/services/itemLabels';
import { printItemLabel } from '@/services/printService';
import { getSession } from '@/services/sessionStorage';

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';

type CatalogOption = {
  id: number;
  name: string;
};

type SelectorConfig = {
  title: string;
  options: CatalogOption[];
  onSelect: (option: CatalogOption | null) => void;
  allowClear?: boolean;
};

export default function ItemDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    returnTo?: string | string[];
  }>();
  const { theme } = useAppTheme();

  const itemIdParam = Array.isArray(id) ? id[0] : id;
  const returnRoute = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  const [item, setItem] = useState<Item | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [productTypeId, setProductTypeId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selector, setSelector] = useState<SelectorConfig | null>(null);
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const session = await getSession();
      if (!session) return;

      const itemId = Number(itemIdParam);

      const [
        itemData,
        productTypeData,
        brandData,
        sizeData,
        locationData,
      ] = await Promise.all([
        getItemById(itemId),
        getProductTypes(session.branchId),
        getBrands(session.branchId),
        getSizes(session.branchId),
        getStorageLocations(session.branchId),
      ]);

      setItem(itemData);
      setProductTypes(productTypeData);
      setBrands(brandData);
      setSizes(sizeData);
      setLocations(locationData);
      syncForm(itemData);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar la prenda.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncForm = (nextItem: Item) => {
    setProductTypeId(nextItem.productTypeId);
    setBrandId(nextItem.brandId ?? null);
    setSizeId(nextItem.sizeId ?? null);
    setStorageLocationId(nextItem.storageLocationId ?? null);
    setPrice(
      nextItem.price !== null && nextItem.price !== undefined
        ? String(nextItem.price)
        : ''
    );
    setComments(nextItem.comments ?? '');
  };

  const selectedProductType = useMemo(
    () => productTypes.find((option) => option.id === productTypeId) ?? null,
    [productTypes, productTypeId]
  );

  const selectedBrand = useMemo(
    () => brands.find((option) => option.id === brandId) ?? null,
    [brands, brandId]
  );

  const selectedSize = useMemo(
    () => sizes.find((option) => option.id === sizeId) ?? null,
    [sizes, sizeId]
  );

  const selectedLocation = useMemo(
    () => locations.find((option) => option.id === storageLocationId) ?? null,
    [locations, storageLocationId]
  );

  const canEditProperties = item?.status === 'AVAILABLE';

  const openSelector = (config: SelectorConfig) => {
    if (!canEditProperties) return;
    setSelector(config);
  };

  const closeSelector = () => {
    setSelector(null);
  };

  const handleSave = async () => {
    if (!item) return;

    if (!canEditProperties) {
      Alert.alert(
        'Inventario',
        'Solo se pueden editar prendas disponibles. El estado cambia mediante reservas, ventas o devoluciones.'
      );
      return;
    }

    if (!productTypeId) {
      Alert.alert('Validación', 'Selecciona el tipo de prenda.');
      return;
    }

    const parsedPrice = price.trim() ? Number(price) : null;

    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      Alert.alert('Validación', 'El precio sugerido no es valido.');
      return;
    }

    try {
      setIsSaving(true);

      const updated = await updateItem(item.id, {
        code: item.code,
        qrCode: item.qrCode || item.code,
        productTypeId,
        brandId,
        sizeId,
        comments: comments.trim() || null,
        price: parsedPrice,
        status: item.status,
        storageLocationId,
      });

      setItem(updated);
      syncForm(updated);

      Alert.alert('Exito', 'Datos actualizados.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!item) return;

    try {
      setIsPrinting(true);
      await printItemLabel(item);
    } catch (e: any) {
      Alert.alert('Impresion', e.message || 'No se pudo imprimir la etiqueta.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading || !item) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute={returnRoute || '/items'} />
      <AppText variant="title" bold>
        Detalle de prenda
      </AppText>

      <AppCard>
        <AppText bold>Código</AppText>
        <AppText>{item.code}</AppText>

        <AppText bold style={styles.mt}>
          Lote
        </AppText>
        <AppText>{item.batchFolio || item.batchId || 'Sin lote'}</AppText>

        <AppText bold style={styles.mt}>
          Estado
        </AppText>
        <AppText>{getItemStatusLabel(item.status)}</AppText>
      </AppCard>

      {!canEditProperties ? (
        <AppCard>
          <AppText bold>Edicion bloqueada</AppText>
          <AppText color={theme.colors.mutedText} style={styles.mt}>
            Solo las prendas disponibles pueden editarse desde inventario. Esta prenda cambia mediante su flujo operativo.
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="subtitle" bold>
          Propiedades
        </AppText>

        <AppSelectorField
          label="Tipo de prenda"
          value={selectedProductType?.name}
          placeholder="Seleccionar tipo"
          disabled={!canEditProperties}
          onPress={() =>
            openSelector({
              title: 'Seleccionar tipo de prenda',
              options: productTypes,
              onSelect: (option) => setProductTypeId(option?.id ?? null),
            })
          }
        />

        <AppSelectorField
          label="Marca"
          value={selectedBrand?.name}
          placeholder="Sin marca"
          disabled={!canEditProperties}
          onPress={() =>
            openSelector({
              title: 'Seleccionar marca',
              options: brands,
              onSelect: (option) => setBrandId(option?.id ?? null),
              allowClear: true,
            })
          }
        />

        <AppSelectorField
          label="Talla"
          value={selectedSize?.name}
          placeholder="Sin talla"
          disabled={!canEditProperties}
          onPress={() =>
            openSelector({
              title: 'Seleccionar talla',
              options: sizes,
              onSelect: (option) => setSizeId(option?.id ?? null),
              allowClear: true,
            })
          }
        />

        <AppSelectorField
          label="Ubicacion"
          value={selectedLocation?.name}
          placeholder="Sin ubicacion"
          disabled={!canEditProperties}
          onPress={() =>
            openSelector({
              title: 'Seleccionar ubicacion',
              options: locations,
              onSelect: (option) => setStorageLocationId(option?.id ?? null),
              allowClear: true,
            })
          }
        />

        <AppInput
          label="Precio sugerido"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          editable={canEditProperties}
        />

        <AppInput
          label="Comentarios"
          value={comments}
          onChangeText={setComments}
          editable={canEditProperties}
        />

        <AppButton
          title="Guardar cambios"
          onPress={handleSave}
          loading={isSaving}
          disabled={!canEditProperties || isSaving}
        />
      </AppCard>

      <AppButton
        title="Ver etiqueta QR"
        variant="secondary"
        onPress={() => setIsLabelModalVisible(true)}
      />

      <AppBottomModal
        visible={!!selector}
        title={selector?.title ?? ''}
        onClose={closeSelector}
      >
        {selector?.allowClear ? (
          <AppOptionRow
            title="Sin seleccion"
            onPress={() => {
              selector.onSelect(null);
              closeSelector();
            }}
          />
        ) : null}

        {selector?.options.map((option) => (
          <AppOptionRow
            key={option.id}
            title={option.name}
            onPress={() => {
              selector.onSelect(option);
              closeSelector();
            }}
          />
        ))}
      </AppBottomModal>

      <AppBottomModal
        visible={isLabelModalVisible}
        title="Etiqueta de prenda"
        onClose={() => setIsLabelModalVisible(false)}
        showCancelButton={false}
      >
        <View
          style={[
            styles.labelContainer,
            {
              backgroundColor: theme.isDark ? '#ffffff' : theme.colors.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
            },
          ]}
        >
          <ItemLabel item={item} />
        </View>

        <AppButton
          title="Imprimir etiqueta"
          onPress={handlePrintLabel}
          loading={isPrinting}
        />

        <View style={styles.actionSpacing}>
          <AppButton
            title="Cerrar"
            variant="secondary"
            onPress={() => setIsLabelModalVisible(false)}
          />
        </View>
      </AppBottomModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mt: {
    marginTop: 10,
  },
  actionSpacing: {
    marginTop: 10,
  },
  labelContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
});
