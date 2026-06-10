# LIVE-PERM-FIX-A1 - Reporte enforcement REMOVE_LIVE_ACTIVE_ITEM

Fecha: 2026-06-10 11:30:33

## Rama

`feature/live-perm-fix-a1-remove-active-item-enforcement`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -80`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A0"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git --no-pager log --oneline --all --decorate --grep="HOME-LIVE-A"`
- Auditorias `git grep` solicitadas sobre permisos, active item y `AccessDenied`.
- `./mvnw.cmd -Dtest=LiveServiceTests test`
- `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `GET http://localhost:8090/api/me` sin token

## Historial validado

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `88e55ed LIVE-PERM-FIX-A0 documenta autorizacion retirar prenda live`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `9ad9e37 LIVE-PERM-A1 ajusta capacidades sensibles`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`

## Archivos tocados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `docs/LIVE_PERM_FIX_A1_REMOVE_ACTIVE_ITEM_ENFORCEMENT.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `qa-reports/LIVE-PERM-FIX-A1-remove-active-item-enforcement-report-20260610-113033.md`
- `git-diffs/20260610-LIVE-PERM-FIX-A1-remove-active-item-enforcement.diff`
- `git-diffs/20260610-LIVE-PERM-FIX-A1-remove-active-item-enforcement-stat.txt`

## Implementacion

`LiveService.assertCanRemoveLiveActiveItem(...)` ahora exige `REMOVE_LIVE_ACTIVE_ITEM` mediante `accessService.assertCan(...)`.

Se elimino el fallback `DO_LIVE_RESERVATION` solo para retirar prenda al aire.

No se modificaron endpoints, migraciones, RBAC, catalogo de permisos ni frontend funcional.

## Tests agregados / ajustados

- `clearActiveItemRejectsLiveReservationPermissionWithoutRemovePermission`: usuario con `DO_LIVE_RESERVATION` pero sin `REMOVE_LIVE_ACTIVE_ITEM` recibe `AccessDeniedException`.
- `clearActiveItemDoesNotChangeInventoryStatus`: confirma permiso dedicado y que el inventario no cambia.
- `setActiveItemPersistsItemOnSameBranch`: confirma que `CHANGE_LIVE_ACTIVE_ITEM` sigue permitiendo poner/cambiar una prenda `AVAILABLE`.

## Validaciones

| Validacion | Resultado |
| --- | --- |
| `./mvnw.cmd -Dtest=LiveServiceTests test` | PASS, 10 tests. |
| `./mvnw.cmd test` | PASS tras cargar `.env` en memoria y quitar comillas envolventes; no se imprimieron secretos. |
| `npm.cmd run lint` | PASS, 0 errores; 53 warnings preexistentes. |
| `npx.cmd tsc --noEmit` | PASS. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS. |

## Smoke API focalizado

- `/api/me` sin token: `401`, esperado.
- PATCH autenticado seller `itemId: null`: `PENDING_QA_API`.

Motivo: no hay credenciales QA documentadas disponibles sin imprimir/inventar secretos. No se ejecuto mutacion autenticada.

Resultado esperado pendiente:

- seller sin `REMOVE_LIVE_ACTIVE_ITEM` => `403`.
- admin/supervisor con `REMOVE_LIVE_ACTIVE_ITEM` => permitido.

## QA visual

No hubo navegador/screenshot real.

Resultado: `PENDING_QA_VISUAL`.

## Riesgos

- El riesgo principal de API directa queda mitigado en test unitario/service.
- Requiere smoke API real con dataset desechable para cerrar evidencia runtime.
- La compatibilidad de `CHANGE_LIVE_ACTIVE_ITEM` y `DO_LIVE_RESERVATION` fuera del retiro no fue modificada.

## Resultado

`GO_TECNICO`

`PENDING_QA_API`

`PENDING_QA_VISUAL`

No se marca `QA_PASS`.
