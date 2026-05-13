# ERP - Estrategia de migracion tenant

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Tipo: estrategia de migracion, sin SQL

## Objetivo

Definir una estrategia incremental para llevar el ERP actual mono-compania/multi-sucursal a SaaS multi-tenant con `company_id` obligatorio sin romper el RC actual.

## Principios

- Migracion incremental.
- Company default inicial.
- Backfill verificable.
- Compatibilidad dual temporal.
- Rollback por fase.
- No eliminar columnas/tablas antiguas hasta QA completo.
- No hacer `company_id NOT NULL` hasta validar datos y codigo.

## Fases propuestas

### MC-0 - Preparacion

- Backup QA.
- Congelar baseline.
- Confirmar matrices P0/P1/P2.
- Crear dataset QA Empresa A/B.
- Definir criterios de rollback.

### MC-1 - Companies y company default

Futuro:

- Crear `companies`.
- Crear company inicial para datos existentes.
- Registrar estado `ACTIVE`.
- Crear historial inicial.

Validacion:

- Company default existe.
- No cambia login.
- No cambia dashboard.

### MC-2 - Branches tenant

Futuro:

- Agregar `branches.company_id`.
- Backfill con company default.
- Indice `(company_id, status)` y unicidad `(company_id, code)`.

Validacion:

- Todas las branches tienen company.
- No hay branch sin company.
- Usuario actual sigue viendo sus branches.

### MC-3 - Usuarios y sesiones

Futuro:

- Crear `user_companies`.
- Backfill usuarios actuales.
- Validar `user_branches` contra company.
- Preparar `user_api_sessions` tenant-aware.

Validacion:

- Todos los usuarios activos tienen company.
- Usuarios QA login OK.
- Usuario sin company no opera.

### MC-4 - Tablas P0 operativas

Tablas:

- `customers`
- `items`
- `batches`
- `sales`
- `payments`
- `customer_orders`
- `reservations`
- `lives`
- `customer_packages`
- `shipments`
- `cash_closures`
- `customer_balance_movements`
- `system_movement_audit_log`

Estrategia:

- Agregar `company_id` nullable/controlado.
- Backfill desde `branch_id` cuando exista.
- Backfill por cabecera cuando sea detalle.
- Marcar excepciones como `PENDIENTE DE VALIDAR`.

### MC-5 - Servicios tenant-aware

Futuro:

- Tenant resolver.
- Access service tenant-aware.
- Validadores branch/entity.
- Queries P0 filtradas por company.

Validacion:

- Usuario A no ve B.
- Reportes A no incluyen B.
- QR/codigo B no funciona desde A.

### MC-6 - NOT NULL y constraints

Solo despues de QA:

- `company_id NOT NULL`.
- Indices compuestos.
- Unicidades por company.
- Constraints compuestos donde aplique.

### MC-7 - SaaS admin foundation

Futuro:

- `tenant_settings`
- `company_subscriptions`
- `saas_user_roles`
- `support_access_sessions`
- auditoria SaaS

No activar consola hasta tener auditoria y rutas protegidas.

## Tablas P0/P1/P2

### P0

- `companies`
- `branches`
- `users`
- `user_companies`
- `user_branches`
- `roles`/`user_company_roles`
- `permissions`/`user_company_permissions`
- `user_api_sessions`
- `customers`
- `items`
- `batches`
- `sales`
- `payments`
- `customer_orders`
- `reservations`
- `lives`
- `customer_packages`
- `shipments`
- `cash_closures`
- `customer_balance_movements`
- `system_movement_audit_log`

### P1

- `suppliers`
- `product_types`
- `brands`
- `sizes`
- `payment_methods`
- `storage_locations`
- `boxes`
- `branch_sales_channels`
- `refunds`
- `returns`
- `incidents`
- `appearance_settings` o `tenant_settings`
- `system_security_settings` si se decide por company

### P2

- detalles con company derivado si performance lo permite
- historiales secundarios
- logs tecnicos extendidos
- consignacion/settlements si no bloquean tenant inicial

## Backfill

Reglas:

- Si tabla tiene `branch_id`, derivar `company_id` desde `branches.company_id`.
- Si tabla detalle depende de cabecera, derivar de cabecera.
- Si tabla tiene `customer_id`, derivar de `customers.company_id`.
- Si tabla tiene `item_id`, derivar de `items.company_id`.
- Si no hay ruta confiable, no automatizar sin analisis.

Conteos minimos:

- total registros antes/despues.
- registros con `company_id` null.
- registros cuyo branch no coincide con company.
- detalles cuyo company no coincide con cabecera.
- ventas/pagos/reservas con entidades cruzadas.

## Compatibilidad dual

Durante transicion:

- Endpoints pueden seguir recibiendo `branchId`.
- Backend valida branch -> company.
- Queries pueden usar branch y company.
- Frontend no cambia hasta que backend tenga tenant context.
- Roles globales actuales pueden mapearse temporalmente a company default.

No prolongar compatibilidad indefinidamente.

## Rollback

Por fase:

- Columnas nullable: rollback logico dejando de usarlas.
- Backfill: restaurar backup si afecto datos.
- Unicidades/NOT NULL: requieren ventana y backup.
- Cambios auth/security: feature flag o branch rollback.

No aplicar cambios destructivos sin backup verificado.

## Ventanas de migracion

Recomendacion:

- MC-1/MC-2 en QA primero.
- MC-3 con prueba login completa.
- MC-4 por modulo, no todos juntos.
- MC-6 solo en ventana controlada.
- Produccion: fuera de horas pico, con backup y plan de revert.

## Riesgos de datos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Branch sin company | CRITICO | Conteo previo y constraint futuro |
| Entidad sin branch ni ruta a company | ALTO | Analisis manual |
| Detalle con company distinto a cabecera | CRITICO | Queries de validacion |
| Folios duplicados al cambiar unicidad | MEDIO | Revisar colisiones |
| QR/codigos globales | CRITICO | Decision antes de migrar |

## Riesgos operativos

- Login bloqueado por company mal asignada.
- Reportes lentos por indices insuficientes.
- Caja/pagos con company null.
- Soporte sin visibilidad por filtros demasiado estrictos.
- Suspension aplicada antes de probar reactivacion.

## Recomendacion

Fase 2C debe cerrar diseno y checklist de migracion. La primera fase de codigo real debe ser pequena: `companies`, company default y validacion de branches, sin tocar ventas/pagos/reportes todavia.
