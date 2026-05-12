import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { ensureSessionActive, getSession } from '@/services/sessionStorage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Root() {
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const active = await ensureSessionActive();
    const session = await getSession();

    if (active && session) {
      setIsLogged(true);
      setMustChangePassword(Boolean(session.passwordChangeRequired));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <AppScreen>
        <AppText>Cargando...</AppText>
      </AppScreen>
    );
  }

  if (!isLogged) {
    return <Redirect href="/login" />;
  }

  if (mustChangePassword) {
    return <Redirect href={'/change-password' as any} />;
  }

  return <Redirect href="/(tabs)" />;
}
