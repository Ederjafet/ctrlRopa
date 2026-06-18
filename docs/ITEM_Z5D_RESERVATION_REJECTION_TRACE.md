# ITEM-Z5D - Trazabilidad de reservas rechazadas

Fecha: 2026-06-09

Rama: `feature/item-z5d-reservation-rejection-trace`

## Resumen ejecutivo

ITEM-Z5D agrega trazabilidad operativa minima para intentos de reserva rechazados y limpieza programada de llaves de idempotencia expiradas. La fase mantiene intactos pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos y endpoints.

La trazabilidad queda separada de auditoria de seguridad y de `live_events` porque aplica tanto a reservas normales como a reservas LIVE.

## Estado previo

- ITEM-Z3B protege la transicion `AVAILABLE -> RESERVED` con `ItemRepository.reserveIfAvailable(...)`.
- ITEM-Z5B agrega idempotencia opcional con header `X-Idempotency-Key`.
- ITEM-Z5C agrega constraint estructural para una sola reserva `ACTIVE` por item.
- Antes de ITEM-Z5D, los rechazos no quedaban trazados en una tabla operativa especifica.
- `reservation_idempotency_keys.expires_at` existia, pero no habia limpieza automatica de llaves expiradas.

## Patron de auditoria/evento elegido

Se eligio una tabla operativa nueva:

`reservation_rejection_events`

Motivos:

- `security_audit_events` esta orientada a seguridad/autenticacion/autorizacion.
- `live_events` requiere `live_id` y no cubre reservas normales.
- Los rechazos de reserva deben sobrevivir aunque la transaccion principal falle.
- La tabla no guarda payload completo ni secretos.

## Eventos instrumentados

| Motivo | Cuándo se registra |
|---|---|
| `ITEM_NOT_AVAILABLE` | El item no esta `AVAILABLE` o `reserveIfAvailable(...)` afecta `0` filas. |
| `ACTIVE_RESERVATION_EXISTS` | Ya existe reserva activa o la base dispara `uq_reservations_active_item`. |
| `IDEMPOTENCY_PAYLOAD_MISMATCH` | Misma llave de idempotencia con payload distinto. |
| `IDEMPOTENCY_CONFLICT_OR_IN_PROGRESS` | Llave en proceso, duplicada en carrera o estado ambiguo. |
| `VALIDATION_REJECTED` | Validaciones de negocio relevantes de reserva, como LIVE no disponible, canal incompatible, falta de `liveId` o item sin precio. |

## Datos guardados

Campos principales:

- `company_id`
- `branch_id`
- `user_id`
- `item_id`
- `live_id`
- `reservation_id`
- `reason_code`
- `message`
- `idempotency_key_hash`
- `request_hash`
- `created_at`

La llave de idempotencia se guarda como SHA-256. El payload completo no se persiste; solo se conserva el hash del request relevante.

## Migracion

Se agrega:

`backend/control-ropa/src/main/resources/db/migration/V54__reservation_rejection_events.sql`

La migracion:

- crea `reservation_rejection_events` si no existe;
- agrega indices minimos por branch, item, live, user, motivo y fecha;
- no modifica `reservations`;
- no modifica `items`;
- no modifica `reservation_idempotency_keys`;
- no borra datos;
- no crea endpoints.

No se agregan foreign keys a la tabla de eventos. Es una decision intencional para evitar que un evento diagnostico falle por referencias operativas removidas o datos legacy.

## Retencion de idempotencia

ITEM-Z5D agrega limpieza programada de llaves expiradas en `reservation_idempotency_keys`.

Configuracion:

- `reservation.idempotency.cleanup.enabled=${RESERVATION_IDEMPOTENCY_CLEANUP_ENABLED:true}`
- `reservation.idempotency.cleanup-cron=${RESERVATION_IDEMPOTENCY_CLEANUP_CRON:0 30 3 * * *}`

La limpieza elimina solo llaves con `expires_at` anterior a la hora actual. No elimina registros sin `expires_at`, no borra reservas y no crea endpoint manual de purge.

## Que no se cambio

- No se tocaron pagos.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se crearon permisos.
- No se modifico RBAC.
- No se crearon endpoints.
- No se cambio venta financiera.
- No se guarda payload completo.

## Pruebas agregadas/ajustadas

- `ReservationServiceTests` valida trazabilidad para:
  - item no disponible;
  - update atomico con `0` filas;
  - reserva activa detectada por consulta;
  - constraint `uq_reservations_active_item`;
  - idempotency payload mismatch;
  - llave en progreso;
  - canal LIVE sin `liveId`.
- `ReservationIdempotencyCleanupServiceTests` valida:
  - limpieza de llaves expiradas con fecha de corte actual;
  - limpieza deshabilitada sin borrar nada.

## Riesgos pendientes

- No hay consola operativa para consultar `reservation_rejection_events`; la consulta inicial queda por SQL o herramienta tecnica.
- No se implementa retencion de eventos de rechazo; solo limpieza de llaves de idempotencia expiradas.
- QA visual/API real con usuarios operativos queda pendiente si no hay ambiente/navegador disponible.

## Rollback

Rollback tecnico:

1. Revertir cambios de `ReservationService`.
2. Revertir servicio/repositorio/entidad de eventos de rechazo.
3. Revertir limpieza de idempotencia.
4. Si la migracion ya fue aplicada, decidir con DBA si conservar `reservation_rejection_events` como tabla inerte o removerla con script controlado.

No se requiere rollback de pagos, caja, precio ni permisos porque no se tocaron.

## GO/NO-GO

GO tecnico si:

- backend tests pasan;
- frontend lint, typecheck y export pasan;
- `git diff --check` no reporta whitespace;
- no se detectan cambios fuera de reservas/idempotencia/documentacion/evidencia.

Resultado funcional:

- `GO_TECNICO` con `PENDING_QA_VISUAL` si no hay navegador/smoke API real.
