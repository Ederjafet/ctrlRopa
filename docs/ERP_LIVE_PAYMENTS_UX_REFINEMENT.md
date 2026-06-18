# ERP LIVE / Pagos UX Refinement

Fecha: 2026-05-18

Rama: `feature/live-j-notificaciones-detalle-cobro-ux`

## Objetivo

Pulir la experiencia visual del flujo `En vivo -> Reserva -> Pagos` sin tocar backend, migraciones, calculos financieros ni reglas de reservaciones.

## Cambios aplicados

### Notificaciones En vivo

- Se reemplazo el aviso grande tipo banner/dropdown para eventos de accion por un modal compacto centrado.
- El modal usa titulo, mensaje y tono visual para:
  - reserva creada,
  - transmision creada,
  - transmision activada,
  - transmision cerrada,
  - errores de creacion/activacion/cierre/reserva.
- Se elimino el `Alert.alert` duplicado que aparecia despues de crear una transmision.
- La confirmacion de cierre se mantiene en su modal de confirmacion dedicado.
- Los errores secundarios de carga siguen sin convertirse en exito silencioso.

### Pagos / Cobros

- El detalle de reserva dejo de ser una lista vertical larga.
- Se reorganizo en grupos responsive:
  - Reserva / Estado,
  - Cliente / Prenda,
  - Canal / En vivo,
  - Totales.
- En desktop el detalle se distribuye por columnas.
- En movil se acomoda como tarjetas apiladas legibles.
- Se conserva:
  - boton `Volver al En vivo activo`,
  - historial/registro de pagos,
  - calculo de total, pagado, pendiente y saldo a favor,
  - endpoints y payloads actuales.

## Archivos afectados

- `app/live.tsx`
- `app/payments.tsx`
- `locales/es/common.json`
- `locales/en/common.json`

## Validaciones esperadas runtime

1. Iniciar sesion.
2. Abrir En vivo.
3. Crear una reserva.
4. Confirmar que el aviso aparece como modal compacto.
5. Ir a `Pagos / Cobros` desde la reserva.
6. Confirmar que el detalle se ve agrupado y no como lista larga.
7. Volver a En vivo.
8. Validar en escritorio y movil.
9. Cambiar idioma global y confirmar textos ES/EN.

## Riesgos

- El modal compacto es una mejora visual frontend; la confirmacion runtime en dispositivo real sigue siendo necesaria.
- Pagos mantiene textos legacy fuera del bloque de detalle; una futura fase debe migrar toda la pantalla a i18n completa.
- No se altero la logica financiera; cualquier diferencia de montos debe revisarse contra datos backend existentes.

## Decision

`GO tecnico` si lint, TypeScript y export web pasan.

`GO runtime` queda sujeto a smoke visual en web/movil con datos QA reales.
