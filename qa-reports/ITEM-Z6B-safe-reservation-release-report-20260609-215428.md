# ITEM-Z6B - Safe reservation release report

Fecha/hora: 2026-06-09 21:54:28
Rama: `feature/item-z6b-safe-reservation-release`
Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -50`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6A"`

Auditoria:

- `git grep -n -E "ReservationService|ReservationController|ReservationRepository|ReservationStatus|cancel|cancelar|release|liberar|CONVERTED_TO_SALE|CANCELLED|ACTIVE|setStatus|ItemStatus.RESERVED|ItemStatus.AVAILABLE" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs qa-reports`
- `git grep -n -E "payment|Payment|pago|saldo|balance|amountPaid|paid|sale|Sale|venta|cash|caja|refund|devolucion" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs qa-reports`
- `git grep -n -E "reservation_rejection_events|ReservationRejection|reservation_idempotency_keys|active_reservation_item_id|uq_reservations_active_item|trace|trazabilidad" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources backend/control-ropa/src/test docs qa-reports`

Backend:

- `.\mvnw.cmd test`
- `.\mvnw.cmd test` cargando `.env` al proceso sin imprimir secretos y limpiando comillas externas de valores.
- `.\mvnw.cmd "-Dtest=ReservationServiceTests,ReservationServiceLiveOperationalStatusTests" test`

## Historial previo validado

- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `3826a43 ITEM-Z5D registra rechazos de reserva`
- `4744b9c ITEM-Z6A documenta handoff liberacion reservas`

## Hallazgos

- `ReservationService.cancel` ya existia y liberaba el item a `AVAILABLE`.
- La cancelacion normal solo validaba que la reserva no fuera distinta de `ACTIVE`.
- No bloqueaba pagos activos ligados por `PaymentAllocation`.
- No usaba update condicional `RESERVED -> AVAILABLE`.
- `PaymentAllocationRepository.findByReservationIdOrderByCreatedAtAsc` permite detectar pagos ligados a la reserva.
- `PaymentStatus.ACTIVE` y `PaymentStatus.VOIDED` permiten diferenciar pagos que bloquean y pagos anulados.
- `ReservationRejectionTraceService` permite registrar rechazos operativos con motivo `VALIDATION_REJECTED`.

## Implementacion realizada

- Se agrego `ItemRepository.releaseIfReserved(...)` con update condicional por company, branch, item y status `RESERVED`.
- `ReservationService.cancel` ahora:
  - rechaza `CANCELLED`;
  - rechaza `CONVERTED_TO_SALE`;
  - rechaza cualquier status distinto de `ACTIVE`;
  - bloquea cancelacion con pago activo asignado a la reserva;
  - exige que el item este `RESERVED`;
  - libera con `releaseIfReserved`;
  - rechaza si el update condicional afecta 0 filas;
  - conserva eventos LIVE existentes;
  - registra rechazos operativos cuando aplica.

## Migracion

No se creo migracion.

## Archivos tocados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- `docs/ITEM_Z6B_SAFE_RESERVATION_RELEASE.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `qa-reports/ITEM-Z6B-safe-reservation-release-report-20260609-215428.md`
- `git-diffs/20260609-ITEM-Z6B-safe-reservation-release.diff`
- `git-diffs/20260609-ITEM-Z6B-safe-reservation-release-stat.txt`

## Tests agregados o ajustados

- `cancelActiveReservationReleasesReservedItemAtomically`
- `cancelRejectsHistoricalReservations`
- `cancelRejectsWhenItemIsNotReserved`
- `cancelRejectsWhenReservedReleaseAffectsNoRows`
- `cancelRejectsWhenReservationHasActivePaymentAllocation`
- `cancelIgnoresVoidedPaymentAllocationAndReleasesReservedItem`
- `cancelLiveReservationUsesSameSafeReleaseAndRecordsLiveEvents`

## Validaciones ejecutadas

- `.\mvnw.cmd "-Dtest=ReservationServiceTests,ReservationServiceLiveOperationalStatusTests" test`
  - PASS: `BUILD SUCCESS`, 28 tests, 0 failures, 0 errors.
- `.\mvnw.cmd test`
  - Primer intento sin `.env`: FAIL por ambiente, `Access denied for user 'root'@'localhost' (using password: NO)`.
  - Reintento cargando `.env` y limpiando comillas externas: PASS, `BUILD SUCCESS`, 106 tests, 0 failures, 0 errors.
  - Warning no bloqueante: Logback no pudo abrir `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log` por acceso denegado.
- `npm.cmd run lint`
  - PASS: 0 errores, 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`
  - PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
  - PASS. Export generado en `C:/tmp/control-ropa-web-export`.
- `git --no-pager diff --check`
  - PASS.
- `git --no-pager diff --cached --check`
  - PASS.
- `git status`
  - Revisado antes y despues de staging.

## Restricciones confirmadas

- No se tocaron pagos funcionalmente.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se tocaron RBAC ni permisos.
- No se crearon endpoints.
- No se crearon migraciones.
- No se cambio venta financiera.

## Riesgos

- La suite Maven completa requiere MySQL local configurado y variables cargadas; se resolvio cargando `.env` al proceso sin imprimir secretos.
- La cancelacion de reservas con pago activo queda bloqueada, pero la reversa formal de pago/caja sigue pendiente.
- No hay evidencia visual real de UI.

## GO/NO-GO

- `GO_TECNICO`: backend completo, frontend y checks Git pasan.
- `PENDING_QA_VISUAL`: no hubo navegador real ni screenshots.
- No se marca QA_PASS visual/funcional hasta ejecutar smoke API/visual en ambiente QA.
