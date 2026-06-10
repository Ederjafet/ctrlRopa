# LIVE-QA-D visual home LIVE report

Fecha: 2026-06-10 12:05:34
Rama: feature/live-qa-d-visual-home-live

## Resultado ejecutivo

`GO_TECNICO_API` con `PENDING_QA_VISUAL`.

El smoke API real por rol confirma que el acceso LIVE base esta operativo y que seller no puede retirar la prenda al aire sin `REMOVE_LIVE_ACTIVE_ITEM`. La validacion visual queda pendiente porque no hubo navegador/screenshot real disponible en la sesion.

## Commits confirmados

- `619b482 Merge branch 'feature/home-live-a-active-live-card' into develop`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -80`
- `git --no-pager log --oneline --all --decorate --grep="HOME-LIVE-A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git grep -n "HOME-LIVE-A|LIVE activo|Ir a LIVE|canViewLive|DashboardTemplate|summary|active live|live activo" -- app components services locales docs qa-reports`
- `git grep -n "qa.admin@local.test|qa.supervisor.centro|qa.vendedor.centro|qa.sinpermisos" -- docs backend app services qa-reports`
- `git grep -n "REMOVE_LIVE_ACTIVE_ITEM|canClearActiveItem|assertCanRemoveLiveActiveItem|DO_LIVE_RESERVATION|VIEW_LIVE|OPERATE_LIVE" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services docs qa-reports`
- Smoke HTTP/API con PowerShell contra backend y frontend levantados.

Las credenciales y tokens se mantuvieron en memoria local temporal y no se imprimen.

## Backend/frontend detectados

- `GET http://localhost:8090/api/health`: 200
- `GET http://localhost:8090/api/me` sin token: 401
- `GET http://localhost:8081`: 200
- `GET http://192.168.0.128:8081`: 200

## Usuarios QA usados

| Usuario | Login | `/api/me` | Permisos LIVE observados |
| --- | --- | --- | --- |
| `qa.admin@local.test` | 200 | 200 | `VIEW_LIVE`, `OPERATE_LIVE`, `REMOVE_LIVE_ACTIVE_ITEM` |
| `qa.supervisor.centro@local.test` | 200 | 200 | `VIEW_LIVE`, `OPERATE_LIVE`, `REMOVE_LIVE_ACTIVE_ITEM` |
| `qa.vendedor.centro@local.test` | 200 | 200 | `VIEW_LIVE`, `OPERATE_LIVE`; sin `REMOVE_LIVE_ACTIVE_ITEM` |
| `qa.sinpermisos@local.test` | 403 | 401 sin token valido | Sin permisos LIVE efectivos |

## Resultados por rol

| Rol | Home card esperado | API LIVE | Resultado |
| --- | --- | --- | --- |
| Admin | Ve card si hay LIVE activo; boton a `/live` | Acceso LIVE y retiro permitido por permisos | PASS API; visual pendiente |
| Supervisor | Ve card si hay LIVE activo; boton a `/live` | Acceso LIVE y retiro permitido por permisos | PASS API; visual pendiente |
| Vendedor | Ve card si hay LIVE activo; boton a `/live` | Acceso LIVE; retiro bloqueado | PASS API con 403 esperado |
| Sin permisos | No ve card ni acceso operativo | Login bloqueado | PASS API; visual pendiente |

## Smoke API real

Dataset observado:

- Sucursal `4`
- LIVE activo `15`
- `activeItemId` vacio al momento del smoke

Validaciones:

- Admin obtiene lista de lives por sucursal: 200.
- Seller intenta `PATCH /api/lives/15/active-item` con `itemId=null`: 403.
- Resultado focal: `SELLER_REMOVE_ACTIVE_ITEM_RESULT=EXPECTED_403`.

No se ejecutaron mutaciones destructivas ni pagos/caja/precio/devoluciones.

## Smoke visual

Resultado: `PENDING_QA_VISUAL`.

Motivo:

- Browser plugin disponible como skill, pero el Node REPL requerido por esa skill no estuvo expuesto.
- No se encontro Playwright local instalado.
- No se detecto navegador CLI local para captura real.

## Fixes aplicados

No se aplicaron fixes funcionales ni microcopy. La revision tecnica y API smoke no arrojaron evidencia clara de inconsistencia menor segura.

## Validaciones tecnicas

- `backend/control-ropa/./mvnw.cmd test`: PASS
- `npm.cmd run lint`: PASS con 53 warnings preexistentes y 0 errores
- `npx.cmd tsc --noEmit`: PASS
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS
- `git --no-pager diff --check`: PASS
- `git --no-pager diff --cached --check`: PASS
- `git status`: cambios esperados staged para commit

## Confirmaciones de alcance

- No se implementaron features nuevas.
- No se modifico backend funcional.
- No se modifico frontend funcional.
- No se tocaron pagos, caja, precio LIVE, devoluciones ni autorizaciones.
- No se modifico RBAC.
- No se crearon permisos.
- No se crearon endpoints.
- No se crearon migraciones.
- No se cambio venta financiera.

## Resultado

- API: `GO_TECNICO_API`
- Visual: `PENDING_QA_VISUAL`
- GO/NO-GO: `GO_TECNICO_API`

Siguiente fase recomendada: QA visual manual/real por rol de home y `/live`, preferentemente con un LIVE activo que tenga prenda al aire para capturar el card completo.
