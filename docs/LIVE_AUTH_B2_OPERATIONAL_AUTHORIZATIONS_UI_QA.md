# LIVE-AUTH-B2 / UI y QA de autorizaciones operativas LIVE

Fecha: 2026-06-10
Rama: `feature/live-auth-b2-operational-auth-ui-qa`

## Resumen ejecutivo

Se agrego una UI minima para consultar y operar solicitudes de autorizacion operativa LIVE sobre el backend MVP creado en LIVE-AUTH-B1 y reparado con LIVE-AUTH-B1A.

La fase no crea permisos, no modifica RBAC, no crea migraciones y no agrega endpoints backend.

## Pantalla agregada

- Ruta: `/operational-authorizations`
- Navegacion: se agrega en la seccion `Operacion` cuando el usuario tiene `VIEW_LIVE_OPERATION_AUTHORIZATIONS` o `REQUEST_LIVE_OPERATION_AUTHORIZATION`.

La pantalla permite:

- listar solicitudes de la sucursal si el usuario tiene `VIEW_LIVE_OPERATION_AUTHORIZATIONS`;
- listar solo solicitudes propias si solo puede solicitar;
- ver detalle basico;
- crear solicitud si tiene `REQUEST_LIVE_OPERATION_AUTHORIZATION` y el permiso fino de la operacion;
- aprobar/rechazar si tiene `APPROVE_LIVE_OPERATION_AUTHORIZATION`;
- aplicar si tiene `APPLY_LIVE_OPERATION_AUTHORIZATION` y la solicitud esta `APPROVED`.

## Endpoints usados

Base: `/api/operational-authorizations`

- `POST /api/operational-authorizations`
- `GET /api/operational-authorizations/branch/{branchId}`
- `GET /api/operational-authorizations/mine/branch/{branchId}`
- `GET /api/operational-authorizations/{id}`
- `PATCH /api/operational-authorizations/{id}/approve`
- `PATCH /api/operational-authorizations/{id}/reject`
- `POST /api/operational-authorizations/{id}/apply`

No se inventaron endpoints.

## Permisos usados

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `UNDO_LIVE_OPERATIONAL_SALE`
- permisos finos ya existentes para cada tipo de solicitud.

## Estados visibles

- `REQUESTED`
- `APPROVED`
- `REJECTED`
- `APPLIED`
- `EXPIRED`
- `CANCELLED`

## Apply soportado

El backend B1 solo soporta aplicacion real para:

- `UNDO_LIVE_OPERATIONAL_SALE`

La UI muestra mensaje de aplicacion pendiente para operaciones aprobadas que aun no tienen contrato funcional de apply.

## Pendientes

- QA visual con navegador/screenshots reales.
- Smoke API mutante con dataset desechable para crear/aprobar/aplicar `UNDO_LIVE_OPERATIONAL_SALE`.
- UI contextual desde reservas/LIVE para crear solicitudes prellenadas.
- Aplicacion futura de `CANCEL_RESERVATION_WITH_PAYMENT`, `REASSIGN_RESERVATION`, `EDIT_LOCKED_ITEM` y otros flujos sensibles cuando exista contrato funcional.

## Alcance excluido

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- venta financiera;
- RBAC/permisos/migraciones;
- endpoints backend nuevos.
