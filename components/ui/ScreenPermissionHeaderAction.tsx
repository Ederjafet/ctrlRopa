import AppButton from '@/components/ui/AppButton';
import ScreenPermissionModal from '@/components/ui/ScreenPermissionModal';
import {
  canViewScreenPermissionDiagnostics,
  getScreenPermissionSummary,
  ScreenPermissionKey,
} from '@/services/screenPermissions';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, ViewStyle } from 'react-native';

type Props = {
  screenKey: ScreenPermissionKey;
  screenTitle: string;
  session?: UserSession | null;
  buttonStyle?: StyleProp<ViewStyle>;
};

export default function ScreenPermissionHeaderAction({
  screenKey,
  screenTitle,
  session: providedSession,
  buttonStyle,
}: Props) {
  const { i18n } = useTranslation('common');
  const [resolvedSession, setResolvedSession] = useState<UserSession | null>(
    providedSession ?? null
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (providedSession !== undefined) {
      setResolvedSession(providedSession);
      return;
    }

    let mounted = true;
    getSession().then((currentSession) => {
      if (mounted) setResolvedSession(currentSession);
    });

    return () => {
      mounted = false;
    };
  }, [providedSession]);

  const evaluations = getScreenPermissionSummary(
    screenKey,
    resolvedSession,
    i18n.language
  );
  const showTechnicalDetails = canViewScreenPermissionDiagnostics(resolvedSession);

  return (
    <>
      <AppButton
        title="Ver permisos"
        variant="secondary"
        onPress={() => setVisible(true)}
        style={buttonStyle}
      />
      <ScreenPermissionModal
        visible={visible}
        screenTitle={screenTitle}
        evaluations={evaluations}
        showTechnicalDetails={showTechnicalDetails}
        onClose={() => setVisible(false)}
      />
    </>
  );
}
