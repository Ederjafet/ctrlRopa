import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { NormalizedApiError } from '@/services/apiError';
import { formatPermissionCode } from '@/services/permissionDependencies';
import { useTranslation } from 'react-i18next';

type Props = {
  error: NormalizedApiError;
  title?: string;
};

export default function RestrictedSection({ error, title = 'Acceso restringido' }: Props) {
  const { theme } = useAppTheme();
  const { i18n } = useTranslation('common');

  return (
    <AppCard variant="warning">
      <AppText variant="subtitle" bold color={theme.colors.warning}>
        {title}
      </AppText>
      <AppText>No tienes permiso para consultar esta informacion.</AppText>
      {error.requiredPermission ? (
        <AppText color={theme.colors.mutedText}>
          Permiso requerido: {formatPermissionCode(error.requiredPermission, i18n.language)}
        </AppText>
      ) : null}
      <AppText variant="caption" color={theme.colors.mutedText}>
        Si necesitas acceso, solicita este permiso a tu supervisor.
      </AppText>
    </AppCard>
  );
}
