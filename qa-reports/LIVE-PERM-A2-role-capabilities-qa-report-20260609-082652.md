# LIVE-PERM-A2 - QA tecnico de capacidades LIVE por rol

Fecha: 2026-06-09 08:26:52

Rama: `feature/live-perm-a2-role-capabilities-qa`

## Resumen ejecutivo

Se valido que LIVE-PERM-A1 y LIVE-PERM-A1B quedaron integrados en el historial de `develop` mediante:

- `4c7cee8 Merge branch 'feature/live-perm-a1-minimal-live-permissions' into develop`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`

Durante la auditoria se detecto una inconsistencia minima de UI/capabilities en el dashboard legacy `app/(tabs)/index.tsx`: el acceso "En vivo" seguia condicionado directamente a `DO_LIVE_RESERVATION`, mientras el sidebar moderno ya usaba `canViewLive`.

Se corrigio ese acceso para reutilizar el guard central `canViewLive`, manteniendo compatibilidad con `DO_LIVE_RESERVATION` a traves de `services/liveCapabilities.ts`.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -20`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1B"`
- `git grep -n "VIEW_LIVE|OPERATE_LIVE|PREPARE_LIVE_ITEM|CHANGE_LIVE_ACTIVE_ITEM|REMOVE_LIVE_ACTIVE_ITEM|DO_LIVE_RESERVATION" -- . ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "canViewLive|canOperateLive|canPrepareLive|canChangeLiveActiveItem|canRemoveLiveActiveItem|liveCapabilities" -- app services components ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "Retirar prenda del aire|Cambiar prenda al aire|Preparar prenda para LIVE|Apartar en LIVE|Ver LIVE|Operar LIVE" -- app services components locales docs ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `git --no-pager diff --check`
- `git --no-pager diff --cached --check`

Nota: dos comandos `git grep` iniciales con pathspecs antes de `--` fallaron en PowerShell con `fatal: unable to resolve revision: app`. Se repitieron con sintaxis segura `-- app services components ...` y pasaron.

## Hallazgos

### A1/A1B integrados

Confirmado en historial:

- A1 crea los cinco permisos LIVE minimos.
- A1B corrige dependencias con `VIEW_LIVE`.
- A1 cierre final queda documentado.
- La rama base contiene el merge manual a `develop`.

### Backend/RBAC

Confirmado:

- `PermissionCode.java` contiene:
  - `VIEW_LIVE`;
  - `OPERATE_LIVE`;
  - `PREPARE_LIVE_ITEM`;
  - `CHANGE_LIVE_ACTIVE_ITEM`;
  - `REMOVE_LIVE_ACTIVE_ITEM`;
  - `DO_LIVE_RESERVATION`.
- `V50__live_minimal_permissions.sql` asigna:
  - `ADMIN`: los 5 permisos LIVE minimos;
  - `SUPERVISOR`: los 5 permisos LIVE minimos;
  - `SELLER`: `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM`;
  - `SELLER` no recibe `REMOVE_LIVE_ACTIVE_ITEM`.
- `V51__live_permission_view_dependency_backfill.sql` hace backfill idempotente de `VIEW_LIVE` para roles con `DO_LIVE_RESERVATION`.
- No se crearon endpoints nuevos ni migraciones adicionales en A2.

### Frontend/capabilities

Confirmado:

- `services/liveCapabilities.ts` usa los permisos nuevos.
- `DO_LIVE_RESERVATION` se conserva para apartados LIVE y compatibilidad.
- `canClearActiveItem` depende de `REMOVE_LIVE_ACTIVE_ITEM` o capacidad admin/operador permitida.
- `canSetActiveItem` depende de `CHANGE_LIVE_ACTIVE_ITEM` o capacidad admin/operador permitida.
- `canPrepareItem` depende de `PREPARE_LIVE_ITEM` o capacidad admin/operador permitida.
- `canOperateLive` depende de `OPERATE_LIVE` o `DO_LIVE_RESERVATION` legacy.
- `canViewLive` depende de `VIEW_LIVE`, `OPERATE_LIVE`, `DO_LIVE_RESERVATION`, admin o compatibilidad documentada.

## Correccion aplicada

Archivo: `app/(tabs)/index.tsx`

Antes:

- El card legacy "En vivo" usaba `channelCode: 'LIVE'` + `permissionCode: 'DO_LIVE_RESERVATION'`.

Despues:

- El card usa `liveAccess: true`.
- `canShowAccess` delega en `canViewLive(user)`.
- El sidebar moderno y el dashboard legacy quedan alineados.

Impacto:

- Usuario con `VIEW_LIVE` u `OPERATE_LIVE` puede ver el acceso visual legacy a `/live`.
- Usuario con `DO_LIVE_RESERVATION` conserva acceso por compatibilidad dentro de `canViewLive`.
- No se alteran permisos backend/RBAC.
- No se habilitan precio, pagos, caja, devoluciones ni autorizaciones.

## Validaciones

| Validacion | Resultado |
| --- | --- |
| Maven test | PASS |
| npm lint | PASS con warnings preexistentes |
| TypeScript | PASS |
| Expo export web | PASS |
| git diff --check | PASS |
| git diff --cached --check | PASS |

Notas:

- Maven/Flyway valido 51 migraciones.
- Se repitio warning conocido de logback por no poder escribir en `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`; no fallo la suite.
- Lint mantiene 53 warnings preexistentes no relacionados con este ajuste.

## No tocado

No se toco:

- backend funcional;
- RBAC real;
- permisos nuevos;
- endpoints;
- migraciones;
- precio LIVE;
- pagos;
- caja;
- devoluciones;
- autorizaciones complejas.

## Estado QA

Resultado tecnico: `GO_TECNICO`.

Estado visual: `PENDING_QA_VISUAL`.

No se marca `QA_PASS` porque no hubo validacion visual con navegador/screenshots reales.

## Checklist QA visual pendiente

### Admin

- Ver acceso "En vivo" en sidebar y dashboard legacy.
- Confirmar operacion LIVE minima.

### Supervisor

- Confirmar acceso a `/live` con permisos A1.
- Confirmar vista/operacion segun rol y capacidades.

### Seller

- Confirmar que ve `/live` con `VIEW_LIVE`/`OPERATE_LIVE`/`DO_LIVE_RESERVATION`.
- Confirmar que puede preparar/cambiar prenda si tiene permisos A1.
- Confirmar que no puede retirar prenda del aire sin `REMOVE_LIVE_ACTIVE_ITEM`.

### Sin permisos

- Confirmar que no ve acceso operativo LIVE.
- Confirmar bloqueo claro si intenta entrar directo a `/live`.
