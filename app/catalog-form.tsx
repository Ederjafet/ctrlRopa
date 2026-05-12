import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import AppInput from '@/components/ui/AppInput';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  CatalogEntity,
  activateCatalogItem,
  deactivateCatalogItem,
  getCatalogConfig,
  getCatalogItem,
  getEntityTitle,
  isActive,
  saveCatalogItem,
} from '@/services/adminCatalogService';
import { getSession } from '@/services/sessionStorage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

type FormState = {
  code: string;
  name: string;
  description: string;
  qrCode: string;
  sortOrder: string;
};

const initialForm: FormState = {
  code: '',
  name: '',
  description: '',
  qrCode: '',
  sortOrder: '',
};

export default function CatalogFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const config = useMemo(() => getCatalogConfig(params.kind), [params.kind]);
  const { theme } = useAppTheme();

  const itemId = params.id ? Number(params.id) : null;
  const [form, setForm] = useState<FormState>(initialForm);
  const [entity, setEntity] = useState<CatalogEntity | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(itemId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [params.kind, params.id]);

  const loadInitialData = async () => {
    if (!config) return;

    const session = await getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    setBranchId(session.branchId);

    if (!itemId) {
      setForm(initialForm);
      setEntity(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getCatalogItem(config, itemId);
      setEntity(data);
      setForm({
        code: String(data.code ?? ''),
        name: String(data.name ?? ''),
        description: String(data.description ?? ''),
        qrCode: String(data.qrCode ?? ''),
        sortOrder: data.sortOrder === null || data.sortOrder === undefined ? '' : String(data.sortOrder),
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo cargar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!config) return false;

    for (const field of config.fields) {
      if (field.required && !String(form[field.key] ?? '').trim()) {
        Alert.alert('Validación', `Captura ${field.label.toLowerCase()}.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!config || !validate()) return;

    try {
      setIsSaving(true);
      await saveCatalogItem(
        config,
        {
          id: itemId ?? undefined,
          code: form.code,
          name: form.name,
          description: form.description,
          qrCode: form.qrCode,
          sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
        },
        branchId ?? undefined,
        itemId ?? undefined
      );

      Alert.alert('Catálogo', 'Registro guardado correctamente.');
      router.replace(`/catalog-list?kind=${config.kind}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = () => {
    if (!config || !itemId) return;

    Alert.alert('Desactivar', '¿Desactivar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateCatalogItem(config, itemId);
            await loadInitialData();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo desactivar.');
          }
        },
      },
    ]);
  };

  const handleActivate = async () => {
    if (!config || !itemId) return;

    try {
      await activateCatalogItem(config, itemId);
      await loadInitialData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo activar.');
    }
  };

  if (!config) {
    return (
      <AppScreen>
        <AppBackButton fallbackRoute="/catalogs" />
        <AppText>Catálogo no reconocido.</AppText>
      </AppScreen>
    );
  }

  if (isLoading) {
    return (
      <AppScreen scroll={false}>
        <ActivityIndicator />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute={`/catalog-list?kind=${config.kind}`} preferHistory={false} />

      <AppText variant="title" bold>
        {getEntityTitle(config, entity)}
      </AppText>

      <AppCard>
        {config.fields.map((field) => (
          <AppInput
            key={field.key}
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={form[field.key]}
            onChangeText={(value) => updateField(field.key, value)}
            keyboardType={field.keyboardType ?? 'default'}
            autoCapitalize={field.key === 'code' || field.key === 'qrCode' ? 'characters' : 'sentences'}
            placeholder={field.placeholder}
          />
        ))}

        {entity ? (
          <View style={styles.statusBox}>
            <AppText color={theme.colors.mutedText}>Estado actual</AppText>
            <AppText bold color={isActive(entity) ? theme.colors.success : theme.colors.danger}>
              {isActive(entity) ? 'Activo' : 'Inactivo'}
            </AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton title="Guardar" onPress={handleSave} loading={isSaving} />

          {entity && isActive(entity) ? (
            <AppButton title="Desactivar" variant="danger" onPress={handleDeactivate} />
          ) : null}

          {entity && !isActive(entity) ? (
            <AppButton title="Activar" variant="secondary" onPress={handleActivate} />
          ) : null}
        </View>
      </AppCard>

      {config.notes?.length ? (
        <AppCard>
          {config.notes.map((note) => (
            <AppText key={note} color={theme.colors.mutedText}>
              {note}
            </AppText>
          ))}
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusBox: {
    marginBottom: 12,
  },
  actions: {
    gap: 10,
  },
});
