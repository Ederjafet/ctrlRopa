# ITEM-Z6B - Cancelacion y liberacion segura de apartados

Fecha: 2026-06-09
Rama: `feature/item-z6b-safe-reservation-release`
Estado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Resumen ejecutivo

ITEM-Z6B corrige la cancelacion normal de reservas para que solo una reserva `ACTIVE` sin pago activo pueda cancelarse y liberar inventario. La prenda se libera con una transicion condicional `RESERVED -> AVAILABLE`; si la prenda ya no esta reservada, la operacion se rechaza y no fuerza disponibilidad.

No se implementaron pagos, caja, devoluciones, precio LIVE, autorizaciones, permisos, RBAC, endpoints ni migraciones.

## Estado previo

Antes de esta fase:

- `ReservationService.create` ya protegia `AVAILABLE -> RESERVED` con update atomico.
- `X-Idempotency-Key` ya evitaba doble submit exacto de creacion.
- `reservations` ya tenia proteccion estructural para una sola reserva `ACTIVE` por item.
- `reservation_rejection_events` ya registraba rechazos operativos de creacion/validacion.
- `ReservationService.cancel` cambiaba la reserva a `CANCELLED` y liberaba la prenda con `item.setStatus(AVAILABLE)`.
- No habia validacion backend de pago activo antes de cancelar.
- La liberacion no era condicional sobre `ItemStatus.RESERVED`.

## Reglas implementadas

- Solo `ReservationStatus.ACTIVE` puede cancelarse por este flujo normal.
- `ReservationStatus.CANCELLED` se rechaza con mensaje claro.
- `ReservationStatus.CONVERTED_TO_SALE` se rechaza con mensaje claro.
- Si existen allocations de pago activo para la reserva, la cancelacion normal se rechaza.
- Payments `VOIDED` no bloquean la cancelacion normal.
- La prenda debe estar en `ItemStatus.RESERVED`.
- La liberacion usa `ItemRepository.releaseIfReserved(...)`.
- Si el update condicional no afecta exactamente 1 fila, no se cancela la reserva.
- La cancelacion LIVE conserva los eventos operativos existentes.
- Los rechazos se registran con `ReservationRejectionReason.VALIDATION_REJECTED` cuando aplica.

## Validacion financiera encontrada

Se encontro una relacion clara entre reserva y pago mediante:

- `PaymentAllocation.reservationId`
- `PaymentAllocation.paymentId`
- `Payment.status`

La regla aplicada es conservadora: cualquier monto asignado a la reserva desde un pago `ACTIVE` bloquea la cancelacion normal.

Pendiente fuera de esta fase:

- flujo formal de reversa/devolucion;
- efecto contable/caja;
- autorizacion de supervisor/admin;
- manejo operativo de saldos no modelados como `PaymentAllocation` activa.

## Liberacion de inventario

La liberacion de inventario ocurre solo si:

1. la reserva esta `ACTIVE`;
2. no tiene pago activo detectable;
3. el item asociado esta `RESERVED`;
4. el update condicional `RESERVED -> AVAILABLE` afecta 1 fila.

No se liberan prendas `AVAILABLE`, `SOLD`, `DISABLED` ni `ON_CONSIGNMENT`.

## Archivos principales

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`

## Pruebas agregadas o ajustadas

Se agregaron pruebas para:

- cancelar reserva `ACTIVE` y liberar item `RESERVED -> AVAILABLE`;
- rechazar reserva `CANCELLED`;
- rechazar reserva `CONVERTED_TO_SALE`;
- rechazar si el item no esta `RESERVED`;
- rechazar si `releaseIfReserved` afecta 0 filas;
- bloquear cancelacion con pago `ACTIVE`;
- permitir cancelacion con allocation de pago `VOIDED`;
- validar que una reserva LIVE usa la misma liberacion segura y conserva eventos LIVE.

## Validaciones

Ejecutadas:

- `.\mvnw.cmd test`
  - Resultado: `BUILD SUCCESS`, 106 tests, 0 failures, 0 errors.
  - Nota: se cargo `.env` al proceso de Maven sin imprimir secretos y se limpiaron comillas externas del JDBC URL.
- `.\mvnw.cmd "-Dtest=ReservationServiceTests,ReservationServiceLiveOperationalStatusTests" test`
  - Resultado: `BUILD SUCCESS`, 28 tests, 0 failures, 0 errors.
- `npm.cmd run lint`
  - Resultado: PASS, 0 errores, 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`
  - Resultado: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
  - Resultado: PASS.
- `git --no-pager diff --check`
  - Resultado: PASS.
- `git --no-pager diff --cached --check`
  - Resultado: PASS.

## Rollback

Rollback tecnico:

1. Revertir el commit de ITEM-Z6B.
2. Validar que `ReservationService.cancel` vuelva al comportamiento anterior.
3. Repetir pruebas de reservas.

No hay migracion que revertir.

## Riesgos pendientes

- QA API/visual real de cancelacion con usuarios operativos.
- Definir flujo sensible para reservas con pago activo.
- Definir autorizacion de supervisor/admin para liberar apartados con pago.
- Confirmar en ambiente integrado que los mensajes backend se presentan claramente en UI.

## GO/NO-GO

Resultado tecnico de la fase: `GO_TECNICO`.

Condicion:

- Queda `PENDING_QA_VISUAL` porque no hubo navegador real ni screenshots.
