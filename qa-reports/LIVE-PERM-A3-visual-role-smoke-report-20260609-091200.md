# LIVE-PERM-A3 - Smoke visual por rol de capacidades LIVE

Fecha: 2026-06-09 09:12:00
Rama: feature/live-perm-a3-visual-role-smoke
Resultado tecnico: GO_TECNICO
Resultado visual: PENDING_QA_VISUAL

## Objetivo

Validar que LIVE-PERM-A1, LIVE-PERM-A1B y LIVE-PERM-A2 quedaron integrados en develop y revisar que las capacidades LIVE minimas por rol sean coherentes antes de una validacion visual humana.

Esta corrida no implementa permisos nuevos, endpoints, migraciones ni cambios funcionales.

## Commits confirmados

- 5f5cf4d LIVE-PERM-A1 agrega permisos live minimos
- 4975138 LIVE-PERM-A1B corrige dependencias de permisos live
- 6c757c9 LIVE-PERM-A1 documenta cierre final
- 5c7aced LIVE-PERM-A2 ajusta capacidades live por rol
- 025c5c0 Merge branch 'feature/live-perm-a2-role-capabilities-qa' into develop

## Comandos ejecutados

Auditoria inicial:

```text
git branch --show-current
git status
git log --oneline -20
git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"
git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1B"
git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"
```

Auditoria de permisos y capacidades:

```text
git grep -n "VIEW_LIVE\|OPERATE_LIVE\|PREPARE_LIVE_ITEM\|CHANGE_LIVE_ACTIVE_ITEM\|REMOVE_LIVE_ACTIVE_ITEM\|DO_LIVE_RESERVATION" -- . ':!node_modules' ':!.expo' ':!dist' ':!build'
git grep -n "canViewLive\|canOperateLive\|canPrepareLive\|canChangeLiveActiveItem\|canRemoveLiveActiveItem\|liveAccess\|liveCapabilities" -- app services components ':!node_modules' ':!.expo' ':!dist' ':!build'
git grep -n "En vivo\|Apartar en LIVE\|Ver LIVE\|Operar LIVE\|Preparar prenda para LIVE\|Cambiar prenda al aire\|Retirar prenda del aire" -- app services components locales docs ':!node_modules' ':!.expo' ':!dist' ':!build'
```

Revision de infraestructura visual/e2e:

```text
Get-Content package.json
rg --files -g '*playwright*' -g '*cypress*' -g '*e2e*' -g '*visual*' -g '*spec.*' -g '*test.*'
git grep -n "playwright\|cypress\|detox\|puppeteer\|testing-library\|screenshot\|visual" -- package.json app services components docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'
```

Validaciones:

```text
cd backend/control-ropa
./mvnw.cmd test
cd /e/CtrlPan/2026/control-ropa-app
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
git --no-pager diff --check
git --no-pager diff --cached --check
git status
```

## Hallazgos tecnicos

- `PermissionCode.java` conserva `DO_LIVE_RESERVATION` y contiene los permisos LIVE minimos reales:
  - `VIEW_LIVE`
  - `OPERATE_LIVE`
  - `PREPARE_LIVE_ITEM`
  - `CHANGE_LIVE_ACTIVE_ITEM`
  - `REMOVE_LIVE_ACTIVE_ITEM`
- `V50__live_minimal_permissions.sql` inserta los cinco permisos minimos y asigna roles segun el alcance aprobado.
- `V51__live_permission_view_dependency_backfill.sql` hace backfill idempotente de `VIEW_LIVE` para roles con `DO_LIVE_RESERVATION`.
- `OperationMenuService` permite mostrar LIVE con `VIEW_LIVE`, `OPERATE_LIVE` o `DO_LIVE_RESERVATION`.
- `services/liveCapabilities.ts` usa los permisos nuevos y conserva compatibilidad con `DO_LIVE_RESERVATION`.
- `services/permissionDependencies.ts` contiene dependencias visibles:
  - `DO_LIVE_RESERVATION => VIEW_LIVE`
  - `OPERATE_LIVE => VIEW_LIVE`
  - `PREPARE_LIVE_ITEM => VIEW_LIVE`
  - `CHANGE_LIVE_ACTIVE_ITEM => VIEW_LIVE`
  - `REMOVE_LIVE_ACTIVE_ITEM => VIEW_LIVE`
- El sidebar moderno usa `canViewLive(session)`.
- El dashboard legacy usa `liveAccess` delegado a `canViewLive(user)`, no solo `DO_LIVE_RESERVATION`.

## Permisos por rol esperados

- ADMIN: `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`.
- SUPERVISOR: `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`.
- SELLER: `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `CHANGE_LIVE_ACTIVE_ITEM`.
- SELLER no recibe `REMOVE_LIVE_ACTIVE_ITEM`.
- Usuario sin permisos no debe recibir permisos LIVE.
- Roles con `DO_LIVE_RESERVATION` reciben `VIEW_LIVE` por V51.

## Alcance no tocado

Se confirmo que esta fase no implemento ni modifico:

- permisos nuevos fuera del MVP LIVE minimo;
- endpoints;
- migraciones;
- precio LIVE;
- pagos;
- caja;
- devoluciones;
- autorizaciones complejas;
- RBAC funcional adicional.

## QA visual asistido

No se ejecuto QA visual real con capturas porque no se encontro infraestructura e2e/visual existente en el proyecto y la herramienta de navegador local disponible para esta sesion no expone el canal operativo requerido por el skill de browser. No se instalaron dependencias ni se invento automatizacion.

Por lo anterior, el estado visual queda como:

```text
PENDING_QA_VISUAL
```

## Validaciones tecnicas

- Maven test: PASS.
- `npm.cmd run lint`: PASS con advertencias preexistentes, sin errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.

## Checklist visual pendiente

Admin:

- Confirmar que ve acceso a LIVE.
- Confirmar que puede operar LIVE.
- Confirmar que puede preparar prenda.
- Confirmar que puede cambiar prenda al aire.
- Confirmar que puede retirar prenda del aire.

Supervisor:

- Confirmar que ve acceso a LIVE.
- Confirmar que puede operar LIVE.
- Confirmar que puede preparar prenda.
- Confirmar que puede cambiar prenda al aire.
- Confirmar que puede retirar prenda del aire.

Seller:

- Confirmar que ve acceso a LIVE.
- Confirmar que puede operar LIVE segun permisos asignados.
- Confirmar que puede preparar prenda.
- Confirmar que puede cambiar prenda al aire.
- Confirmar que no puede retirar prenda del aire.
- Confirmar que `Apartar en LIVE` no aparece como incluido mientras `Ver LIVE` aparece como agregable.

Sin permisos:

- Confirmar que no ve acceso operativo a LIVE.
- Confirmar que cualquier acceso directo queda bloqueado con mensaje claro.

## Resultado

GO_TECNICO / PENDING_QA_VISUAL.

La rama queda lista para QA visual humano por rol. No se debe marcar QA_PASS hasta contar con evidencia visual real.
