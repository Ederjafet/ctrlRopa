# ITEM-Z5C - Reporte tecnico de constraint de reserva activa por item

Fecha: 2026-06-09 19:18
Rama: `feature/item-z5c-active-reservation-constraint`
Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Resumen

Se implemento una proteccion estructural para impedir multiples reservas `ACTIVE` sobre el mismo item sin bloquear historicos `CANCELLED` o `CONVERTED_TO_SALE`.

## Historial previo validado

Commits encontrados:

- `92e937a ITEM-Z3B protege reserva atomica`
- `ce0e2b5 ITEM-Z4 distingue prenda al aire en selector live`
- `78065c3 ITEM-Z5 documenta handoff idempotencia reservas`
- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`

## Auditoria previa

Tabla real:

- `reservations`

Columnas reales relevantes:

- `item_id`
- `branch_id`
- `status`

No existe `company_id` directo en `reservations`; el scope de company se deriva por branch/item segun el modelo actual.

Estados reales de `ReservationStatus`:

- `ACTIVE`
- `CANCELLED`
- `CONVERTED_TO_SALE`

Status considerado activo:

- `ACTIVE`

Status historicos/no activos:

- `CANCELLED`
- `CONVERTED_TO_SALE`

## Implementacion realizada

Migracion:

- `backend/control-ropa/src/main/resources/db/migration/V53__active_reservation_item_constraint.sql`

Detalle:

- Agrega columna generada `active_reservation_item_id`.
- La columna toma `item_id` solo cuando `status = 'ACTIVE'`.
- Para status no activos queda `NULL`.
- Agrega unique `uq_reservations_active_item (branch_id, active_reservation_item_id)`.

Backend:

- `ReservationService.create` guarda la reserva con `saveAndFlush`.
- Si la base reporta `uq_reservations_active_item`, el servicio devuelve error de negocio:
  `El item ya tiene una reserva activa`.
- Otros errores de integridad no se enmascaran.

## Tests agregados/ajustados

Archivo:

- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`

Cobertura:

- Creacion exitosa conserva update atomico `AVAILABLE -> RESERVED`.
- Flujo sin idempotency key sigue funcionando.
- Flujo con idempotency key sigue funcionando.
- Flujo LIVE conserva `DO_LIVE_RESERVATION`.
- Violacion `uq_reservations_active_item` se traduce a conflicto de negocio.

## Validaciones ejecutadas

Backend:

- `./mvnw.cmd test` cargando `.env` local sin imprimir secretos: PASS.
- Flyway valido 53 migraciones en MySQL 5.7 local.

Frontend:

- `npm.cmd run lint`: PASS, 0 errores, 53 warnings historicos.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.

Git:

- `git --no-pager diff --check`: PASS, solo warnings LF/CRLF.
- `git --no-pager diff --cached --check`: pendiente de ejecutar despues de staging final.

## Restricciones respetadas

Confirmado:

- No se tocaron pagos.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se modifico RBAC.
- No se crearon permisos.
- No se crearon endpoints.
- No se cambio venta financiera.
- No se rompio idempotencia ITEM-Z5B.

## Riesgos pendientes

- Si un ambiente tiene duplicados `ACTIVE` legacy por `branch_id/item_id`, V53 debe fallar hasta resolverlos con decision operativa.
- No existe aun auditoria especifica de intentos rechazados.
- No existe limpieza automatica de llaves de idempotencia expiradas.
- No hubo navegador/screenshots reales.

## GO/NO-GO

Resultado tecnico: `GO_TECNICO`.

Resultado visual/API real: `PENDING_QA_VISUAL`.

Siguiente fase recomendada:

- ITEM-Z5D: trazabilidad de intentos rechazados y limpieza/retencion de idempotency keys si arquitectura lo aprueba.
