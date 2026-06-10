# LIVE-PRICE-D price QA report

Fecha: 2026-06-10 17:13:07
Rama: `feature/live-price-d-price-qa`

## Resumen ejecutivo

Se ejecuto QA API real del flujo de cambio de precio LIVE con autorizacion operativa sobre dataset desechable. El flujo paso: seller solicito, seller no pudo aprobar, admin aprobo, admin aplico, el segundo apply quedo bloqueado y solo cambio `reservations.price`.

Resultado:

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`

No se marca `QA_PASS` porque no hubo evidencia visual.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -120`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PRICE-C"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"`
- `git --no-pager log --oneline --all --decorate --grep="MOBILE-LAN-A"`
- `git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"`
- auditorias `git grep` de permisos, precio, autorizaciones y dataset desechable
- `GET http://localhost:8090/api/health`
- `GET http://localhost:8090/api/me` sin token
- `GET http://localhost:8081`
- `GET http://192.168.0.128:8081`
- login QA admin/supervisor/vendedor sin imprimir password ni tokens
- `GET /api/me` por rol
- `GET /api/reservations/branch/4`
- `GET /api/reservations/45`
- `GET /api/items/106`
- `GET /api/payments/reservation/45`
- `GET /api/sales/branch/4`
- `GET /api/cash-closures/branch/4`
- `POST /api/operational-authorizations`
- `PATCH /api/operational-authorizations/2/approve`
- `POST /api/operational-authorizations/2/apply`
- `GET /api/lives/15/events`

## Commits confirmados

- `658c35f LIVE-PRICE-C implementa autorizacion precio live`
- `6e4bc2e MOBILE-LAN-A documenta diagnostico Expo Go`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`

## Ambiente detectado

- Backend health: `200`
- `/api/me` sin token: `401`
- Frontend local: `200`
- Frontend LAN: `200`

## Usuarios QA usados

| Usuario | Login | Branch | Rol | Resultado permisos |
| --- | --- | ---: | --- | --- |
| `qa.admin@local.test` | OK | `4` | `ADMIN` | Solicita/aprueba/aplica/ver precio LIVE |
| `qa.supervisor.centro@local.test` | OK | `4` | `SUPERVISOR` | Solicita/aprueba/aplica/ver precio LIVE |
| `qa.vendedor.centro@local.test` | OK | `4` | `SELLER` | Solicita; no aprueba ni aplica |

## Dataset usado

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE: `15`
- Reserva: `45`
- Item: `106`
- Item code: `QA_LIVE_DISPOSABLE_20260610104008-ITEM-B`

La reserva estaba `ACTIVE`, `RESERVED`, sin pagos por `GET /api/payments/reservation/45 => []`.

## Smoke API mutante

| Paso | Resultado |
| --- | --- |
| Seller crea solicitud `LIVE_PRICE_CHANGE` | `REQUESTED`, authorization id `2` |
| Seller intenta aprobar | `403`, esperado |
| Admin aprueba | `APPROVED` |
| Admin aplica | `APPLIED` |
| Admin reintenta aplicar | `400`, esperado |

## Verificacion antes/despues

| Control | Antes | Despues | Resultado |
| --- | ---: | ---: | --- |
| `reservations.price` reserva `45` | `102.00` | `111.23` | PASS |
| `items.price` item `106` | `102.00` | `102.00` | PASS |
| ventas asociadas | `0` | `0` | PASS |
| pagos asociados | `0` | `0` | PASS |
| cierres de caja en sucursal | `1` | `1` | PASS |
| evento `LIVE_PRICE_CHANGE_APPLIED` | - | `1` | PASS |

## Confirmacion de no alcance

- No se tocaron pagos funcionalmente.
- No se toco caja.
- No se tocaron devoluciones.
- No se cambio venta financiera.
- No se crearon permisos.
- No se modifico RBAC.
- No se crearon endpoints.
- No se crearon migraciones.
- No se implemento logica nueva.

## Validaciones tecnicas

- `./mvnw.cmd test`: PASS, 122 tests; Flyway valido 57 migraciones.
- `npm.cmd run lint`: PASS sin errores; 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: pendiente de cierre posterior a staging.

## Resultado

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`
