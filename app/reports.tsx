import AppShell from '@/components/layout/AppShell';
import { buildMainNavSections, getSessionScopeLabel } from '@/components/layout/appNavigation';
import ActionTile from '@/components/ui/ActionTile';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { getSession, UserSession } from '@/services/sessionStorage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ReportAccess = {
  titleKey: string;
  descriptionKey: string;
  route: string;
};

const reports: ReportAccess[] = [
  {
    titleKey: 'reports.dailyStoreTitle',
    descriptionKey: 'reports.dailyStoreDescription',
    route: '/report-daily-store',
  },
  {
    titleKey: 'reports.dailyDeliveriesTitle',
    descriptionKey: 'reports.dailyDeliveriesDescription',
    route: '/report-deliveries',
  },
  {
    titleKey: 'reports.dailyDepositsTitle',
    descriptionKey: 'reports.dailyDepositsDescription',
    route: '/report-deposits',
  },
  {
    titleKey: 'reports.dailyCancellationsTitle',
    descriptionKey: 'reports.dailyCancellationsDescription',
    route: '/report-cancellations',
  },
  {
    titleKey: 'reports.liveControlTitle',
    descriptionKey: 'reports.liveControlDescription',
    route: '/report-live',
  },
  {
    titleKey: 'reports.remissionsTitle',
    descriptionKey: 'reports.remissionsDescription',
    route: '/report-remissions',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t } = useTranslation('common');
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  return (
    <AppShell
      title={t('reports.title')}
      subtitle={t('reports.subtitle')}
      contextTitle={t('reports.contextTitle')}
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="reports"
      session={session}
      navSections={navSections}
    >
      <AppInfoCard title={t('reports.cardTitle')}>
        <AppText color={theme.colors.infoCardText}>
          {t('reports.cardHelp')}
        </AppText>
      </AppInfoCard>

      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        {reports.map((report) => (
          <ActionTile
            key={report.route}
            title={t(report.titleKey)}
            subtitle={t(report.descriptionKey)}
            icon="analytics"
            onPress={() => router.push(report.route as any)}
          />
        ))}
      </AppResponsiveGrid>
    </AppShell>
  );
}
