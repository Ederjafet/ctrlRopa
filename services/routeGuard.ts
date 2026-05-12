import { canAccess } from '@/services/accessControl';
import { getSession } from '@/services/sessionStorage';

export async function validateRouteAccess(
  channelCode: string,
  permissionCode: string
): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  return canAccess(session, channelCode, permissionCode);
}