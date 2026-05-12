import AppBackButton from '@/components/ui/AppBackButton';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';

export default function ModalScreen() {
  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />
      <AppText variant="title" bold>
        Modal
      </AppText>
    </AppScreen>
  );
}
