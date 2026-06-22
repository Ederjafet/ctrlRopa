# SEC-RBAC-AUDIT-A - Matriz real de permisos

Fecha: 2026-06-21

Rama: `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Alcance

Auditoria enfocada en la consistencia entre:

- roles sembrados por migraciones;
- permisos efectivos devueltos al frontend;
- matriz `services/screenPermissions.ts`;
- botones y rutas operativas;
- endpoints backend criticos.

El hallazgo que disparo la auditoria fue `Nuevo apartado`: el modal marcaba `Crear prenda rapida` como bloqueado para vendedor, pero la ruta de alta rapida podia crear una prenda por falta de guard backend en `POST /api/items`.

## Permisos reales confirmados

| Permiso | Estado | Uso principal |
| --- | --- | --- |
| `VIEW_PLATFORM` | Persistido | Entrada a Panel Owner global. |
| `MANAGE_COMPANIES` | Persistido | Crear/editar companias desde plataforma. |
| `MANAGE_TENANT_ADMINS` | Persistido | Crear/editar admin inicial de cliente. |
| `VIEW_CUSTOMERS` | Persistido | Consultar clientes finales. |
| `CREATE_CUSTOMER` | Persistido | Crear clientes finales. |
| `EDIT_CUSTOMER` | Persistido | Editar clientes finales. |
| `VIEW_INVENTORY` | Persistido | Consultar prendas, lotes y catalogos operativos de inventario. |
| `MANAGE_INVENTORY` | Persistido | Crear/editar prendas y administrar lotes/recepcion. |
| `MANAGE_CATALOGS` | Persistido | Crear proveedores/catalogos operativos. |
| `DO_DOOR_RESERVATION` | Persistido | Crear apartados de mostrador. |
| `DO_DOOR_SALE` | Persistido | Operar venta puerta. |
| `VIEW_LIVE` | Persistido | Ver LIVE. |
| `OPERATE_LIVE` | Persistido | Operar sesiones LIVE. |
| `PREPARE_LIVE_ITEM` | Persistido | Preparar prenda LIVE. |
| `CHANGE_LIVE_ACTIVE_ITEM` | Persistido | Cambiar prenda al aire. |
| `REMOVE_LIVE_ACTIVE_ITEM` | Persistido | Retirar prenda al aire. |
| `DO_LIVE_RESERVATION` | Persistido | Crear apartado desde LIVE. |
| `REGISTER_PAYMENTS` | Persistido | Registrar pagos/abonos. |
| `VIEW_PAYMENTS` | Persistido | Consultar pagos. |
| `APPLY_CUSTOMER_BALANCE` | Persistido | Aplicar saldo a favor. |
| `CREATE_CLOSE_CUSTOMER_PACKAGE` | Persistido | Crear/cerrar paquete de cliente. |
| `MANAGE_SHIPMENTS` | Persistido | Administrar envios. |
| `MANAGE_USERS` | Persistido | Administrar usuarios tenant. |
| `MANAGE_ROLES` | Persistido | Administrar roles/permisos tenant. |
| `MANAGE_BRANDING` | Persistido | Administrar apariencia. |

Nota: `CREATE_ITEM` y `EDIT_ITEM` aparecen como dependencias/labels preparatorios en frontend, pero no estan confirmados como permisos persistidos en `PermissionCode.java` ni migraciones base. En esta fase no se crean permisos nuevos; la creacion/edicion de prendas queda alineada con `MANAGE_INVENTORY`.

## Roles reales revisados

| Rol | Permisos relevantes confirmados | Observacion |
| --- | --- | --- |
| `PLATFORM_OWNER` | `VIEW_PLATFORM`, `MANAGE_COMPANIES`, `MANAGE_TENANT_ADMINS`, permisos de billing/licencias/uso plataforma | Rol global de plataforma. No se debe otorgar a tenant. |
| `ADMIN` | Todos los permisos existentes por migraciones y backfills | Admin tenant amplio para instalacion cliente. No incluye permisos platform salvo asignacion indebida manual. |
| `SUPERVISOR` | Operacion amplia, pagos, paquetes, envios, reportes, autorizaciones segun migraciones | No deberia administrar plataforma. |
| `SELLER` | `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `DO_LIVE_RESERVATION`, `DO_DOOR_SALE`, `DO_DOOR_RESERVATION`, `REGISTER_PAYMENTS` | Puede consultar inventario y operar apartados/venta; no tiene `MANAGE_INVENTORY`. |
| `CASHIER` | `VIEW_CUSTOMERS`, `REGISTER_PAYMENTS`, `APPLY_CUSTOMER_BALANCE`, `VOID_PAYMENT`, reportes/corte segun migraciones | Caja/pagos; no administra inventario. |
| `INVENTORY` | `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `MANAGE_CATALOGS` | Inventario y catalogos operativos. |
| `PACKING` | `VIEW_CUSTOMERS`, `CREATE_CLOSE_CUSTOMER_PACKAGE` | Paquetes, sin inventario administrativo completo. |
| `LOGISTICS` | `VIEW_CUSTOMERS`, `MANAGE_SHIPMENTS`, transferencias/incidencias segun migracion | Envio/logistica. |
| `COURIER` | `MANAGE_SHIPMENTS`, `MANAGE_INCIDENTS` | Mensajeria/logistica acotada. |
| `NO_ACCESS` / `SIN_PERMISOS` | Sin permisos efectivos | Debe quedar bloqueado por login/acceso restringido. |

## Matriz accion-endpoint

| Rol | Permiso | Pantalla | Accion | Endpoint | Estado esperado |
| --- | --- | --- | --- | --- | --- |
| `SELLER` | `DO_DOOR_RESERVATION` | `/door-reservation` | Crear apartado | `POST /api/reservations` | Permitido si canal/sucursal aplica. |
| `SELLER` | `VIEW_CUSTOMERS` | `/door-reservation` | Seleccionar cliente | `GET /api/customers/branch/{branchId}` | Permitido solo en su tenant/sucursal. |
| `SELLER` | sin `CREATE_CUSTOMER` | `/customers-create` | Crear cliente | `POST /api/customers` | Bloqueado con 403 claro. |
| `SELLER` | `VIEW_INVENTORY` | `/door-reservation` | Agregar prenda existente | `GET /api/items/branch/{branchId}` | Permitido solo lectura. |
| `SELLER` | sin `MANAGE_INVENTORY` | `/door-reservation` | Alta rapida de prenda | `POST /api/items` | Bloqueado en UI y backend. |
| `ADMIN` | `MANAGE_INVENTORY` | `/items-create` | Crear prenda | `POST /api/items` | Permitido. |
| `INVENTORY` | `MANAGE_INVENTORY` | `/items-create` | Crear/editar prenda | `POST/PUT/PATCH /api/items/**` | Permitido. |
| `CASHIER` | `REGISTER_PAYMENTS` | pagos/paquetes/apartados | Registrar pago | `POST /api/payments` | Permitido si scope operativo aplica. |
| Usuario sin `REGISTER_PAYMENTS` | sin permiso | pagos/paquetes/apartados | Registrar pago | `POST /api/payments` | Bloqueado backend. |
| Usuario sin `APPLY_CUSTOMER_BALANCE` | sin permiso | pagos/paquetes | Aplicar saldo | `/api/balance/**` | Bloqueado backend. |
| `ADMIN` | `CREATE_CUSTOMER` | `/customers-create` | Crear cliente final | `POST /api/customers` | Permitido tenant-scoped. |
| `ADMIN` | `MANAGE_CATALOGS` | `/suppliers` | Crear proveedor | endpoints de proveedores | Permitido. |
| `SELLER` | sin `MANAGE_CATALOGS` | `/suppliers` | Crear proveedor | endpoints de proveedores | Bloqueado/oculto segun menu. |
| `ADMIN` / `INVENTORY` | `MANAGE_INVENTORY` | `/batches`, `/batch-detail` | Crear/editar lote | `/api/batches/**` | Permitido. |
| `SELLER` | sin `MANAGE_INVENTORY` | lotes | Crear/editar lote | `/api/batches/**` | Bloqueado backend. |
| `LOGISTICS` | `MANAGE_SHIPMENTS` | `/shipments` | Cambiar estado envio | `/api/shipments/**` | Permitido segun tenant. |
| Usuario sin `MANAGE_SHIPMENTS` | sin permiso | `/shipments` | Cambiar estado envio | `/api/shipments/**` | Bloqueado backend. |
| `PLATFORM_OWNER` | `VIEW_PLATFORM` | `/platform` | Ver dashboard/companias/auditoria | `/api/platform/**` | Permitido global. |
| Tenant admin | sin `VIEW_PLATFORM` | `/platform` | Ver datos globales | `/api/platform/**` | Bloqueado con 403. |

## Pantallas auditadas por consistencia

| Pantalla | ScreenKey | Permisos principales | Estado |
| --- | --- | --- | --- |
| `/door-reservation` | `doorReservation` | `DO_DOOR_RESERVATION`, `VIEW_CUSTOMERS`, `CREATE_CUSTOMER`, `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REGISTER_PAYMENTS` | Corregido P0 en alta rapida. |
| `/items-create` | `itemsCreate` | `MANAGE_INVENTORY`, `VIEW_INVENTORY` | Corregido guard visual de creacion. |
| `/customers-create` | `customersCreate` | `VIEW_CUSTOMERS`, `CREATE_CUSTOMER`, `EDIT_CUSTOMER` | Revisado por RC-CLIENTE-C. |
| `/suppliers` | `suppliers` | `VIEW_INVENTORY`, `MANAGE_CATALOGS` | Revisado por RC-CLIENTE-C. |
| `/batch-detail` | `batchDetail` | `VIEW_INVENTORY`, `MANAGE_INVENTORY` | Revisado por BATCH-UX-A. |
| `/payments` | `payments` | `VIEW_PAYMENTS`, `REGISTER_PAYMENTS`, `APPLY_CUSTOMER_BALANCE` | Ya alineado por PERM-UX. |
| `/customer-package-detail` | `customerPackageDetail` | paquetes, pagos, saldo, envios | Acciones criticas con permisos existentes. |
| `/shipments` y `/shipment-detail` | `shipments`, `shipmentDetail` | `MANAGE_SHIPMENTS` | Acciones de envio protegidas por permiso existente. |
| `/platform` | secciones platform | `VIEW_PLATFORM` y permisos platform especificos | Protegido para Platform Owner. |

## Decision de esta fase

No se agrego migracion ni permiso nuevo. El permiso real usado para crear prenda rapida es `MANAGE_INVENTORY`, porque:

- ya existe en backend y migraciones;
- `SELLER` no lo tiene;
- `ADMIN` e `INVENTORY` si lo tienen;
- `screenPermissions.ts` ya lo declaraba para `Crear prenda rapida`;
- evita inventar `CREATE_ITEM` sin catalogo backend completo.
