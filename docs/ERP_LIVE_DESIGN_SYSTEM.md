# ERP LIVE-N - Live Commerce Design System

Fecha: 2026-05-19

## Objetivo

Crear una base visual consistente para tarjetas y bloques de `En vivo`, sin reemplazar todavia todo el sistema UI global.

## Componentes creados

Archivo:

- `components/live/LiveCommerceCards.tsx`

Componentes:

- `LiveInfoCard`
- `LiveMetricCard`
- `LiveActionCard`
- `LiveStatusCard`
- `LiveWarningCard`
- `LiveSuccessCard`
- `LiveCompactCard`

## Uso inicial

`LiveMetricCard` ya se usa en `app/live.tsx` para homologar las metricas demostrativas.

## Reglas visuales

- Bordes suaves.
- Padding compacto en tablet.
- Menos texto en tarjetas metricas.
- Color de acento solo para valor clave.
- Ayudas largas solo en desktop.
- Estados y avisos con tono visual diferenciado.

## Tipos de tarjetas

### InfoCard

Para informacion contextual breve.

### MetricCard

Para espectadores, participacion, comentarios y reservas.

### ActionCard

Para acciones primarias de operador.

### StatusCard

Para estado de transmision.

### WarningCard

Para permisos, carga parcial o bloqueo.

### SuccessCard

Para confirmaciones importantes.

### CompactCard

Para movil/tablet o listas densas.

## Evolucion recomendada

1. Migrar estado operativo a `LiveStatusCard`.
2. Migrar avisos de carga parcial a `LiveWarningCard`.
3. Migrar reservas recientes a `LiveCompactCard`.
4. Mantener `AppCard` para pantallas generales no LIVE hasta una fase de design system global.
