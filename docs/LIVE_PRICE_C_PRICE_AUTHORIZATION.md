# LIVE-PRICE-C - Cambio de precio LIVE con autorizacion

Fecha: 2026-06-10
Rama: `feature/live-price-c-price-authorization`

## Resumen ejecutivo

LIVE-PRICE-C implementa un MVP seguro de autorizacion para cambio de precio LIVE usando el flujo generico de `operational_authorization_requests`.

Decision tomada:

- No existe un campo de precio LIVE temporal independiente.
- `items.price` es precio sugerido/base de inventario.
- `reservations.price` es el precio confirmado del apartado.
- El MVP aplica exclusivamente sobre `reservations.price` de una reserva LIVE activa, sin pago activo, sin vendido operativo y con prenda todavia `RESERVED`.

No se toca pago, caja, devolucion ni venta financiera.

Resultado esperado: `GO_TECNICO` con `PENDING_QA_VISUAL`.

## Modelo de precio encontrado

| Entidad | Campo | Uso |
|---|---|---|
| `items` | `price` | Precio sugerido/base de la prenda. Se muestra como referencia en LIVE. |
| `reservations` | `price` | Precio confirmado del apartado. Es el objetivo seguro del MVP. |
| `sales` | `price` | Precio historico de venta. No se modifica en esta fase. |

En `/live`, el precio editable antes de reservar vive en UI y se persiste al crear el apartado. No hay columna backend para precio temporal LIVE de prenda al aire sin apartado.

## Alcance implementado

- Nuevo tipo de autorizacion operativa: `LIVE_PRICE_CHANGE`.
- Nuevos permisos:
  - `REQUEST_LIVE_PRICE_CHANGE`
  - `APPROVE_LIVE_PRICE_CHANGE`
  - `APPLY_APPROVED_LIVE_PRICE_CHANGE`
  - `VIEW_LIVE_PRICE_AUTHORIZATIONS`
  - `CHANGE_LIVE_PRICE`
- Migracion Flyway `V57__live_price_authorization_permissions.sql`.
- Validacion de solicitud con `requestedPrice` en `payloadJson`.
- Aprobacion/rechazo exige permiso fino `APPROVE_LIVE_PRICE_CHANGE`.
- Aplicacion exige `APPLY_LIVE_OPERATION_AUTHORIZATION` y `APPLY_APPROVED_LIVE_PRICE_CHANGE`.
- Aplicacion cambia `reservations.price` solo si el snapshot sigue consistente.
- Evento LIVE `LIVE_PRICE_CHANGE_APPLIED`.
- UI minima en `/operational-authorizations` para crear solicitudes de precio por ID de apartado.

## Endpoints usados

Se reutilizan endpoints existentes:

- `POST /api/operational-authorizations`
- `GET /api/operational-authorizations/branch/{branchId}`
- `GET /api/operational-authorizations/mine/branch/{branchId}`
- `PATCH /api/operational-authorizations/{id}/approve`
- `PATCH /api/operational-authorizations/{id}/reject`
- `POST /api/operational-authorizations/{id}/apply`

No se crearon endpoints nuevos.

## Contrato de solicitud

Para `LIVE_PRICE_CHANGE`:

- `operationType`: `LIVE_PRICE_CHANGE`
- `targetType`: `RESERVATION`
- `targetId`: ID del apartado LIVE
- `reservationId`: mismo ID del apartado
- `payloadJson`: `{"requestedPrice": 249.50}`
- `reason`: obligatorio

## Reglas de aplicacion

La aplicacion solo procede si:

- la solicitud esta `APPROVED`;
- no esta expirada;
- la reserva pertenece al branch/company activo;
- la reserva pertenece a LIVE;
- `reservations.status = ACTIVE`;
- `live_operational_status` no es `OPERATIONAL_SOLD`;
- la prenda sigue `RESERVED`;
- no hay pago activo aplicado a la reserva;
- el snapshot de reserva coincide.

Si cualquiera de esas condiciones falla, no se aplica el cambio.

## Lo que no afecta

- No modifica `items.price`.
- No modifica `sales.price`.
- No crea ventas.
- No crea pagos.
- No modifica caja.
- No procesa devoluciones.
- No recalcula saldos financieros.
- No cambia precio historico de ventas cerradas.

## UI

La pantalla `/operational-authorizations` ahora permite crear `LIVE_PRICE_CHANGE`.

Para esta operacion:

- fuerza objetivo `RESERVATION`;
- solicita ID del apartado LIVE;
- solicita precio requerido;
- envia `requestedPrice` en `payloadJson`;
- permite aplicar si backend y permisos lo autorizan.

Queda pendiente una UI contextual desde `/live` o detalle de apartado para prellenar el ID y el precio actual.

## RBAC

Asignacion inicial por migracion:

- `ADMIN` y `SUPERVISOR`: solicitar, ver, aprobar, aplicar y cambiar precio LIVE.
- `SELLER`: solicitar cambio de precio LIVE.

`SELLER` no recibe aprobacion ni aplicacion.

## Rollback

Si se requiere revertir:

1. Revertir el commit de LIVE-PRICE-C.
2. Si `V57` ya fue aplicada, no editar ni borrar la migracion aplicada.
3. Crear una migracion posterior para revocar asignaciones si negocio lo requiere.
4. Las solicitudes existentes en `operational_authorization_requests` deben conservarse como auditoria o migrarse con plan DBA.

## Riesgos y mitigacion

| Riesgo | Mitigacion |
|---|---|
| Cambiar precio con pago activo | Bloqueado por `PaymentAllocation` + `PaymentStatus.ACTIVE`. |
| Cambiar venta cerrada | No se toca `sales.price`. |
| Cambiar apartado ya vendido operativamente | Bloqueado si `OPERATIONAL_SOLD`. |
| Aplicar sobre estado cambiado | Snapshot hash provoca conflicto. |
| Simular precio temporal LIVE inexistente | No se implementa; queda pendiente de modelo. |

## QA

Cubierto por tests backend:

- seller/usuario solicitante requiere permisos de solicitud;
- aprobacion requiere permiso fino;
- aplicacion cambia precio de reserva LIVE segura;
- reserva `OPERATIONAL_SOLD` queda bloqueada.

Pendientes:

- smoke API real con dataset desechable;
- QA visual con screenshots por rol;
- UI contextual desde LIVE/reservas.
