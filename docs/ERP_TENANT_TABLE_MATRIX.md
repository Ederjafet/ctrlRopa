# ERP - Matriz tenant de tablas/modelos

Fecha: 2026-05-13  
Fase: 2B - matriz tenant/tablas  
Rama: `feature/fase2b-matriz-tenant-endpoints`  
Tipo: analisis documental, sin cambios SQL

## Objetivo

Identificar tablas/modelos que deben evolucionar a multi-compania con `company_id`, `branch_id`, unicidad por compania, indices tenant-aware y prioridad de migracion.

## Criterios

- `company_id`: obligatorio en tablas tenant-scoped o derivable en detalles.
- `branch_id`: obligatorio cuando el registro vive operativamente en una sucursal.
- Datos sensibles:
  - ALTO: dinero, clientes, prendas, reportes, seguridad.
  - MEDIO: configuracion/catlogos operativos.
  - BAJO: catalogo tecnico global.
- Prioridad:
  - P0: necesario antes de habilitar multi-compania.
  - P1: primera ola despues de core tenant.
  - P2: hardening/optimizacion.

## Matriz principal

| Tabla/modelo | Modulo | Requiere company_id | Requiere branch_id | Datos sensibles | Riesgo fuga | Unicidad por compania | Indices recomendados | Prioridad |
|---|---|---:|---:|---|---|---|---|---|
| `companies` futuro | SaaS | N/A | No | ALTO | CRITICO | `code`, posible `tax_id` | `uq_companies_code`, `idx_companies_status`, `idx_companies_tax_id` | P0 |
| `tenant_settings` futuro | SaaS/config | Si | No | MEDIO/ALTO | ALTO | `(company_id, setting_key)` | `idx_tenant_settings_company` | P1 |
| `company_subscriptions` futuro | SaaS/billing | Si | No | ALTO | ALTO | una activa por company | `idx_company_subscriptions_company_status`, `idx_company_subscriptions_period_end` | P1 |
| `company_status_history` futuro | SaaS/auditoria | Si | No | ALTO | MEDIO | N/A | `idx_company_status_history_company_date` | P1 |
| `support_access_sessions` futuro | Soporte SaaS | Si | No | ALTO | CRITICO | N/A | `idx_support_sessions_company_status`, `idx_support_sessions_user_status` | P0 |
| `branches` | Sucursales | Si | N/A | ALTO | CRITICO | `(company_id, code)`, opcional `(company_id, name)` | `idx_branches_company_status` | P0 |
| `users` | Usuarios | Si indirecto via `user_companies` | Sucursal principal futura opcional | ALTO | CRITICO | email global o por politica | `idx_users_status`, futuro `idx_users_default_company` | P0 |
| `user_companies` futuro | Usuarios | Si | No | ALTO | CRITICO | `(user_id, company_id)` | `idx_user_companies_company_status`, `idx_user_companies_user_status` | P0 |
| `user_branches` | Usuarios/sucursales | Si indirecto/futuro directo | Si | ALTO | CRITICO | `(user_id, branch_id)`; validar branch-company | `idx_user_branches_user`, `idx_user_branches_branch` | P0 |
| `roles` | Permisos | Global plantilla o company si editable | No | ALTO | CRITICO | global `code` o `(company_id, code)` | `idx_roles_company` si tenant | P0 |
| `permissions` | Permisos | Global tecnico | No | MEDIO | ALTO | `code` global | `idx_permissions_module` futuro | P1 |
| `user_roles` | Permisos actual | Debe migrar a `user_company_roles` | No | ALTO | CRITICO | `(user_id, company_id, role_id)` futuro | `idx_user_company_roles_company` | P0 |
| `user_permissions` | Permisos actual | Debe migrar a `user_company_permissions` | No | ALTO | CRITICO | `(user_id, company_id, permission_id)` futuro | `idx_user_company_permissions_company` | P0 |
| `role_permissions` | Permisos | Si si rol tenant | No | ALTO | ALTO | `(role_id, permission_id)` | `idx_role_permissions_role` | P1 |
| `saas_user_roles` futuro | SaaS permisos | No company scope directo | No | ALTO | CRITICO | `(user_id, saas_role_code)` | `idx_saas_user_roles_user_status` | P0 |
| `customers` | Clientes | Si | Si | ALTO | CRITICO | telefono/email por company segun politica | `idx_customers_company_branch`, `idx_customers_company_phone`, `idx_customers_company_status` | P0 |
| `customer_addresses` | Clientes | Si derivado o directo | Derivado | ALTO | ALTO | N/A | `idx_customer_addresses_company_customer` si directo | P1 |
| `customer_owner_history` | Clientes | Si | Derivado | MEDIO | ALTO | N/A | `idx_customer_owner_history_company_customer` | P1 |
| `product_types` | Catalogos | Si si configurable | No | MEDIO | MEDIO | `(company_id, code/name)` si tenant | `idx_product_types_company_status` | P1 |
| `brands` | Catalogos | Si si configurable | No | MEDIO | MEDIO | `(company_id, code/name)` si tenant | `idx_brands_company_status` | P1 |
| `sizes` | Catalogos | Si si configurable | No | MEDIO | MEDIO | `(company_id, code/name)` si tenant | `idx_sizes_company_status` | P1 |
| `payment_methods` | Catalogos/pagos | Si si configurable | No | ALTO | ALTO | `(company_id, code/name)` si tenant | `idx_payment_methods_company_status` | P1 |
| `sales_channels` | Canales | Global tecnico + configuracion por company | No | MEDIO | MEDIO | `code` global o `(company_id, code)` | `idx_sales_channels_enabled` | P1 |
| `branch_sales_channels` | Canales/sucursal | Si | Si | MEDIO | ALTO | `(company_id, branch_id, sales_channel_id)` | `idx_branch_sales_channels_company_branch` | P1 |
| `storage_locations` | Inventario | Si | Si | MEDIO | ALTO | `(company_id, branch_id, code/name)` | `idx_storage_locations_company_branch_status` | P1 |
| `boxes` | Inventario/reservas | Si | Si | MEDIO | ALTO | `(company_id, branch_id, code)`, QR global o por company | `idx_boxes_company_branch_status`, `idx_boxes_company_qr` | P1 |
| `suppliers` | Proveedores | Si | No | MEDIO | ALTO | `(company_id, code/name)` | `idx_suppliers_company_status` | P1 |
| `batches` | Lotes | Si | Si | ALTO | CRITICO | `(company_id, folio)` recomendado | `idx_batches_company_branch_status`, `idx_batches_company_supplier` | P0 |
| `batch_classification_details` | Lotes | Si directo opcional | Derivado | MEDIO | ALTO | `(batch_id, product_type_id)` + company validation | `idx_batch_classification_company_batch` si directo | P1 |
| `items` | Inventario/prendas | Si | Si | ALTO | CRITICO | `(company_id, code)`, `(company_id, qr_code)` | `idx_items_company_branch_status`, `idx_items_company_code`, `idx_items_company_qr` | P0 |
| `lives` | Live | Si | Si | ALTO | CRITICO | opcional `(company_id, branch_id, created_at)` | `idx_lives_company_branch_status` | P0 |
| `reservations` | Reservas | Si | Si | ALTO | CRITICO | N/A | `idx_reservations_company_branch_status`, `idx_reservations_company_customer` | P0 |
| `customer_orders` | Pedidos | Si | Si | ALTO | CRITICO | folio si existe por company | `idx_customer_orders_company_branch_status`, `idx_customer_orders_company_customer` | P0 |
| `customer_order_items` | Pedidos detalle | Si derivado/directo para performance | Derivado | ALTO | CRITICO | N/A | `idx_customer_order_items_company_order` si directo | P1 |
| `sales` | Ventas | Si | Si | ALTO | CRITICO | folio si existe por company | `idx_sales_company_branch_date`, `idx_sales_company_customer`, `idx_sales_company_status` | P0 |
| `payments` | Pagos | Si | Si | ALTO | CRITICO | folio/reference si existe por company | `idx_payments_company_branch_date`, `idx_payments_company_customer`, `idx_payments_company_status` | P0 |
| `payment_allocations` | Pagos detalle | Si derivado/directo | Derivado | ALTO | CRITICO | N/A | `idx_payment_allocations_company_payment` si directo | P1 |
| `customer_balance_movements` | Saldos | Si | Si | ALTO | CRITICO | N/A | `idx_balance_company_customer_date`, `idx_balance_company_branch_date` | P0 |
| `cash_closures` | Caja | Si | Si | ALTO | CRITICO | `(company_id, branch_id, closure_date)` | `idx_cash_closures_company_branch_date` | P0 |
| `cash_expenses` | Caja gastos | Si | Si | ALTO | CRITICO | N/A | `idx_cash_expenses_company_closure` | P1 |
| `returns` | Devoluciones | Si | Derivado de sale | ALTO | CRITICO | N/A | `idx_returns_company_status`, `idx_returns_company_sale` | P0 |
| `return_items` | Devoluciones detalle | Si derivado | Derivado | ALTO | CRITICO | N/A | `idx_return_items_company_return` si directo | P1 |
| `refunds` | Reembolsos | Si | Si | ALTO | CRITICO | N/A | `idx_refunds_company_branch_status`, `idx_refunds_company_customer` | P0 |
| `customer_packages` | Paquetes | Si | Si | ALTO | CRITICO | `(company_id, folio)` | `idx_customer_packages_company_branch_status`, `idx_customer_packages_company_customer` | P0 |
| `customer_package_items` | Paquetes detalle | Si derivado/directo | Derivado | ALTO | CRITICO | `(customer_package_id, item_id)` + company validation | `idx_customer_package_items_company_package` si directo | P1 |
| `shipments` | Envios | Si | Si | ALTO | CRITICO | `(company_id, folio)` | `idx_shipments_company_branch_status` | P0 |
| `shipment_packages` | Envios detalle | Si derivado/directo | Derivado | ALTO | CRITICO | package unico + company validation | `idx_shipment_packages_company_shipment` si directo | P1 |
| `branch_transfers` | Transferencias | Si | Si origen/destino | ALTO | CRITICO | `(company_id, folio)` | `idx_transfers_company_from_status`, `idx_transfers_company_to_status` | P0 |
| `branch_transfer_items` | Transferencias detalle | Si derivado/directo | Derivado | ALTO | CRITICO | `(branch_transfer_id, item_id)` + company validation | `idx_transfer_items_company_transfer` si directo | P1 |
| `incidents` | Incidencias | Si | Si/derivado | MEDIO/ALTO | ALTO | N/A | `idx_incidents_company_branch_status`, `idx_incidents_company_customer` | P1 |
| `consignees` | Consignacion | Si | Si | MEDIO | ALTO | `(company_id, branch_id, name/code)` si existe | `idx_consignees_company_branch_status` | P1 |
| `consignments` | Consignacion | Si | Si | ALTO | ALTO | `(company_id, folio)` | `idx_consignments_company_branch_status` | P1 |
| `consignment_items` | Consignacion detalle | Si derivado/directo | Derivado | ALTO | ALTO | `(consignment_id, item_id)` + company validation | `idx_consignment_items_company_consignment` si directo | P2 |
| `consignment_settlements` | Consignacion pagos | Si derivado/directo | Derivado | ALTO | ALTO | N/A | `idx_consignment_settlements_company` si directo | P2 |
| `system_movement_audit_log` | Auditoria | Si | Si opcional | ALTO | ALTO | N/A | `idx_audit_company_date`, `idx_audit_company_entity`, `idx_audit_actor` | P0 |
| `appearance_settings` | Apariencia | Si futuro | No | MEDIO | MEDIO | `(company_id)` | migrar a `tenant_settings` o `idx_appearance_company` | P1 |
| `system_security_settings` | Seguridad | Definir global vs company | No | ALTO | ALTO | una global o `(company_id)` | `idx_security_settings_company` si tenant | P1 |
| `user_login_security` | Seguridad | Si derivado por user/company futuro | No | ALTO | ALTO | `(user_id)` actual; futuro por company si aplica | `idx_login_security_user` | P1 |
| `user_api_sessions` | Seguridad | Si futuro | No | ALTO | CRITICO | token hash global | `idx_api_sessions_user_company`, `idx_api_sessions_company_status` | P0 |
| `user_password_history` | Seguridad | No/usuario global | No | ALTO | MEDIO | N/A | `idx_password_history_user_date` | P2 |

## Tablas P0 prioritarias

1. `companies`
2. `branches`
3. `users` + `user_companies`
4. `user_branches`
5. `roles`/`user_company_roles`
6. `permissions`/`user_company_permissions`
7. `user_api_sessions`
8. `customers`
9. `items`
10. `batches`
11. `sales`
12. `payments`
13. `customer_orders`
14. `reservations`
15. `lives`
16. `customer_packages`
17. `shipments`
18. `cash_closures`
19. `customer_balance_movements`
20. `system_movement_audit_log`

## Unicidades que deben cambiar

| Actual | Riesgo | Recomendacion futura |
|---|---|---|
| `uq_branches_code (code)` | Codigo de sucursal global bloquea multi-tenant o expone colisiones | `(company_id, code)` |
| `uq_roles_code (code)` | Roles editables podrian ser globales | Mantener plantillas globales o `(company_id, code)` para roles cliente |
| `uq_product_types_code/name` | Catalogo configurable global | `(company_id, code/name)` si tenant |
| `uq_brands_code/name` | Catalogo configurable global | `(company_id, code/name)` si tenant |
| `uq_sizes_code/name` | Catalogo configurable global | `(company_id, code/name)` si tenant |
| `uq_payment_methods_code/name` | Metodo global podria no aplicar por cliente | `(company_id, code/name)` o configuracion por company |
| `uq_storage_locations_branch_*` | OK por branch, pero branch debe validar company | Agregar company al indice para performance |
| `uq_boxes_qr_code` | QR global puede ser valido o demasiado restrictivo | Decidir global vs `(company_id, qr_code)` |
| `uq_batches_folio` | Folio global limita multi-tenant | `(company_id, folio)` |
| `uq_items_code`, `uq_items_qr_code` | Lookup global de item es riesgo CRITICO | `(company_id, code)`, `(company_id, qr_code)` salvo estrategia global segura |
| `uq_customer_packages_folio` | Folio global limita multi-tenant | `(company_id, folio)` |
| `uq_shipments_folio` | Folio global limita multi-tenant | `(company_id, folio)` |
| `uq_branch_transfers_folio` | Folio global limita multi-tenant | `(company_id, folio)` |
| `uq_consignments_folio` | Folio global limita multi-tenant | `(company_id, folio)` |
| `uq_suppliers_code/name` | Proveedor global incorrecto para clientes distintos | `(company_id, code/name)` |
| `uq_cash_closure_branch_date` | Correcto por branch, pero falta company performance | `(company_id, branch_id, closure_date)` |

## Reglas de integridad tenant

- Toda FK entre entidades tenant-scoped debe validar misma company en servicio.
- Donde sea viable, usar constraints compuestos en fases futuras.
- Detalles de alto volumen pueden llevar `company_id` directo para performance y QA de conteos.
- Tablas detalle sin `company_id` directo deben tener ruta inequívoca a cabecera tenant.
- No hacer `company_id NOT NULL` hasta tener backfill, conteos y QA cross-company.

## Pendientes de decision

- Usuarios con email global unico vs email por compania.
- QR/codigo de prenda global vs por compania.
- Catalogos tecnicos globales vs configurables por empresa.
- Seguridad settings global HPSQ vs por compania.
- Apariencia en `appearance_settings` vs migrar a `tenant_settings`.
