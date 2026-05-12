import AppBackButton from '@/components/ui/AppBackButton';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import ColorField from '@/components/ui/ColorField';
import { AppDatePreview } from '@/components/ui/AppDateField';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  AppearanceSettings,
  ButtonStyle,
  DensityMode,
  getAppearanceSettings,
  ThemeMode,
  updateAppearanceSettings,
} from '@/services/appearanceService';
import { isAdmin } from '@/services/accessControl';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

const DEFAULT_FORM: AppearanceSettings = {
  appName: 'Control Ropa',
  logoUrl: '',
  faviconUrl: '',
  loginLogoUrl: '',
  printLogoUrl: '',
  primaryColor: '#111111',
  secondaryColor: '#666666',
  accentColor: '#0A7EA4',
  primaryButtonColor: '#111111',
  primaryButtonTextColor: '#FFFFFF',
  secondaryButtonColor: '#666666',
  secondaryButtonTextColor: '#FFFFFF',
  operationButtonColor: '#0F172A',
  operationButtonTextColor: '#FFFFFF',
  dangerButtonColor: '#B00020',
  dangerButtonTextColor: '#FFFFFF',
  cancelButtonColor: '#6B7280',
  cancelButtonTextColor: '#FFFFFF',
  backButtonColor: '#374151',
  backButtonTextColor: '#FFFFFF',
  menuButtonColor: '#2563EB',
  menuButtonTextColor: '#FFFFFF',
  infoCardBackgroundColor: '#EEF2FF',
  infoCardTextColor: '#1E293B',
  infoCardBorderColor: '#93C5FD',
  calendarSelectedColor: '#0F172A',
  calendarSelectedTextColor: '#FFFFFF',
  calendarTextColor: '#111111',
  dashboardMetricBackgroundColor: '#FFFFFF',
  dashboardMetricTextColor: '#111111',
  dashboardAccentColor: '#2563EB',
  themeMode: 'LIGHT',
  densityMode: 'NORMAL',
  buttonStyle: 'ROUNDED',
  showLogoOnPrints: true,
  printFooterText: '',
  packageThankYouText: '',
};

const COLOR_FIELDS: Array<keyof AppearanceSettings> = [
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'primaryButtonColor',
  'primaryButtonTextColor',
  'secondaryButtonColor',
  'secondaryButtonTextColor',
  'operationButtonColor',
  'operationButtonTextColor',
  'dangerButtonColor',
  'dangerButtonTextColor',
  'cancelButtonColor',
  'cancelButtonTextColor',
  'backButtonColor',
  'backButtonTextColor',
  'menuButtonColor',
  'menuButtonTextColor',
  'infoCardBackgroundColor',
  'infoCardTextColor',
  'infoCardBorderColor',
  'calendarSelectedColor',
  'calendarSelectedTextColor',
  'calendarTextColor',
  'dashboardMetricBackgroundColor',
  'dashboardMetricTextColor',
  'dashboardAccentColor',
];

const isValidHex = (value?: string | null) => {
  if (!value) return false;
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(value.trim());
};

const normalizeHex = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return withHash.toUpperCase();
};

export default function AppearanceScreen() {
  const router = useRouter();
  const { theme, reloadTheme } = useAppTheme();
  const [user, setUser] = useState<UserSession | null>(null);
  const [form, setForm] = useState<AppearanceSettings>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const session = await getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      if (!isAdmin(session)) {
        router.replace('/access-denied');
        return;
      }

      setUser(session);
      const settings = await getAppearanceSettings();
      setForm({ ...DEFAULT_FORM, ...settings });
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateColorField = (key: keyof AppearanceSettings, value: string) => {
    updateField(key, normalizeHex(value) as never);
  };

  const normalizeText = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  const validateColors = () => {
    const invalidFields = COLOR_FIELDS.filter((key) => !isValidHex(form[key] as string));

    if (invalidFields.length > 0) {
      Alert.alert('Color invalido', 'Revisa los colores. Deben tener formato HEX, por ejemplo #2563EB.');
      return false;
    }

    return true;
  };

  const save = async () => {
    if (!validateColors()) return;

    try {
      setSaving(true);

      await updateAppearanceSettings({
        appName: form.appName?.trim() || DEFAULT_FORM.appName,
        logoUrl: normalizeText(form.logoUrl),
        faviconUrl: normalizeText(form.faviconUrl),
        loginLogoUrl: normalizeText(form.loginLogoUrl),
        printLogoUrl: normalizeText(form.printLogoUrl),
        primaryColor: normalizeHex(form.primaryColor || DEFAULT_FORM.primaryColor),
        secondaryColor: normalizeHex(form.secondaryColor || DEFAULT_FORM.secondaryColor),
        accentColor: normalizeHex(form.accentColor || DEFAULT_FORM.accentColor),
        primaryButtonColor: normalizeHex(form.primaryButtonColor || DEFAULT_FORM.primaryButtonColor),
        primaryButtonTextColor: normalizeHex(
          form.primaryButtonTextColor || DEFAULT_FORM.primaryButtonTextColor
        ),
        secondaryButtonColor: normalizeHex(
          form.secondaryButtonColor || DEFAULT_FORM.secondaryButtonColor
        ),
        secondaryButtonTextColor: normalizeHex(
          form.secondaryButtonTextColor || DEFAULT_FORM.secondaryButtonTextColor
        ),
        operationButtonColor: normalizeHex(
          form.operationButtonColor || DEFAULT_FORM.operationButtonColor
        ),
        operationButtonTextColor: normalizeHex(
          form.operationButtonTextColor || DEFAULT_FORM.operationButtonTextColor
        ),
        dangerButtonColor: normalizeHex(form.dangerButtonColor || DEFAULT_FORM.dangerButtonColor),
        dangerButtonTextColor: normalizeHex(
          form.dangerButtonTextColor || DEFAULT_FORM.dangerButtonTextColor
        ),
        cancelButtonColor: normalizeHex(form.cancelButtonColor || DEFAULT_FORM.cancelButtonColor),
        cancelButtonTextColor: normalizeHex(
          form.cancelButtonTextColor || DEFAULT_FORM.cancelButtonTextColor
        ),
        backButtonColor: normalizeHex(form.backButtonColor || DEFAULT_FORM.backButtonColor),
        backButtonTextColor: normalizeHex(
          form.backButtonTextColor || DEFAULT_FORM.backButtonTextColor
        ),
        menuButtonColor: normalizeHex(form.menuButtonColor || DEFAULT_FORM.menuButtonColor),
        menuButtonTextColor: normalizeHex(
          form.menuButtonTextColor || DEFAULT_FORM.menuButtonTextColor
        ),
        infoCardBackgroundColor: normalizeHex(
          form.infoCardBackgroundColor || DEFAULT_FORM.infoCardBackgroundColor
        ),
        infoCardTextColor: normalizeHex(
          form.infoCardTextColor || DEFAULT_FORM.infoCardTextColor
        ),
        infoCardBorderColor: normalizeHex(
          form.infoCardBorderColor || DEFAULT_FORM.infoCardBorderColor
        ),
        calendarSelectedColor: normalizeHex(
          form.calendarSelectedColor || DEFAULT_FORM.calendarSelectedColor
        ),
        calendarSelectedTextColor: normalizeHex(
          form.calendarSelectedTextColor || DEFAULT_FORM.calendarSelectedTextColor
        ),
        calendarTextColor: normalizeHex(form.calendarTextColor || DEFAULT_FORM.calendarTextColor),
        dashboardMetricBackgroundColor: normalizeHex(
          form.dashboardMetricBackgroundColor || DEFAULT_FORM.dashboardMetricBackgroundColor
        ),
        dashboardMetricTextColor: normalizeHex(
          form.dashboardMetricTextColor || DEFAULT_FORM.dashboardMetricTextColor
        ),
        dashboardAccentColor: normalizeHex(
          form.dashboardAccentColor || DEFAULT_FORM.dashboardAccentColor
        ),
        themeMode: form.themeMode || DEFAULT_FORM.themeMode,
        densityMode: form.densityMode || DEFAULT_FORM.densityMode,
        buttonStyle: form.buttonStyle || DEFAULT_FORM.buttonStyle,
        showLogoOnPrints: form.showLogoOnPrints ?? true,
        printFooterText: normalizeText(form.printFooterText),
        packageThankYouText: normalizeText(form.packageThankYouText),
      });

      await reloadTheme();
      Alert.alert('Listo', 'La apariencia se guardo correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la apariencia.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <AppScreen>
        <AppText>Cargando apariencia...</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Apariencia / Branding
      </AppText>

      <AppCard>
        <AppText variant="subtitle" bold>
          Identidad
        </AppText>

        <Field
          label="Nombre del sistema"
          value={form.appName || ''}
          onChangeText={(value) => updateField('appName', value)}
        />

        <Field
          label="Logo general URL"
          value={form.logoUrl || ''}
          onChangeText={(value) => updateField('logoUrl', value)}
        />

        <Field
          label="Favicon URL"
          value={form.faviconUrl || ''}
          onChangeText={(value) => updateField('faviconUrl', value)}
        />

        <Field
          label="Logo login URL"
          value={form.loginLogoUrl || ''}
          onChangeText={(value) => updateField('loginLogoUrl', value)}
        />
        <LogoPreview title="Vista previa login" url={form.loginLogoUrl || form.logoUrl || ''} />

        <Field
          label="Logo impresion URL"
          value={form.printLogoUrl || ''}
          onChangeText={(value) => updateField('printLogoUrl', value)}
        />
        <LogoPreview title="Vista previa impresion" url={form.printLogoUrl || form.logoUrl || ''} />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Tarjetas informativas
        </AppText>
        <AppText color={theme.colors.mutedText} style={styles.sectionHint}>
          Se usan para textos de introduccion o contexto, no para acciones.
        </AppText>

        <ColorField
          label="Tarjeta informativa - fondo"
          value={form.infoCardBackgroundColor || ''}
          onChangeText={(value) => updateColorField('infoCardBackgroundColor', value)}
        />

        <ColorField
          label="Tarjeta informativa - texto"
          value={form.infoCardTextColor || ''}
          onChangeText={(value) => updateColorField('infoCardTextColor', value)}
        />

        <ColorField
          label="Tarjeta informativa - borde"
          value={form.infoCardBorderColor || ''}
          onChangeText={(value) => updateColorField('infoCardBorderColor', value)}
        />

        <View
          style={[
            styles.infoPreview,
            {
              backgroundColor: form.infoCardBackgroundColor,
              borderColor: form.infoCardBorderColor,
            },
          ]}
        >
          <AppText bold color={form.infoCardTextColor}>
            Ejemplo informativo
          </AppText>
          <AppText color={form.infoCardTextColor}>
            Este bloque no es un boton; solo da contexto.
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Colores generales
        </AppText>

        <ColorField
          label="Color primario"
          value={form.primaryColor || ''}
          onChangeText={(value) => updateColorField('primaryColor', value)}
        />

        <ColorField
          label="Color secundario"
          value={form.secondaryColor || ''}
          onChangeText={(value) => updateColorField('secondaryColor', value)}
        />

        <ColorField
          label="Color de acento"
          value={form.accentColor || ''}
          onChangeText={(value) => updateColorField('accentColor', value)}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Botones
        </AppText>

        <ColorField
          label="Boton primario - fondo"
          value={form.primaryButtonColor || ''}
          onChangeText={(value) => updateColorField('primaryButtonColor', value)}
        />

        <ColorField
          label="Boton primario - texto"
          value={form.primaryButtonTextColor || ''}
          onChangeText={(value) => updateColorField('primaryButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa primario"
          title="Primario"
          backgroundColor={form.primaryButtonColor}
          textColor={form.primaryButtonTextColor}
        />

        <ColorField
          label="Boton secundario - fondo"
          value={form.secondaryButtonColor || ''}
          onChangeText={(value) => updateColorField('secondaryButtonColor', value)}
        />

        <ColorField
          label="Boton secundario - texto"
          value={form.secondaryButtonTextColor || ''}
          onChangeText={(value) => updateColorField('secondaryButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa secundario"
          title="Secundario"
          backgroundColor={form.secondaryButtonColor}
          textColor={form.secondaryButtonTextColor}
        />

        <ColorField
          label="Boton operativo - fondo"
          value={form.operationButtonColor || ''}
          onChangeText={(value) => updateColorField('operationButtonColor', value)}
        />

        <ColorField
          label="Boton operativo - texto"
          value={form.operationButtonTextColor || ''}
          onChangeText={(value) => updateColorField('operationButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa operativo"
          title="Seleccionar cliente"
          backgroundColor={form.operationButtonColor}
          textColor={form.operationButtonTextColor}
        />

        <ColorField
          label="Boton peligro - fondo"
          value={form.dangerButtonColor || ''}
          onChangeText={(value) => updateColorField('dangerButtonColor', value)}
        />

        <ColorField
          label="Boton peligro - texto"
          value={form.dangerButtonTextColor || ''}
          onChangeText={(value) => updateColorField('dangerButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa peligro"
          title="Cancelar venta"
          backgroundColor={form.dangerButtonColor}
          textColor={form.dangerButtonTextColor}
        />

        <ColorField
          label="Boton cancelar - fondo"
          value={form.cancelButtonColor || ''}
          onChangeText={(value) => updateColorField('cancelButtonColor', value)}
        />

        <ColorField
          label="Boton cancelar - texto"
          value={form.cancelButtonTextColor || ''}
          onChangeText={(value) => updateColorField('cancelButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa cancelar"
          title="Cancelar"
          backgroundColor={form.cancelButtonColor}
          textColor={form.cancelButtonTextColor}
        />

        <ColorField
          label="Boton volver - fondo"
          value={form.backButtonColor || ''}
          onChangeText={(value) => updateColorField('backButtonColor', value)}
        />

        <ColorField
          label="Boton volver - texto"
          value={form.backButtonTextColor || ''}
          onChangeText={(value) => updateColorField('backButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa volver"
          title="Volver"
          backgroundColor={form.backButtonColor}
          textColor={form.backButtonTextColor}
        />

        <ColorField
          label="Boton menu principal - fondo"
          value={form.menuButtonColor || ''}
          onChangeText={(value) => updateColorField('menuButtonColor', value)}
        />

        <ColorField
          label="Boton menu principal - texto"
          value={form.menuButtonTextColor || ''}
          onChangeText={(value) => updateColorField('menuButtonTextColor', value)}
        />
        <ButtonPreview
          label="Vista previa menu principal"
          title="Menu principal"
          backgroundColor={form.menuButtonColor}
          textColor={form.menuButtonTextColor}
        />

      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Calendario
        </AppText>

        <ColorField
          label="Dia seleccionado - fondo"
          value={form.calendarSelectedColor || ''}
          onChangeText={(value) => updateColorField('calendarSelectedColor', value)}
        />

        <ColorField
          label="Dia seleccionado - texto"
          value={form.calendarSelectedTextColor || ''}
          onChangeText={(value) => updateColorField('calendarSelectedTextColor', value)}
        />

        <ColorField
          label="Calendario - texto"
          value={form.calendarTextColor || ''}
          onChangeText={(value) => updateColorField('calendarTextColor', value)}
        />

        <AppDatePreview
          selectedBackground={form.calendarSelectedColor}
          selectedText={form.calendarSelectedTextColor}
          textColor={form.calendarTextColor}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Mi dashboard
        </AppText>

        <ColorField
          label="Metrica - fondo"
          value={form.dashboardMetricBackgroundColor || ''}
          onChangeText={(value) => updateColorField('dashboardMetricBackgroundColor', value)}
        />

        <ColorField
          label="Metrica - texto"
          value={form.dashboardMetricTextColor || ''}
          onChangeText={(value) => updateColorField('dashboardMetricTextColor', value)}
        />

        <ColorField
          label="Dashboard - acento"
          value={form.dashboardAccentColor || ''}
          onChangeText={(value) => updateColorField('dashboardAccentColor', value)}
        />

        <View
          style={[
            styles.dashboardPreview,
            {
              backgroundColor: form.dashboardMetricBackgroundColor,
              borderColor: form.dashboardAccentColor,
            },
          ]}
        >
          <AppText variant="caption" color={form.dashboardMetricTextColor}>
            Ventas de hoy
          </AppText>
          <AppText bold color={form.dashboardAccentColor}>
            $1,250.00
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Tema y estilo
        </AppText>

        <OptionGroup<ThemeMode>
          label="Tema"
          value={form.themeMode || 'LIGHT'}
          options={[
            { label: 'Claro', value: 'LIGHT' },
            { label: 'Oscuro', value: 'DARK' },
            { label: 'Auto', value: 'AUTO' },
          ]}
          onChange={(value) => updateField('themeMode', value)}
        />

        <OptionGroup<DensityMode>
          label="Densidad"
          value={form.densityMode || 'NORMAL'}
          options={[
            { label: 'Normal', value: 'NORMAL' },
            { label: 'Compacta', value: 'COMPACT' },
          ]}
          onChange={(value) => updateField('densityMode', value)}
        />

        <OptionGroup<ButtonStyle>
          label="Estilo de botones"
          value={form.buttonStyle || 'ROUNDED'}
          options={[
            { label: 'Redondeados', value: 'ROUNDED' },
            { label: 'Rectos', value: 'STRAIGHT' },
          ]}
          onChange={(value) => updateField('buttonStyle', value)}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          Impresion
        </AppText>

        <View style={styles.switchRow}>
          <AppText>Mostrar logo en documentos</AppText>
          <Switch
            value={form.showLogoOnPrints ?? true}
            onValueChange={(value) => updateField('showLogoOnPrints', value)}
          />
        </View>

        <Field
          label="Pie de pagina"
          value={form.printFooterText || ''}
          onChangeText={(value) => updateField('printFooterText', value)}
          multiline
        />

        <Field
          label="Mensaje de agradecimiento en paquete"
          value={form.packageThankYouText || ''}
          onChangeText={(value) => updateField('packageThankYouText', value)}
          multiline
        />
      </AppCard>

      <AppButton title="Guardar cambios" loading={saving} onPress={save} />
    </AppScreen>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
};

function Field({ label, value, onChangeText, multiline = false }: FieldProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        multiline={multiline}
        placeholderTextColor={theme.colors.placeholderText}
        style={[
          styles.input,
          {
            borderColor: theme.colors.inputBorder,
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.inputText,
            minHeight: multiline ? 78 : 44,
          },
        ]}
      />
    </View>
  );
}

function ButtonPreview({
  label,
  title,
  backgroundColor,
  textColor,
}: {
  label: string;
  title: string;
  backgroundColor?: string;
  textColor?: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.buttonPreviewBlock}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>
      <View
        style={[
          styles.buttonPreview,
          {
            backgroundColor: backgroundColor || '#111111',
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <AppText bold color={textColor || '#FFFFFF'}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

function LogoPreview({ title, url }: { title: string; url?: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.logoPreviewBlock}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {title}
      </AppText>
      <View style={[styles.logoPreview, { borderColor: theme.colors.border }]}>
        {url ? (
          <Image source={{ uri: url }} resizeMode="contain" style={styles.logoImage} />
        ) : (
          <AppText color={theme.colors.mutedText}>Sin logo configurado</AppText>
        )}
      </View>
    </View>
  );
}

type Option<T extends string> = {
  label: string;
  value: T;
};

type OptionGroupProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionGroupProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.optionGroup}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {label}
      </AppText>

      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.primaryButtonBackground
                    : theme.colors.inputBackground,
                },
              ]}
            >
              <AppText
                color={selected ? theme.colors.primaryButtonText : theme.colors.text}
                bold={selected}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonPreviewBlock: {
    marginBottom: 16,
  },
  dashboardPreview: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
    padding: 14,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  optionGroup: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  option: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoPreview: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
    marginTop: 8,
    padding: 14,
  },
  logoImage: {
    height: 72,
    width: '100%',
  },
  logoPreview: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 90,
    padding: 10,
  },
  logoPreviewBlock: {
    marginBottom: 12,
  },
  sectionHint: {
    marginBottom: 10,
  },
});

