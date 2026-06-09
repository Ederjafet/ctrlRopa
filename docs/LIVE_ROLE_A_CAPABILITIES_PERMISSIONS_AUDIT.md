# LIVE-ROLE-A - Auditoria de permisos y capacidades operativas LIVE

## 1. Resumen ejecutivo

LIVE-ROLE-A audita permisos actuales, capacidades frontend y reglas observadas en LIVE/apartados para separar con claridad:

- actor visual: operador, vendedor, supervisor, admin;
- permiso real: codigo persistido en RBAC/backend;
- capacidad efectiva: decision frontend derivada de permisos, canal, rol y contexto;
- autorizacion operativa: aprobacion futura para acciones sensibles.

Esta fase no implementa codigo, no modifica RBAC, no crea permisos, no crea endpoints y no cambia backend. El resultado queda como `DESIGN_READY / PENDING_ARCH_REVIEW`.

Hallazgo principal: el backend LIVE y apartados usa permisos existentes demasiado amplios para varias operaciones. En particular, `DO_LIVE_RESERVATION` permite operar LIVE en backend y `CANCEL_RESERVATION` cubre cancelacion general, mientras que acciones como preparar prenda, cambiar prenda al aire, cerrar venta LIVE, deshacer cierre, liberar prenda apartada o autorizaciones no tienen permisos finos propios.

## 2. Problema detectado

QA detecto que existen permisos generales como:

- `DO_LIVE_RESERVATION`
- `CANCEL_RESERVATION`
- `REGISTER_PAYMENTS`
- `CANCEL_SALE`
- `VOID_PAYMENT`
- `MANAGE_SECURITY_SETTINGS`
- `MANAGE_USERS`

Pero varias acciones operativas LIVE no tienen permiso dedicado:

- buscar o preparar prenda en LIVE;
- poner/cambiar/retirar prenda al aire;
- cerrar como venta LIVE;
- deshacer cierre de venta LIVE;
- cancelar apartado con pago;
- liberar prenda apartada;
- cambiar precio LIVE;
- solicitar/aprobar autorizaciones.

## 3. Actor visual vs permiso real

Regla de arquitectura:

> La UI puede usar el actor visual para ordenar experiencia, pero no para conceder acciones. Las acciones deben depender de permisos/capacidades efectivas.

Ejemplo:

- `SELLER` clasifica la experiencia como vendedor.
- `DO_LIVE_RESERVATION` permite crear apartados LIVE.
- `VIEW_INVENTORY` permite consultar prendas.
- Sin permiso granular futuro, el vendedor no debe controlar la prenda al aire solo por ser vendedor.

## 4. Permisos actuales identificados

### Catalogo backend relevante

Permisos en `PermissionCode.java`, seeds/migraciones y servicios revisados:

| Dominio | Permisos actuales relevantes |
| --- | --- |
| LIVE / canales | `DO_LIVE_RESERVATION`, canal `LIVE` |
| Inventario | `VIEW_INVENTORY`, `MANAGE_INVENTORY` |
| Clientes | `VIEW_CUSTOMERS`, `CREATE_CUSTOMER`, `EDIT_CUSTOMER`, `REASSIGN_CUSTOMERS` |
| Apartados / ventas | `CANCEL_RESERVATION`, `DO_DOOR_SALE`, `DO_DOOR_RESERVATION`, `VIEW_SALES`, `CANCEL_SALE` |
| Pagos / caja | `VIEW_PAYMENTS`, `REGISTER_PAYMENTS`, `VOID_PAYMENT`, `MANAGE_CASH_CLOSURES`, `APPLY_CUSTOMER_BALANCE` |
| Reportes / supervision | `VIEW_REPORTS` |
| Seguridad / usuarios | `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_SECURITY_SETTINGS`, `VIEW_SECURITY_AUDIT` |
| Devoluciones | `REQUEST_REFUND`, `APPROVE_REFUND`, `PROCESS_REFUND`, `CANCEL_REFUND`, `MANAGE_REFUNDS`, `MANAGE_RETURNS` |

### Capacidades frontend actuales en LIVE

`services/liveCapabilities.ts` deriva capacidades como:

| Capacidad | Formula actual resumida | Observacion |
| --- | --- | --- |
| `canViewLive` | canal LIVE + admin/seller/supervisor/`DO_LIVE_RESERVATION`/`VIEW_REPORTS` | No existe `VIEW_LIVE`. |
| `canOperateLive` | `canAccess(LIVE, DO_LIVE_RESERVATION)` | Permiso general para operar/apartar. |
| `canSelectCustomer` | operar LIVE + `VIEW_CUSTOMERS` | Correcto como lectura de clientes. |
| `canCreateCustomer` | operar LIVE + `CREATE_CUSTOMER` | Correcto. |
| `canSelectItem` | operar LIVE + `VIEW_INVENTORY` | Correcto para buscar/ver prendas. |
| `canCreateItem` | manage live session + `MANAGE_INVENTORY` | Muy amplio; no hay `CREATE_LIVE_ITEM`. |
| `canPrepareItem` | manage live session + `VIEW_INVENTORY` | No existe `PREPARE_LIVE_ITEM`. |
| `canSetActiveItem` | manage live session + `VIEW_INVENTORY` | No existe `CHANGE_LIVE_ACTIVE_ITEM`. |
| `canClearActiveItem` | manage live session + `VIEW_INVENTORY` | No existe `REMOVE_LIVE_ACTIVE_ITEM`. |
| `canCreateReservation` | operar LIVE | Usa `DO_LIVE_RESERVATION`; bien para apartar, pero demasiado general para otras operaciones. |
| `canCancelReservation` | operar LIVE + `CANCEL_RESERVATION` | No distingue sin pago/con pago. |
| `canMarkOperationalSold` | operar LIVE + admin o `DO_DOOR_SALE` | No existe `CLOSE_LIVE_OPERATIONAL_SALE`. |
| `canReleaseReservedItem` | `CANCEL_RESERVATION` + `MANAGE_INVENTORY` + `VIEW_PAYMENTS` | Guardia compuesta, sin permiso dedicado. |
| `canChangeLivePrice` | operar LIVE + admin o inventario/cancelacion/dashboard | No existe `CHANGE_LIVE_PRICE` ni autorizacion real. |
| `canViewPayments` | `VIEW_PAYMENTS` | Correcto para estado de pago. |
| `canAccessCashbox` | `MANAGE_CASH_CLOSURES` o `REGISTER_PAYMENTS` | No debe mezclarse con reversas LIVE sin contrato. |

### Backend observado

- `LiveService.create/activate/close/setActiveItem` validan `DO_LIVE_RESERVATION` + canal `LIVE`.
- `ReservationService.cancel` valida `CANCEL_RESERVATION`.
- `ReservationService.updateLiveOperationalStatus` usa `validateReservationManagementAccess`, que para LIVE valida `DO_LIVE_RESERVATION`.
- `PaymentService` valida `REGISTER_PAYMENTS`, `VIEW_PAYMENTS` y `VOID_PAYMENT`.
- No se encontraron permisos dedicados para autorizaciones operativas LIVE.

## 5. Matriz accion -> permiso/capacidad

| Accion operativa | Pantalla / flujo | Actor visual actual | Permiso actual encontrado | Esta bien cubierto? | Brecha detectada | Permiso/capacidad sugerida | Requiere autorizacion | Requiere supervisor/admin | Riesgo | Recomendacion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Buscar prenda en LIVE | `/live` selector prendas | Operador, vendedor con flujo | `VIEW_INVENTORY` + operar LIVE | Parcial | Depende de operar LIVE; no existe permiso de preparar/buscar LIVE separado | `VIEW_LIVE_ITEMS` o conservar `VIEW_INVENTORY` para busqueda | No | No | Medio | Mantener busqueda con `VIEW_INVENTORY`, separar preparacion con permiso fino. |
| Escanear QR | `/live` QR | Operador | `VIEW_INVENTORY` + operar LIVE | Parcial | QR es otra forma de buscar prenda; no tiene permiso propio | `VIEW_LIVE_ITEMS` / `SCAN_LIVE_ITEM_QR` opcional | No | No | Medio | Tratar como busqueda de prenda; no conceder control activo. |
| Crear prenda rapida | `/items-create?returnTo=/live` | Operador | `MANAGE_INVENTORY` por capacidad frontend | Parcial | Crear prenda desde LIVE puede requerir permiso mas fino que administrar inventario completo | `CREATE_LIVE_QUICK_ITEM` o `CREATE_ITEM` formal | No | No | Medio | Definir permiso de alta rapida si negocio lo separa. |
| Preparar prenda para cambio | `/live` prenda preparada | Operador | `VIEW_INVENTORY` + manage live session | No | No existe `PREPARE_LIVE_ITEM`; vendedor no puede preparar sin control total | `PREPARE_LIVE_ITEM` | No, salvo prenda bloqueada | No necesariamente | Alto | Crear permiso granular futuro. |
| Poner prenda al aire | `/live` active item | Operador | Backend `DO_LIVE_RESERVATION`; frontend manage live item | No | Permiso de apartado permite cambiar prenda activa en backend | `CHANGE_LIVE_ACTIVE_ITEM` / `SET_LIVE_ACTIVE_ITEM` | No, salvo item bloqueado | Operador/admin con permiso | Alto | Separar de apartar LIVE. |
| Cambiar prenda al aire | `/live` prepared -> active | Operador | Backend `DO_LIVE_RESERVATION`; frontend manage live item | No | Misma brecha que set active item | `CHANGE_LIVE_ACTIVE_ITEM` | No, salvo item bloqueado | Operador/admin con permiso | Alto | Permiso dedicado y auditoria. |
| Retirar prenda del aire | `/live` clear active | Operador | Backend `DO_LIVE_RESERVATION`; frontend manage live item | No | No existe `REMOVE_LIVE_ACTIVE_ITEM` | `REMOVE_LIVE_ACTIVE_ITEM` | No, salvo item con apartado/pago | Operador/admin con permiso | Alto | Permiso dedicado. |
| Ver prenda al aire | `/live` | Todos con acceso LIVE | `DO_LIVE_RESERVATION`, roles, `VIEW_REPORTS` | Parcial | No existe permiso de solo lectura LIVE | `VIEW_LIVE` | No | No | Bajo | Agregar `VIEW_LIVE` para lectura formal. |
| Ver historial/eventos LIVE | `/live` eventos | Operador/supervisor | `canViewLive`; `VIEW_REPORTS` para dashboard | Parcial | No existe `VIEW_LIVE_EVENTS` | `VIEW_LIVE_EVENTS` | No | No | Medio | Separar eventos de operacion. |
| Apartar en LIVE | `/live` reserva | Operador/vendedor | `DO_LIVE_RESERVATION` + canal LIVE | Si | Debe seguir bloqueando si item ya apartado/vendido | `DO_LIVE_RESERVATION` | No si item disponible | No | Alto | Mantener y reforzar guardias de item. |
| Ver apartado LIVE | `/live`, `/reservations` | Operador/vendedor/supervisor | Acceso LIVE y/o permisos de reserva actuales | Parcial | No hay permiso `VIEW_LIVE_RESERVATIONS` | `VIEW_LIVE_RESERVATIONS` opcional | No | No | Medio | Separar lectura si se requiere. |
| Cancelar apartado sin pago | `/live` apartados | Operador/admin | `CANCEL_RESERVATION` + operar LIVE | Parcial | Backend cancel general; status operativo LIVE usa `DO_LIVE_RESERVATION` | `CANCEL_LIVE_RESERVATION` o mantener `CANCEL_RESERVATION` | No si sin pago y motivo | Puede ser operador con permiso | Alto | Distinguir sin pago/con pago. |
| Cancelar apartado con pago | `/live` apartados | Operador/admin | Bloque frontend si `VIEW_PAYMENTS` detecta pago; no flujo real | No | Requiere autorizacion/reversa formal | `CANCEL_RESERVATION_WITH_PAYMENT` + autorizacion | Si | Si | Critico | No implementar sin LIVE-AUTH-B/pagos. |
| Liberar prenda apartada | LIVE/inventario | Operador/admin | Compuesto: `CANCEL_RESERVATION` + `MANAGE_INVENTORY` + `VIEW_PAYMENTS` | Parcial | No existe permiso dedicado ni reversa formal | `RELEASE_RESERVED_ITEM` | Si si hay pago o duda | Si | Critico | Hacer contrato backend/auditoria. |
| Reasignar apartado | Apartados | Admin/supervisor futuro | `REASSIGN_CUSTOMERS` existe para clientes, no apartado LIVE | No | No cubre target reservation claramente | `REASSIGN_RESERVATION` | Si | Si | Alto | Definir permiso y autorizacion. |
| Cerrar como venta LIVE | `/live` apartados | Operador/vendedor con venta | `DO_DOOR_SALE` o admin en frontend; backend status usa `DO_LIVE_RESERVATION` | Parcial | No existe permiso especifico; no registra pago/caja | `CLOSE_LIVE_OPERATIONAL_SALE` | No si sin pago/caja y estado valido | Operador con permiso | Alto | Separar cierre operativo de venta/caja. |
| Deshacer cierre LIVE sin pago | `/live` apartados | Operador/admin | `canChangeReservationStatus`; backend `DO_LIVE_RESERVATION` | No | No existe permiso de reversa operativa | `UNDO_LIVE_OPERATIONAL_SALE` | Recomendado si operacion sensible | Supervisor/admin segun politica | Alto | Permiso dedicado; motivo y auditoria. |
| Deshacer cierre LIVE con pago | `/live` apartados | Operador/admin | Bloque frontend si pago; no backend real | No | Reversa con pago/caja requiere contrato | `UNDO_LIVE_OPERATIONAL_SALE_WITH_PAYMENT` + autorizacion | Si | Si | Critico | Bloquear hasta autorizacion formal. |
| Cambiar precio LIVE | `/live` precio | Operador/admin | Capacidad compuesta; no backend autorizacion | No | No existe `CHANGE_LIVE_PRICE`; no hay solicitud real | `CHANGE_LIVE_PRICE`, `REQUEST_LIVE_PRICE_CHANGE` | Si si no tiene permiso directo | Si para aprobar | Alto | Implementar solo despues de LIVE-Z10B/arquitectura. |
| Solicitar cambio de precio | `/live` precio | Vendedor/operador | No existe backend | No | UI no debe simular pendiente | `REQUEST_LIVE_PRICE_CHANGE` | Si | No | Alto | Crear flujo real antes de mostrar pendiente. |
| Aprobar cambio de precio | Cola futura | Supervisor/admin | No existe | No | Falta permiso, endpoint, auditoria | `APPROVE_LIVE_PRICE_CHANGE` | N/A | Si | Alto | Parte de autorizaciones. |
| Registrar pago | Pagos/caja | Caja/admin/vendedor segun permisos | `REGISTER_PAYMENTS` | Si | No debe resolverse desde reversas LIVE sin contrato | `REGISTER_PAYMENTS` | No | No | Alto | Mantener fuera de LIVE salvo flujo formal. |
| Anular pago | Pagos/caja | Caja/admin | `VOID_PAYMENT` | Si | No debe dispararse desde cancelacion LIVE | `VOID_PAYMENT` | Puede requerir autorizacion futura | Si segun politica | Critico | Mantener separado. |
| Ver estado de pago | LIVE/apartados | Operador/admin/supervisor | `VIEW_PAYMENTS` | Si | Si no existe, no asumir sin pago | `VIEW_PAYMENT_STATUS` opcional | No | No | Alto | `VIEW_PAYMENTS` sirve ahora; considerar permiso menos amplio. |
| Solicitar autorizacion operativa | LIVE futuro | Solicitante | No existe | No | Sin entidad/endpoint | `REQUEST_LIVE_OPERATION_AUTHORIZATION` | N/A | No | Alto | Implementar LIVE-AUTH-B/C. |
| Aprobar autorizacion operativa | Cola futura | Supervisor/admin | No existe | No | Falta permiso dedicado | `APPROVE_LIVE_OPERATION_AUTHORIZATION` | N/A | Si | Alto | Aprobador por permiso, no por actor. |
| Rechazar autorizacion operativa | Cola futura | Supervisor/admin | No existe | No | Falta permiso dedicado | `APPROVE_LIVE_OPERATION_AUTHORIZATION` o `DECIDE_LIVE_OPERATION_AUTHORIZATION` | N/A | Si | Medio | Mismo contrato de aprobacion. |
| Ver cola de autorizaciones | Cola futura | Supervisor/admin | No existe | No | Falta lectura/alcance | `VIEW_LIVE_OPERATION_AUTHORIZATIONS` | N/A | Si o permiso dedicado | Medio | Agregar scope por branch/company. |
| Aplicar autorizacion aprobada | LIVE futuro | Operador/aprobador | No existe | No | Falta revalidacion y estado `APPLIED` | `APPLY_LIVE_OPERATION_AUTHORIZATION` | N/A | Segun tipo | Alto | Aplicar con revalidacion backend. |

## 6. Brechas detectadas

1. `DO_LIVE_RESERVATION` cubre creacion de apartados, pero backend tambien lo usa para iniciar/cerrar LIVE y cambiar prenda activa.
2. No existe `VIEW_LIVE`; la lectura se infiere por roles, canal, `DO_LIVE_RESERVATION` o `VIEW_REPORTS`.
3. No existe permiso para preparar prenda sin controlar prenda al aire.
4. No existe permiso para cambiar/retirar prenda al aire.
5. No existe permiso especifico para cierre operativo de venta LIVE.
6. No existe permiso para deshacer cierre operativo LIVE.
7. `CANCEL_RESERVATION` no distingue apartado sin pago vs con pago.
8. No existe contrato de autorizaciones operativas en backend.
9. No hay cola de autorizaciones ni permisos de aprobacion LIVE.
10. Precio LIVE no tiene autorizacion real ni permiso fino.
11. Ver pago usa `VIEW_PAYMENTS`, que puede ser mas amplio que solo ver estado de pago del apartado.
12. El vendedor centro no puede preparar prenda sin control total porque no existe `PREPARE_LIVE_ITEM`.

## 7. Permisos/capacidades sugeridas

### LIVE

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `START_LIVE`
- `CLOSE_LIVE`
- `VIEW_LIVE_ITEMS`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- `VIEW_LIVE_EVENTS`
- `VIEW_LIVE_RESERVATIONS`
- `CLOSE_LIVE_OPERATIONAL_SALE`
- `UNDO_LIVE_OPERATIONAL_SALE`

### Autorizaciones

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`

### Precio

- `CHANGE_LIVE_PRICE`
- `REQUEST_LIVE_PRICE_CHANGE`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`

### Apartados

- `CANCEL_LIVE_RESERVATION`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `REASSIGN_RESERVATION`

### Pagos

- `VIEW_PAYMENT_STATUS`
- mantener `REGISTER_PAYMENTS`, `VIEW_PAYMENTS`, `VOID_PAYMENT` para pagos/caja reales.

## 8. Recomendacion por actor

| Actor | Recomendacion |
| --- | --- |
| Admin | Puede administrar y operar si tiene permisos; no debe saltarse auditoria en reversas con pago o autorizaciones sensibles. |
| Supervisor | Puede monitorear; puede aprobar solo con permiso de aprobacion dedicado y mismo scope company/branch. |
| Operador LIVE | Puede controlar prenda al aire, preparar/cambiar/retirar, apartar y cerrar operativo solo con permisos finos futuros. |
| Vendedor | Puede ver LIVE, seleccionar cliente y apartar si tiene permisos; puede preparar prenda solo si se crea `PREPARE_LIVE_ITEM`; no debe poner al aire sin `CHANGE_LIVE_ACTIVE_ITEM`. |
| Sin permisos | Bloqueo claro; sin polling util ni botones mudos. |

## 9. Decision sobre vendedor centro

QA reporto que `qa.vendedor.centro@local.test` no puede buscar, escanear, crear prenda, poner al aire ni cambiar prenda.

Decision de auditoria:

- Debe poder apartar en LIVE si conserva `DO_LIVE_RESERVATION`.
- Debe poder seleccionar cliente si conserva `VIEW_CUSTOMERS`.
- Debe poder ver/priorizar prenda al aire si tiene acceso LIVE.
- Buscar/escaneo de prendas puede ser razonable con `VIEW_INVENTORY`, pero hoy esta atado a operar LIVE y a capacidades de seleccion.
- Crear prenda rapida no debe concederse por ser vendedor; requiere permiso de inventario o permiso futuro especifico.
- Preparar prenda debe separarse de controlar prenda al aire.
- Poner/cambiar/retirar prenda al aire debe requerir permiso explicito distinto a preparar.

Recomendacion:

- Crear `PREPARE_LIVE_ITEM` para permitir que vendedor prepare prendas sin controlar la prenda al aire.
- Crear `CHANGE_LIVE_ACTIVE_ITEM` para operadores que si pueden poner/cambiar prenda al aire.
- Mantener `PENDING_ARCH_DECISION` hasta que arquitectura/producto definan si vendedor centro debe recibir `PREPARE_LIVE_ITEM` por defecto.

## 10. Relacion con LIVE-AUTH-A

LIVE-AUTH-A disena la entidad y flujo de autorizaciones operativas. LIVE-ROLE-A complementa ese diseno con la matriz de permisos/capacidades que deberia alimentar futuras fases:

- LIVE-AUTH-B: backend/migracion/contrato de autorizaciones.
- LIVE-AUTH-C: UI de solicitudes y cola.
- LIVE-Z10B: autorizacion real de cambio de precio.
- LIVE-PAYMENT-GUARD-A: reversas/cancelaciones con pago.
- AUTH-LIVE-PERMISSIONS-A: catalogo final de permisos LIVE finos.

LIVE-ROLE-A no reemplaza LIVE-AUTH-A; lo prepara para decidir permisos concretos por accion.

## 11. Riesgos

| Riesgo | Impacto | Mitigacion sugerida |
| --- | --- | --- |
| `DO_LIVE_RESERVATION` demasiado amplio en backend | Vendedor con permiso de apartado podria ejecutar endpoints sensibles si frontend falla | Separar permisos backend para LIVE session/item. |
| Permisos solo frontend | Seguridad incompleta | Backend debe validar permisos finos en fases futuras. |
| Cancelacion con pago sin autorizacion | Riesgo financiero | Bloquear hasta contrato de reversa/autorizacion. |
| Aprobacion por rol visual | Escalada indebida | Aprobar por permiso efectivo y scope. |
| Crear demasiados permisos | Operacion compleja | Agrupar por capacidades reales, no por cada boton cosmetico. |
| Vendedor sin herramienta de preparacion | Friccion operativa | `PREPARE_LIVE_ITEM` separado de `CHANGE_LIVE_ACTIVE_ITEM`. |

## 12. Decisiones pendientes

- Confirmar si `VIEW_LIVE` sera permiso explicito o si se mantiene por canal/rol.
- Confirmar si `OPERATE_LIVE` reemplaza parte de `DO_LIVE_RESERVATION`.
- Definir permisos exactos para iniciar/cerrar LIVE.
- Definir si vendedor centro recibira `PREPARE_LIVE_ITEM`.
- Definir si busqueda/escaneo en LIVE usa `VIEW_INVENTORY` o permiso LIVE especifico.
- Definir si `VIEW_PAYMENT_STATUS` debe ser menos amplio que `VIEW_PAYMENTS`.
- Definir aprobador por permiso, supervisor directo o ambos.
- Definir si cierre operativo de venta LIVE requiere permiso dedicado o se mantiene con `DO_DOOR_SALE`.

## 13. Fases futuras sugeridas

| Fase | Objetivo | Sensibilidad |
| --- | --- | --- |
| AUTH-LIVE-PERMISSIONS-A | Aprobar catalogo final de permisos LIVE finos | Alta |
| LIVE-ROLE-B | Implementar permisos frontend/backend para preparar y cambiar prenda LIVE | Alta |
| LIVE-AUTH-B | Crear backend de autorizaciones operativas | Alta |
| LIVE-AUTH-C | Crear UI de solicitud y cola de autorizaciones | Media/alta |
| LIVE-Z10B | Autorizacion real de cambio de precio LIVE | Alta |
| LIVE-PAYMENT-GUARD-A | Reversa/cancelacion con pago y autorizacion formal | Critica |

Todas requieren handoff de arquitectura antes de implementacion.

## 14. QA requerido

QA debe validar documentalmente:

1. Que la matriz cubre acciones LIVE/prendas/apartados/pagos/autorizaciones.
2. Que vendedor centro no recibe permisos nuevos en esta fase.
3. Que `PREPARE_LIVE_ITEM` queda como propuesta, no implementado.
4. Que cancelaciones con pago siguen dependiendo de LIVE-FIX-A y LIVE-AUTH-A, no de esta fase.
5. Que no se marca `QA_PASS` sin evidencia.

## 15. GO/NO-GO

GO:

- usar esta auditoria como insumo para arquitectura;
- abrir handoff para AUTH-LIVE-PERMISSIONS-A o LIVE-ROLE-B;
- mantener bloqueos honestos mientras no existan permisos/autoraciones reales.

NO-GO:

- implementar permisos nuevos sin aprobacion arquitectonica;
- habilitar acciones por actor visual;
- cambiar backend, RBAC, pagos, caja o inventario en esta fase;
- declarar QA_PASS sin corrida real.
