# ERP - Matriz tenant de endpoints

Fecha: 2026-05-13  
Fase: 2B - matriz tenant/endpoints  
Rama: `feature/fase2b-matriz-tenant-endpoints`  
Tipo: analisis documental, sin cambios de codigo

## Objetivo

Mapear endpoints actuales contra el futuro modelo multi-compania para identificar donde debe validarse `company_id`, `branch_id`, permisos por compania y aislamiento cross-company.

La arquitectura definida en Fase 2A recomienda una sola aplicacion, una sola base y `company_id` obligatorio. Esta matriz prepara la implementacion sin modificar codigo.

## Criterios usados

- `company_id`: requerido cuando el endpoint consulta o modifica datos de una empresa.
- `branch_id`: requerido cuando el flujo opera por sucursal.
- Riesgo cross-company:
  - CRITICO: puede exponer o modificar dinero, inventario, clientes o reportes de otra empresa.
  - ALTO: puede exponer operacion sensible o configuracion.
  - MEDIO: puede afectar catalogos, UX o soporte.
  - BAJO: tecnico/publico con bajo contenido sensible.
- Prioridad:
  - P0: migrar/validar antes de habilitar multi-compania.
  - P1: migrar en primer bloque operacional.
  - P2: migrar despues de flujos criticos.

## Matriz principal

| Endpoint/ruta | Modulo | Controller/servicio probable | Tablas afectadas | Requiere company_id | Requiere branch_id | Riesgo cross-company | Rol permitido futuro | Validacion backend requerida | Prioridad |
|---|---|---|---|---|---|---|---|---|---|
| `POST /api/auth/login` | Auth | `AuthController` / `AuthService` | `users`, `user_api_sessions`, `user_companies`, `branches` futuro | Si | Si, si usuario tiene sucursal activa | CRITICO | Usuario activo por company | Resolver companias permitidas, estado de company, sucursal activa y permisos por company | P0 |
| `POST /api/auth/logout` | Auth | `AuthController` / `AuthService` | `user_api_sessions` | Si | No | MEDIO | Usuario autenticado | Cerrar sesion del usuario actual y tenant activo | P1 |
| `POST /api/auth/change-password` | Auth | `AuthController` / `AuthService` | `users`, `user_password_history` | Si | No | ALTO | Usuario autenticado | Validar usuario activo; auditar con company activa | P1 |
| `GET /api/me` | Sesion | `MeController` | `users`, `roles`, `permissions`, `user_branches` | Si | Si | CRITICO | Usuario autenticado | Devolver company activa, allowedCompanyIds, branch scope y permisos tenant | P0 |
| `GET /api/me/permissions` | Sesion | `MeController` | `permissions`, `user_company_permissions` futuro | Si | No | CRITICO | Usuario autenticado | Permisos efectivos por company, no globales | P0 |
| `GET /api/me/channels` | Sesion | `MeController` | `branch_sales_channels`, `sales_channels` | Si | Si | ALTO | Usuario autenticado | Canales solo de sucursales permitidas por company | P1 |
| `GET /api/access/can` | Seguridad | `AccessCheckController` / `AccessService` | `permissions`, `roles` | Si | Opcional | CRITICO | Usuario autenticado | `assertCan(user, company, permission)`; no permiso global sin tenant | P0 |
| `GET /api/branches` | Sucursales | `BranchController` | `branches` | Si | No | CRITICO | `COMPANY_ADMIN`, `HPSQ_SUPPORT` limitado | Listar solo branches de company activa; HPSQ solo por modo soporte | P0 |
| `GET /api/branches/active` | Sucursales | `BranchController` | `branches` | Si | No | CRITICO | Usuario autenticado | Filtrar branches permitidas por company y usuario | P0 |
| `GET /api/branches/{id}` | Sucursales | `BranchController` | `branches` | Si | Si | CRITICO | Usuario con acceso a branch | Validar branch pertenece a company activa | P0 |
| `POST /api/branches` | Sucursales | `BranchController` | `branches` | Si | No | CRITICO | `COMPANY_ADMIN` | Crear en company activa, validar limite de plan y unicidad por company | P0 |
| `PUT/PATCH /api/branches/{id}` | Sucursales | `BranchController` | `branches` | Si | Si | CRITICO | `COMPANY_ADMIN` | Validar branch-company, plan, auditoria | P0 |
| `GET/POST/PUT/PATCH /api/users...` | Usuarios | `UserAdminController` / `UserAdminService` | `users`, `user_roles`, `user_permissions`, `user_branches` | Si | Si, para asignaciones | CRITICO | `COMPANY_ADMIN`, `HPSQ_SUPPORT` limitado | Usuarios por company; roles/permisos por company; limite plan; no listar HPSQ ni otras companies | P0 |
| `GET/POST/PUT /api/roles...` | Roles | `RoleAdminController` | `roles`, `role_permissions` | Si para roles tenant | No | CRITICO | `COMPANY_ADMIN` o HPSQ segun tipo | Separar roles ERP company vs roles SaaS; no mezclar `SAAS_*` | P0 |
| `GET /api/permissions` | Permisos | `PermissionAdminController` | `permissions` | No para catalogo tecnico, Si para asignacion | No | ALTO | Admin autorizado | Devolver catalogo filtrado por tipo ERP/SaaS y rol | P1 |
| `GET /api/customers/branch/{branchId}` | Clientes | `CustomerController` | `customers` | Si | Si | CRITICO | `VIEW_CUSTOMERS` | Validar branch pertenece a company activa y usuario tiene acceso | P0 |
| `GET /api/customers/{id}` | Clientes | `CustomerController` | `customers`, `customer_addresses` | Si | Derivado | CRITICO | `VIEW_CUSTOMERS` | Validar customer.company_id y branch permitido | P0 |
| `GET /api/customers/branch/{branchId}/phone/{phone}` | Clientes | `CustomerController` | `customers` | Si | Si | CRITICO | `VIEW_CUSTOMERS` | Buscar telefono dentro de company/branch, no global | P0 |
| `POST /api/customers/branch/{branchId}` | Clientes | `CustomerController` | `customers` | Si | Si | CRITICO | `VIEW_CUSTOMERS`/crear cliente | Crear solo en branch-company autorizado; genericos por company/branch | P0 |
| `PUT/PATCH /api/customers/{id}` | Clientes | `CustomerController` | `customers` | Si | Derivado | CRITICO | Admin/operativo permitido | Validar customer-company y auditoria | P0 |
| `/api/customer-addresses/customer/{customerId}` | Clientes | `CustomerAddressController` | `customer_addresses`, `customers` | Si | Derivado | ALTO | `VIEW_CUSTOMERS` | Validar customer pertenece a company | P1 |
| `/api/customer-owner-history/...` | Clientes | `CustomerOwnerHistoryController` | `customer_owner_history`, `customers`, `users` | Si | Derivado | ALTO | Admin/seguimiento | Validar customer y usuarios dentro de company | P1 |
| `GET /api/items/branch/{branchId}` | Inventario | `ItemController` | `items` | Si | Si | CRITICO | `VIEW_INVENTORY` | Validar branch-company; filtrar item.company_id | P0 |
| `GET /api/items/{id}` | Inventario | `ItemController` | `items` | Si | Derivado | CRITICO | `VIEW_INVENTORY` | Validar item.company_id | P0 |
| `GET /api/items/code/{code}` | Inventario | `ItemController` | `items` | Si | Opcional | CRITICO | `VIEW_INVENTORY` | Buscar codigo dentro de company; evitar global leak | P0 |
| `GET /api/items/lookup/code/{code}` | Inventario | `ItemController` | `items` | Si | Opcional | CRITICO | Operativo venta/pago | Lookup tenant-scoped y estado permitido | P0 |
| `GET /api/items/lookup/qr/{qrCode}` | Inventario | `ItemController` | `items` | Si | Opcional | CRITICO | Operativo venta/pago | QR tenant-scoped o global con tenant validation estricta | P0 |
| `POST /api/items` | Inventario | `ItemController` | `items`, `batches`, catalogos | Si | Si | CRITICO | `MANAGE_INVENTORY` | Validar branch, batch, catalogos, location dentro de company | P0 |
| `PUT/PATCH /api/items/{id}...` | Inventario | `ItemController` | `items`, `storage_locations` | Si | Derivado | CRITICO | `MANAGE_INVENTORY` | Validar item y location misma company | P0 |
| `/api/storage-locations/branch/{branchId}` | Inventario | `StorageLocationController` | `storage_locations` | Si | Si | ALTO | `VIEW_INVENTORY` | Filtrar por company/branch; unicidad por company+branch | P1 |
| `/api/boxes/branch/{branchId}` | Inventario | `BoxController` | `boxes`, `reservations` | Si | Si | ALTO | `VIEW_INVENTORY` | Filtrar por company/branch; QR scoped | P1 |
| `GET/POST /api/batches/branch/{branchId}` | Lotes | `BatchController` | `batches`, `suppliers` | Si | Si | CRITICO | `MANAGE_INVENTORY` | Validar branch-company, supplier-company, folio scoped | P0 |
| `GET /api/batches/{id}` | Lotes | `BatchController` | `batches`, `batch_classification_details` | Si | Derivado | CRITICO | `MANAGE_INVENTORY` | Validar batch.company_id | P0 |
| `GET /api/batches/folio/{folio}` | Lotes | `BatchController` | `batches` | Si | Opcional | CRITICO | `MANAGE_INVENTORY` | Folio por company o lookup con tenant | P0 |
| `PATCH/PUT /api/batches/{id}/receive|classification|reconcile|cancel` | Lotes | `BatchController` / `BatchService` | `batches`, `items`, `batch_classification_details` | Si | Derivado | CRITICO | `MANAGE_INVENTORY` | Validar batch-company, auditoria, no crear items cross-company | P0 |
| `GET/POST/PUT/PATCH /api/suppliers...` | Proveedores | `SupplierController` | `suppliers`, `batches` | Si | No | ALTO | `MANAGE_CATALOGS` | Proveedores por company; unicidad por company | P1 |
| `/api/product-types`, `/api/brands`, `/api/sizes` | Catalogos | Catalog controllers | `product_types`, `brands`, `sizes` | Si si configurables | No | MEDIO | `MANAGE_CATALOGS` | Definir global vs tenant; si tenant, filtrar por company | P1 |
| `/api/payment-methods` | Catalogos/pagos | `PaymentMethodController` | `payment_methods` | Si si configurable | No | ALTO | `MANAGE_CATALOGS` | Metodos permitidos por company/plan; no global operativo | P1 |
| `/api/sales-channels`, `/api/branch-sales-channels` | Canales | `SalesChannelController`, `BranchSalesChannelController` | `sales_channels`, `branch_sales_channels` | Si para configuracion | Si | ALTO | `MANAGE_BRANCH_CHANNELS` | Validar branch-company y canales habilitados por company | P1 |
| `GET /api/catalogs/bootstrap?branchId=` | Bootstrap | `CatalogBootstrapController` | catalogos, boxes, storage_locations, roles, permissions | Si | Si | CRITICO | Usuario autenticado | Validar branch-company; no devolver roles/permisos globales indebidamente | P0 |
| `POST /api/sales` | Ventas | `SaleController` | `sales`, `items`, `customers`, `payments`, `customer_orders` | Si | Si | CRITICO | `DO_DOOR_SALE` | Validar item/customer/branch/channel/payment method dentro de company | P0 |
| `GET /api/sales/branch/{branchId}` | Ventas | `SaleController` | `sales` | Si | Si | CRITICO | `DO_DOOR_SALE`/reportes | Filtrar company+branch | P0 |
| `GET /api/sales/{id}` | Ventas | `SaleController` | `sales` | Si | Derivado | CRITICO | Usuario permitido | Validar sale.company_id | P0 |
| `PATCH /api/sales/{saleId}/cancel` | Ventas | `SaleController` | `sales`, `items`, `payments` | Si | Derivado | CRITICO | cancelacion autorizada | Validar company, motivo, auditoria y permisos | P0 |
| `POST /api/payments...` | Pagos | `PaymentController` | `payments`, `payment_allocations`, `sales`, `reservations`, `customer_orders` | Si | Si | CRITICO | `REGISTER_PAYMENTS` | Validar todos los targets misma company; metodo pago permitido | P0 |
| `GET /api/payments/{id}` | Pagos | `PaymentController` | `payments` | Si | Derivado | CRITICO | `REGISTER_PAYMENTS`/reportes | Validar payment.company_id | P0 |
| `GET /api/payments/customer/{customerId}` | Pagos | `PaymentController` | `payments`, `customers` | Si | Derivado | CRITICO | Usuario permitido | Validar customer-company | P0 |
| `PATCH /api/payments/{paymentId}/void` | Pagos | `PaymentController` | `payments`, `allocations`, balances | Si | Derivado | CRITICO | anulacion autorizada | Validar company, motivo, auditoria | P0 |
| `/api/balance/...` | Saldos | `BalanceController` | `customer_balance_movements`, `payments`, `customer_orders` | Si | Si/derivado | CRITICO | pagos/caja | Validar customer/order/payment company; bloquear cruces | P0 |
| `/api/reservations...` | Reservas | `ReservationController` | `reservations`, `items`, `customers`, `lives`, `boxes` | Si | Si | CRITICO | `DO_DOOR_RESERVATION`/live | Validar item/customer/live/box misma company | P0 |
| `/api/lives/branch/{branchId}` | Live | `LiveController` | `lives`, `reservations` | Si | Si | CRITICO | `DO_LIVE_RESERVATION` | Filtrar company+branch | P0 |
| `/api/lives/{id}/activate|close` | Live | `LiveController` | `lives` | Si | Derivado | CRITICO | `DO_LIVE_RESERVATION` | Validar live.company_id y branch access | P0 |
| `/api/customer-orders...` | Pedidos | `CustomerOrderController` | `customer_orders`, `customer_order_items` | Si | Si/derivado | CRITICO | ventas/pagos | Validar customer/order branch company | P0 |
| `/api/customer-packages...` | Paquetes | `CustomerPackageController` | `customer_packages`, `customer_package_items`, `items`, `sales`, `reservations` | Si | Si/derivado | CRITICO | `CREATE_CLOSE_CUSTOMER_PACKAGE` | Validar package/customer/item/order misma company | P0 |
| `/api/shipments...` | Envios | `ShipmentController` | `shipments`, `shipment_packages`, `customer_packages` | Si | Si/derivado | CRITICO | `MANAGE_SHIPMENTS` | Validar package/shipment/customer/address misma company | P0 |
| `/api/cash-closures...` | Caja | `CashClosureController` | `cash_closures`, `cash_expenses`, `payments`, `sales` | Si | Si | CRITICO | `MANAGE_CASH_CLOSURES` | Cierre por company+branch+date; no mezclar movimientos | P0 |
| `/api/refunds...` | Reembolsos | `RefundController` | `refunds`, `returns`, `customers`, balances | Si | Si/derivado | CRITICO | `MANAGE_REFUNDS` | Validar return/customer/order company | P0 |
| `/api/returns...` | Devoluciones | `ReturnController` | `returns`, `return_items`, `sales`, `items` | Si | Derivado | CRITICO | `MANAGE_RETURNS` | Validar sale/item company | P0 |
| `/api/transfers...` | Transferencias | `BranchTransferController` | `branch_transfers`, `branch_transfer_items`, `items` | Si | Si, origen/destino | CRITICO | `MANAGE_TRANSFERS` | Validar from/to branch misma company salvo flujo especial futuro | P0 |
| `/api/consignees`, `/api/consignments...` | Consignacion | Consignment controllers | `consignees`, `consignments`, `consignment_items`, settlements | Si | Si | ALTO | `MANAGE_CONSIGNMENTS` | Validar branch/company e items same company | P1 |
| `/api/incidents...` | Incidencias | `IncidentController` | `incidents`, shipments, orders, items | Si | Si/derivado | ALTO | `MANAGE_INCIDENTS` | Validar entidades relacionadas por company | P1 |
| `/api/reports/daily-store` | Reportes | `DailyStoreReportController` | `sales`, `payments`, `cash` | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company siempre, branch validado | P0 |
| `/api/reports/daily-deposits` | Reportes | `DailyDepositsReportController` | `payments` | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company, no totales cruzados | P0 |
| `/api/reports/daily-deliveries` | Reportes | `DailyDeliveriesReportController` | entregas/envios/paquetes | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company y branch validado | P0 |
| `/api/reports/daily-cancellations` | Reportes | `DailyCancellationsReportController` | ventas/reservas/cancelaciones | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company y branch validado | P0 |
| `/api/reports/live-control` | Reportes | `LiveControlReportController` | `lives`, `reservations`, `payments` | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company | P0 |
| `/api/reports/remissions` | Reportes | `RemissionsReportController` | envios/paquetes | Si | Si/opcional | ALTO | `VIEW_REPORTS` | Filtrar company | P0 |
| `/api/reports/movement-history` | Reportes | `MovementHistoryController` | multiples movimientos | Si | Si/opcional | CRITICO | `VIEW_REPORTS` | Filtrar company y todos los joins tenant-scoped | P0 |
| `/api/dashboard/me` | Dashboard | `SellerDashboardController` | ventas, pagos, inventario, pendientes | Si | Si | CRITICO | Usuario autenticado | Solo company/branches asignadas | P0 |
| `/api/dashboard/me/branches/{branchId}/metrics/{metric}` | Dashboard | `SellerDashboardController` | multiples | Si | Si | CRITICO | Usuario autenticado | Validar branch-company y metrica permitida | P0 |
| `/api/security/settings` | Seguridad | `SecuritySettingsController` | `system_security_settings` | Global o company, definir | No/Si futuro | ALTO | admin tecnico | Definir si global HPSQ o tenant; no mezclar | P1 |
| `/api/security/settings/public` | Seguridad publica | `SecuritySettingsController` | settings | No al inicio | No | BAJO | publico | No exponer config sensible; futuro por hostname/company si aplica | P2 |
| `/api/security/sessions...` | Seguridad sesiones | `SecuritySessionsController` | `user_api_sessions`, `users` | Si | No | CRITICO | admin/soporte | Solo sesiones de company o HPSQ con permiso SaaS auditado | P0 |
| `/api/system/logs` | Logs | `SystemLogController` | archivos/logs | Si para filtro | No | ALTO | soporte tecnico | Logs filtrados por company y rol; no global a cliente | P1 |
| `/api/appearance` | Apariencia | `AppearanceSettingsController` | `appearance_settings`, futuro `tenant_settings` | Si futuro | No | MEDIO | admin company/HPSQ | Branding por company; fallback seguro | P1 |
| `/api/operation/menu` | Menu | `OperationMenuController` | permisos/canales | Si | Si | ALTO | usuario autenticado | Menu segun company, branch, plan y permisos | P0 |
| `GET /api/health` | Health | `HealthController` | ninguna | No | No | BAJO | publico tecnico | No exponer datos tenant ni sensibles | P2 |

## Endpoints SaaS futuros propuestos

No existen aun. Se listan para orientar Fase 2C+.

| Endpoint futuro | Modulo SaaS | Tablas | Rol HPSQ | Validacion requerida | Prioridad |
|---|---|---|---|---|---|
| `GET /api/saas/companies` | Consola HPSQ | `companies`, `company_subscriptions` | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT`, `HPSQ_BILLING`, `HPSQ_AUDITOR` segun filtro | Permiso `SAAS_COMPANY_VIEW`, auditoria de consulta sensible | P1 |
| `POST /api/saas/companies` | Empresas | `companies`, `company_status_history` | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` | `SAAS_COMPANY_CREATE`, motivo, auditoria | P1 |
| `PUT /api/saas/companies/{companyId}` | Empresas | `companies`, `tenant_settings` | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` | `SAAS_COMPANY_UPDATE`, auditoria | P1 |
| `PATCH /api/saas/companies/{companyId}/suspend` | Empresas | `companies`, `company_status_history` | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Doble confirmacion, motivo obligatorio, auditoria | P1 |
| `PATCH /api/saas/companies/{companyId}/reactivate` | Empresas | `companies`, `company_status_history` | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Motivo obligatorio, auditoria | P1 |
| `PUT /api/saas/companies/{companyId}/subscription` | Suscripcion | `company_subscriptions` | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | `SAAS_SUBSCRIPTION_MANAGE`, auditoria | P1 |
| `PUT /api/saas/companies/{companyId}/modules` | Modulos | `tenant_settings`, subscription modules | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` | `SAAS_MODULES_MANAGE`, auditoria | P1 |
| `POST /api/saas/support-sessions` | Soporte | `support_access_sessions` | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Motivo/ticket, expiracion, alcance, auditoria | P0 |
| `GET /api/saas/audit` | Auditoria | auditoria SaaS | `HPSQ_AUDITOR`, `HPSQ_SUPERADMIN` | Solo lectura; filtros; auditoria de consulta | P1 |

## Modulos de mayor riesgo por endpoints

1. Pagos, ventas y caja: impacto financiero directo.
2. Reportes: fuga silenciosa de totales entre companias.
3. Inventario/items: un QR/codigo global puede revelar o mover prendas de otra empresa.
4. Usuarios/permisos: permisos globales podrian escalar acceso.
5. Dashboard: agrega muchas fuentes y puede mezclar datos si un join falta.
6. Soporte/logs: HPSQ-SOFT debe ver solo lo necesario y auditarlo.

## Reglas de implementacion derivadas

- Todo endpoint P0 debe migrarse antes de activar multi-compania.
- Todo endpoint que recibe id directo debe validar entidad contra `activeCompanyId`.
- Todo endpoint que recibe `branchId` debe validar `branch.company_id = activeCompanyId` y asignacion del usuario.
- Todo lookup por codigo, folio o QR debe ser tenant-scoped o tener estrategia global documentada.
- Reportes y dashboard deben filtrar `company_id` en todos los joins.
- Rutas SaaS futuras deben usar permisos `SAAS_*`, nunca permisos ERP cliente.
