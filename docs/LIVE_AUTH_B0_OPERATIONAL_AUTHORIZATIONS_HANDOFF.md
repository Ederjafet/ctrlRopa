# LIVE-AUTH-B0 - Handoff autorizaciones operativas reales

Fecha: 2026-06-10
Rama: feature/live-auth-b0-operational-authorizations-handoff

## 1. Resumen ejecutivo

LIVE-AUTH-B0 consolida el handoff arquitectonico para autorizaciones operativas reales sobre la base LIVE RC1. Esta fase no implementa codigo, no crea endpoints, no crea migraciones, no crea permisos y no cambia RBAC. El objetivo es dejar listo el diseno para una fase posterior `LIVE-AUTH-B1`, porque las acciones afectadas cruzan LIVE, inventario, reservas, pagos, saldos, ventas operativas y auditoria.

Se requiere autorizacion operativa porque la base LIVE ya permite operar el flujo seguro principal, pero mantiene bloqueadas o sin contrato formal varias acciones sensibles:

- deshacer vendido operativo LIVE;
- cancelar/liberar reserva con pago activo;
- cancelar reserva convertida a venta;
- reasignar reserva a otro cliente;
- editar prenda bloqueada, reservada o vendida operativamente;
- liberar item/reserva en estado inconsistente;
- operaciones manuales de soporte sobre LIVE, reservas, inventario o trazabilidad.

Resultado de esta fase:

- `HANDOFF_ARQUITECTONICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_LIVE_AUTH_B1`

## 2. Estado actual

### Permisos LIVE existentes

La base RC1 ya tiene permisos LIVE minimos reales:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- `DO_LIVE_RESERVATION`

Evidencia:

- `PermissionCode.java` define permisos LIVE base.
- `LiveService.assertCanRemoveLiveActiveItem(...)` exige `REMOVE_LIVE_ACTIVE_ITEM`.
- `services/liveCapabilities.ts` deriva capacidades como `canViewLive`, `canOperateLive`, `canSetActiveItem`, `canClearActiveItem` y `canCreateReservation`.
- `LIVE-QA-C2` confirma seller 403 al retirar active item sin `REMOVE_LIVE_ACTIVE_ITEM`.

### Cancelacion segura

`ReservationService.cancel(...)`:

- exige `CANCEL_RESERVATION`;
- solo cancela reservas `ACTIVE`;
- bloquea reservas `CONVERTED_TO_SALE`;
- calcula pagos activos aplicados mediante `PaymentAllocation` + `PaymentStatus.ACTIVE`;
- si existe pago activo, bloquea el flujo normal y pide reversa formal;
- libera inventario solo con `ItemRepository.releaseIfReserved(...)` de `RESERVED` a `AVAILABLE`;
- registra rechazos mediante `reservation_rejection_events`;
- registra eventos LIVE cuando aplica.

### Vendido operativo

`ReservationService.updateLiveOperationalStatus(...)` permite actualizar estado operativo de reservas LIVE bajo acceso de administracion de reserva LIVE. Para `OPERATIONAL_SOLD` valida:

- reserva pertenece a LIVE;
- reserva no esta `CANCELLED`;
- reserva no esta `CONVERTED_TO_SALE`;
- reserva sigue `ACTIVE`;
- item sigue `RESERVED`.

Al marcar `OPERATIONAL_SOLD`:

- registra `LIVE_RESERVATION_STATUS_CHANGED`;
- registra evento dedicado `LIVE_OPERATIONAL_SOLD`;
- no crea venta financiera;
- no crea pago;
- no toca caja.

### Pagos y saldos detectables

`PaymentService`:

- registra pagos con `REGISTER_PAYMENTS`;
- consulta pagos con `VIEW_PAYMENTS`;
- anula pagos con `VOID_PAYMENT`;
- usa `PaymentStatus.ACTIVE` para pagos vigentes;
- usa `PaymentAllocation` para vincular pagos con reservas o ventas;
- puede generar saldo por sobrepago mediante `BalanceService`.

Riesgo: cualquier cancelacion o reversa con pago activo no puede resolverse solo desde LIVE. Debe existir contrato formal de autorizacion y reversa financiera antes de aplicar cambios.

### Ventas y conversion de reservas

`SaleService.create(...)` puede convertir una reserva activa a venta:

- migra allocations de reserva a venta;
- marca la reserva como `CONVERTED_TO_SALE`;
- mantiene item `RESERVED` hasta que el estado de pago determine `SOLD`;
- sincroniza pago/orden.

`SaleService.cancel(...)` existe para ventas, exige `CANCEL_SALE` y libera item a `AVAILABLE`, pero ese flujo es financiero/venta, no debe usarse como reversa LIVE sin diseno.

### Trazabilidad actual

La base actual ya tiene:

- `live_events` para eventos LIVE;
- `reservation_rejection_events` para rechazos de reserva/cancelacion;
- `system_movement_audit_log` e infraestructura de security audit para seguridad general;
- eventos existentes: `LIVE_STARTED`, `LIVE_CLOSED`, `ACTIVE_ITEM_CHANGED`, `LIVE_RESERVATION_CREATED`, `LIVE_RESERVATION_STATUS_CHANGED`, `LIVE_OPERATIONAL_SOLD`, `LIVE_RESERVATION_CANCELLED`.

Brecha: no existe entidad persistente de solicitud/aprobacion/aplicacion de autorizaciones operativas.

## 3. Acciones sensibles

| Accion | Riesgo | Estado actual | Solicita | Aprueba | Permisos sugeridos | Datos requeridos | Evento/auditoria | Bloqueos | Rollback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deshacer vendido operativo LIVE | Puede reabrir un cierre operativo y alterar reportes/actividad | No hay permiso backend dedicado ni flujo de autorizacion real | Operador/admin con acceso LIVE | Supervisor/admin con permiso de aprobacion | `UNDO_LIVE_OPERATIONAL_SALE`, `REQUEST_LIVE_OPERATION_AUTHORIZATION`, `APPROVE_LIVE_OPERATION_AUTHORIZATION`, `APPLY_LIVE_OPERATION_AUTHORIZATION` | reservationId, liveId, itemId, estado actual, motivo, snapshot de pago | `LIVE_AUTH_REQUEST_*`, `LIVE_OPERATIONAL_SOLD_UNDONE` futuro | Bloquear si reserva no esta ACTIVE, item no RESERVED, pago/caja asociada sin contrato | Restaurar estado previo solo si snapshot coincide; evento compensatorio |
| Cancelar/liberar reserva con pago activo | Riesgo financiero y de caja; puede dejar saldo o pago huerfano | Cancelacion normal bloquea si hay `PaymentStatus.ACTIVE` aplicado | Operador/caja/supervisor segun politica | Supervisor/caja/admin con permiso | `CANCEL_RESERVATION_WITH_PAYMENT`, `RELEASE_RESERVED_ITEM`, autorizacion operativa | reservationId, paymentAllocationIds, paymentIds, monto activo, cliente, item, motivo | solicitud, aprobacion, aplicacion, reversa financiera si existe | Bloquear si no hay contrato de reversa; bloquear si pago ya cambio | Reversa formal de pago/saldo primero; luego liberar item |
| Cancelar reserva convertida a venta | Puede romper venta, orden, pagos y reportes | `ReservationService.cancel` bloquea `CONVERTED_TO_SALE` | Soporte/admin | Supervisor/admin financiero | `CANCEL_SALE`, `CANCEL_RESERVATION_WITH_PAYMENT`, autorizacion operativa especifica | reservationId, saleId, orderId, payment allocations, estado de item | solicitud y evento de aplicacion con relacion venta/reserva | Bloquear si venta tiene pago/caja sin reversa | Revertir venta con contrato financiero, no desde reserva |
| Reasignar reserva a otro cliente | Afecta cliente, orden, pagos, reportes y trazabilidad | No hay endpoint dedicado detectado para reserva LIVE | Operador/supervisor | Supervisor/admin con scope | `REASSIGN_RESERVATION`, autorizacion operativa | reservationId, oldCustomerId, newCustomerId, orderId, pagos activos | evento de reasignacion y auditoria de cliente | Bloquear si hay pago activo sin consentimiento/contrato | Volver a cliente anterior solo si no hubo pagos/venta posteriores |
| Editar prenda bloqueada/reservada/vendida operativamente | Puede alterar precio, descripcion, estado o trazabilidad de item en flujo activo | UI de item bloquea edicion si no esta AVAILABLE; no hay permiso dedicado | Soporte/inventario | Supervisor/admin inventario | `EDIT_LOCKED_ITEM`, autorizacion operativa | itemId, campos afectados, reserva/venta/live asociados, motivo | evento de item editado con snapshot | Bloquear campos financieros o estado sin contrato | Restaurar snapshot de campos editados si sigue consistente |
| Liberar item/reserva en estado inconsistente | Puede ocultar corrupcion o doble reserva | Cancelacion segura solo libera si item esta `RESERVED`; inconsistencias rechazan | Soporte/admin | Admin tecnico/operativo | `RELEASE_RESERVED_ITEM`, autorizacion operativa | itemId, reservationId, estado item, reservas activas, pagos, liveId | evento de soporte y rechazo/aplicacion | Bloquear si hay pago, venta activa o mismatch no explicado | Aplicacion compensatoria con snapshot y auditoria |
| Operaciones manuales de soporte LIVE/reservas | Riesgo de bypass por API y cambios no trazados | No hay flujo formal de solicitud/aprobacion | Soporte con permiso de solicitud | Admin/supervisor con permiso y scope | `REQUEST_LIVE_OPERATION_AUTHORIZATION`, `APPROVE_LIVE_OPERATION_AUTHORIZATION`, `APPLY_LIVE_OPERATION_AUTHORIZATION` | targetType, targetId, reason, payload minimo, snapshot | eventos `LIVE_AUTH_REQUEST_*` y security audit | Bloquear self-approval, cross-tenant, autorizacion expirada | Compensacion por evento; no borrar trazas |

## 4. Modelo recomendado

Crear en fase posterior una entidad generica, por ejemplo `operational_authorization_requests`, no especifica solo de precio ni solo de reservas.

Campos sugeridos:

| Campo | Uso |
| --- | --- |
| `id` | Identificador interno. |
| `request_type` | Tipo: `UNDO_LIVE_OPERATIONAL_SALE`, `CANCEL_RESERVATION_WITH_PAYMENT`, `REASSIGN_RESERVATION`, etc. |
| `status` | `REQUESTED`, `APPROVED`, `REJECTED`, `APPLIED`, `EXPIRED`, `CANCELLED`. |
| `company_id` | Aislamiento tenant obligatorio. |
| `branch_id` | Scope operativo obligatorio. |
| `requested_by_user_id` | Usuario solicitante. |
| `requested_at` | Fecha de solicitud. |
| `decided_by_user_id` | Aprobador/rechazador. |
| `decided_at` | Fecha de decision. |
| `applied_by_user_id` | Usuario que aplica la autorizacion. |
| `applied_at` | Fecha de aplicacion. |
| `expires_at` | Vencimiento por tipo de accion. |
| `target_type` | `LIVE`, `RESERVATION`, `ITEM`, `PAYMENT`, `SALE`, `SUPPORT`. |
| `target_id` | Recurso principal. |
| `live_id` | Relacion opcional. |
| `reservation_id` | Relacion opcional. |
| `item_id` | Relacion opcional. |
| `payment_id` | Relacion opcional. |
| `sale_id` | Relacion opcional. |
| `reason` | Motivo del solicitante. |
| `decision_reason` | Motivo de aprobacion/rechazo. |
| `current_state_hash` | Hash del snapshot para detectar cambios antes de aplicar. |
| `snapshot_json` | Estado minimo necesario, sin secretos ni datos sensibles innecesarios. |
| `payload_json` | Datos de aplicacion solicitados. |
| `created_at`, `updated_at` | Auditoria tecnica. |

Reglas de modelo:

- no guardar tokens, passwords, datos de tarjeta ni secretos;
- usar snapshot minimo y hash para detectar drift;
- una solicitud `REQUESTED` por `request_type + company_id + branch_id + target_type + target_id` salvo excepcion aprobada;
- aprobador distinto al solicitante;
- aplicacion revalida estado real, permisos, tenant y branch;
- autorizacion aprobada no debe aplicar si el recurso cambio de forma incompatible.

## 5. Permisos propuestos

Permisos futuros ya mapeados como etiquetas frontend o documentados, pero no creados en esta fase:

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`

Recomendacion:

- solicitantes: `REQUEST_LIVE_OPERATION_AUTHORIZATION` mas permiso base de la accion o vista;
- aprobadores: `APPROVE_LIVE_OPERATION_AUTHORIZATION` y scope company/branch compatible;
- aplicadores: `APPLY_LIVE_OPERATION_AUTHORIZATION`, o aplicacion automatica transaccional por el servicio al aprobar si arquitectura lo permite;
- lectores/cola: `VIEW_LIVE_OPERATION_AUTHORIZATIONS`;
- permisos de accion fina como `UNDO_LIVE_OPERATIONAL_SALE`, `RELEASE_RESERVED_ITEM`, `REASSIGN_RESERVATION` deben existir solo si se aprueban en B1.

No crear permisos sin migracion, seeds, tests y matriz QA por rol.

## 6. Diseno de flujo

### Solicitud

1. Usuario intenta una accion sensible.
2. Backend detecta que requiere autorizacion o frontend muestra accion `Solicitar autorizacion` solo si existe backend real.
3. Se captura motivo obligatorio.
4. Backend guarda solicitud con snapshot minimo del recurso y estado `REQUESTED`.
5. Se registra evento de auditoria.

### Revision

1. Aprobador consulta cola filtrada por company/branch/permisos.
2. Ve snapshot: live, reserva, item, cliente, pago/saldo si aplica y riesgo.
3. No puede aprobar su propia solicitud.
4. Si el recurso cambio, se muestra warning y se obliga a rechazar o regenerar solicitud.

### Aprobacion/rechazo

1. Aprobador decide con motivo.
2. Estado pasa a `APPROVED` o `REJECTED`.
3. Se registra evento.
4. Una aprobacion queda con TTL; no es autorizacion permanente.

### Aplicacion

1. Usuario autorizado o servicio aplica la accion.
2. Se revalida estado actual contra snapshot/hash.
3. Se revalidan permisos, tenant, branch, pago, venta y estado de item.
4. Si pasa, se aplica en una transaccion corta e idempotente.
5. Estado pasa a `APPLIED` y se registra evento.

### Caducidad

- Jobs o validacion lazy marcan `EXPIRED`.
- Solicitudes expiradas no aplican.
- Si se requiere de nuevo, se crea una solicitud nueva con snapshot actualizado.

### Manejo de errores

- `403`: usuario sin permiso/scope.
- `409`: snapshot obsoleto, solicitud duplicada o estado cambio.
- `422`: accion no aplicable por reglas de negocio.
- `404`: target no existe dentro del scope.

### UI minima

- Boton `Solicitar autorizacion` solo cuando exista backend real.
- Cola de autorizaciones para aprobador.
- Detalle con snapshot, motivo, riesgo y estado.
- Estados visibles: solicitada, aprobada, rechazada, aplicada, vencida, cancelada.
- No simular pendientes locales.

## 7. Riesgos

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Permisos excesivos | Usuarios podrian ejecutar reversas o liberaciones sensibles | Permisos dedicados y aprobacion por permiso efectivo, no por rol visual |
| Bypass por API | UI oculta boton pero backend permite accion | Backend debe validar autorizacion y permiso en cada endpoint sensible |
| Autorizacion sobre dato que cambio | Aplicar sobre reserva/pago distinto al snapshot | Hash/snapshot y revalidacion transaccional |
| Doble aplicacion | Duplicidad de reversa o liberacion | Estado `APPLIED`, idempotencia por request y locks transaccionales |
| Pagos/caja | Riesgo financiero, saldos incorrectos, caja descuadrada | No tocar pagos/caja hasta contrato financiero aprobado |
| Tenant/branch isolation | Aprobador aplica fuera de scope | Validar company/branch en solicitud, cola, decision y aplicacion |
| Auditoria incompleta | Sin trazabilidad de decisiones sensibles | Eventos dedicados + system movement/security audit |
| Self-approval | Control interno debil | Bloquear solicitante = aprobador |
| Datos sensibles en payload | Exposicion accidental | Snapshot minimo, sin secretos, sin tarjetas, sin tokens |

## 8. Plan LIVE-AUTH-B1

Alcance minimo implementable recomendado:

1. Crear modelo backend `operational_authorization_requests`.
2. Crear migracion aditiva sin tocar datos existentes.
3. Crear permisos aprobados por arquitectura:
   - `REQUEST_LIVE_OPERATION_AUTHORIZATION`
   - `APPROVE_LIVE_OPERATION_AUTHORIZATION`
   - `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
   - `APPLY_LIVE_OPERATION_AUTHORIZATION`
4. Implementar endpoints read/write de solicitud, cola, decision y aplicacion controlada.
5. Implementar un solo caso de aplicacion inicial, preferentemente `UNDO_LIVE_OPERATIONAL_SALE` sin pago activo o `RELEASE_RESERVED_ITEM` sin pago, segun aprobacion.
6. Mantener cancelacion con pago como bloqueo hasta diseno financiero/caja.
7. Registrar eventos de auditoria.
8. Agregar tests backend unitarios/integracion por permisos, tenant, branch, estados y self-approval.

Endpoints probables:

- `POST /api/operational-authorizations`
- `GET /api/operational-authorizations/pending`
- `GET /api/operational-authorizations/my-requests`
- `GET /api/operational-authorizations/{id}`
- `PATCH /api/operational-authorizations/{id}/approve`
- `PATCH /api/operational-authorizations/{id}/reject`
- `PATCH /api/operational-authorizations/{id}/cancel`
- `POST /api/operational-authorizations/{id}/apply`

Servicios probables a tocar:

- nuevo `OperationalAuthorizationService`;
- `ReservationService` solo para integrar aplicacion aprobada, no para relajar guards;
- `LiveEventService` para eventos operativos;
- `AccessService` solo para validar permisos existentes/nuevos;
- frontend `/live` y cola futura solo despues de backend real.

Tests requeridos:

- crear solicitud con permiso de solicitud;
- bloquear solicitud sin permiso;
- bloquear cross-tenant/cross-branch;
- aprobar con permiso y scope;
- bloquear self-approval;
- rechazar con motivo;
- aplicar solo `APPROVED` no expirada;
- bloquear aplicacion si snapshot cambio;
- bloquear doble aplicacion;
- registrar eventos;
- no tocar pago/caja en caso MVP.

QA requerido:

- smoke API por rol;
- smoke visual de cola si hay UI;
- dataset desechable;
- evidencia de 403/409/422;
- confirmacion de que pagos/caja no se mutan;
- no marcar `QA_PASS` sin evidencia real.

Criterios GO/NO-GO para implementar:

- GO si arquitectura aprueba permisos, tabla, endpoints y primer caso de aplicacion.
- NO-GO si se pretende cancelar con pago o tocar caja sin contrato financiero.
- NO-GO si se pretende aprobar por rol visual sin permiso efectivo.
- NO-GO si no hay validacion tenant/branch.

## 9. No alcance

Fuera de LIVE-AUTH-B0 y fuera del MVP B1 salvo aprobacion explicita:

- precio LIVE;
- pagos/caja;
- devolucion;
- venta financiera;
- cambios de RBAC sin aprobacion;
- creacion de permisos en B0;
- migraciones en B0;
- endpoints en B0;
- QA_PASS visual.

## 10. Handoff final

LIVE-AUTH-B0 deja la arquitectura lista para decision. La recomendacion es no habilitar ningun boton de autorizacion real ni ninguna accion sensible nueva hasta que exista backend persistente, permisos aprobados, auditoria y QA por rol.

Siguiente fase recomendada:

`LIVE-AUTH-B1 - Backend minimo de autorizaciones operativas LIVE`

Estado: `PENDING_APPROVAL_FOR_LIVE_AUTH_B1`.
