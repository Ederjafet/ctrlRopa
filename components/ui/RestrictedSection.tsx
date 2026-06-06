import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { NormalizedApiError } from '@/services/apiError';
import { formatPermissionCode } from '@/services/permissionDependencies';

type Props = {
  error: NormalizedApiError;
  title?: string;
};

export default function RestrictedSection({ error, title = 'Acceso restringido' }: Props) {
  const { theme } = useAppTheme();

  return (
    <AppCard variant="warning">
      <AppText variant="subtitle" bold color={theme.colors.warning}>
        {title}
      </AppText>
      <AppText>No tienes permiso para consultar esta informacion.</AppText>
      {error.requiredPermission ? (
        <AppText color={theme.colors.mutedText}>
          Permiso requerido: {formatPermissionCode(error.requiredPermission)}
        </AppText>
      ) : null}
      <AppText variant="caption" color={theme.colors.mutedText}>
        Si necesitas acceso, solicita este permiso a tu supervisor.
      </AppText>
    </AppCard>
  );
}
