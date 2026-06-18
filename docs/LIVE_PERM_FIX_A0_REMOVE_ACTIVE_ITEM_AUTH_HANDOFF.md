# LIVE-PERM-FIX-A0 - Handoff autorizacion REMOVE_LIVE_ACTIVE_ITEM

Fecha: 2026-06-10

## Resultado

`HANDOFF_TECNICO_COMPLETO`

`NO_IMPLEMENTATION`

`PENDING_APPROVAL_FOR_LIVE_PERM_FIX_A1`

## Hallazgo exacto de LIVE-QA-C

LIVE-QA-C termino en `NO_GO` porque `qa.vendedor.centro@local.test` pudo retirar la prenda al aire por API aunque no tiene `REMOVE_LIVE_ACTIVE_ITEM`.

Evidencia documentada:

- `docs/LIVE_QA_C_VISUAL_DISPOSABLE_FLOW.md`: vendedor con permisos `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `VIEW_LIVE`, sin `REMOVE_LIVE_ACTIVE_ITEM`.
- `PATCH /api/lives/15/active-item` con `itemId: null` respondio `200`.
- `qa-reports/LIVE-QA-C-visual-disposable-flow-report-20260610-104030.md`: `SELLER_REMOVE_ACTIVE_ITEM status=200 UNEXPECTED`.

## Usuario / rol afectado

| Usuario | Rol | Permiso faltante |
| --- | --- | --- |
| `qa.vendedor.centro@local.test` | `SELLER` | `REMOVE_LIVE_ACTIVE_ITEM` |

El vendedor conserva permisos LIVE para ver, operar, preparar, cambiar prenda y apartar, pero no debe poder retirar la prenda al aire.

## Endpoint y metodo probable afectado

Endpoint:

- `PATCH /api/lives/{id}/active-item`

Frontend service:

- `services/liveService.ts` -> `setLiveActiveItem(liveId, itemId)`
- El retiro usa `itemId: null`.

Backend controller:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- Metodo `setActiveItem(@PathVariable Long id, @RequestBody LiveActiveItemRequest request)`

Backend service:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- Metodo `setActiveItem(Long id, LiveActiveItemRequest request)`
- Rama de retiro: `request == null || request.getItemId() == null`

## Diferencia frontend capability vs backend enforcement

Frontend:

- `services/liveCapabilities.ts` calcula `canClearActiveItem` con `removeLiveActiveItemPermission || canManageLiveItem`.
- `removeLiveActiveItemPermission` depende de `REMOVE_LIVE_ACTIVE_ITEM`.
- Por capacidad visual, el vendedor sin `REMOVE_LIVE_ACTIVE_ITEM` no deberia ver/usar retiro desde UI.

Backend:

- `LiveService.setActiveItem(...)` llama `assertCanRemoveLiveActiveItem(...)` cuando `itemId` es `null`.
- `assertCanRemoveLiveActiveItem(...)` actualmente acepta `PermissionCode.REMOVE_LIVE_ACTIVE_ITEM` con fallback `PermissionCode.DO_LIVE_RESERVATION`.
- Como el vendedor tiene `DO_LIVE_RESERVATION`, la API autoriza el retiro aunque no tenga `REMOVE_LIVE_ACTIVE_ITEM`.

## Causa probable

Compatibilidad legacy demasiado amplia en backend. `DO_LIVE_RESERVATION` se conserva para apartados LIVE, pero en la rama de retirar prenda al aire funciona como fallback de una accion sensible que ya tiene permiso dedicado.

Esta brecha no es de catalogo ni de asignacion de roles: el usuario efectivamente no tiene `REMOVE_LIVE_ACTIVE_ITEM`. La brecha esta en enforcement del endpoint.

## Impacto / riesgo

Riesgo: alto.

- Un vendedor con permiso de apartado LIVE puede dejar una transmision activa sin prenda al aire por API directa.
- La UI puede ocultar el boton, pero la proteccion critica queda incompleta si el endpoint acepta el fallback legacy.
- Puede interrumpir operacion LIVE, afectar continuidad visual y generar eventos `ACTIVE_ITEM_CHANGED` no autorizados.
- No toca pagos/caja/precio, pero bloquea avance seguro de QA LIVE y HOME-LIVE-A.

## Fix recomendado para LIVE-PERM-FIX-A1

Implementar un fix backend focalizado:

1. Separar el enforcement de retiro para que `assertCanRemoveLiveActiveItem(...)` exija `REMOVE_LIVE_ACTIVE_ITEM` sin fallback `DO_LIVE_RESERVATION`.
2. Mantener compatibilidad legacy solo donde corresponda:
   - lectura LIVE: `VIEW_LIVE`, `OPERATE_LIVE`, `DO_LIVE_RESERVATION`;
   - operar sesion si asi esta documentado: `OPERATE_LIVE`, `DO_LIVE_RESERVATION`;
   - apartar LIVE: `DO_LIVE_RESERVATION`;
   - cambiar/poner prenda al aire: evaluar si `CHANGE_LIVE_ACTIVE_ITEM` tambien debe perder fallback en una fase separada o dentro de A1 con decision explicita.
3. Agregar prueba backend que simule usuario con `DO_LIVE_RESERVATION` pero sin `REMOVE_LIVE_ACTIVE_ITEM` y valide `AccessDeniedException` al limpiar active item.
4. Agregar prueba positiva con `REMOVE_LIVE_ACTIVE_ITEM`.
5. Confirmar que cerrar LIVE (`close`) sigue limpiando `activeItem` por accion de cerrar sesion y no depende del endpoint de retiro manual.

## Archivos que probablemente tocara LIVE-PERM-FIX-A1

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- Posible test controller si existe o si se decide cubrir endpoint HTTP.
- Documentacion y reporte de la fase A1.

No se recomienda tocar frontend para el fix principal, porque el frontend ya expresa la capacidad esperada.

## Tests minimos requeridos

Backend:

- Usuario con `DO_LIVE_RESERVATION` y sin `REMOVE_LIVE_ACTIVE_ITEM` no puede limpiar `activeItem`.
- Usuario con `REMOVE_LIVE_ACTIVE_ITEM` puede limpiar `activeItem`.
- Retirar prenda no cambia `items.status`.
- Retirar prenda registra `ACTIVE_ITEM_CHANGED` solo cuando esta autorizado.
- Cerrar LIVE conserva comportamiento esperado y limpia active item como parte del cierre.

Validaciones:

- `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `git --no-pager diff --check`
- `git --no-pager diff --cached --check`

## QA focalizado posterior

Repetir smoke API con dataset desechable:

- Login `qa.vendedor.centro@local.test`.
- Confirmar `/api/me` sin `REMOVE_LIVE_ACTIVE_ITEM`.
- Preparar/cambiar prenda al aire si sus permisos actuales lo permiten.
- Intentar `PATCH /api/lives/{id}/active-item` con `itemId: null`.
- Resultado esperado: `403` o rechazo equivalente.
- Confirmar que admin/supervisor con `REMOVE_LIVE_ACTIVE_ITEM` si pueden retirar.
- Confirmar que el cierre de LIVE autorizado no queda roto.
- Confirmar que no se crean ventas, pagos ni movimientos de caja.

## Confirmacion de alcance

En A0 no se implemento ningun cambio funcional.

No se tocaron:

- backend funcional;
- RBAC;
- permisos reales;
- migraciones;
- endpoints;
- frontend funcional;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones complejas.

## GO/NO-GO para implementar fix

`GO_FOR_LIVE_PERM_FIX_A1`

El hallazgo esta suficientemente acotado para una fase A1 de backend/autorizacion focalizada, con pruebas minimas obligatorias y sin cambios de catalogo/RBAC.
