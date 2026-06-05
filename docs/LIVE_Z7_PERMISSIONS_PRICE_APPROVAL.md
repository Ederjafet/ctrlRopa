# LIVE-Z7 - Permisos finos, precio LIVE y autorizacion operativa

## Objetivo

Formalizar reglas sensibles de LIVE sin crear roles paralelos. La fuente de verdad sigue siendo:

AUTH real -> permisos reales -> capacidades LIVE -> vista y acciones permitidas.

Los nombres Operador, Vendedor/Presentadora y Supervisor son experiencias visuales de negocio. No reemplazan AUTH/RBAC.

## Auditoria /api/me

API local validada: `http://localhost:8090`

| Usuario QA | Estado /api/me | Rol real | Permisos relevantes detectados | Empresa / sucursal | Capacidades LIVE resultantes | Vista LIVE resultante | Acciones permitidas | Acciones bloqueadas / gaps |
|---|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ACTIVE | `ADMIN` | `DO_LIVE_RESERVATION`, `CANCEL_RESERVATION`, `MANAGE_INVENTORY`, `REGISTER_PAYMENTS`, `MANAGE_CASH_CLOSURES`, `VIEW_REPORTS`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`; no aparece `VIEW_PAYMENTS` | `HPSQ-SOFT Default Company` / `QA Centro` | ver/operar LIVE, iniciar/cerrar, preparar prenda, poner/sacar al aire, reservar, cancelar, vendido operativo, cambiar precio LIVE; no liberar prenda si no se confirma pagos | Operador | Operacion LIVE completa desde frontend; cambio de precio LIVE con confirmacion | `VIEW_PAYMENTS` no viene en /api/me; liberacion segura queda bloqueada por falta de confirmacion de pagos |
| `qa.vendedor.centro@local.test` | ACTIVE | `SELLER` | `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `REGISTER_PAYMENTS`; no `CANCEL_RESERVATION`, no `MANAGE_INVENTORY`, no `VIEW_REPORTS`, no `VIEW_PAYMENTS` | `HPSQ-SOFT Default Company` / `QA Centro` | ver LIVE y apoyo visual; no cambio de precio LIVE | Vendedor/Presentadora | lectura/apoyo visual; precio solo lectura con solicitud de autorizacion pendiente | no cancelar, no liberar, no dashboard supervisor, no editar precio LIVE |
| `qa.supervisor.centro@local.test` | ACTIVE | `SUPERVISOR` | `DO_LIVE_RESERVATION`, `CANCEL_RESERVATION`, `MANAGE_INVENTORY`, `VIEW_REPORTS`, `REGISTER_PAYMENTS`, `MANAGE_CASH_CLOSURES`; no `VIEW_PAYMENTS` | `HPSQ-SOFT Default Company` / `QA Centro` | ver dashboard supervisor, eventos, reservas; puede tener capacidad de precio LIVE por permisos actuales, pero la vista sigue siendo Supervisor | Supervisor | monitoreo/control, indicadores reales disponibles | liberacion segura bloqueada por falta de `VIEW_PAYMENTS`; no se convierte en consola operador |
| `qa.sinpermisos@local.test` | login 403 | NO_ACCESS / sin permisos efectivos | No se obtuvo /api/me porque login fue rechazado | No disponible | sin capacidades LIVE | NO_ACCESS | ninguna | bloqueado desde AUTH |

## Permisos reales encontrados

Backend actual (`PermissionCode.java`) contiene permisos reutilizables:

- `DO_LIVE_RESERVATION`
- `CANCEL_RESERVATION`
- `VIEW_CUSTOMERS`
- `CREATE_CUSTOMER`
- `VIEW_INVENTORY`
- `MANAGE_INVENTORY`
- `VIEW_REPORTS`
- `VIEW_PAYMENTS`
- `REGISTER_PAYMENTS`
- `MANAGE_CASH_CLOSURES`

No se encontraron permisos granulares formales para:

- `START_LIVE`
- `CLOSE_LIVE`
- `SET_ACTIVE_LIVE_ITEM`
- `CLEAR_LIVE_ACTIVE_ITEM`
- `UPDATE_LIVE_PRICE`
- `RELEASE_LIVE_RESERVED_ITEM`
- `REQUEST_LIVE_AUTHORIZATION`

## Capacidades LIVE aplicadas

Archivo principal: `services/liveCapabilities.ts`

- `canViewLive`: canal LIVE activo y permiso/rol de lectura u operacion.
- `canStartLive` / `canCloseLive`: conservadoramente derivado de `DO_LIVE_RESERVATION`.
- `canPrepareItem`, `canSetActiveItem`, `canClearActiveItem`: derivado de operacion LIVE + `VIEW_INVENTORY`.
- `canCreateReservation`: derivado de `DO_LIVE_RESERVATION`.
- `canCancelReservation`: derivado de `DO_LIVE_RESERVATION` + `CANCEL_RESERVATION`.
- `canMarkOperationalSold`: derivado de operacion LIVE.
- `canChangeLivePrice`: endurecido en Z7. Ya no depende solo de operacion LIVE; requiere admin o combinacion conservadora de inventario/cancelacion/dashboard.
- `canReleaseReservedItem`: requiere cancelacion, inventario y `VIEW_PAYMENTS`.

## Precio LIVE vs precio base

Precio base:

- Pertenece a la prenda/catalogo.
- No se modifica desde LIVE.

Precio LIVE:

- Es el precio capturado para la reserva en transmision.
- Puede diferir del precio base.
- Se envia en `createReservation.price`.

Cambios Z7:

- Si el usuario no tiene `canChangeLivePrice`, el precio se muestra como solo lectura.
- Se muestra `Solicitar autorizacion`.
- La solicitud no se simula como autorizacion real; muestra mensaje de pendiente.
- Si el usuario si puede cambiar precio y el precio LIVE difiere del sugerido/base, se pide confirmacion antes de crear la reserva.

Gap:

- No existe bitacora backend especifica para cambio de precio LIVE.
- Pendiente permiso granular `UPDATE_LIVE_PRICE`.

## Cancelacion con motivo

La consola ya pide motivo antes de cancelar apartado:

- Cliente desistio
- Error de captura
- Duplicado
- Sin inventario
- Otro

El frontend envia el motivo a `updateLiveReservationOperationalStatus(..., 'CANCELLED', reason)`.

Gap:

- La persistencia depende del soporte backend actual del campo `liveOperationalStatusReason`.
- Nota libre para `Otro` queda pendiente.

## Liberacion segura de prenda

Regla conservadora:

- No se libera automaticamente.
- Solo se considera segura si la reserva esta cancelada, no tiene pago aplicado, no esta vendida, no hay otra reserva activa, pertenece al mismo tenant/sucursal y el usuario tiene capacidad.
- Si falta `VIEW_PAYMENTS`, no se puede confirmar pago y no se libera.

Estado Z7:

- No se implementa liberacion real porque no hay endpoint seguro especifico.
- Queda documentado para una fase posterior.

## Solicitud de autorizacion

Se agrega UX para acciones bloqueadas por precio LIVE:

- Boton `Solicitar autorizacion`.
- Motivos:
  - Promocion en vivo
  - Ajuste por defecto
  - Cliente frecuente
  - Autorizacion verbal
  - Otro
- Mensaje final:
  - Solicitud pendiente de implementar.

No se crea backend ni se simula aprobacion.

Pendiente recomendado: `LIVE-Z8 - mensajeria interna y solicitudes de autorizacion`.

## Auditoria operacional

Eventos existentes/revisados:

- Prenda al aire cambiada.
- Reserva creada.
- Reserva cancelada operativamente.
- Vendido operativo.
- Estado operativo actualizado.

Gaps:

- Intentos bloqueados por permiso no quedan en bitacora operacional.
- Cambio de precio LIVE no tiene evento granular.
- Solicitud de autorizacion no se persiste.

## GO / NO-GO

GO para Z7 frontend:

- Capacidad conservadora para precio LIVE.
- Precio solo lectura cuando no hay capacidad.
- Solicitud de autorizacion visible sin simular backend.
- Confirmacion cuando precio LIVE difiere del precio sugerido/base.
- Cancelacion con motivo se mantiene.

NO-GO en Z7:

- Crear permisos backend sin migracion formal.
- Liberar prenda sin endpoint seguro.
- Simular autorizacion real.
- Tocar pagos/caja/reportes/billing/IA.

## Siguiente fase recomendada

LIVE-Z8:

- Permisos granulares formales de LIVE en backend/RBAC.
- Mensajeria interna de solicitudes de autorizacion.
- Evento `LIVE_PRICE_CHANGED`.
- Endpoint seguro para liberacion de prenda con validacion de pagos.
- Auditoria operacional de intentos bloqueados.
