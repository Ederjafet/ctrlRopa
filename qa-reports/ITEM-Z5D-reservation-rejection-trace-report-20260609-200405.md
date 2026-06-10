# ITEM-Z5D - Reservation rejection trace report

Fecha: 2026-06-09 20:04:05

Rama: `feature/item-z5d-reservation-rejection-trace`

## Resumen

ITEM-Z5D implemento trazabilidad minima para intentos de reserva rechazados y limpieza programada de llaves de idempotencia expiradas.

Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`.

## Historial validado

Commits confirmados en historial:

- `78065c3 ITEM-Z5 documenta handoff idempotencia reservas`
- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `92e937a ITEM-Z3B protege reserva atomica`
- `ce0e2b5 ITEM-Z4 distingue prenda al aire en selector live`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -45`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z4"`

Auditoria:

- `git grep -n -E "ReservationService|ReservationController|ReservationRepository|ReservationIdempotency|reservation_idempotency_keys|X-Idempotency-Key|reserveIfAvailable|active_reservation_item_id|uq_reservations_active_item" -- ...`
- `git grep -n -E "Audit|audit|Event|event|live_events|SecurityAudit|OperationalEvent|History|bitacora|bitácora|trace|trazabilidad" -- ...`
- `git grep -n -E "Scheduled|scheduler|cron|cleanup|retention|expires_at|expired|delete.*idempotency|purge" -- ...`

Validaciones:

- `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

Nota: el primer intento de Maven fallo por no cargar password desde `.env`. El segundo intento detecto que `CONTROL_ROPA_DB_URL` estaba entre comillas simples; se repitio cargando `.env` sin imprimir secretos y quitando comillas simples/dobles. Resultado final: PASS.

## Patron elegido

Se creo una tabla operativa separada:

- `reservation_rejection_events`

No se reutilizo `security_audit_events` porque es auditoria de seguridad.
No se reutilizo `live_events` porque los rechazos aplican tambien a reservas normales sin `live_id`.

## Migracion creada

- `backend/control-ropa/src/main/resources/db/migration/V54__reservation_rejection_events.sql`

La migracion:

- crea `reservation_rejection_events`;
- agrega indices minimos;
- no agrega foreign keys para no bloquear trazabilidad por datos legacy;
- no toca `reservations`;
- no toca `items`;
- no toca pagos, caja, precio LIVE, devoluciones, autorizaciones, permisos ni RBAC.

## Implementacion realizada

Archivos backend:

- `ReservationRejectionReason.java`
- `ReservationRejectionEvent.java`
- `ReservationRejectionEventRepository.java`
- `ReservationRejectionTraceService.java`
- `ReservationIdempotencyRetentionProperties.java`
- `ReservationIdempotencyCleanupConfiguration.java`
- `ReservationIdempotencyCleanupService.java`
- `ReservationIdempotencyCleanupJob.java`
- `ReservationIdempotencyRepository.java`
- `ReservationService.java`
- `application.properties`

Documentacion:

- `docs/ITEM_Z5D_RESERVATION_REJECTION_TRACE.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

## Motivos trazados

- `ITEM_NOT_AVAILABLE`
- `ACTIVE_RESERVATION_EXISTS`
- `IDEMPOTENCY_PAYLOAD_MISMATCH`
- `IDEMPOTENCY_CONFLICT_OR_IN_PROGRESS`
- `VALIDATION_REJECTED`

## Seguridad de datos

- No se guarda payload completo.
- `X-Idempotency-Key` se registra solo como hash SHA-256.
- Se guarda `request_hash`, no el cuerpo de la solicitud.
- No se imprimen passwords ni tokens.

## Retencion / limpieza

Se implemento limpieza programada de llaves expiradas:

- `reservation.idempotency.cleanup.enabled`
- `reservation.idempotency.cleanup-cron`

La limpieza elimina solo registros con `expires_at` anterior al momento de ejecucion.

No se implemento retencion de `reservation_rejection_events`; queda como decision futura segun volumen real.

## Tests agregados / ajustados

- `ReservationServiceTests`
  - item no disponible;
  - update atomico con `0` filas;
  - reserva activa existente por consulta;
  - constraint `uq_reservations_active_item`;
  - idempotency payload mismatch;
  - llave en progreso;
  - canal LIVE sin `liveId`;
  - flujo exitoso sin evento de rechazo.
- `ReservationIdempotencyCleanupServiceTests`
  - limpia llaves vencidas;
  - limpieza deshabilitada no borra.
- `ReservationServiceLiveOperationalStatusTests`
  - actualizado por nueva dependencia de constructor.

## Validaciones

| Validacion | Resultado | Nota |
|---|---|---|
| `./mvnw.cmd test` | PASS | Ejecutado con `.env` cargado sin imprimir secretos. |
| `npm.cmd run lint` | PASS con warnings | Warnings historicos existentes; 0 errores. |
| `npx.cmd tsc --noEmit` | PASS | Sin salida de error. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS | Exportado en `C:/tmp/control-ropa-web-export`. |

## Riesgos

- La tabla nueva no tiene consola de consulta; soporte inicial requiere SQL o herramienta tecnica.
- No hay QA visual/API real ejecutada con usuarios operativos en esta fase.
- El volumen futuro de `reservation_rejection_events` podria requerir retencion propia.

## Confirmacion de no alcance

No se tocaron:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- permisos;
- RBAC;
- endpoints nuevos;
- venta financiera.

## Resultado

- `GO_TECNICO`
- `PENDING_QA_VISUAL`

Siguiente fase recomendada:

- ITEM-Z5E o QA API/visual de reserva normal y LIVE con doble submit, item ya tomado, misma idempotency key y mismatch de payload.
