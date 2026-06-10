# LIVE-PERM-FIX-A0 - Reporte handoff autorizacion retirar prenda live

Fecha: 2026-06-10 11:16:24

## Rama

`feature/live-perm-fix-a0-remove-active-item-auth-handoff`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -60`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C"`
- `git --no-pager log --oneline --all --decorate --grep="HOME-LIVE-A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git grep -n "REMOVE_LIVE_ACTIVE_ITEM|removeActiveItem|clearActiveItem|setActiveItem|activeItem.*null|SACAR DEL AIRE|Retirar prenda del aire" ...`
- `git grep -n "CHANGE_LIVE_ACTIVE_ITEM|OPERATE_LIVE|VIEW_LIVE|DO_LIVE_RESERVATION|PermissionCode|hasPermission|requirePermission|PreAuthorize" ...`
- Revisiones no interactivas de `LiveService`, `LiveController`, `LiveServiceTests`, `services/liveCapabilities.ts`, `services/liveService.ts`, `docs/LIVE_QA_C_VISUAL_DISPOSABLE_FLOW.md` y reporte LIVE-QA-C.

## Historial validado

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `9ad9e37 LIVE-PERM-A1 ajusta capacidades sensibles`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Archivos revisados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `services/liveCapabilities.ts`
- `services/liveService.ts`
- `docs/LIVE_QA_C_VISUAL_DISPOSABLE_FLOW.md`
- `qa-reports/LIVE-QA-C-visual-disposable-flow-report-20260610-104030.md`

## Hallazgo

`qa.vendedor.centro@local.test` no tiene `REMOVE_LIVE_ACTIVE_ITEM`, pero LIVE-QA-C evidencio:

`SELLER_REMOVE_ACTIVE_ITEM status=200 UNEXPECTED`

Endpoint afectado probable:

- `PATCH /api/lives/{id}/active-item` con `itemId: null`.

Metodo afectado probable:

- `LiveService.setActiveItem(Long id, LiveActiveItemRequest request)`.

## Riesgo

Alto. El backend permite que un vendedor con `DO_LIVE_RESERVATION` retire la prenda al aire por API directa aunque la capability frontend espere `REMOVE_LIVE_ACTIVE_ITEM`.

## Plan de fix

Para LIVE-PERM-FIX-A1:

- ajustar `assertCanRemoveLiveActiveItem(...)` para exigir `REMOVE_LIVE_ACTIVE_ITEM` sin fallback `DO_LIVE_RESERVATION`;
- agregar prueba negativa para usuario con `DO_LIVE_RESERVATION` sin permiso de retiro;
- agregar prueba positiva para usuario con `REMOVE_LIVE_ACTIVE_ITEM`;
- confirmar que `close` sigue limpiando active item como parte de cierre autorizado;
- ejecutar `./mvnw.cmd test` y validaciones frontend completas.

## No implementacion

No se implemento fix. No se tocaron backend funcional, frontend funcional, RBAC, permisos, migraciones ni endpoints.

## Resultado

`HANDOFF_TECNICO_COMPLETO`

`NO_IMPLEMENTATION`

`PENDING_APPROVAL_FOR_LIVE_PERM_FIX_A1`

## Siguiente fase recomendada

`LIVE-PERM-FIX-A1`: fix backend focalizado de autorizacion para retirar prenda al aire y QA API por rol.
