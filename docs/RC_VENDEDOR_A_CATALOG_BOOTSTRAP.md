# RC-VENDEDOR-A Catalog bootstrap para vendedor

Fecha: 2026-06-21

Rama: `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Hallazgo del smoke

Con cuenta de vendedor el login funcionaba y varios endpoints operativos respondian 200:

- `GET /api/me`
- `GET /api/lives/branch/5`
- `GET /api/reservations/branch/5`
- `GET /api/customers/branch/5`

Pero fallaba:

- `GET /api/catalogs/bootstrap?branchId=5`

El backend respondia 500 con `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`.

## Causa raiz

`CatalogBootstrapService.getBootstrap()` estaba anotado como transaccion read-only y llamaba `accessService.assertCan(currentUser, MANAGE_USERS)` dentro de `canManageUsers()`.

Para vendedor, `MANAGE_USERS` no aplica. La excepcion se atrapaba para devolver `false`, pero `AccessService.assertCan()` es un metodo transaccional que registra denegacion y lanza `AccessDeniedException`; al cruzar el proxy transaccional, Spring podia marcar la transaccion como rollback-only aunque el caller atrapara la excepcion.

Resultado: el endpoint parecia recuperarse del permiso faltante, pero al cerrar la transaccion explotaba con `UnexpectedRollbackException`.

## Correccion aplicada

En `CatalogBootstrapService`:

- `canManageUsers()` ahora usa `accessService.can(...)`, que evalua permiso sin lanzar por permiso faltante.
- `getBootstrap()` resuelve y valida el tenant con `TenantAccessGuard`.
- Si llega `branchId`, se valida con `requireBranch(...)`.
- El catalogo de sucursales se limita a la company y sucursal efectiva del usuario.
- Ubicaciones y cajas usan la sucursal efectiva validada.

Esto evita convertir permisos esperados en error 500 y refuerza aislamiento por sucursal.

## Permisos revisados

No se ampliaron permisos al vendedor.

El vendedor puede cargar catologos read-only minimos segun el bootstrap permitido. Los catalogos administrativos de roles/permisos siguen vacios si no tiene `MANAGE_USERS`.

## Tests agregados

Se agrego `CatalogBootstrapServiceTests` con casos:

- Vendedor sin `MANAGE_USERS` puede consultar bootstrap sin usar `assertCan()`.
- Admin con `MANAGE_USERS` conserva el camino permitido.
- Branch fuera del tenant activo devuelve `AccessDeniedException` controlado.

## Frontend

No se modifico frontend. El consumidor principal (`items-create`) ya usa `getActionableApiError()` para mostrar errores 403/500 con mensaje amigable.

## Pendientes

- Si se requiere que admins multi-sucursal vean varias sucursales en bootstrap, definir reglas explicitas de acceso por `user_branches`.
- Considerar endpoint dedicado para catalogos de administracion si roles/permisos dejan de pertenecer al bootstrap operativo.

## Validaciones

- `./mvnw.cmd -Dtest=CatalogBootstrapServiceTests test`: OK.
- `./mvnw.cmd test` sin `.env`: fallo de entorno por `Access denied for user 'root'@'localhost' (using password: NO)`.
- `./mvnw.cmd -q test` cargando `.env`: OK.
- `npm run lint`: OK, sin errores; quedan warnings previos en otras pantallas.
- `npx tsc --noEmit`: OK.
- `git --no-pager diff --check`: OK.
