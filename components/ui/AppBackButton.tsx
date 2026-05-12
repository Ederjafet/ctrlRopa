import AppButton from '@/components/ui/AppButton';
import { useRouter } from 'expo-router';
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
  title = 'Volver',
  preferHistory = false,
  onPress,
  showMenuButton = true,
}: Props) {
  const router = useRouter();

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
        title={fallbackRoute === '/' ? 'Menu principal' : title}
        variant={fallbackRoute === '/' ? 'menu' : 'back'}
        onPress={handlePress}
        style={{ flexGrow: 1 }}
      />
      {shouldShowMenuButton ? (
        <AppButton
          title="Menu principal"
          variant="menu"
          onPress={goToMenu}
          style={{ flexGrow: 1 }}
        />
      ) : null}
    </View>
  );
}
