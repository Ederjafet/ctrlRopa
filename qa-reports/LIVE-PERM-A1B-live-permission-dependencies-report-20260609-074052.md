# LIVE-PERM-A1B - Reporte de dependencias de permisos LIVE

Fecha: 2026-06-09 07:40:52

Rama: `feature/live-perm-a1-minimal-live-permissions`

## Alcance

Corregir la inconsistencia visual/operativa donde `DO_LIVE_RESERVATION` / "Apartar en LIVE" podia quedar incluido sin `VIEW_LIVE` / "Ver LIVE".

La fase no implementa permisos nuevos ni capacidades sensibles.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -12`
- `git show --stat --oneline 5f5cf4d`
- `git show --name-only --oneline 5f5cf4d`
- `git grep -n "DO_LIVE_RESERVATION|VIEW_LIVE|OPERATE_LIVE|PREPARE_LIVE_ITEM|CHANGE_LIVE_ACTIVE_ITEM|REMOVE_LIVE_ACTIVE_ITEM" services app backend/control-ropa/src/main/resources backend/control-ropa/src/main/java docs`
- `git grep -n "permissionDependencies|dependencies|requires|required|Incluido|Agregar" services app components locales docs`
- `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `git --no-pager diff --check`

## Hallazgos

- `services/permissionDependencies.ts` ya declaraba `OPERATE_LIVE -> VIEW_LIVE` y `PREPARE_LIVE_ITEM -> VIEW_LIVE`.
- `services/permissionDependencies.ts` no declaraba `DO_LIVE_RESERVATION -> VIEW_LIVE`.
- `CHANGE_LIVE_ACTIVE_ITEM` y `REMOVE_LIVE_ACTIVE_ITEM` dependian de `OPERATE_LIVE`, pero la decision A1B exige dependencia minima directa de `VIEW_LIVE`.
- `V50__live_minimal_permissions.sql` asignaba `VIEW_LIVE` a roles base A1, pero no hacia backfill de roles legacy que ya tuvieran `DO_LIVE_RESERVATION`.
- `DO_LIVE_RESERVATION` se conserva como permiso legacy/funcional de apartados LIVE.

## Cambios aplicados

- Se agrego `DO_LIVE_RESERVATION -> VIEW_LIVE` al mapper central.
- Se alinearon `CHANGE_LIVE_ACTIVE_ITEM` y `REMOVE_LIVE_ACTIVE_ITEM` para depender como minimo de `VIEW_LIVE`.
- Se agrego `V51__live_permission_view_dependency_backfill.sql` para que todo rol con `DO_LIVE_RESERVATION` reciba `VIEW_LIVE`.
- Se creo documentacion de fase en `docs/LIVE_PERM_A1B_LIVE_PERMISSION_DEPENDENCIES.md`.

## Migracion

Archivo: `backend/control-ropa/src/main/resources/db/migration/V51__live_permission_view_dependency_backfill.sql`

Caracteristicas:

- idempotente con `INSERT IGNORE`;
- solo inserta `VIEW_LIVE` para roles con `DO_LIVE_RESERVATION`;
- no crea permisos;
- no toca permisos sensibles;
- no edita `V50`;
- no asigna `REMOVE_LIVE_ACTIVE_ITEM` a `SELLER`.

## Validaciones

| Validacion | Resultado |
| --- | --- |
| Maven test | PASS |
| npm lint | PASS con warnings preexistentes |
| TypeScript | PASS |
| Expo export web | PASS |
| git diff --check | PASS |

Nota: Maven emitio warning de logback por no poder escribir en `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`, pero el proceso termino con codigo 0.

## No tocado

- Precio LIVE.
- Pagos.
- Caja.
- Devoluciones.
- Autorizaciones complejas.
- Endpoints.
- Permisos nuevos fuera de A1.
- Reglas de negocio sensibles.

## Estado QA

Resultado tecnico: `GO_TECNICO`.

Estado visual: `PENDING_QA_VISUAL`.

No se marca `QA_PASS` porque no hubo validacion visual posterior en navegador/ambiente QA.

## QA visual recomendado

1. Abrir pantalla de roles/permisos.
2. Confirmar que si "Apartar en LIVE" esta incluido, "Ver LIVE" no queda como agregable independiente.
3. Confirmar que operar/preparar/cambiar/retirar LIVE muestran dependencia minima con "Ver LIVE".
4. Confirmar que no aparecen permisos nuevos fuera de A1.
5. Confirmar que no cambian precio, pagos, caja, devoluciones ni autorizaciones.
