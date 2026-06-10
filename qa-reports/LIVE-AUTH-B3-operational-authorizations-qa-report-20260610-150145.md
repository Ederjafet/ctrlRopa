# LIVE-AUTH-B3 operational authorizations QA report

Fecha: 2026-06-10 15:01:45
Rama: `feature/live-auth-b3-operational-auth-qa`

## Resultado ejecutivo

Se ejecuto smoke API real de autorizaciones operativas LIVE con mutacion controlada sobre dataset desechable.

Resultado:

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`

No se marca `QA_PASS` porque no hubo evidencia visual real con navegador/screenshots.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -120`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B1A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B0"`
- `git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C2"`
- auditorias `git grep` de autorizaciones operativas, UI, migraciones y dataset desechable
- `GET /api/health`
- `GET /api/me`
- logins QA sin imprimir password ni tokens
- smoke API de lectura y mutacion controlada

## Commits confirmados

- `385c1b9 LIVE-AUTH-B2 agrega UI autorizaciones operativas`
- `a1777c7 LIVE-AUTH-B1A corrige migracion autorizaciones live`
- `290369c LIVE-AUTH-B1 implementa autorizaciones operativas`
- `ed69ecf LIVE-AUTH-B0 documenta autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`

## Backend / frontend

| Componente | URL | Resultado |
|---|---|---|
| Backend health | `http://localhost:8090/api/health` | `200` |
| Backend sin token | `http://localhost:8090/api/me` | `401` |
| Frontend local | `http://localhost:8081` | `200` |
| Frontend LAN | `http://192.168.0.128:8081` | `200` |

## Usuarios QA usados

| Usuario | Resultado | Branch | Roles | Permisos relevantes |
|---|---|---:|---|---|
| `qa.admin@local.test` | `200` | `4` | `ADMIN` | `REQUEST`, `VIEW`, `APPROVE`, `APPLY`, permisos finos |
| `qa.supervisor.centro@local.test` | `200` | `4` | `SUPERVISOR` | `REQUEST`, `VIEW`, `APPROVE`, `APPLY`, permisos finos |
| `qa.vendedor.centro@local.test` | `200` | `4` | `SELLER` | `REQUEST_LIVE_OPERATION_AUTHORIZATION`, `UNDO_LIVE_OPERATIONAL_SALE` |
| `qa.sinpermisos@local.test` | `403` | N/A | N/A | N/A |

## Smoke API no destructivo

| Caso | Resultado |
|---|---|
| Admin lista autorizaciones branch `4` | `200` |
| Admin lista pendientes branch `4` | `200` |
| Supervisor lista pendientes branch `4` | `200` |
| Seller lista solicitudes propias branch `4` | `200` |
| Usuario sin permisos | login bloqueado `403`; sin token operativo |
| Seller intenta aprobar id inexistente | `403` |

## Smoke API mutante

Dataset desechable:

- `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE `15`
- Reserva `45`

Mutaciones ejecutadas:

| Paso | Resultado |
|---|---|
| Seller crea solicitud `UNDO_LIVE_OPERATIONAL_SALE` para reserva `45` | `200`, authorization id `1` |
| Seller intenta aprobar solicitud `1` | `403` |
| Admin aprueba solicitud `1` | `200` |
| Admin aplica solicitud `1` | `200`, status `APPLIED` |

No se ejecutaron operaciones sobre pagos, caja, precio LIVE, devoluciones ni venta financiera.

## Visual smoke

No ejecutado.

Motivo: no hubo herramienta de navegador/screenshot real disponible en esta sesion.

Estado: `PENDING_QA_VISUAL`.

## Fixes aplicados

No se aplicaron fixes.

## Validaciones tecnicas

- `./mvnw.cmd test`: PASS, 119 tests, 0 failures, 0 errors. Primer intento sin `.env` fallo por credenciales DB; segundo intento con `.env` local cargado sin imprimir secretos paso.
- `npm.cmd run lint`: PASS con 53 advertencias preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS, incluye `/operational-authorizations`.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: cambios esperados staged antes del commit.

## Resultado

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`
