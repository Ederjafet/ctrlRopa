# LIVE-PERM-A1 - Cierre final tecnico

Fecha: 2026-06-09 07:52:33

Rama: `feature/live-perm-a1-minimal-live-permissions`

## Resumen ejecutivo

Se audito la rama completa LIVE-PERM-A1, incluyendo:

- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`

La rama queda tecnicamente lista para merge manual, con estado:

- `GO_TECNICO`
- `PENDING_QA_VISUAL`
- `READY_FOR_MANUAL_MERGE`

No se hizo merge a `develop`.

## Permisos creados en A1

Permisos minimos reales implementados:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`

`DO_LIVE_RESERVATION` sigue existiendo como permiso legacy/funcional para apartados LIVE y compatibilidad.

## Permisos sensibles no implementados

Se confirmo que estos permisos no fueron creados en backend/RBAC/migraciones de A1:

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
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`
- `VIEW_PAYMENT_STATUS`

El grep encontro esos codigos en documentacion y etiquetas visibles futuras de `services/permissionDependencies.ts`, no como permisos backend reales.

## Migraciones

### V50

Archivo: `backend/control-ropa/src/main/resources/db/migration/V50__live_minimal_permissions.sql`

Confirmado:

- inserta solo los cinco permisos minimos aprobados;
- asigna los cinco permisos a `ADMIN`;
- asigna los cinco permisos a `SUPERVISOR`;
- asigna a `SELLER`:
  - `VIEW_LIVE`;
  - `OPERATE_LIVE`;
  - `PREPARE_LIVE_ITEM`;
  - `CHANGE_LIVE_ACTIVE_ITEM`;
- no asigna `REMOVE_LIVE_ACTIVE_ITEM` a `SELLER`;
- no borra ni renombra `DO_LIVE_RESERVATION`.

### V51

Archivo: `backend/control-ropa/src/main/resources/db/migration/V51__live_permission_view_dependency_backfill.sql`

Confirmado:

- es idempotente con `INSERT IGNORE`;
- asigna `VIEW_LIVE` a todo rol que ya tenga `DO_LIVE_RESERVATION`;
- no crea permisos nuevos;
- no asigna permisos sensibles;
- no asigna `REMOVE_LIVE_ACTIVE_ITEM` a `SELLER`;
- V50 no fue editada durante A1B.

## Dependencias corregidas en A1B

`services/permissionDependencies.ts` refleja:

- `DO_LIVE_RESERVATION -> VIEW_LIVE`;
- `OPERATE_LIVE -> VIEW_LIVE`;
- `PREPARE_LIVE_ITEM -> VIEW_LIVE`;
- `CHANGE_LIVE_ACTIVE_ITEM -> VIEW_LIVE`;
- `REMOVE_LIVE_ACTIVE_ITEM -> VIEW_LIVE`.

## Backend revisado

Archivos principales:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/operation/OperationMenuService.java`
- `backend/control-ropa/src/main/resources/db/migration/V50__live_minimal_permissions.sql`
- `backend/control-ropa/src/main/resources/db/migration/V51__live_permission_view_dependency_backfill.sql`

Confirmado:

- `PermissionCode.java` contiene los cinco permisos minimos y conserva `DO_LIVE_RESERVATION`.
- `LiveService` usa permisos nuevos para separar ver/operar/cambiar/retirar y conserva fallback legacy con `DO_LIVE_RESERVATION`.
- `OperationMenuService` permite LIVE con `VIEW_LIVE`, `OPERATE_LIVE` o `DO_LIVE_RESERVATION`.

## Frontend revisado

Archivos principales:

- `services/liveCapabilities.ts`
- `services/permissionDependencies.ts`
- `app/(tabs)/index.tsx`

Confirmado:

- `services/liveCapabilities.ts` consume los permisos minimos nuevos.
- `DO_LIVE_RESERVATION` se conserva para apartados LIVE y compatibilidad legacy.
- Las etiquetas visibles siguen legibles.
- `/live` en tabs conserva `DO_LIVE_RESERVATION` como compatibilidad frontend legacy; el menu operativo backend ya acepta `VIEW_LIVE`, `OPERATE_LIVE` o `DO_LIVE_RESERVATION`.

## Documentacion y evidencia existente

Confirmado:

- `docs/LIVE_PERM_A1_MINIMAL_LIVE_PERMISSIONS.md`
- `docs/LIVE_PERM_A1B_LIVE_PERMISSION_DEPENDENCIES.md`
- `qa-reports/LIVE-PERM-A1-minimal-live-permissions-report-20260609-011548.md`
- `qa-reports/LIVE-PERM-A1B-live-permission-dependencies-report-20260609-074052.md`
- `git-diffs/20260609-LIVE-PERM-A1-minimal-live-permissions.diff`
- `git-diffs/20260609-LIVE-PERM-A1-minimal-live-permissions-stat.txt`
- `git-diffs/20260609-LIVE-PERM-A1B-live-permission-dependencies.diff`
- `git-diffs/20260609-LIVE-PERM-A1B-live-permission-dependencies-stat.txt`

## Validaciones ejecutadas

| Validacion | Resultado |
| --- | --- |
| `./mvnw.cmd test` | PASS |
| `npm.cmd run lint` | PASS con warnings preexistentes |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS |
| `git --no-pager diff --check` | PASS |
| `git --no-pager diff --cached --check` | PASS |
| `git status` | limpio antes de crear este reporte |

Notas:

- Maven/Flyway valido 51 migraciones y el schema local quedo actualizado.
- Se observo warning conocido de logback por falta de permiso para escribir en `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`; no fallo la suite.
- Lint mantiene warnings preexistentes no relacionados con LIVE-PERM-A1.

## No tocado

Se confirma que el cierre final no toca ni implementa:

- precio LIVE;
- pagos;
- caja;
- devoluciones;
- autorizaciones complejas;
- endpoints nuevos;
- permisos sensibles fuera del MVP A1;
- migraciones destructivas;
- merge a `develop`.

## Checklist QA visual pendiente

### Admin

- Ver `/live`.
- Operar flujo LIVE minimo.
- Ver permisos LIVE minimos asignables.
- Confirmar que no aparecen permisos sensibles como implementados reales.

### Supervisor

- Ver `/live`.
- Operar flujo minimo aprobado.
- Confirmar acceso a dashboard/vista de supervision segun permisos.

### Seller

- Confirmar que tiene `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM`.
- Confirmar que no tiene `REMOVE_LIVE_ACTIVE_ITEM` salvo asignacion manual posterior.
- Confirmar que `DO_LIVE_RESERVATION` sigue permitiendo apartar en LIVE.

### Sin permisos

- Confirmar bloqueo claro en `/live`.
- Confirmar que no aparecen acciones operativas LIVE.

### Dependencias visibles

- Confirmar que si "Apartar en LIVE" esta incluido, "Ver LIVE" no queda como permiso independiente agregable sin relacion.
- Confirmar que operar/preparar/cambiar/retirar LIVE muestran `VIEW_LIVE` como dependencia minima.

## Resultado

`GO_TECNICO`

`PENDING_QA_VISUAL`

`READY_FOR_MANUAL_MERGE`
