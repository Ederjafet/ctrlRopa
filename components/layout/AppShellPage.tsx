import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import { getSession, UserSession } from '@/services/sessionStorage';
import { ReactNode, useEffect, useMemo, useState } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  contextTitle?: string;
  contextSubtitle?: string;
  activeRoute: string;
  session?: UserSession | null;
  rightContent?: ReactNode;
  children: ReactNode;
};

export default function AppShellPage({
  title,
  subtitle,
  contextTitle,
  contextSubtitle,
  activeRoute,
  session: providedSession,
  rightContent,
  children,
}: Props) {
  const [loadedSession, setLoadedSession] = useState<UserSession | null>(providedSession ?? null);
  const session = providedSession === undefined ? loadedSession : providedSession;
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useEffect(() => {
    if (providedSession !== undefined) {
      setLoadedSession(providedSession);
      return;
    }

    let mounted = true;
    getSession().then((currentSession) => {
      if (mounted) setLoadedSession(currentSession);
    });

    return () => {
      mounted = false;
    };
  }, [providedSession]);

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      contextTitle={contextTitle ?? title}
      contextSubtitle={contextSubtitle ?? getSessionScopeLabel(session)}
      activeRoute={activeRoute}
      session={session}
      navSections={navSections}
      rightContent={rightContent}
    >
      {children}
    </AppShell>
  );
}
