import { useAppTheme } from '@/context/AppThemeContext';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export default function AppScreen({
  children,
  scroll = true,
  style,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const horizontalPadding = Math.max(
    theme.density === 'COMPACT' ? theme.spacing.md : theme.spacing.lg,
    responsive.horizontalPadding
  );
  const statusBarFallback =
    Platform.OS === 'android' ? 24 : Platform.OS === 'ios' ? 44 : 0;
  const navigationBarFallback =
    Platform.OS === 'android' ? 56 : Platform.OS === 'ios' ? 34 : theme.spacing.md;
  const topPadding = theme.spacing.lg + Math.max(insets.top, statusBarFallback);
  const bottomSafeArea = Math.max(insets.bottom, navigationBarFallback);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sharedContentStyle = {
    backgroundColor: theme.colors.background,
    alignSelf: 'center' as const,
    width: '100%' as const,
    maxWidth: responsive.contentMaxWidth,
    paddingHorizontal: horizontalPadding,
    paddingTop: topPadding,
    paddingBottom: theme.spacing.lg + (keyboardHeight > 0 ? keyboardHeight : 0),
  };

  const scrollContentStyle = [
    styles.container,
    sharedContentStyle,
    style,
  ];

  const fixedContentStyle = [
    styles.fixedContainer,
    sharedContentStyle,
    style,
  ];

  if (!scroll) {
    return (
      <View style={[styles.screen, styles.webScreen, { backgroundColor: theme.colors.background }]}>
        <View style={fixedContentStyle}>{children}</View>
        <View style={{ height: bottomSafeArea, backgroundColor: theme.colors.background }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, styles.webScreen, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
      >
        {children}
      </ScrollView>
      <View style={{ height: bottomSafeArea, backgroundColor: theme.colors.background }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  webScreen: Platform.select({
    web: {
      height: '100vh',
      maxHeight: '100vh',
    },
    default: {},
  }) as ViewStyle,
  container: {
    flexGrow: 1,
  },
  fixedContainer: {
    flex: 1,
  },
});
