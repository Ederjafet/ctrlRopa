# ERP - Matriz de permisos

## Permisos reales detectados

Fuente: `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`.

| Permiso | Uso observado |
|---|---|
| `MANAGE_USERS` | Usuarios, bootstrap catalogos. |
| `MANAGE_ROLES` | Roles, canales globales. |
| `MANAGE_BRANCH_CHANNELS` | Canales por sucursal. |
| `MANAGE_BRANCHES` | Sucursales. PENDIENTE DE VALIDAR llamadas. |
| `MANAGE_CATALOGS` | Catalogos y proveedores. |
| `MANAGE_SECURITY_SETTINGS` | Configuracion de seguridad. |
| `VIEW_CUSTOMERS` | PENDIENTE DE VALIDAR uso real. |
| `VIEW_CUSTOMER_ORDERS` | PENDIENTE DE VALIDAR uso real. |
| `VIEW_INVENTORY` | Inventario, dashboard, proveedores lectura. |
| `MANAGE_INVENTORY` | Lotes, recepcion, clasificacion, inventario. |
| `DO_LIVE_RESERVATION` | Live y reservas live. |
| `DO_DOOR_SALE` | Venta puerta. |
| `DO_DOOR_RESERVATION` | Apartado puerta. |
| `REGISTER_PAYMENTS` | Pagos. |
| `APPLY_CUSTOMER_BALANCE` | Saldos. |
| `VOID_PAYMENT` | Anular pagos. |
| `CREATE_CLOSE_CUSTOMER_PACKAGE` | Paquetes. |
| `MANAGE_SHIPMENTS` | Envios. |
| `CANCEL_RESERVATION` | Cancelar reservas. |
| `CANCEL_SALE` | Cancelar ventas. |
| `REQUEST_REFUND` | Solicitar reembolso. |
| `APPROVE_REFUND` | Aprobar reembolso. |
| `PROCESS_REFUND` | Procesar reembolso. |
| `CANCEL_REFUND` | Cancelar reembolso. |
| `MANAGE_REFUNDS` | Gestion de reembolsos. |
| `MANAGE_RETURNS` | Devoluciones. |
| `REASSIGN_CUSTOMERS` | Reasignar clientes. |
| `MANAGE_BRANDING` | Apariencia. |
| `MANAGE_TRANSFERS`, `SEND_TRANSFERS`, `RECEIVE_TRANSFERS`, `CANCEL_TRANSFERS` | Transferencias. |
| `MANAGE_CONSIGNMENTS`, `SETTLE_CONSIGNMENTS`, `CANCEL_CONSIGNMENTS` | Consignacion. |
| `VIEW_REPORTS` | Reportes e historico. |
| `MANAGE_CASH_CLOSURES` | Cierre de caja. |
| `MANAGE_INCIDENTS` | Incidencias. |

## Riesgos

- `SecurityConfig.java` no restringe por URL; la seguridad depende de cada servicio.
- Debe probarse que todos los controladores llaman servicios con `assertCan`.
- Proveedores usan `MANAGE_CATALOGS`, pero podria requerir permiso especifico ERP `MANAGE_SUPPLIERS`.
- Logs tecnicos en `app/system-logs.tsx` deben quedar solo para perfil tecnico/administrador.

## Matriz preliminar endpoint-permiso

Esta matriz no cambia seguridad real. Solo documenta permiso esperado y riesgo si falta validacion.

| Modulo | Endpoint critico | Permiso esperado | Riesgo si falta validacion |
|---|---|---|---|
| Auth | `POST /api/auth/login` | Publico controlado | Acceso indebido o bloqueo masivo si falla politica. |
| Auth | `POST /api/auth/change-password` | Usuario autenticado | Cambio de password sin identidad valida. |
| Usuarios | `POST /api/users`, `PUT /api/users/{id}` | `MANAGE_USERS` | Alta/modificacion indebida de usuarios. |
| Usuarios | `PUT /api/users/{id}/roles`, `PUT /api/users/{id}/permissions` | `MANAGE_ROLES`/`MANAGE_USERS` | Escalamiento de privilegios. |
| Roles | `POST /api/roles`, `PUT /api/roles/{id}/permissions` | `MANAGE_ROLES` | Permisos mal asignados a perfiles. |
| Seguridad | `PUT /api/security/settings` | `MANAGE_SECURITY_SETTINGS` | Politicas de seguridad debilitadas. |
| Sesiones | `POST /api/security/sessions/*` | Perfil tecnico/admin | Cierre o desbloqueo indebido de sesiones. |
| Catalogos | `POST/PUT/PATCH /api/product-types|brands|sizes|payment-methods` | `MANAGE_CATALOGS` | Datos maestros incorrectos. |
| Proveedores | `POST/PUT/PATCH /api/suppliers` | `MANAGE_CATALOGS` | Proveedores duplicados/inactivos usados en lotes. |
| Lotes | `POST /api/batches/branch/{branchId}` | `MANAGE_INVENTORY` | Inventario originado por usuario no autorizado. |
| Lotes | `PATCH /api/batches/{id}/receive` | `MANAGE_INVENTORY` | Recepcion/cantidad/calidad incorrecta. |
| Lotes | `PUT /api/batches/{id}/classification` | `MANAGE_INVENTORY` | Clasificacion incorrecta. |
| Lotes | `PATCH /api/batches/{id}/reconcile|cancel` | `MANAGE_INVENTORY` | Cierre/cancelacion indebida. |
| Items | `POST /api/items`, `PUT /api/items/{id}` | `MANAGE_INVENTORY` | Alta/modificacion de prenda indebida. |
| Live | `POST /api/lives/branch/{branchId}`, `PATCH /api/lives/{id}/activate|close` | `DO_LIVE_RESERVATION` | Captura de live indebida o cierre incorrecto. |
| Reservas | `POST /api/reservations` | `DO_LIVE_RESERVATION` o `DO_DOOR_RESERVATION` segun canal | Reserva indebida o canal no autorizado. |
| Reservas | `PATCH /api/reservations/{id}/cancel` | `CANCEL_RESERVATION` | Cancelacion sin autorizacion. |
| Ventas | `POST /api/sales` | `DO_DOOR_SALE` | Venta e inventario afectados indebidamente. |
| Ventas | `PATCH /api/sales/{saleId}/cancel` | `CANCEL_SALE` | Cancelacion financiera/inventario indebida. |
| Pagos | `POST /api/payments*` | `REGISTER_PAYMENTS` | Diferencias de caja/saldo. |
| Pagos | `PATCH /api/payments/{paymentId}/void` | `VOID_PAYMENT` | Anulacion indebida. |
| Saldos | `POST /api/balance/apply-to-order` | `APPLY_CUSTOMER_BALANCE` | Saldo aplicado indebidamente. |
| Paquetes | `POST/PATCH /api/customer-packages*` | `CREATE_CLOSE_CUSTOMER_PACKAGE` | Paquete incompleto o cerrado indebidamente. |
| Envios | `POST/PATCH /api/shipments*` | `MANAGE_SHIPMENTS` | Despacho/entrega incorrecta. |
| Transferencias | `POST /api/transfers` | `MANAGE_TRANSFERS` | Movimiento entre sucursales indebido. |
| Transferencias | `PATCH /api/transfers/{id}/send` | `SEND_TRANSFERS` | Envio no autorizado. |
| Transferencias | `PATCH /api/transfers/{id}/receive-item` | `RECEIVE_TRANSFERS` | Recepcion indebida. |
| Reportes | `GET /api/reports/*` | `VIEW_REPORTS` | Exposicion de informacion operativa/financiera. |
| Caja | `POST/PUT/PATCH /api/cash-closures*` | `MANAGE_CASH_CLOSURES` | Cierre de caja incorrecto. |
| Logs | `GET /api/system/logs` | Perfil tecnico/admin | Exposicion de informacion tecnica. |

## Pendientes Fase 4

- Confirmar por prueba automatizada/manual que cada endpoint critico ejecuta validacion backend.
- Separar permisos especificos para proveedores/logs si el modelo de roles lo requiere.
- Definir perfiles: operativo, admin, soporte tecnico y auditor.
