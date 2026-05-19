# ERP LIVE-L - Responsive Layouts

Fecha: 2026-05-19

Rama: `feature/live-l-layouts-flujo-operativo`

## Objetivo

Separar la experiencia visual de `En vivo` por dispositivo sin tocar backend, migraciones, pagos reales, reportes ni integraciones externas.

## Implementacion frontend

Se mantiene la logica principal en `app/live.tsx` y se extraen solo componentes de distribucion visual:

- `components/live/LiveDesktopLayout.tsx`
- `components/live/LiveTabletLayout.tsx`
- `components/live/LiveMobileLayout.tsx`

Estos componentes reciben tres bloques visuales como `children`:

1. producto/transmision/metricas,
2. captura/reserva,
3. reservas recientes/cierre.

No contienen llamadas API, reglas de negocio, calculos financieros ni manejo de permisos.

## Desktop

Layout de tres columnas:

- izquierda: producto visual, estado, comentarios demo y metricas;
- centro: sesiones, seleccion/creacion de transmision y captura;
- derecha: reservas recientes, cobro y cierre.

Uso esperado:

- demos comerciales,
- supervision,
- operacion con monitor amplio.

## Tablet

Layout de dos columnas:

- izquierda: producto + actividad;
- derecha: captura + reservas + metricas operativas.

Objetivo:

- 1024x768,
- 1280x800,
- Galaxy Tab,
- iPad horizontal.

## Movil

Layout apilado:

- secciones compactas,
- CTA principal visible,
- sin listas laterales forzadas,
- sin depender de columnas.

## Criterios UX

- Priorizar captura rapida.
- Evitar que la presentadora opere el sistema completo.
- Hacer que el operador vea producto actual, cliente, prenda y reserva en el menor scroll posible.
- Mantener textos visibles en espanol como `En vivo`, `Panel` y `Linea de tiempo`.

## Validacion pendiente

- Smoke visual real en tablet.
- Smoke visual real en movil.
- Confirmar que modales de cliente/prenda no quedan tapados por columnas.
