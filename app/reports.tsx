import AppBackButton from '@/components/ui/AppBackButton';
import AppInfoCard from '@/components/ui/AppInfoCard';
import AppResponsiveGrid from '@/components/ui/AppResponsiveGrid';
import AppScreen from '@/components/ui/AppScreen';
import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

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
    title: 'Depósitos diarios',
    description: 'Pagos recibidos, métodos, referencias y totales del día.',
    route: '/report-deposits',
  },
  {
    title: 'Cancelaciones diarias',
    description: 'Ventas, reservas y devoluciones canceladas en la fecha.',
    route: '/report-cancellations',
  },
  {
    title: 'Control Live',
    description: 'Paquetes, piezas, saldos y liquidación de operación Live.',
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

  return (
    <AppScreen>
      <AppBackButton fallbackRoute="/" />

      <AppText variant="title" bold>
        Reportes
      </AppText>

      <AppInfoCard title="Reportes operativos">
        <AppText color={theme.colors.infoCardText}>
          Consulta reportes por fecha y sucursal. Incluye operación diaria,
          depósitos, entregas, cancelaciones, control Live y remisiones.
        </AppText>
      </AppInfoCard>

      <AppResponsiveGrid tabletColumns={2} desktopColumns={3}>
        {reports.map((report) => (
          <Pressable
            key={report.title}
            onPress={() => router.push(report.route as any)}
            style={({ pressed }) => [
              styles.reportCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.8 : 1,
                padding: theme.spacing.md,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <AppText variant="subtitle" bold>
                  {report.title}
                </AppText>
                <AppText color={theme.colors.mutedText}>{report.description}</AppText>
                <AppText bold color={theme.colors.accent} style={styles.actionText}>
                  Abrir reporte
                </AppText>
              </View>
              <AppText color={theme.colors.accent} style={styles.chevron}>
                ›
              </AppText>
            </View>
          </Pressable>
        ))}
      </AppResponsiveGrid>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  reportCard: {
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 118,
  },
  actionText: {
    marginTop: 12,
  },
  chevron: {
    fontSize: 28,
    lineHeight: 32,
  },
});
