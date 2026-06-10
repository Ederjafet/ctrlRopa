# ITEM-Z6A - Reporte handoff cancelacion/liberacion segura de reservas

Fecha: 2026-06-09 21:07:37
Rama: `feature/item-z6a-reservation-release-handoff`
Tipo: auditoria documental, sin implementacion funcional.

## Resumen

Se audito el flujo real de cancelacion de reservas, liberacion de item, pagos aplicados, conversion a venta, eventos LIVE, idempotencia y constraint de reserva activa. No se tocaron backend funcional, inventario real, pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints ni migraciones.

Resultado esperado de fase:

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z6B`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -45`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z4"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`

Auditoria:

- `git grep -n -E "ReservationService|ReservationController|ReservationRepository|ReservationStatus|cancel|cancelar|release|liberar|CONVERTED_TO_SALE|CANCELLED|ACTIVE|setStatus|ItemStatus.RESERVED|ItemStatus.AVAILABLE" -- ...`
- `git grep -n -E "payment|Payment|pago|saldo|balance|amountPaid|paid|sale|Sale|venta|cash|caja|refund|devolucion" -- ...`
- `git grep -n -E "reservation_rejection_events|reservation_idempotency_keys|active_reservation_item_id|uq_reservations_active_item|live_events|audit|trace|trazabilidad" -- ...`
- `git grep -n -E "cancel\\(|cancelReservation|CONVERTED_TO_SALE|ItemStatus\\.AVAILABLE|PaymentAllocation|findByReservationIdOrderByCreatedAtAsc|LIVE_RESERVATION_CANCELLED|ReservationServiceTests" -- ...`
- `git grep -n -E "CREATE TABLE.*reservations|reservations \\(|status.*Reservation|live_operational_status|cancelled_at|payment_allocations|CREATE TABLE.*payment_allocations|reservation_id" -- backend/control-ropa/src/main/resources/db/migration`
- `git grep -n -E "releaseIfReserved|AVAILABLE -> RESERVED|RESERVED -> AVAILABLE|cancelacion|liberacion" -- ...`

Lecturas directas:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/LiveReservationOperationalStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/Payment.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentAllocation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentAllocationRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/sale/SaleService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/sale/Sale.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/sale/SaleStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/resources/db/migration/V53__active_reservation_item_constraint.sql`
- `backend/control-ropa/src/main/resources/db/migration/V54__reservation_rejection_events.sql`
- `services/reservationService.ts`
- `app/live.tsx`
- `docs/ITEM_Z5B_RESERVATION_IDEMPOTENCY.md`
- `docs/ITEM_Z5C_ACTIVE_RESERVATION_CONSTRAINT.md`
- `docs/ITEM_Z5D_RESERVATION_REJECTION_TRACE.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

## Historial validado

Commits esperados encontrados:

- `92e937a ITEM-Z3B protege reserva atomica`
- `ce0e2b5 ITEM-Z4 distingue prenda al aire en selector live`
- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `3826a43 ITEM-Z5D registra rechazos de reserva`

## Hallazgos

1. `ReservationService.create(...)` conserva update atomico `AVAILABLE -> RESERVED`.
2. `ReservationService.cancel(...)` cancela reserva `ACTIVE` y libera item con `item.setStatus(ItemStatus.AVAILABLE)`.
3. La cancelacion actual no consulta pagos activos aplicados a `reservationId`.
4. Pagos de reserva existen via `PaymentAllocation.reservationId`.
5. `PaymentStatus` real contiene `ACTIVE` y `VOIDED`.
6. `SaleService.create(...)` migra pagos de reserva a venta y marca reserva `CONVERTED_TO_SALE`.
7. `ReservationStatus` real contiene `ACTIVE`, `CANCELLED` y `CONVERTED_TO_SALE`.
8. El constraint de ITEM-Z5C bloquea solo reservas `ACTIVE` por item.
9. `live_events` registra cambios operativos de reservas LIVE.
10. `reservation_rejection_events` cubre rechazos de creacion, no liberaciones/cancelaciones.
11. `app/live.tsx` tiene guarda UX para bloquear acciones sensibles si no puede confirmar pagos o detecta pago registrado.
12. No se encontro prueba directa de `ReservationService.cancel(...)` en la auditoria de tests.

## Riesgos

- Liberar item con pago activo.
- Liberar item convertido a venta.
- Dejar item `RESERVED` sin reserva `ACTIVE`.
- Dejar reserva `ACTIVE` con item `AVAILABLE`.
- Cancelar dos veces sin trazabilidad especifica.
- Confundir cancelacion operativa LIVE con cancelacion real de reserva.
- Perder trazabilidad de liberacion.
- Romper `uq_reservations_active_item` si la reserva pasa a historico antes de liberar correctamente.

## Recomendacion tecnica

ITEM-Z6B debe endurecer `ReservationService.cancel(...)` como MVP:

- permitir solo reserva `ACTIVE`;
- bloquear si hay pagos `ACTIVE` aplicados a la reserva;
- bloquear reserva `CONVERTED_TO_SALE`;
- liberar item con update condicional `RESERVED -> AVAILABLE`;
- registrar evento/traza de cancelacion o bloqueo;
- refrescar pedido si aplica;
- conservar endpoint actual salvo que negocio apruebe endpoint separado;
- no tocar pagos, caja, precio, devoluciones, autorizaciones, permisos ni RBAC.

## No implementacion

Confirmado:

- No se modifico backend funcional.
- No se modifico frontend funcional.
- No se modifico inventario real.
- No se tocaron pagos.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se crearon migraciones.
- No se crearon endpoints.
- No se modifico RBAC.
- No se crearon permisos.

## Validaciones

Ejecutadas:

| Comando | Resultado | Nota |
|---|---|---|
| `npm.cmd run lint` | PASS | 0 errores; 53 warnings preexistentes del proyecto. |
| `npx.cmd tsc --noEmit` | PASS | Sin errores TypeScript. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS | Export web completado. |
| `git --no-pager diff --check` | PASS | Sin errores de whitespace. |
| `git --no-pager diff --cached --check` | PASS | Sin errores en staged diff al momento de la revision. |
| `git status` | PASS | Solo archivos documentales/evidencia antes de staging final. |

No se ejecuta Maven porque no se toca backend.

## GO/NO-GO para ITEM-Z6B

GO para preparar ITEM-Z6B si se aprueba:

- bloquear cancelaciones con pago activo;
- agregar update atomico `RESERVED -> AVAILABLE`;
- agregar tests backend de cancelacion segura;
- no mezclar pagos/caja/reversas.

NO-GO si Z6B intenta:

- anular pagos;
- tocar caja;
- convertir venta;
- implementar autorizacion formal sin aprobacion;
- liberar inventario sin validar pago activo.

## Estado final esperado

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z6B`
