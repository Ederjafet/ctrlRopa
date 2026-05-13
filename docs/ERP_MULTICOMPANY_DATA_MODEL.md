# ERP - Modelo de datos multi-compania

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania  
Tipo: propuesta tecnica, sin migraciones

## Objetivo

Definir el modelo de datos recomendado para convertir el ERP actual mono-compania/multi-sucursal en una arquitectura multi-compania segura.

## Principio central

Toda entidad de negocio debe pertenecer directa o indirectamente a una `company`.

La relacion base recomendada es:

`companies -> branches -> operaciones`

El `branch_id` sigue siendo importante para operacion diaria, pero no puede ser el unico limite de seguridad. El limite superior debe ser `company_id`.

El modelo tambien debe separar datos de plataforma SaaS HPSQ-SOFT de datos operativos del cliente. Las tablas SaaS administran empresas, planes, limites, suscripciones, soporte y auditoria global; las tablas ERP operan ventas, pagos, inventario, lotes, clientes y reportes dentro de una compania.

## Tabla `companies`

Propuesta:

```sql
companies
- id
- code
- legal_name
- trade_name
- tax_id
- status
- plan_code
- created_at
- updated_at
- created_by_user_id
- updated_by_user_id
```

Indices sugeridos:

- `uq_companies_code`
- `idx_companies_status`
- `idx_companies_tax_id`

Campos adicionales recomendados antes de implementar SaaS:

- `commercial_name`
- `contact_name`
- `contact_email`
- `contact_phone`
- `billing_email`
- `timezone`
- `locale`
- `logo_url`
- `primary_color`
- `secondary_color`
- `suspended_at`
- `suspended_reason`
- `cancelled_at`

## Tablas SaaS de plataforma

Estas tablas pertenecen a la administracion HPSQ-SOFT y no deben mezclarse con pantallas ERP operativas de cliente.

### `tenant_settings`

Configuracion por compania.

```sql
tenant_settings
- id
- company_id
- setting_key
- setting_value
- value_type
- is_sensitive
- created_at
- updated_at
- created_by_user_id
- updated_by_user_id
```

Indices:

- `uq_tenant_settings_company_key (company_id, setting_key)`
- `idx_tenant_settings_company (company_id)`

Usos: branding, modulos habilitados, preferencias globales y configuracion operativa segura.

### `company_subscriptions`

Estado comercial y limites del plan.

```sql
company_subscriptions
- id
- company_id
- plan_code
- status
- started_at
- trial_ends_at
- current_period_start
- current_period_end
- grace_until
- suspended_at
- cancelled_at
- suspension_reason
- max_users
- max_branches
- max_storage_mb
- enabled_modules_json
- created_at
- updated_at
- created_by_user_id
- updated_by_user_id
```

Indices:

- `idx_company_subscriptions_company_status (company_id, status)`
- `idx_company_subscriptions_period_end (current_period_end)`

Regla: solo una suscripcion activa/gracia por compania debe permitirse.

### `company_status_history`

Historial de cambios de estado de empresa.

```sql
company_status_history
- id
- company_id
- previous_status
- new_status
- reason
- source
- changed_by_user_id
- changed_at
- metadata_json
```

Indices:

- `idx_company_status_history_company_date (company_id, changed_at)`
- `idx_company_status_history_status (new_status)`

Uso obligatorio para activar, suspender, cancelar o reactivar empresas.

### `saas_user_roles`

Roles HPSQ-SOFT separados de roles ERP cliente.

```sql
saas_user_roles
- id
- user_id
- saas_role_code
- status
- created_at
- created_by_user_id
```

Roles esperados:

- `HPSQ_SUPERADMIN`
- `HPSQ_SUPPORT`
- `HPSQ_BILLING`
- `HPSQ_IMPLEMENTATION`
- `HPSQ_AUDITOR`

### `support_access_sessions`

Acceso delegado/impersonation controlado.

```sql
support_access_sessions
- id
- hpsq_user_id
- company_id
- requested_reason
- approved_by_user_id
- ticket_reference
- allowed_scope
- started_at
- expires_at
- ended_at
- status
- created_at
```

Indices:

- `idx_support_sessions_company_status (company_id, status)`
- `idx_support_sessions_user_status (hpsq_user_id, status)`

Regla: todo acceso de soporte a una compania debe tener motivo, caducidad y auditoria.

## Relacion company -> branches

Tabla actual: `branches`.

Agregar en fase futura:

- `company_id BIGINT UNSIGNED NOT NULL`
- FK `branches.company_id -> companies.id`

Cambios de unicidad:

- Actual `uq_branches_code (code)` debe evolucionar a `uq_branches_company_code (company_id, code)`.
- Validar limite de sucursales contra `company_subscriptions.max_branches`.

Regla:

- Una sucursal pertenece a una sola compania.
- Todo `branchId` recibido por API debe validarse contra el `companyId` activo del usuario.

## Relacion company -> users

Estado actual:

- `users.branch_id` define sucursal principal.
- `user_branches(user_id, branch_id, is_primary)` permite multiples sucursales.
- `user_roles` y `user_permissions` no tienen scope compania.

Modelo recomendado:

```sql
user_companies
- user_id
- company_id
- status
- is_primary
- created_at
- created_by_user_id
```

```sql
user_company_branches
- user_id
- company_id
- branch_id
- is_primary
- created_at
```

Roles/permisos por compania:

```sql
user_company_roles
- user_id
- company_id
- role_id
```

```sql
user_company_permissions
- user_id
- company_id
- permission_id
```

Regla:

- `users.email` puede permanecer unico globalmente para login.
- La autorizacion debe resolverse por compania activa.
- Los usuarios HPSQ-SOFT deben tener roles SaaS separados y no depender de roles ERP cliente.
- Los usuarios cliente pueden pertenecer a varias companias solo si existe asignacion explicita en `user_companies`.

## Catalogos

Catalogos globales o por compania deben clasificarse:

Globales controlados por HPSQ-SOFT:

- `permissions`
- catalogo tecnico de codigos base si aplica

Por compania:

- `product_types`
- `brands`
- `sizes`
- `payment_methods`
- `sales_channels` si cada empresa puede configurarlos
- `suppliers`

Recomendacion:

- Agregar `company_id` a catalogos operativos configurables.
- Cambiar unicidades globales como `uq_suppliers_code`, `uq_suppliers_name`, `uq_product_types_code`, `uq_brands_name` a unicidades por compania.

## Clientes

Tabla actual: `customers` con `branch_id`, `owner_user_id`, `created_by_user_id`.

Agregar:

- `company_id`
- `updated_by_user_id`

Indices:

- `idx_customers_company_branch (company_id, branch_id)`
- `idx_customers_company_phone (company_id, phone)`
- `idx_customers_company_status (company_id, status)`

Regla:

- Clientes genericos deben ser por compania/sucursal, no globales.

## Inventario y prendas

Tablas principales:

- `items`
- `storage_locations`
- `boxes`
- catalogos de producto

Agregar:

- `items.company_id`
- `storage_locations.company_id`
- `boxes.company_id`

Indices:

- `idx_items_company_branch_status (company_id, branch_id, status)`
- `idx_items_company_code (company_id, code)`
- `idx_items_company_qr (company_id, qr_code)`

Regla:

- Codigos y QR deben ser unicos por compania o globales si se quiere escaneo universal. Recomendacion inicial: unico por compania, con validacion de tenant.

## Lotes y proveedores

Tablas actuales:

- `batches`
- `batch_classification_details`
- `suppliers`

Agregar:

- `batches.company_id`
- `suppliers.company_id`
- `batch_classification_details.company_id` opcional si se requiere filtro directo; si no, derivado por `batch_id`.

Indices:

- `idx_batches_company_branch_status (company_id, branch_id, status)`
- `idx_batches_company_supplier (company_id, supplier_id)`
- `idx_suppliers_company_status (company_id, status)`

Regla:

- Proveedor puede repetirse entre companias con diferente calidad/historial.
- `suppliers` debe ser tenant-scoped; el proveedor no debe ser global por defecto.

## Ventas, pagos y caja

Tablas:

- `sales`
- `customer_orders`
- `customer_order_items`
- `payments`
- `payment_allocations`
- `cash_closures`
- `cash_expenses`
- `refunds`
- `returns`

Agregar:

- `company_id` en tablas raiz de movimiento: ventas, pedidos, pagos, cierres, gastos, reembolsos, devoluciones.
- En tablas detalle, usar `company_id` si se requiere query directa de alto volumen; si no, derivar por cabecera.

Indices:

- `idx_sales_company_branch_date (company_id, branch_id, sold_at)`
- `idx_payments_company_branch_date (company_id, branch_id, paid_at)`
- `idx_cash_closures_company_branch_date (company_id, branch_id, closure_date)`

Regla:

- Nunca aplicar pago a venta/pedido de otra compania aunque el id exista.

## Reservas, live, paquetes y envios

Tablas:

- `lives`
- `reservations`
- `customer_packages`
- `customer_package_items`
- `shipments`
- `shipment_packages`

Agregar:

- `company_id` en cabeceras.
- Validar todos los items, clientes y paquetes contra misma compania.

Indices:

- `idx_lives_company_branch_status`
- `idx_reservations_company_branch_status`
- `idx_customer_packages_company_branch_status`
- `idx_shipments_company_branch_status`

## Reportes

Los reportes no necesariamente requieren tabla propia, pero cada consulta debe filtrar:

- `company_id`
- `branch_id` opcional y validado
- rango de fecha
- estado

Endpoints actuales como `/api/reports/daily-store`, `/api/reports/daily-deposits`, `/api/reports/live-control`, `/api/reports/remissions`, `/api/reports/movement-history` deben incorporar tenant scope.

## Auditoria

Tabla actual relevante: `system_movement_audit_log` segun documentos ERP.

Agregar:

- `company_id`
- `branch_id`
- `actor_user_id`
- `actor_support_user_id` opcional para soporte HPSQ-SOFT
- `entity_type`
- `entity_id`
- `action`
- `request_id`
- `ip_address`
- `user_agent`

Regla:

- Toda accion sensible debe poder reconstruirse por compania.
- Toda accion HPSQ-SOFT debe reconstruirse por compania, usuario interno, motivo, ticket y resultado.

## Metadata obligatoria

Para tablas de negocio nuevas o migradas:

- `company_id`
- `branch_id` cuando aplique
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`
- `cancelled_by_user_id` / `approved_by_user_id` cuando aplique

## Tablas prioritarias para `company_id`

Prioridad 1:

- `branches`
- `users` / `user_companies`
- `user_branches`
- `roles` / asignaciones por compania
- `customers`
- `items`
- `batches`
- `sales`
- `payments`
- `customer_orders`
- `reservations`
- `lives`

Prioridad 2:

- `customer_packages`
- `shipments`
- `cash_closures`
- `refunds`
- `returns`
- `transfers`
- `incidents`
- `suppliers`
- catalogos operativos

Prioridad 3:

- auditoria extendida
- logs tecnicos tenant-aware
- parametros de apariencia por compania
- parametros de seguridad por compania
- `tenant_settings`
- `company_subscriptions`
- `company_status_history`
- `support_access_sessions`

## Reglas de integridad

- Toda FK entre tablas tenant-scoped debe validar misma compania por servicio y, cuando sea viable, por constraints compuestos.
- Las unicidades operativas deben cambiar de globales a scoped:
  - `(company_id, code)`
  - `(company_id, branch_id, code)`
  - `(company_id, folio)` segun entidad.
- No permitir ids cruzados aunque el usuario tenga permiso global.
- Validar limites de plan en backend antes de crear usuarios, sucursales o habilitar modulos.
- No permitir que roles SaaS reemplacen permisos ERP sin acceso delegado auditado.

## Estrategia para datos existentes

1. Crear una compania inicial para los datos actuales.
2. Asignar todas las sucursales existentes a esa compania.
3. Asignar usuarios existentes a `user_companies`.
4. Mapear roles/permisos actuales como permisos de la compania inicial durante transicion.
5. Backfill de `company_id` por `branch_id` en tablas operativas.
6. Para tablas sin `branch_id`, derivar por cabecera o marcar `PENDIENTE DE VALIDAR`.
7. Mantener `company_id` nullable/controlado hasta terminar QA de conteos.
8. Hacer `company_id NOT NULL` solo despues de pruebas cross-company.
9. Crear segunda compania QA para validar aislamiento negativo.
10. No modificar datos productivos sin backup y rollback.

## Pendiente de validar

- Si habra usuarios con acceso a varias companias simultaneas en una misma sesion o seleccion activa por compania.
- Si catalogos como marcas/tallas/tipos seran globales o por compania.
- Si codigos QR de prendas deben ser globalmente unicos o unicos por compania.
- Si soporte HPSQ-SOFT necesita impersonacion o solo modo lectura auditado.
