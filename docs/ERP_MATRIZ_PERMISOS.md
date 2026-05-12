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

