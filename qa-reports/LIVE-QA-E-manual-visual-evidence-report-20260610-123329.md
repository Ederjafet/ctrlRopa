# LIVE-QA-E manual visual evidence report

Fecha: 2026-06-10 12:33:29
Rama: feature/live-qa-e-manual-visual-evidence

## Resultado ejecutivo

`GO_TECNICO_DOCUMENTAL` con `PENDING_QA_VISUAL`.

Se preparo la evidencia visual manual asistida para home + LIVE por rol, pero no se recibieron screenshots, rutas capturadas ni descripcion visual verificable. Por regla de fase, no se marca `QA_VISUAL_PASS`.

## Commits confirmados

- `5a2771f LIVE-QA-D valida home live por rol`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -80`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-D"`
- `git --no-pager log --oneline --all --decorate --grep="HOME-LIVE-A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git grep -n "LIVE activo|Ir a LIVE|canViewLive|DashboardTemplate|summary|HOME-LIVE-A" -- app components services locales docs qa-reports`
- `git grep -n "REMOVE_LIVE_ACTIVE_ITEM|canClearActiveItem|assertCanRemoveLiveActiveItem|VIEW_LIVE|OPERATE_LIVE|DO_LIVE_RESERVATION" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services docs qa-reports`
- Busqueda local de evidencia visual `LIVE-QA-E` o `manual-evidence`: sin resultados.

## Auditoria

Hallazgos tecnicos:

- Home usa `DashboardTemplate`.
- El card de LIVE activo esta en el `summary` superior.
- La visibilidad del card depende de `canViewLive(session)`.
- El boton `Ir a LIVE` navega a `/live`.
- `DashboardTemplate` renderiza `summary` antes de las secciones del contenido previo.
- LIVE usa `liveCapabilities.canClearActiveItem`.
- Backend exige `REMOVE_LIVE_ACTIVE_ITEM` en `LiveService.assertCanRemoveLiveActiveItem(...)`.
- LIVE-QA-D ya habia confirmado por API que seller recibe 403 al retirar active item sin permiso.

## Evidencia visual recibida

No se recibieron screenshots ni evidencia visual verificable.

No se creo ni modifico carpeta `qa-reports/manual-evidence/` porque no hubo archivos de imagen que registrar.

## Resultado por rol

| Rol | Evidencia requerida | Evidencia recibida | Resultado |
| --- | --- | --- | --- |
| Admin | Home + LIVE + retiro si hay active item | Ninguna | `PENDING_QA_VISUAL` |
| Supervisor | Home + LIVE | Ninguna | `PENDING_QA_VISUAL` |
| Vendedor | Home + LIVE + retiro ausente/bloqueado | Ninguna | `PENDING_QA_VISUAL` |
| Sin permisos | Home/login bloqueado + `/live` directo | Ninguna | `PENDING_QA_VISUAL` |

## Checklist visual preparado

### Admin

- Login como `qa.admin@local.test`.
- Confirmar card LIVE en home si hay LIVE activo.
- Confirmar boton `Ir a LIVE`.
- Confirmar navegacion a `/live`.
- Confirmar contenido anterior del home debajo del card.
- Confirmar retiro de prenda si hay active item.

### Supervisor

- Login como `qa.supervisor.centro@local.test`.
- Confirmar card LIVE en home si hay LIVE activo.
- Confirmar navegacion a `/live`.
- Confirmar acciones permitidas por rol.

### Vendedor

- Login como `qa.vendedor.centro@local.test`.
- Confirmar card LIVE en home si hay LIVE activo.
- Confirmar navegacion a `/live`.
- Confirmar que retirar prenda al aire no esta disponible o queda bloqueado.

### Sin permisos

- Login con `qa.sinpermisos@local.test` o documentar 403.
- Confirmar que no ve card LIVE.
- Confirmar que `/live` directo queda bloqueado o sin acciones.

## QA_VISUAL_PASS

No se puede marcar `QA_VISUAL_PASS`.

Motivo: falta evidencia visual real suficiente.

## Confirmacion de no cambios funcionales

- No se modifico backend funcional.
- No se modifico frontend funcional.
- No se tocaron pagos, caja, precio LIVE, devoluciones ni autorizaciones.
- No se modifico RBAC.
- No se crearon permisos.
- No se crearon endpoints.
- No se crearon migraciones.
- No se cambio venta financiera.

## Validaciones tecnicas

- `npm.cmd run lint`: PASS con 53 warnings preexistentes y 0 errores
- `npx.cmd tsc --noEmit`: PASS
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS
- `git --no-pager diff --check`: PASS
- `git --no-pager diff --cached --check`: PASS
- `git status`: cambios esperados staged para commit

## Resultado

- Resultado documental: `GO_TECNICO_DOCUMENTAL`
- Resultado visual: `PENDING_QA_VISUAL`

Siguiente fase recomendada: ejecutar QA visual manual real con screenshots y actualizar evidencia antes de declarar `QA_VISUAL_PASS`.
