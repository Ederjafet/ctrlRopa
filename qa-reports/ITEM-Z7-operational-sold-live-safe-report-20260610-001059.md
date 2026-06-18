# ITEM-Z7 - Operational sold LIVE safe report

Fecha/hora: 2026-06-10 00:10:59
Rama: `feature/item-z7-operational-sold-live-safe`
Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -60`

Historial:

- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6C"`

Auditoria:

- `git grep -n "OPERATIONAL_SOLD|operationalSold|operational sold|vendido operativo|VENDIDO OPERATIVO|mark.*sold|soldOperational|LiveReservation|live reservation|LIVE_RESERVATION" -- ...`
- `git grep -n "ReservationService|LiveService|LiveEvent|live_events|ReservationStatus|CONVERTED_TO_SALE|CANCELLED|ACTIVE|ItemStatus.RESERVED|ItemStatus.SOLD|PaymentAllocation|PaymentStatus.ACTIVE" -- ...`
- `git grep -n "vendido operativo|operativo|cerrar venta operativa|deshacer vendido|OPERATIONAL_SOLD|SOLD|sale|Sale|payment|Payment|cash|caja" -- ...`
- lectura focal de `ReservationService.java`, `ReservationServiceLiveOperationalStatusTests.java`, `Reservation.java`, `ReservationController.java`, `services/reservationService.ts` y `app/live.tsx`.

Validacion focal:

- `.\mvnw.cmd "-Dtest=ReservationServiceLiveOperationalStatusTests" test`: PASS, 9 tests.

## Commits previos confirmados

- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `3826a43 ITEM-Z5D registra rechazos de reserva`
- `4744b9c ITEM-Z6A documenta handoff liberacion reservas`
- `7490809 ITEM-Z6B libera reservas de forma segura`
- `5c0cf22 ITEM-Z6C documenta smoke liberacion reservas`
- `1ad570e Merge branch 'feature/item-z6c-reservation-release-smoke' into develop`

## Hallazgo real

El vendido operativo LIVE ya existia como backend real:

- campo `reservations.live_operational_status`;
- enum `LiveReservationOperationalStatus.OPERATIONAL_SOLD`;
- endpoint existente `PATCH /api/reservations/{reservationId}/live-operational-status`;
- evento `LIVE_OPERATIONAL_SOLD` en `live_events`;
- UI en `/live` que llama `updateLiveReservationOperationalStatus`.

Riesgo encontrado:

- `ReservationService.updateLiveOperationalStatus` validaba que la reserva fuera LIVE y permisos, pero no validaba que `reservation.status` siguiera `ACTIVE` ni que el item siguiera `RESERVED` antes de persistir `OPERATIONAL_SOLD`.

## Implementacion realizada

Se agrego validacion defensiva solo para `nextStatus == OPERATIONAL_SOLD`:

- rechaza `ReservationStatus.CANCELLED`;
- rechaza `ReservationStatus.CONVERTED_TO_SALE`;
- rechaza cualquier estado core distinto de `ACTIVE`;
- rechaza `liveOperationalStatus = CANCELLED`;
- exige `item.status = RESERVED`;
- no toca `item.status`;
- no crea venta;
- no crea pago;
- no toca caja;
- no cambia precio;
- no libera inventario;
- no crea endpoints ni migraciones.

## Tests agregados/ajustados

En `ReservationServiceLiveOperationalStatusTests`:

- caso exitoso confirma que `OPERATIONAL_SOLD` conserva `ReservationStatus.ACTIVE` y `ItemStatus.RESERVED`;
- rechazo de `CANCELLED`;
- rechazo de `CONVERTED_TO_SALE`;
- rechazo de apartado LIVE operativamente `CANCELLED`;
- rechazo para item `AVAILABLE`, `SOLD`, `DISABLED` y `ON_CONSIGNMENT`;
- en rechazos no se llama `repository.save` ni `liveEventService.record`.

## Archivos tocados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `docs/ITEM_Z7_OPERATIONAL_SOLD_LIVE_SAFE.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `qa-reports/ITEM-Z7-operational-sold-live-safe-report-20260610-001059.md`
- `git-diffs/20260610-ITEM-Z7-operational-sold-live-safe.diff`
- `git-diffs/20260610-ITEM-Z7-operational-sold-live-safe-stat.txt`

## Validaciones completas

- `.\mvnw.cmd "-Dtest=ReservationServiceLiveOperationalStatusTests" test`: PASS, 9 tests.
- `.\mvnw.cmd test`: PASS. Se cargo `.env` en el proceso sin imprimir secretos; hubo warning local de Logback por acceso al archivo de log, no bloqueante.
- `npm.cmd run lint`: PASS con 0 errores y 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS despues de normalizar espacios finales en la evidencia generada.
- `git status`: PASS antes de commit; solo cambios ITEM-Z7 en staging.

## Confirmacion de restricciones

- No se tocaron pagos funcionalmente.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se tocaron permisos/RBAC.
- No se crearon endpoints.
- No se crearon migraciones.
- No se cambio venta financiera.

## Riesgos y QA pendiente

- Falta smoke API real con una reserva LIVE desechable.
- Falta QA visual real en `/live`.
- Conversion financiera real y reversas con pago siguen fuera de alcance.

## GO/NO-GO

- `GO_TECNICO` si pasa la suite completa.
- `PENDING_QA_VISUAL` porque no hubo navegador/screenshots reales.
- No se marca `QA_PASS`.
