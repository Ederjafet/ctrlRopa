import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import AppButton from './AppButton';
import AppText from './AppText';

type Tone = 'success' | 'warning' | 'danger' | 'info';

type Props = ViewProps & {
  title?: string;
  message: string;
  tone?: Tone;
  children?: ReactNode;
  defaultExpanded?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
};

export default function AppNoticeDropdown({
  title,
  message,
  tone = 'info',
  children,
  defaultExpanded = true,
  actionLabel,
  onAction,
  onClose,
  style,
  ...rest
}: Props) {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const color =
    tone === 'danger'
      ? theme.colors.danger
      : tone === 'warning'
        ? theme.colors.warning
        : tone === 'success'
          ? theme.colors.success
          : theme.colors.accent;

  const background =
    tone === 'danger'
      ? theme.colors.dangerBackground
      : tone === 'warning'
        ? theme.colors.warningBackground
        : tone === 'success'
          ? theme.colors.successBackground
          : theme.colors.infoCardBackground;

  const heading =
    title ??
    (tone === 'danger'
      ? 'Revisa esta acción'
      : tone === 'warning'
        ? 'Atención'
        : tone === 'success'
          ? 'Listo'
          : 'Aviso');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: background,
          borderColor: color,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      <Pressable
        onPress={() => setExpanded((current) => !current)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <AppText bold color={color}>
            {heading}
          </AppText>
          <AppText color={theme.colors.text}>{message}</AppText>
        </View>
        <AppText bold color={color}>
          {expanded ? 'Ocultar' : 'Ver'}
        </AppText>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {children}
          <View style={styles.actions}>
            {actionLabel && onAction ? (
              <View style={styles.actionButton}>
                <AppButton title={actionLabel} onPress={onAction} />
              </View>
            ) : null}
            {onClose ? (
              <View style={styles.actionButton}>
                <AppButton title="Cerrar aviso" variant="secondary" onPress={onClose} />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    elevation: 2,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  body: {
    gap: 10,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: 150,
  },
});
