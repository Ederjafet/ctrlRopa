# ITEM-Z2 - Validacion backend minima de elegibilidad de prenda al aire

## Resumen ejecutivo

ITEM-Z2 agrega una proteccion backend minima para el flujo LIVE: una prenda solo puede ponerse o cambiarse como "prenda al aire" si su estado real de inventario es `AVAILABLE`.

La fase refuerza `LiveService.setActiveItem` sin modificar el modelo de inventario, sin crear estados nuevos, sin migraciones y sin tocar pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.

Resultado esperado:

- `GO_TECNICO` si las validaciones pasan.
- `PENDING_QA_VISUAL` hasta ejecutar smoke visual o API con datos reales.
- `NO_GO` si se detecta regresion backend/frontend.

## Contexto validado

ITEM-Z1 documento que `items.status` es la fuente real de disponibilidad:

- `AVAILABLE`
- `RESERVED`
- `SOLD`
- `DISABLED`
- `ON_CONSIGNMENT`

Tambien documento que:

- `ReservationService.create` ya bloquea reservas si la prenda no esta `AVAILABLE`.
- Al reservar, backend cambia la prenda a `RESERVED`.
- `lives.active_item_id` solo representa la prenda al aire.
- "Prenda preparada" sigue siendo estado temporal frontend.
- `OPERATIONAL_SOLD` es cierre operativo LIVE, no venta financiera, pago ni caja.

## Cambio implementado

`LiveService.setActiveItem` ahora valida el estado de la prenda antes de asignarla como active item:

- Permite `AVAILABLE`.
- Rechaza `RESERVED`.
- Rechaza `SOLD`.
- Rechaza `DISABLED`.
- Rechaza `ON_CONSIGNMENT`.

Mensaje backend:

```text
Solo se pueden poner al aire prendas disponibles
```

La validacion se ejecuta despues de las validaciones existentes de live, tenant/company, sucursal y permisos.

## Lo que no cambia

- Poner una prenda al aire no cambia `items.status`.
- Cambiar la prenda al aire no cambia `items.status`.
- Retirar la prenda del aire no cambia `items.status`.
- No se persiste "prenda preparada".
- No se crean endpoints.
- No se crean migraciones.
- No se crean permisos.
- No se modifica RBAC.
- No se toca precio LIVE.
- No se toca pago, caja, devoluciones ni autorizaciones.
- No se cambia `DO_LIVE_RESERVATION`.
- `ReservationService` conserva la responsabilidad de bloquear inventario al apartar.

## Reglas operativas

| Flujo | Regla ITEM-Z2 |
| --- | --- |
| Poner prenda al aire | Requiere `item.status == AVAILABLE`. |
| Cambiar prenda al aire | Requiere `item.status == AVAILABLE`. |
| Retirar prenda del aire | No requiere que el item actual este `AVAILABLE`; no toca inventario. |
| Apartar en LIVE | Sigue usando `ReservationService.create` y `DO_LIVE_RESERVATION`. |
| Venta operativa LIVE | Fuera de alcance. |
| Pago/caja | Fuera de alcance. |

## Pruebas backend agregadas

Se agregaron pruebas para:

- Permitir prenda `AVAILABLE` como active item.
- Rechazar `RESERVED`.
- Rechazar `SOLD`.
- Rechazar `DISABLED`.
- Rechazar `ON_CONSIGNMENT`.
- Confirmar que poner una prenda al aire no cambia `items.status`.
- Confirmar que retirar la prenda del aire no cambia inventario.

Tambien se conserva cobertura para sucursal ajena.

## Riesgos mitigados

- Evita que una prenda ya apartada sea puesta como prenda al aire.
- Evita que una prenda vendida aparezca como candidata activa en LIVE.
- Evita usar prendas deshabilitadas o en consignacion como active item.
- Reduce desincronizacion entre LIVE e inventario sin introducir bloqueo nuevo.

## Riesgos pendientes

- La transicion `AVAILABLE -> RESERVED` aun debe evaluarse para doble submit/concurrencia en ITEM-Z3.
- "Prenda preparada" no esta persistida en backend.
- No hay integracion de venta financiera, pago ni caja.
- La autorizacion operativa para reversas/cambios sensibles sigue pendiente.
- QA visual/API con datos reales queda pendiente si no hay evidencia de navegador o smoke autenticado.

## QA requerido

Casos sugeridos:

1. Poner al aire una prenda `AVAILABLE`.
2. Intentar poner al aire una prenda `RESERVED`; debe rechazarse.
3. Intentar poner al aire una prenda `SOLD`; debe rechazarse.
4. Intentar poner al aire una prenda `DISABLED`; debe rechazarse.
5. Intentar poner al aire una prenda `ON_CONSIGNMENT`; debe rechazarse.
6. Retirar prenda al aire y confirmar que el estado de inventario no cambia.
7. Apartar en LIVE y confirmar que la reserva sigue cambiando inventario mediante `ReservationService`.

## GO / NO-GO

`GO_TECNICO` si:

- Maven test pasa.
- Lint frontend pasa.
- TypeScript pasa.
- Expo export web pasa.
- `git diff --check` no reporta errores.
- No hay cambios fuera de alcance.

`PENDING_QA_VISUAL` si no hay evidencia visual o API real autenticada.
