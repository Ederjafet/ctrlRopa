# ITEM-Z6C - Reservation release smoke report

Fecha/hora: 2026-06-09 23:05:54
Rama: `feature/item-z6c-reservation-release-smoke`
Resultado: `GO_TECNICO_DOCUMENTAL` / `PENDING_QA_API_OR_VISUAL`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -50`

Historial:

- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`

Auditoria:

- `git grep -n -E "ReservationService|cancel|releaseIfReserved|PaymentAllocation|PaymentStatus.ACTIVE|CONVERTED_TO_SALE|CANCELLED|ACTIVE|ItemStatus.RESERVED|ItemStatus.AVAILABLE|VALIDATION_REJECTED" -- backend/control-ropa/src/main/java backend/control-ropa/src/test docs qa-reports`
- `git grep -n -E "ITEM-Z6B|safe-reservation-release|libera reservas|cancelacion|liberacion|liberacion" -- docs qa-reports git-diffs backend/control-ropa/src/test`
- lectura por rangos de `ReservationService.java`, `ItemRepository.java`, `ReservationController.java`, `ReservationServiceTests.java`.

Smoke API no destructivo:

- `GET http://localhost:8090/api/health`
- `POST http://localhost:8090/api/auth/login` con usuario QA documentado, sin imprimir password ni token.

## Commits confirmados

- `7490809 ITEM-Z6B libera reservas de forma segura`
- `ced96e0 Merge branch 'feature/item-z6b-safe-reservation-release' into develop`
- `4744b9c ITEM-Z6A documenta handoff liberacion reservas`
- `3826a43 ITEM-Z5D registra rechazos de reserva`
- `ef8d255 ITEM-Z5C protege reserva activa por item`
- `6f1ee15 ITEM-Z5B agrega idempotencia de reservas`

## Archivos revisados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `docs/ITEM_Z6B_SAFE_RESERVATION_RELEASE.md`
- `qa-reports/ITEM-Z6B-safe-reservation-release-report-20260609-215428.md`

## Resultado tecnico

Confirmado:

- `ReservationService.cancel` valida `ACTIVE`.
- `CANCELLED` se rechaza.
- `CONVERTED_TO_SALE` se rechaza.
- `PaymentAllocation` ligado a `PaymentStatus.ACTIVE` bloquea cancelacion normal.
- `ItemRepository.releaseIfReserved` existe.
- El update condicional no fuerza `AVAILABLE` si el item no esta `RESERVED`.
- Se registra rechazo con `VALIDATION_REJECTED`.
- Reserva LIVE usa el mismo comportamiento seguro y conserva eventos.
- No hay migracion Z6B.
- No hay endpoints nuevos en Z6B.

## Tests confirmados

Se confirmo existencia de pruebas para:

- cancelacion `ACTIVE` libera `RESERVED -> AVAILABLE`;
- `CANCELLED` y `CONVERTED_TO_SALE` se rechazan;
- item no `RESERVED` no se libera;
- liberacion condicional con 0 filas se rechaza;
- pago `ACTIVE` bloquea cancelacion normal;
- pago `VOIDED` no bloquea;
- reserva LIVE usa la misma liberacion segura.

## Smoke API

No se ejecuto cancelacion API real.

Resultado no destructivo:

- `/api/health`: `401 Unauthorized`.
- `POST /api/auth/login` con `qa.admin@local.test`: `401 Unauthorized`.

Motivo para no ejecutar cancelacion real:

- no habia una reserva desechable identificada;
- `PATCH /api/reservations/{id}/cancel` muta inventario;
- ejecutar sobre datos existentes podria liberar una prenda real.

Estado: `PENDING_QA_API_OR_VISUAL`.

## Validaciones ejecutadas

- `.\mvnw.cmd test`: PASS. Se cargo `.env` en el proceso sin imprimir secretos; hubo warnings de Logback por acceso al archivo de log local, no bloqueantes.
- `npm.cmd run lint`: PASS con 0 errores y 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: PASS antes de commit; solo artefactos Z6C en staging.

## Confirmacion de no implementacion

- No se modifico backend funcional.
- No se tocaron pagos funcionalmente.
- No se toco caja.
- No se toco precio LIVE.
- No se tocaron devoluciones.
- No se tocaron autorizaciones.
- No se tocaron permisos/RBAC.
- No se crearon endpoints.
- No se crearon migraciones.

## GO/NO-GO

- `GO_TECNICO_DOCUMENTAL`.
- `PENDING_QA_API_OR_VISUAL`.
- No se marca `QA_PASS`.
