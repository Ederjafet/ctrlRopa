# LIVE-PERM-FIX-A1 - Enforce backend REMOVE_LIVE_ACTIVE_ITEM

Fecha: 2026-06-10

## Resultado

`GO_TECNICO`

`PENDING_QA_API`

`PENDING_QA_VISUAL`

## Bug corregido

LIVE-QA-C dejo `NO_GO` porque `qa.vendedor.centro@local.test` pudo retirar la prenda al aire por API aunque no tiene `REMOVE_LIVE_ACTIVE_ITEM`.

Evidencia origen:

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `SELLER_REMOVE_ACTIVE_ITEM status=200 UNEXPECTED`
- Endpoint: `PATCH /api/lives/{id}/active-item`
- Payload de retiro: `itemId: null`

## Causa confirmada

`LiveService.setActiveItem(...)` detecta retiro cuando `request == null || request.getItemId() == null` y llama `assertCanRemoveLiveActiveItem(...)`.

Antes de A1, ese metodo aceptaba:

- `REMOVE_LIVE_ACTIVE_ITEM`
- fallback `DO_LIVE_RESERVATION`

Por esa compatibilidad legacy, un vendedor con permiso de apartado LIVE podia retirar la prenda al aire por API directa.

## Implementacion

Cambio focalizado en backend:

- `assertCanRemoveLiveActiveItem(...)` ahora exige estrictamente `PermissionCode.REMOVE_LIVE_ACTIVE_ITEM`.
- Se elimino `DO_LIVE_RESERVATION` como fallback para retirar prenda al aire.
- No se cambio el endpoint.
- No se cambio RBAC.
- No se crearon permisos ni migraciones.

Se mantiene:

- `DO_LIVE_RESERVATION` para apartar en LIVE.
- `CHANGE_LIVE_ACTIVE_ITEM` para poner/cambiar prenda al aire, con la compatibilidad existente que no fue parte de esta fase.
- `VIEW_LIVE` / `OPERATE_LIVE` sin cambios.
- `close(...)` limpia `activeItem` como parte del cierre de LIVE autorizado.

## Comportamiento esperado por rol

| Rol / permiso | Retirar prenda al aire |
| --- | --- |
| Admin con `REMOVE_LIVE_ACTIVE_ITEM` | Permitido |
| Supervisor con `REMOVE_LIVE_ACTIVE_ITEM` | Permitido |
| Vendedor sin `REMOVE_LIVE_ACTIVE_ITEM` | Rechazado por backend |
| Usuario con `DO_LIVE_RESERVATION` solamente | Rechazado para retirar; conserva apartado LIVE |
| Usuario con `OPERATE_LIVE` solamente | Rechazado para retirar |
| Usuario con `CHANGE_LIVE_ACTIVE_ITEM` solamente | Rechazado para retirar; sirve para poner/cambiar segun reglas vigentes |

## Tests agregados / ajustados

Archivo:

- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`

Cobertura:

- `clearActiveItemDoesNotChangeInventoryStatus` ahora verifica que el backend exige `REMOVE_LIVE_ACTIVE_ITEM`.
- `clearActiveItemRejectsLiveReservationPermissionWithoutRemovePermission` valida que un usuario con `DO_LIVE_RESERVATION` pero sin `REMOVE_LIVE_ACTIVE_ITEM` no puede limpiar `activeItem`.
- `setActiveItemPersistsItemOnSameBranch` confirma que `CHANGE_LIVE_ACTIVE_ITEM` sigue permitiendo poner/cambiar prenda disponible.
- Tests existentes de reservas LIVE siguen cubriendo que `DO_LIVE_RESERVATION` se mantiene para apartados.

## Smoke API focalizado

Ejecutado:

- `GET http://localhost:8090/api/me` sin token: `401`, esperado.

Pendiente:

- `PATCH /api/lives/{id}/active-item` con usuario vendedor real.

Motivo:

- No hay credenciales QA documentadas disponibles en `.env` ni se deben inventar/imprimir secretos.
- No se ejecuto mutacion autenticada sin dataset/credenciales seguros.

Resultado: `PENDING_QA_API`.

## Relacion con LIVE-QA-C

Este cambio corrige el NO_GO especifico de LIVE-QA-C:

- Antes: seller sin `REMOVE_LIVE_ACTIVE_ITEM` podia retirar prenda al aire.
- Ahora: backend exige permiso dedicado y el test unitario cubre el rechazo.

Debe repetirse smoke API real con dataset desechable para cerrar evidencia runtime.

## Restricciones respetadas

No se tocaron:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones complejas;
- RBAC;
- permisos;
- endpoints;
- migraciones;
- venta financiera;
- frontend funcional.

## Validaciones

- `./mvnw.cmd -Dtest=LiveServiceTests test`: PASS.
- `./mvnw.cmd test`: PASS tras cargar `.env` en memoria y quitar comillas envolventes de valores, sin imprimir secretos.
- `npm.cmd run lint`: PASS, 0 errores, warnings preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.

## Pendientes

- Smoke API autenticado por rol con `qa.vendedor.centro@local.test`: esperar `403` en retiro de active item.
- Smoke positivo admin/supervisor con `REMOVE_LIVE_ACTIVE_ITEM`.
- QA visual si se requiere evidencia de UI.
