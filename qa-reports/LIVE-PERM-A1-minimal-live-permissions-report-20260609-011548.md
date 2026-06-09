# LIVE-PERM-A1 - Reporte tecnico

Fecha: 2026-06-09 01:15:48

Rama: `feature/live-perm-a1-minimal-live-permissions`

Fase: LIVE-PERM-A1 - Permisos LIVE minimos reales

## Resumen

Se implemento el MVP aprobado de permisos LIVE reales:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`

No se implementaron permisos de precio, pagos, caja, devoluciones, autorizaciones operativas, reversas con pago ni endpoints nuevos.

## Comandos ejecutados

Comandos iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -15`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A0"`
- `git --no-pager log --oneline --all --decorate --grep="PRODUCT-UX-B2"`

Auditoria:

- `git grep` sobre `PermissionCode`, permisos actuales, enforcement backend, migraciones y mapper frontend.
- Revision de `LiveService`, `OperationMenuService`, `PermissionCode.java`, migraciones Flyway y capacidades frontend.

Validaciones:

- `.\mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `git --no-pager diff --check`

## Resultado de comandos

Backend:

- Primer intento `.\mvnw.cmd test`: fallo por configuracion local, `Access denied for user 'root'@'localhost' (using password: NO)`.
- Segundo intento cargando `.env`: fallo porque el loader local de prueba dejo comillas literales en `CONTROL_ROPA_DB_URL`.
- Tercer intento cargando `.env` con saneo de comillas: `PASS`.
- Flyway valido `50 migrations`.
- Schema actual reportado por Flyway: version `50`.

Frontend:

- `npm.cmd run lint`: `PASS` con warnings preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: `PASS`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: `PASS`.

Git:

- `git --no-pager diff --check`: `PASS` sin errores; solo warnings CRLF.

## Archivos tocados

Backend:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/operation/OperationMenuService.java`
- `backend/control-ropa/src/main/resources/db/migration/V50__live_minimal_permissions.sql`

Frontend:

- `services/liveCapabilities.ts`
- `services/permissionDependencies.ts`

Documentacion:

- `docs/LIVE_PERM_A1_MINIMAL_LIVE_PERMISSIONS.md`
- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

## Permisos creados

Solo se crearon los cinco permisos aprobados:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`

## Permisos no creados

No se crearon:

- `CHANGE_LIVE_PRICE`
- `REQUEST_LIVE_PRICE_CHANGE`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`
- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `CLOSE_LIVE_OPERATIONAL_SALE`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `RELEASE_RESERVED_ITEM`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`
- `VIEW_PAYMENT_STATUS`

## Migracion

Migracion creada: `V50__live_minimal_permissions.sql`.

La migracion:

- inserta permisos con `INSERT IGNORE`;
- asigna permisos base a `ADMIN`, `SUPERVISOR` y `SELLER` siguiendo el alcance aprobado;
- no modifica datos de pagos, caja, devoluciones, precio ni autorizaciones;
- no borra ni renombra `DO_LIVE_RESERVATION`.

## Riesgos

- `DO_LIVE_RESERVATION` sigue como compatibilidad legacy. QA debe validar roles reales para evitar permisos excesivos en operacion.
- No hay evidencia visual real en esta fase.
- Precio, pagos, caja, reversas y autorizaciones siguen pendientes para fases aprobadas por arquitectura.

## Resultado

Resultado tecnico: `GO_TECNICO`.

Resultado QA visual: `PENDING_QA_VISUAL`.
