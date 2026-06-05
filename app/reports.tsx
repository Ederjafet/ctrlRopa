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

type ReportAccess = {
  title: string;
  description: string;
  route: string;
};

const reports: ReportAccess[] = [
  {
    title: 'Diario tienda',
    description: 'Resumen diario de ventas, apartados, pagos, efectivo y cancelaciones.',
    route: '/report-daily-store',
  },
  {
    title: 'Entregas diarias',
    description: 'Paquetes enviados, entregados, devueltos y pendientes por sucursal/fecha.',
    route: '/report-deliveries',
  },
  {
    title: 'Depositos diarios',
    description: 'Pagos recibidos, metodos, referencias y totales del dia.',
    route: '/report-deposits',
  },
  {
    title: 'Cancelaciones diarias',
    description: 'Ventas, reservas y devoluciones canceladas en la fecha.',
    route: '/report-cancellations',
  },
  {
    title: 'Control Live',
    description: 'Paquetes, piezas, saldos y liquidacion de operacion Live.',
    route: '/report-live',
  },
  {
    title: 'Remisiones',
    description: 'Detalle de prendas, clientes, pagos, paquetes y vendedores.',
    route: '/report-remissions',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [session, setSession] = useState<UserSession | null>(null);
  const navSections = useMemo(() => buildMainNavSections(session), [session]);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  return (
    <AppShell
      title="Reportes"
      subtitle="Consultas operativas por fecha y sucursal"
      contextTitle="Centro de reportes"
      contextSubtitle={getSessionScopeLabel(session)}
      activeRoute="reports"
      session={session}
      navSections={navSections}
    >
      <AppInfoCard title="Reportes operativos">
        <AppText color={theme.colors.infoCardText}>
          Consulta reportes por fecha y sucursal. Incluye operacion diaria, depositos, entregas,
          cancelaciones, control Live y remisiones.
        </AppText>
      </AppInfoCard>

      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        {reports.map((report) => (
          <ActionTile
            key={report.title}
            title={report.title}
            subtitle={report.description}
            icon="analytics"
            onPress={() => router.push(report.route as any)}
          />
        ))}
      </AppResponsiveGrid>
    </AppShell>
  );
}
