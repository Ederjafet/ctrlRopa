import AppShellPage from '@/components/layout/AppShellPage';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import ColorField from '@/components/ui/ColorField';
import { AppDatePreview } from '@/components/ui/AppDateField';
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
import { canAccessByPermission, hasModuleEnabled } from '@/services/accessControl';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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

      if (
        !canAccessByPermission(session, 'MANAGE_BRANDING') ||
        !hasModuleEnabled(session, 'APPEARANCE_CUSTOMIZATION')
      ) {
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
      Alert.alert(t('appearance.invalidColorTitle'), t('appearance.invalidColorMessage'));
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
      Alert.alert(t('appearance.savedTitle'), t('appearance.savedMessage'));
    } catch (error) {
      Alert.alert(t('appearance.saveErrorTitle'), t('appearance.saveErrorMessage'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <AppShellPage
        title={t('navigation.items.appearance')}
        subtitle={t('appearance.subtitle')}
        activeRoute="appearance"
        session={user}
      >
        <AppText>{t('common.loading')}</AppText>
      </AppShellPage>
    );
  }

  return (
    <AppShellPage
      title={t('navigation.items.appearance')}
      subtitle={t('appearance.subtitle')}
      activeRoute="appearance"
      session={user}
    >
      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.identity')}
        </AppText>

        <Field
          label={t('appearance.systemName')}
          value={form.appName || ''}
          onChangeText={(value) => updateField('appName', value)}
        />

        <Field
          label={t('appearance.logoUrl')}
          value={form.logoUrl || ''}
          onChangeText={(value) => updateField('logoUrl', value)}
        />

        <Field
          label={t('appearance.faviconUrl')}
          value={form.faviconUrl || ''}
          onChangeText={(value) => updateField('faviconUrl', value)}
        />

        <Field
          label={t('appearance.loginLogoUrl')}
          value={form.loginLogoUrl || ''}
          onChangeText={(value) => updateField('loginLogoUrl', value)}
        />
        <LogoPreview title={t('appearance.loginPreview')} url={form.loginLogoUrl || form.logoUrl || ''} />

        <Field
          label={t('appearance.printLogoUrl')}
          value={form.printLogoUrl || ''}
          onChangeText={(value) => updateField('printLogoUrl', value)}
        />
        <LogoPreview title={t('appearance.printPreview')} url={form.printLogoUrl || form.logoUrl || ''} />
      </AppCard>

      <AppCard variant="info">
        <AppText variant="subtitle" bold>
          {t('paletteGenerator.appearanceCardTitle')}
        </AppText>
        <AppText color={theme.colors.mutedText} style={styles.sectionHint}>
          {t('paletteGenerator.appearanceCardHelp')}
        </AppText>
        <AppButton
          title={t('paletteGenerator.openGenerator')}
          variant="secondary"
          onPress={() => router.push('/ui-kit')}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.infoCards')}
        </AppText>
        <AppText color={theme.colors.mutedText} style={styles.sectionHint}>
          {t('appearance.infoCardsHelp')}
        </AppText>

        <ColorField
          label={t('appearance.infoCardBackground')}
          value={form.infoCardBackgroundColor || ''}
          onChangeText={(value) => updateColorField('infoCardBackgroundColor', value)}
        />

        <ColorField
          label={t('appearance.infoCardText')}
          value={form.infoCardTextColor || ''}
          onChangeText={(value) => updateColorField('infoCardTextColor', value)}
        />

        <ColorField
          label={t('appearance.infoCardBorder')}
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
            {t('appearance.infoExampleTitle')}
          </AppText>
          <AppText color={form.infoCardTextColor}>
            {t('appearance.infoExampleText')}
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.generalColors')}
        </AppText>

        <ColorField
          label={t('appearance.primaryColor')}
          value={form.primaryColor || ''}
          onChangeText={(value) => updateColorField('primaryColor', value)}
        />

        <ColorField
          label={t('appearance.secondaryColor')}
          value={form.secondaryColor || ''}
          onChangeText={(value) => updateColorField('secondaryColor', value)}
        />

        <ColorField
          label={t('appearance.accentColor')}
          value={form.accentColor || ''}
          onChangeText={(value) => updateColorField('accentColor', value)}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.buttons')}
        </AppText>

        <ColorField
          label={t('appearance.primaryButtonBackground')}
          value={form.primaryButtonColor || ''}
          onChangeText={(value) => updateColorField('primaryButtonColor', value)}
        />

        <ColorField
          label={t('appearance.primaryButtonText')}
          value={form.primaryButtonTextColor || ''}
          onChangeText={(value) => updateColorField('primaryButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.primaryPreview')}
          title={t('appearance.primaryButton')}
          backgroundColor={form.primaryButtonColor}
          textColor={form.primaryButtonTextColor}
        />

        <ColorField
          label={t('appearance.secondaryButtonBackground')}
          value={form.secondaryButtonColor || ''}
          onChangeText={(value) => updateColorField('secondaryButtonColor', value)}
        />

        <ColorField
          label={t('appearance.secondaryButtonText')}
          value={form.secondaryButtonTextColor || ''}
          onChangeText={(value) => updateColorField('secondaryButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.secondaryPreview')}
          title={t('appearance.secondaryButton')}
          backgroundColor={form.secondaryButtonColor}
          textColor={form.secondaryButtonTextColor}
        />

        <ColorField
          label={t('appearance.operationButtonBackground')}
          value={form.operationButtonColor || ''}
          onChangeText={(value) => updateColorField('operationButtonColor', value)}
        />

        <ColorField
          label={t('appearance.operationButtonText')}
          value={form.operationButtonTextColor || ''}
          onChangeText={(value) => updateColorField('operationButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.operationPreview')}
          title={t('appearance.selectCustomerPreview')}
          backgroundColor={form.operationButtonColor}
          textColor={form.operationButtonTextColor}
        />

        <ColorField
          label={t('appearance.dangerButtonBackground')}
          value={form.dangerButtonColor || ''}
          onChangeText={(value) => updateColorField('dangerButtonColor', value)}
        />

        <ColorField
          label={t('appearance.dangerButtonText')}
          value={form.dangerButtonTextColor || ''}
          onChangeText={(value) => updateColorField('dangerButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.dangerPreview')}
          title={t('appearance.cancelSalePreview')}
          backgroundColor={form.dangerButtonColor}
          textColor={form.dangerButtonTextColor}
        />

        <ColorField
          label={t('appearance.cancelButtonBackground')}
          value={form.cancelButtonColor || ''}
          onChangeText={(value) => updateColorField('cancelButtonColor', value)}
        />

        <ColorField
          label={t('appearance.cancelButtonText')}
          value={form.cancelButtonTextColor || ''}
          onChangeText={(value) => updateColorField('cancelButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.cancelPreview')}
          title={t('common.cancel')}
          backgroundColor={form.cancelButtonColor}
          textColor={form.cancelButtonTextColor}
        />

        <ColorField
          label={t('appearance.backButtonBackground')}
          value={form.backButtonColor || ''}
          onChangeText={(value) => updateColorField('backButtonColor', value)}
        />

        <ColorField
          label={t('appearance.backButtonText')}
          value={form.backButtonTextColor || ''}
          onChangeText={(value) => updateColorField('backButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.backPreview')}
          title={t('common.back')}
          backgroundColor={form.backButtonColor}
          textColor={form.backButtonTextColor}
        />

        <ColorField
          label={t('appearance.mainMenuButtonBackground')}
          value={form.menuButtonColor || ''}
          onChangeText={(value) => updateColorField('menuButtonColor', value)}
        />

        <ColorField
          label={t('appearance.mainMenuButtonText')}
          value={form.menuButtonTextColor || ''}
          onChangeText={(value) => updateColorField('menuButtonTextColor', value)}
        />
        <ButtonPreview
          label={t('appearance.mainMenuPreview')}
          title={t('common.mainMenu')}
          backgroundColor={form.menuButtonColor}
          textColor={form.menuButtonTextColor}
        />

      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.calendar')}
        </AppText>

        <ColorField
          label={t('appearance.selectedDayBackground')}
          value={form.calendarSelectedColor || ''}
          onChangeText={(value) => updateColorField('calendarSelectedColor', value)}
        />

        <ColorField
          label={t('appearance.selectedDayText')}
          value={form.calendarSelectedTextColor || ''}
          onChangeText={(value) => updateColorField('calendarSelectedTextColor', value)}
        />

        <ColorField
          label={t('appearance.calendarText')}
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
          {t('appearance.dashboard')}
        </AppText>

        <ColorField
          label={t('appearance.metricBackground')}
          value={form.dashboardMetricBackgroundColor || ''}
          onChangeText={(value) => updateColorField('dashboardMetricBackgroundColor', value)}
        />

        <ColorField
          label={t('appearance.metricText')}
          value={form.dashboardMetricTextColor || ''}
          onChangeText={(value) => updateColorField('dashboardMetricTextColor', value)}
        />

        <ColorField
          label={t('appearance.dashboardAccent')}
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
            {t('appearance.todaySales')}
          </AppText>
          <AppText bold color={form.dashboardAccentColor}>
            $1,250.00
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.themeAndStyle')}
        </AppText>

        <OptionGroup<ThemeMode>
          label={t('appearance.theme')}
          value={form.themeMode || 'LIGHT'}
          options={[
            { label: t('theme.light'), value: 'LIGHT' },
            { label: t('theme.dark'), value: 'DARK' },
            { label: t('appearance.autoTheme'), value: 'AUTO' },
          ]}
          onChange={(value) => updateField('themeMode', value)}
        />

        <OptionGroup<DensityMode>
          label={t('appearance.density')}
          value={form.densityMode || 'NORMAL'}
          options={[
            { label: t('appearance.normalDensity'), value: 'NORMAL' },
            { label: t('appearance.compactDensity'), value: 'COMPACT' },
          ]}
          onChange={(value) => updateField('densityMode', value)}
        />

        <OptionGroup<ButtonStyle>
          label={t('appearance.buttonStyle')}
          value={form.buttonStyle || 'ROUNDED'}
          options={[
            { label: t('appearance.roundedButtons'), value: 'ROUNDED' },
            { label: t('appearance.straightButtons'), value: 'STRAIGHT' },
          ]}
          onChange={(value) => updateField('buttonStyle', value)}
        />
      </AppCard>

      <AppCard>
        <AppText variant="subtitle" bold>
          {t('appearance.printing')}
        </AppText>

        <View style={styles.switchRow}>
          <AppText>{t('appearance.showLogoOnPrints')}</AppText>
          <Switch
            value={form.showLogoOnPrints ?? true}
            onValueChange={(value) => updateField('showLogoOnPrints', value)}
          />
        </View>

        <Field
          label={t('appearance.footerText')}
          value={form.printFooterText || ''}
          onChangeText={(value) => updateField('printFooterText', value)}
          multiline
        />

        <Field
          label={t('appearance.packageThanks')}
          value={form.packageThankYouText || ''}
          onChangeText={(value) => updateField('packageThankYouText', value)}
          multiline
        />
      </AppCard>

      <AppButton title={t('appearance.saveChanges')} loading={saving} onPress={save} />
    </AppShellPage>
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
  const { t } = useTranslation('common');

  return (
    <View style={styles.logoPreviewBlock}>
      <AppText variant="caption" color={theme.colors.mutedText}>
        {title}
      </AppText>
      <View style={[styles.logoPreview, { borderColor: theme.colors.border }]}>
        {url ? (
          <Image source={{ uri: url }} resizeMode="contain" style={styles.logoImage} />
        ) : (
          <AppText color={theme.colors.mutedText}>{t('appearance.noLogoConfigured')}</AppText>
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
