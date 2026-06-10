# LIVE-QA-C2 remove active item re-smoke report

Fecha: 2026-06-10 11:45:07
Rama: feature/live-qa-c2-remove-active-item-resmoke

## Resultado ejecutivo

`GO_TECNICO_API`

El re-smoke focalizado confirma que `qa.vendedor.centro@local.test` ya no puede retirar la prenda al aire por API sin `REMOVE_LIVE_ACTIVE_ITEM`. El endpoint respondio 403 para seller y 200 para admin sobre dataset desechable.

Smoke visual queda como `PENDING_QA_VISUAL` porque no se capturaron screenshots con navegador real.

## Commits confirmados

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `88e55ed LIVE-PERM-FIX-A0 documenta autorizacion retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -100`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A0"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A1"`
- `git --no-pager log --oneline --all --decorate --grep="HOME-LIVE-A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git grep -n "assertCanRemoveLiveActiveItem|REMOVE_LIVE_ACTIVE_ITEM|DO_LIVE_RESERVATION|CHANGE_LIVE_ACTIVE_ITEM|setActiveItem|activeItem.*null|itemId.*null|removeActiveItem|clearActiveItem" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs qa-reports`
- `git grep -n "qa.admin@local.test|qa.supervisor.centro@local.test|qa.vendedor.centro@local.test|qa.sinpermisos@local.test|QA_LIVE_DISPOSABLE_20260610104008" -- docs backend app services qa-reports git-diffs`
- Smoke HTTP con PowerShell contra `http://localhost:8090` y `http://localhost:8081`

Las credenciales y tokens se mantuvieron en variables temporales y no se imprimen en este reporte.

## Backend y frontend detectados

- `GET http://localhost:8090/api/health`: 200
- `GET http://localhost:8090/api/me` sin token: 401
- `GET http://localhost:8081`: 200
- `GET http://192.168.0.128:8081`: 200

## Usuarios QA usados

| Usuario | Login | `/api/me` | Resultado |
| --- | --- | --- | --- |
| `qa.admin@local.test` | 200 | 200 | Tiene `REMOVE_LIVE_ACTIVE_ITEM` |
| `qa.supervisor.centro@local.test` | 200 | 200 | Tiene `REMOVE_LIVE_ACTIVE_ITEM` |
| `qa.vendedor.centro@local.test` | 200 | 200 | No tiene `REMOVE_LIVE_ACTIVE_ITEM`; si tiene `DO_LIVE_RESERVATION` y `CHANGE_LIVE_ACTIVE_ITEM` |
| `qa.sinpermisos@local.test` | 403 | 401 sin token valido | Bloqueado |

## Dataset usado

Dataset desechable LIVE-QA-C:

- LIVE `15`
- Item activo inicial `106`
- Estado LIVE `ACTIVE`
- Prefijo documentado: `QA_LIVE_DISPOSABLE_20260610104008`

## Smoke API ejecutado

### Seller sin REMOVE_LIVE_ACTIVE_ITEM

- Operacion: `PATCH /api/lives/15/active-item` con `itemId=null`
- Esperado: 403
- Obtenido: 403
- Resultado: PASS

### Admin con REMOVE_LIVE_ACTIVE_ITEM

- Operacion: `PATCH /api/lives/15/active-item` con `itemId=null`
- Esperado: 200
- Obtenido: 200
- Resultado: PASS

Mutacion realizada: admin retiro el item activo `106` del LIVE `15`, dentro del dataset desechable identificado.

## Smoke visual

No se ejecuto navegador real ni screenshots.

Resultado visual: `PENDING_QA_VISUAL`.

## Validaciones tecnicas

- `backend/control-ropa/./mvnw.cmd test`: PASS
- `npm.cmd run lint`: PASS con 53 warnings preexistentes y 0 errores
- `npx.cmd tsc --noEmit`: PASS
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS
- `git --no-pager diff --check`: PASS
- `git --no-pager diff --cached --check`: PASS
- `git status`: cambios esperados staged para commit

## Confirmaciones de alcance

- No se implemento logica nueva.
- No se modifico backend funcional.
- No se modifico frontend funcional.
- No se tocaron pagos, caja, precio LIVE, devoluciones ni autorizaciones complejas.
- No se modifico RBAC.
- No se crearon permisos.
- No se crearon endpoints.
- No se crearon migraciones.
- No se cambio venta financiera.

## Resultado

- API: `GO_TECNICO_API`
- Visual: `PENDING_QA_VISUAL`
- GO/NO-GO: `GO_TECNICO_API`

Siguiente fase recomendada: merge manual de LIVE-QA-C2 y luego continuar con QA visual/formal de LIVE si se requiere evidencia de navegador.
