# ITEM-Z6C - Smoke tecnico de cancelacion y liberacion segura de apartados

Fecha: 2026-06-09
Rama: `feature/item-z6c-reservation-release-smoke`
Estado: `GO_TECNICO_DOCUMENTAL` / `PENDING_QA_API_OR_VISUAL`

## Resumen

ITEM-Z6C valida tecnicamente el cierre de ITEM-Z6B sin implementar logica nueva. La revision confirma que Z6B ya esta en el historial de develop y que el backend conserva la cancelacion segura de reservas:

- solo reservas `ACTIVE` pueden cancelarse por flujo normal;
- `CANCELLED` se rechaza;
- `CONVERTED_TO_SALE` se rechaza;
- pago activo por `PaymentAllocation` bloquea la cancelacion normal;
- item no `RESERVED` no se fuerza a `AVAILABLE`;
- la liberacion usa `ItemRepository.releaseIfReserved(...)`;
- reserva LIVE usa el mismo comportamiento seguro;
- rechazos de cancelacion usan `VALIDATION_REJECTED`.

No se tocaron pagos funcionalmente, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints ni migraciones.

## Historial confirmado

- `7490809 ITEM-Z6B libera reservas de forma segura`
- `ced96e0 Merge branch 'feature/item-z6b-safe-reservation-release' into develop`
- `4744b9c ITEM-Z6A documenta handoff liberacion reservas`
- `3826a43 ITEM-Z5D registra rechazos de reserva`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`

## Validacion de codigo

### `ReservationService.cancel`

Confirmado:

- exige `CANCEL_RESERVATION`;
- carga la reserva por el flujo existente;
- rechaza `ReservationStatus.CANCELLED`;
- rechaza `ReservationStatus.CONVERTED_TO_SALE`;
- rechaza cualquier estado distinto de `ACTIVE`;
- calcula monto activo aplicado a la reserva;
- bloquea si hay pago `PaymentStatus.ACTIVE`;
- exige `ItemStatus.RESERVED`;
- llama `itemRepository.releaseIfReserved(...)`;
- rechaza si la liberacion condicional no afecta 1 fila;
- solo despues marca la reserva `CANCELLED`;
- si la reserva viene de LIVE, marca estado operativo `CANCELLED` y conserva eventos LIVE;
- registra rechazos con `ReservationRejectionReason.VALIDATION_REJECTED`.

### `ItemRepository.releaseIfReserved`

Confirmado:

- update condicional por `companyId`, `branchId`, `itemId` y `status`;
- cambia a `AVAILABLE` solo si el item sigue `RESERVED`;
- no fuerza `SOLD`, `DISABLED`, `ON_CONSIGNMENT` ni `AVAILABLE`.

### Migraciones

Confirmado:

- no existe migracion Z6B;
- la ultima migracion numerica es `V54__reservation_rejection_events.sql`;
- Z6B no creo endpoints ni permisos.

## Validacion de tests

Confirmado en `ReservationServiceTests`:

- `cancelActiveReservationReleasesReservedItemAtomically`;
- `cancelRejectsHistoricalReservations`;
- `cancelRejectsWhenItemIsNotReserved`;
- `cancelRejectsWhenReservedReleaseAffectsNoRows`;
- `cancelRejectsWhenReservationHasActivePaymentAllocation`;
- `cancelIgnoresVoidedPaymentAllocationAndReleasesReservedItem`;
- `cancelLiveReservationUsesSameSafeReleaseAndRecordsLiveEvents`.

Tambien se conserva `ReservationServiceLiveOperationalStatusTests` actualizado para la firma real de `ReservationService`.

## Smoke API real

Se intento un smoke no destructivo:

- `GET http://localhost:8090/api/health`
  - Resultado: `401 Unauthorized` en el proceso local disponible.
- `POST http://localhost:8090/api/auth/login` con usuario QA documentado `qa.admin@local.test`
  - Resultado: `401 Unauthorized`.

No se ejecuto `PATCH /api/reservations/{id}/cancel` porque:

- requiere una reserva de prueba desechable y conocida;
- cancelar por API muta inventario real;
- no habia evidencia de dataset seguro para ejecutar la cancelacion sin riesgo.

Resultado API: `PENDING_QA_API_OR_VISUAL`.

## Checklist API/manual pendiente

Ejecutar en ambiente QA controlado, con datos desechables:

1. Crear o identificar reserva `ACTIVE` sin pago y con item `RESERVED`.
2. Ejecutar `PATCH /api/reservations/{id}/cancel` con motivo.
3. Confirmar que la reserva queda `CANCELLED`.
4. Confirmar que el item pasa `RESERVED -> AVAILABLE`.
5. Reintentar cancelar la misma reserva y confirmar rechazo por `CANCELLED`.
6. Intentar cancelar reserva `CONVERTED_TO_SALE` y confirmar rechazo.
7. Intentar cancelar reserva con `PaymentAllocation` de `PaymentStatus.ACTIVE` y confirmar bloqueo.
8. Intentar cancelar reserva cuyo item ya no esta `RESERVED` y confirmar que no fuerza `AVAILABLE`.
9. Confirmar `reservation_rejection_events` con `VALIDATION_REJECTED` para rechazos.
10. Confirmar que reserva LIVE usa el mismo backend y conserva eventos LIVE.

## Riesgos restantes

- Falta smoke API destructivo-controlado con datos desechables.
- Falta smoke visual en `/live` y detalle de apartado.
- Flujo formal de reversa para apartados con pago activo sigue pendiente.
- Autorizacion supervisor/admin para reversas sensibles sigue pendiente.

## Recomendacion para ITEM-Z7

Preparar ITEM-Z7 como fase de QA/API controlado o handoff de reversa/autorizacion:

- crear dataset desechable de reservas para cancelar;
- cubrir casos con y sin pago;
- separar cancelacion normal de reversa financiera;
- no tocar caja ni devoluciones sin aprobacion formal.

## GO/NO-GO

- `GO_TECNICO_DOCUMENTAL`: codigo, tests y evidencia documental de Z6B estan consistentes.
- `PENDING_QA_API_OR_VISUAL`: no hubo cancelacion API real ni screenshot.
- No se marca `QA_PASS`.
