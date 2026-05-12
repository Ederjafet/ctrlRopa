import { useAppTheme } from '@/context/AppThemeContext';
import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import AppText from './AppText';

type Props = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  maxHeight?: `${number}%`;
  showCancelButton?: boolean;
  cancelTitle?: string;
  scroll?: boolean;
};

export default function AppBottomModal({
  visible,
  title,
  children,
  onClose,
  maxHeight = '85%',
  showCancelButton = true,
  cancelTitle = 'Cancelar',
  scroll = true,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigationBarFallback =
    Platform.OS === 'android' ? 56 : Platform.OS === 'ios' ? 34 : theme.spacing.md;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}
      >
        <View
          style={[
            styles.content,
            {
              maxHeight,
              backgroundColor: theme.colors.modalBackground,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              paddingBottom:
                theme.spacing.lg + Math.max(insets.bottom, navigationBarFallback),
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
            },
          ]}
        >
          <AppText variant="subtitle" bold>
            {title}
          </AppText>

          {scroll ? (
            <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          ) : (
            <View style={styles.nonScrollableContent}>{children}</View>
          )}

          {showCancelButton ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <AppButton title={cancelTitle} variant="cancel" onPress={onClose} />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
  },
  nonScrollableContent: {
    flexShrink: 1,
  },
});
