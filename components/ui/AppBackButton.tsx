import AppButton from '@/components/ui/AppButton';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Props = {
  fallbackRoute: string;
  title?: string;
  preferHistory?: boolean;
  onPress?: () => void;
  showMenuButton?: boolean;
};

export default function AppBackButton({
  fallbackRoute,
  title,
  preferHistory = false,
  onPress,
  showMenuButton = true,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const backTitle = title ?? t('common.back');
  const mainMenuTitle = t('common.mainMenu');

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (preferHistory && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackRoute as any);
  };

  const goToMenu = () => {
    router.replace('/' as any);
  };

  const shouldShowMenuButton = showMenuButton && fallbackRoute !== '/';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      <AppButton
        title={fallbackRoute === '/' ? mainMenuTitle : backTitle}
        variant={fallbackRoute === '/' ? 'menu' : 'back'}
        onPress={handlePress}
        style={{ flexGrow: 1 }}
      />
      {shouldShowMenuButton ? (
        <AppButton
          title={mainMenuTitle}
          variant="menu"
          onPress={goToMenu}
          style={{ flexGrow: 1 }}
        />
      ) : null}
    </View>
  );
}
