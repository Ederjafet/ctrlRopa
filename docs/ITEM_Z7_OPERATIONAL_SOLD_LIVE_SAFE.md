# ITEM-Z7 - Vendido operativo LIVE seguro

Fecha: 2026-06-10
Rama: `feature/item-z7-operational-sold-live-safe`
Estado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Resumen ejecutivo

ITEM-Z7 endurece el cierre `OPERATIONAL_SOLD` de apartados LIVE para que sea un estado operativo seguro y no una venta financiera. La accion ya existia en backend mediante `ReservationService.updateLiveOperationalStatus(...)`, `reservations.live_operational_status` y eventos `live_events`.

El ajuste implementado valida que "vendido operativo LIVE" solo se aplique sobre una reserva LIVE valida, activa y con la prenda todavia `RESERVED`. No crea ventas, no registra pagos, no toca caja, no modifica precio, no libera inventario y no cambia `item.status`.

## Hallazgo real

Antes de ITEM-Z7, el endpoint `PATCH /api/reservations/{reservationId}/live-operational-status` podia persistir `OPERATIONAL_SOLD` si la reserva era LIVE y el usuario tenia permiso, pero no validaba en backend:

- que `reservation.status` siguiera `ACTIVE`;
- que la reserva no estuviera `CANCELLED`;
- que la reserva no estuviera `CONVERTED_TO_SALE`;
- que el estado operativo LIVE no estuviera `CANCELLED`;
- que el item siguiera `RESERVED`.

La UI ya tenia varios guardrails, pero el backend necesitaba la misma proteccion porque es la fuente de verdad.

## Reglas implementadas

Al marcar `OPERATIONAL_SOLD`:

- la reserva debe ser LIVE;
- el usuario debe conservar acceso operativo LIVE por el flujo existente;
- `reservation.status` debe ser `ACTIVE`;
- `reservation.status = CANCELLED` se rechaza;
- `reservation.status = CONVERTED_TO_SALE` se rechaza;
- `live_operational_status = CANCELLED` se rechaza;
- `item.status` debe ser `RESERVED`;
- si el item esta `AVAILABLE`, `SOLD`, `DISABLED` u `ON_CONSIGNMENT`, se rechaza.

## Que no significa vendido operativo

`OPERATIONAL_SOLD` no es venta financiera:

- no crea `Sale`;
- no crea `Payment`;
- no toca caja;
- no registra devolucion;
- no cambia precio;
- no convierte `ReservationStatus` a `CONVERTED_TO_SALE`;
- no cambia `item.status` a `SOLD`;
- no libera el item a `AVAILABLE`.

## Trazabilidad

El flujo conserva el patron existente de `live_events`:

- `LIVE_RESERVATION_STATUS_CHANGED`;
- `LIVE_OPERATIONAL_SOLD` cuando el nuevo estado es `OPERATIONAL_SOLD`.

Los rechazos se devuelven como errores de negocio claros. No se agrego tabla nueva ni auditoria pesada en esta fase.

## Archivos principales

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`

## Migraciones

No hubo migracion.

El campo `live_operational_status` y `live_events` ya existian.

## Pruebas agregadas/ajustadas

Se amplio `ReservationServiceLiveOperationalStatusTests` para cubrir:

- vendido operativo exitoso sobre reserva `ACTIVE` + item `RESERVED`;
- rechazo de `CANCELLED`;
- rechazo de `CONVERTED_TO_SALE`;
- rechazo si el apartado LIVE ya estaba operativamente `CANCELLED`;
- rechazo si el item no esta `RESERVED`;
- confirmacion de que no se guarda la reserva ni se registra evento cuando se rechaza;
- confirmacion de que el item se mantiene `RESERVED` en el caso exitoso.

## Riesgos pendientes

- Falta QA visual real en `/live`.
- Falta smoke API con dataset desechable controlado.
- Conversion financiera real de apartado a venta sigue fuera de alcance.
- Reversa/autorizacion de vendido operativo con pago queda para una fase sensible posterior.

## Rollback

Rollback tecnico:

1. Revertir el commit ITEM-Z7.
2. Volver a ejecutar `./mvnw.cmd test`.
3. Bloquear temporalmente la accion en UI si QA detecta riesgo operativo.

No hay rollback de base de datos porque no se crearon migraciones ni datos nuevos.

## QA requerido

En ambiente controlado:

1. Crear apartado LIVE `ACTIVE` con item `RESERVED`.
2. Marcar como vendido operativo LIVE.
3. Confirmar que queda `liveOperationalStatus = OPERATIONAL_SOLD`.
4. Confirmar que `reservation.status` sigue `ACTIVE`.
5. Confirmar que `item.status` sigue `RESERVED`.
6. Confirmar evento `LIVE_OPERATIONAL_SOLD`.
7. Intentar marcar como vendido operativo una reserva `CANCELLED`.
8. Intentar marcar como vendido operativo una reserva `CONVERTED_TO_SALE`.
9. Intentar marcar si el item ya no esta `RESERVED`.
10. Confirmar que no se crea `Sale`, `Payment` ni movimiento de caja.

## GO/NO-GO

- `GO_TECNICO`: reglas backend y pruebas pasan.
- `PENDING_QA_VISUAL`: no hubo navegador ni screenshots reales.
- No se marca `QA_PASS`.
