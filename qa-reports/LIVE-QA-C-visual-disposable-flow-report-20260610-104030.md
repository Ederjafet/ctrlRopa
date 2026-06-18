# LIVE-QA-C - Reporte QA live con dataset desechable

Fecha: 2026-06-10 10:40:30 -06:00
Rama: `feature/live-qa-c-visual-disposable-flow`
Resultado: `NO_GO`

## Resumen

LIVE-QA-C creo un dataset desechable real con prefijo `QA_LIVE_DISPOSABLE_20260610104008` y ejecuto smoke API mutante sobre flujo LIVE base. Varias reglas criticas pasaron: active item no cambia status del item, idempotencia funciona, doble reserva se rechaza, cancelacion libera item, `OPERATIONAL_SOLD` no crea pagos ni ventas y genera evento LIVE.

La fase queda en `NO_GO` porque el usuario vendedor pudo retirar la prenda al aire por API aunque no tiene `REMOVE_LIVE_ACTIVE_ITEM`.

No se aplicaron fixes y no se marca `QA_PASS`.

## Comandos ejecutados

Preflight:

- `git branch --show-current`
- `git status`
- `git log --oneline -100`

Historial:

- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-B"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`

Auditoria:

- `git grep -n "qa.admin@local.test\|qa.supervisor.centro\|qa.vendedor.centro\|qa.sinpermisos" -- docs backend app services qa-reports ...`
- `git grep -n "QA_LIVE_DISPOSABLE\|disposable\|desechable\|seed\|demo\|QA_CTR\|local.test" -- docs backend app services qa-reports backend/control-ropa/src/main/resources ...`
- `git grep -n "create.*item\|ItemController\|LiveController\|ReservationController\|setActiveItem\|updateLiveOperationalStatus\|X-Idempotency-Key" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services docs ...`
- `git grep -n "VIEW_LIVE\|OPERATE_LIVE\|PREPARE_LIVE_ITEM\|CHANGE_LIVE_ACTIVE_ITEM\|REMOVE_LIVE_ACTIVE_ITEM\|DO_LIVE_RESERVATION" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources app services docs qa-reports ...`

Ambiente/API:

- `GET /api/health`
- `GET /api/me` sin token
- `GET http://localhost:8081`
- `GET http://192.168.0.128:8081`
- login/logout por rol sin imprimir secretos
- `GET /api/catalogs/bootstrap?branchId=4`
- `GET /api/items/branch/4`
- `GET /api/customers/branch/4`
- `GET /api/lives/branch/4`
- mutaciones controladas sobre dataset `QA_LIVE_DISPOSABLE_20260610104008`

## Backend/frontend detectados

| Check | Resultado |
|---|---|
| Backend health | `200` |
| `/api/me` sin token | `401` |
| Frontend localhost | `200` |
| Frontend LAN | `200` |

## Usuarios QA usados

| Usuario | Resultado |
|---|---|
| `qa.admin@local.test` | login OK, `/api/me` OK |
| `qa.supervisor.centro@local.test` | login OK, `/api/me` OK |
| `qa.vendedor.centro@local.test` | login OK, `/api/me` OK |
| `qa.sinpermisos@local.test` | `403` esperado |

## Dataset encontrado o creado

No existian datos `QA_LIVE_DISPOSABLE` antes de la corrida.

Creado:

- cliente `32`;
- item A `105`;
- item B `106`;
- LIVE `15`;
- reserva A `44`;
- reserva B `45`.

Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`.

## API smoke real

| Caso | Resultado |
|---|---|
| Poner item A al aire | PASS |
| Item A conserva `AVAILABLE` al ponerse al aire | PASS |
| Vendedor intenta retirar item al aire | FAIL, respondio `200` |
| Reserva con idempotency key | PASS |
| Reintento misma key/mismo payload | PASS, misma reserva |
| Reintento misma key/payload distinto | PASS, `409` |
| Reservar item ya tomado | PASS, `400` |
| Cancelar reserva activa sin pago | PASS |
| Item A vuelve a `AVAILABLE` tras cancelar | PASS |
| `OPERATIONAL_SOLD` sobre reserva LIVE valida | PASS |
| Item B queda `RESERVED` tras `OPERATIONAL_SOLD` | PASS |
| Evento `LIVE_OPERATIONAL_SOLD` | PASS |
| Pagos para reserva B | PASS, 0 |
| Ventas para items desechables | PASS, 0 |
| Usuario sin permisos | PASS, `403` |

## Visual smoke real

Pendiente.

No hubo screenshots porque Browser Use no expuso `node_repl/js` y el repo no incluye Playwright/Puppeteer ni scripts e2e.

Resultado visual: `PENDING_QA_VISUAL`.

## Screenshots/evidencia

No existen screenshots.

Evidencia API:

- `DATASET_IDS liveId=15 customerId=32 itemA=105 itemB=106 reservationA=44 reservationB=45`
- `SELLER_REMOVE_ACTIVE_ITEM status=200 UNEXPECTED`
- `OPERATIONAL_SOLD ... itemStatusAfter=RESERVED opSoldEvents=1 paymentsForReservation=0 salesForDisposableItems=0`

## Mutaciones ejecutadas

Todas las mutaciones se limitaron al prefijo `QA_LIVE_DISPOSABLE_20260610104008`.

No se borraron datos existentes. No se hizo cleanup automatico.

## Fixes

No se aplicaron fixes.

Motivo: el hallazgo principal esta en autorizacion efectiva de backend/permisos para retirar prenda al aire; corregirlo implicaria tocar backend funcional/RBAC/permisos, fuera del alcance permitido.

## Validaciones tecnicas

- `./mvnw.cmd test`: `PASS` cargando `.env` en memoria sin imprimir secretos y quitando comillas envolventes de valores. Logback reporto acceso denegado al archivo externo `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`, pero el comando termino con exit code `0`.
- `npm.cmd run lint`: `PASS` con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: `PASS`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: `PASS`.
- `git --no-pager diff --check`: `PASS`.
- `git --no-pager diff --cached --check`: `PASS`.
- `git status`: limpio despues del commit esperado.

## Resultado

`NO_GO`

Motivo: vendedor sin `REMOVE_LIVE_ACTIVE_ITEM` pudo retirar la prenda al aire por API.

No se marca `QA_PASS`.
