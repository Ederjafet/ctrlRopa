import AppShellPage from '@/components/layout/AppShellPage';
import AppActionDialog from '@/components/ui/AppActionDialog';
import AppBottomModal from '@/components/ui/AppBottomModal';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppOptionRow from '@/components/ui/AppOptionRow';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppSelectorField from '@/components/ui/AppSelectorField';
import ScreenPermissionHeaderAction from '@/components/ui/ScreenPermissionHeaderAction';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

import { getActionableApiError } from '@/services/apiError';
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
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';

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

type FormErrors = Partial<
  Record<'productType' | 'size' | 'price' | 'quantity', string>
>;

type FormErrorKey = keyof FormErrors;

type ValidationDialogState = {
  details: string[];
  firstField?: FormErrorKey;
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
  const { isPhone } = useResponsiveLayout();
  const { t } = useTranslation('common');
  const priceInputRef = useRef<TextInput>(null);
  const quantityInputRef = useRef<TextInput>(null);

  const returnRoute = typeof returnTo === 'string' ? returnTo : '/items';
  const preselectedBatchId = typeof batchId === 'string' ? Number(batchId) : null;
  const preselectedBatchFolio = typeof batchFolio === 'string' ? batchFolio : null;
  const quickItemTarget: QuickItemTarget | null =
    returnRoute.startsWith('/door-sale')
      ? 'door-sale'
      : returnRoute.startsWith('/door-reservation')
        ? 'door-reservation'
        : returnRoute.startsWith('/live')
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
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [validationDialog, setValidationDialog] =
    useState<ValidationDialogState | null>(null);

  const [selector, setSelector] = useState<SelectorConfig | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');

  const showActionableError = (error: unknown) => {
    const copy = getActionableApiError(error, t);
    Alert.alert(copy.title, copy.message, [{ text: copy.primaryActionLabel }]);
  };

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

      const errorCopies = [bootstrapResult, batchResult]
        .filter((result) => result.status === 'rejected')
        .map((result) =>
          result.status === 'rejected'
            ? getActionableApiError(result.reason, t)
            : null
        )
        .filter(
          (copy): copy is ReturnType<typeof getActionableApiError> => Boolean(copy)
        );

      if (errorCopies.length > 0) {
        const [copy] = errorCopies;
        const messages = errorCopies.map((entry) => entry.message);
        Alert.alert(copy.title, Array.from(new Set(messages)).join('\n'), [
          { text: copy.primaryActionLabel },
        ]);
      }
    } catch (e: any) {
      showActionableError(e);
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
    setFormErrors({});
  };

  const openSelector = (config: SelectorConfig) => {
    setSelector(config);
    setSelectorSearch('');
  };

  const closeSelector = () => {
    setSelector(null);
    setSelectorSearch('');
  };

  const openProductTypeSelector = () => {
    openSelector({
      title: 'Seleccionar tipo de prenda',
      options: productTypes,
      onSelect: (option) => {
        setSelectedProductType(option);
        setFormErrors((current) => ({ ...current, productType: undefined }));
      },
    });
  };

  const openSizeSelector = () => {
    openSelector({
      title: 'Seleccionar talla',
      options: sizes,
      onSelect: (option) => {
        setSelectedSize(option);
        setFormErrors((current) => ({ ...current, size: undefined }));
      },
    });
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const details: string[] = [];
    let firstField: FormErrorKey | undefined;

    const addError = (field: FormErrorKey, message: string) => {
      nextErrors[field] = message;
      details.push(message);
      firstField = firstField ?? field;
    };

    if (!selectedProductType) {
      addError('productType', t('itemsCreate.selectItemType'));
    }

    if (!selectedSize) {
      addError('size', t('itemsCreate.selectSize'));
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      addError('quantity', t('itemsCreate.validQuantity'));
    }

    const parsedPrice = price.trim() ? Number(price) : null;
    if (requiresPrice && !price.trim()) {
      addError('price', t('itemsCreate.validPrice'));
    } else if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      addError('price', t('itemsCreate.validPrice'));
    } else if (requiresPrice && (!parsedPrice || parsedPrice <= 0)) {
      addError('price', t('itemsCreate.validPrice'));
    }

    setFormErrors(nextErrors);

    if (details.length > 0) {
      setValidationDialog({ details, firstField });
      return false;
    }

    setValidationDialog(null);
    return true;
  };

  const goToFirstInvalidField = () => {
    const field = validationDialog?.firstField;
    setValidationDialog(null);

    if (field === 'productType') {
      openProductTypeSelector();
      return;
    }

    if (field === 'size') {
      openSizeSelector();
      return;
    }

    if (field === 'price') {
      priceInputRef.current?.focus();
      return;
    }

    if (field === 'quantity') {
      quantityInputRef.current?.focus();
    }
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

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
      setFormErrors({});

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
      showActionableError(e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSelectorOptions =
    selector?.options.filter((option) => matchesOption(option, selectorSearch)) ?? [];

  return (
    <AppShellPage
      title={t('navigation.items.createItems')}
      subtitle={t('operationalScreens.itemsCreate.subtitle')}
      activeRoute="items-create"
      compactHeader
      rightContent={
        <View style={styles.headerActions}>
          <ScreenPermissionHeaderAction
            screenKey="itemsCreate"
            screenTitle="Alta de prendas"
          />
          <AppButton
            title={t('operationalScreens.itemsCreate.backToFlow')}
            variant="secondary"
            onPress={() => router.replace(returnRoute as any)}
          />
        </View>
      }
    >
        <AppText variant="caption" style={styles.intro}>
          {t('operationalScreens.itemsCreate.intro')}
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

        {quickItemTarget === 'live' ? (
          <AppCard variant="info">
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {t('itemsCreate.liveReturnHelp')}
            </AppText>
          </AppCard>
        ) : null}

        <AppCard>
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle" bold>
              Datos de inventario
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Selecciona lote, tipo, talla y ubicacion en una vista compacta.
            </AppText>
          </View>

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
            error={formErrors.productType}
            onPress={openProductTypeSelector}
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
            error={formErrors.size}
            onPress={openSizeSelector}
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
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle" bold>
              Cantidad y datos opcionales
            </AppText>
            <AppText variant="caption" color={theme.colors.mutedText}>
              Define cuantas prendas generar y agrega precio o comentarios si aplica.
            </AppText>
          </View>

          <AppResponsiveGrid desktopColumns={3}>
          <AppInput
            ref={priceInputRef}
            label={requiresPrice ? 'Precio *' : 'Precio sugerido'}
            value={price}
            onChangeText={(value) => {
              setPrice(value);
              setFormErrors((current) => ({ ...current, price: undefined }));
            }}
            keyboardType="numeric"
            placeholder={requiresPrice ? 'Obligatorio' : 'Opcional'}
            error={formErrors.price}
          />

          <AppInput
            ref={quantityInputRef}
            label="Cantidad *"
            value={quantity}
            onChangeText={(value) => {
              setQuantity(value);
              setFormErrors((current) => ({ ...current, quantity: undefined }));
            }}
            keyboardType="numeric"
            placeholder="Ej. 1"
            error={formErrors.quantity}
          />

          <AppInput
            label="Comentarios"
            value={comments}
            onChangeText={setComments}
            placeholder="Opcional"
          />
          </AppResponsiveGrid>
        </AppCard>

        <View style={styles.actionBar}>
          <AppButton
            title={t('operationalScreens.itemsCreate.generateItems')}
            onPress={handleCreate}
            loading={isSaving}
            style={isPhone ? styles.mobilePrimaryAction : styles.desktopPrimaryAction}
          />
        </View>
      <AppActionDialog
        visible={!!validationDialog}
        title={t('itemsCreate.validationTitle')}
        message={t('itemsCreate.validationMessage')}
        details={validationDialog?.details ?? []}
        variant="warning"
        onClose={() => setValidationDialog(null)}
        primaryAction={{
          label: t('common.understood'),
          onPress: () => setValidationDialog(null),
        }}
        secondaryAction={
          validationDialog?.firstField
            ? {
                label: t('itemsCreate.goToFirstField'),
                onPress: goToFirstInvalidField,
                variant: 'secondary',
              }
            : undefined
        }
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
    </AppShellPage>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  intro: {
    marginBottom: 12,
  },
  successBox: {
    padding: 12,
    marginBottom: 10,
  },
  actionBar: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  desktopPrimaryAction: {
    minWidth: 220,
  },
  mobilePrimaryAction: {
    alignSelf: 'stretch',
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  selectorList: {
    maxHeight: 360,
  },
});
