import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import AppButton from './AppButton';
import AppText from './AppText';

type DialogVariant = 'info' | 'warning' | 'danger' | 'success';

type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral' | 'ghost';
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  details?: string[];
  variant?: DialogVariant;
  primaryAction: DialogAction;
  secondaryAction?: DialogAction;
  onClose: () => void;
  children?: ReactNode;
};

export default function AppActionDialog({
  visible,
  title,
  message,
  details = [],
  variant = 'info',
  primaryAction,
  secondaryAction,
  onClose,
  children,
}: Props) {
  const { theme } = useAppTheme();
  const toneColor =
    variant === 'danger'
      ? theme.colors.danger
      : variant === 'warning'
        ? theme.colors.warning
        : variant === 'success'
          ? theme.colors.success
          : theme.colors.info;

  const toneBackground =
    variant === 'danger'
      ? theme.colors.dangerBackground
      : variant === 'warning'
        ? theme.isDark
          ? theme.colors.surfaceAlt
          : theme.colors.warningBackground
        : variant === 'success'
          ? theme.colors.successBackground
          : theme.colors.infoSoft;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.modalBackground,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View
            style={[
              styles.toneBar,
              {
                backgroundColor: toneBackground,
                borderColor: toneColor,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
              },
            ]}
          >
            <AppText variant="subtitle" bold color={toneColor}>
              {title}
            </AppText>
            <AppText color={theme.colors.textSecondary}>{message}</AppText>
          </View>

          {details.length > 0 ? (
            <View style={styles.details}>
              {details.map((detail) => (
                <View key={detail} style={styles.detailRow}>
                  <View style={[styles.bullet, { backgroundColor: toneColor }]} />
                  <AppText style={styles.detailText}>{detail}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          {children ? <View style={styles.children}>{children}</View> : null}

          <View style={styles.actions}>
            {secondaryAction ? (
              <View style={styles.action}>
                <AppButton
                  title={secondaryAction.label}
                  variant={secondaryAction.variant ?? 'secondary'}
                  onPress={secondaryAction.onPress}
                />
              </View>
            ) : null}
            <View style={styles.action}>
              <AppButton
                title={primaryAction.label}
                variant={primaryAction.variant ?? 'primary'}
                onPress={primaryAction.onPress}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
    minWidth: 140,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  bullet: {
    borderRadius: 4,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  children: {
    marginTop: 12,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  detailText: {
    flex: 1,
  },
  details: {
    gap: 8,
    marginTop: 16,
  },
  dialog: {
    borderWidth: 1,
    elevation: 8,
    maxWidth: 520,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    width: '100%',
  },
  toneBar: {
    borderWidth: 1,
    gap: 6,
  },
});
