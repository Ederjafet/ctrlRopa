# ERP - Plan de migracion multi-compania

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania  
Tipo: plan, sin migraciones

## Objetivo

Migrar gradualmente el ERP actual a multi-compania sin romper el RC candidato aprobable de Fase 1.

Incluir la preparacion de la consola SaaS HPSQ-SOFT sin activar funcionalidades productivas hasta cerrar seguridad, QA cross-company y rollback.

## Estrategia general

Usar migracion incremental con compania default:

1. Crear `companies`.
2. Crear una compania inicial para los datos existentes.
3. Agregar `company_id` nullable o con default controlado en tablas prioritarias.
4. Backfill de datos existentes.
5. Agregar indices.
6. Actualizar backend para validar tenant.
7. Hacer `company_id` obligatorio.
8. Activar QA de aislamiento.

Orden recomendado por gobierno SaaS:

1. Documentacion.
2. Modelo `companies`.
3. Tenant context backend.
4. `company_id` en tablas criticas.
5. Filtros backend.
6. Permisos por compania.
7. Consola HPSQ-SOFT.
8. QA cross-company.
9. Hardening release.

No se recomienda big bang.

## Fases propuestas

### Fase MC-0 - Preparacion

Objetivo:

- Congelar RC actual.
- Crear backup QA.
- Documentar tablas afectadas.
- Crear dataset multi-compania de prueba.

Salida:

- No cambia produccion.
- Matriz tabla/campo/indice aprobada.

### Fase MC-S0 - Diseno SaaS HPSQ-SOFT

Objetivo:

- Definir consola privada HPSQ-SOFT.
- Definir roles SaaS separados.
- Definir planes, limites, suspension, soporte y auditoria.
- Definir que NO se implementa todavia.

Salida:

- `ERP_SAAS_ADMIN_CONSOLE.md`
- `ERP_SAAS_ROLES_PERMISSIONS.md`
- `ERP_SAAS_BILLING_AND_PLANS.md`
- Sin cambios productivos.

### Fase MC-1 - Compania base y sucursales

Cambios futuros:

- Crear `companies`.
- Crear `tenant_settings` minimo si branding/estado visible se requiere desde inicio.
- Crear `company_status_history` para cambios de estado.
- Agregar `branches.company_id`.
- Crear compania default para datos existentes.
- Backfill de `branches.company_id`.
- Cambiar unicidad de sucursal a `(company_id, code)`.

QA:

- Sucursales existentes siguen visibles.
- No cambia login actual.

Rollback:

- Revertir migracion si no hay datos nuevos multi-compania.

### Fase MC-2 - Usuarios y permisos por compania

Cambios futuros:

- Crear `user_companies`.
- Crear `saas_user_roles`.
- Migrar `users.branch_id` y `user_branches` a compania default.
- Crear asignaciones `user_company_roles` y `user_company_permissions`.
- Extender sesion para company activa.

QA:

- Usuarios actuales inician sesion igual.
- Usuario con una compania no ve selector innecesario.
- Usuario multi-compania selecciona contexto.

Rollback:

- Mantener compatibilidad temporal con `user_roles` y `user_permissions`.

### Fase MC-3 - Datos maestros

Tablas:

- `customers`
- `suppliers`
- `product_types`
- `brands`
- `sizes`
- `payment_methods`
- `sales_channels`
- `storage_locations`
- `boxes`

Cambios futuros:

- Agregar `company_id`.
- Cambiar unicidades globales a unicidades por compania.
- Backfill por sucursal/compania default.

QA:

- Empresa A puede tener proveedor/codigo igual que empresa B sin mezclar datos.

### Fase MC-4 - Inventario y lotes

Tablas:

- `batches`
- `batch_classification_details`
- `items`

Cambios futuros:

- Agregar `company_id` a cabeceras.
- Validar que item, batch, branch y supplier pertenecen a misma compania.

QA:

- Item de empresa B no puede venderse, reservarse o agregarse a paquete de empresa A.

### Fase MC-5 - Operacion financiera y comercial

Tablas:

- `sales`
- `payments`
- `payment_allocations`
- `customer_orders`
- `reservations`
- `lives`
- `cash_closures`
- `refunds`
- `returns`

Cambios futuros:

- Agregar `company_id`.
- Validar cruces customer/item/payment/order.
- Revisar reportes financieros.

QA:

- Venta/pago de empresa A no aparece en reportes empresa B.
- Pago no se puede aplicar a venta de otra compania.

### Fase MC-6 - Logistica y soporte

Tablas:

- `customer_packages`
- `shipments`
- `transfers`
- `incidents`
- auditoria y logs.
- `support_access_sessions`

QA:

- Paquetes/envios no cruzan companias.
- Soporte HPSQ-SOFT queda auditado.

### Fase MC-6B - Consola HPSQ-SOFT minima

Cambios futuros:

- Listado de empresas.
- Alta/edicion basica de empresa.
- Estado de empresa: activa/suspendida.
- Usuarios administradores de empresa.
- Vista tecnica de salud por empresa.
- Bitacora global.

Fuera de esta fase:

- Operar ventas/pagos desde consola.
- Borrado de datos productivos.
- Impersonacion completa.
- Facturacion automatica real.

### Fase MC-7 - Endurecimiento

Objetivo:

- Hacer `company_id NOT NULL`.
- Agregar constraints/indices finales.
- Eliminar compatibilidad temporal.
- Bloquear endpoints sin tenant scope.
- Bloquear consola SaaS si falta auditoria.

## Tablas prioritarias

Prioridad inmediata:

- `companies`
- `tenant_settings`
- `company_status_history`
- `branches`
- `users`
- `user_branches`
- `roles`/asignaciones
- `customers`
- `items`
- `batches`
- `sales`
- `payments`
- `reservations`
- `lives`

Prioridad siguiente:

- `company_subscriptions`
- `saas_user_roles`
- `support_access_sessions`
- `suppliers`
- `customer_orders`
- `customer_packages`
- `shipments`
- `cash_closures`
- `refunds`
- `returns`
- `transfers`
- `incidents`
- `system_movement_audit_log`

## Estrategia para no romper RC actual

- No modificar comportamiento hasta tener compania default.
- Mantener endpoints actuales temporalmente, pero validar `branchId` contra company.
- No cambiar rutas frontend en la primera migracion.
- Agregar pruebas antes de hacer `company_id NOT NULL`.
- Mantener rollback por fase.
- No activar consola HPSQ-SOFT en menu hasta tener permisos SaaS y auditoria.
- No aplicar suspension comercial a usuarios reales hasta validar flujo de reactivacion.

## Validaciones QA obligatorias

- Login usuario existente.
- Dashboard empresa default.
- Clientes por sucursal.
- Inventario por sucursal.
- Venta y pago QA controlado.
- Reportes por sucursal.
- Usuario empresa A no accede a branch empresa B.
- Usuario soporte requiere contexto y queda auditado.
- Empresa suspendida no opera.
- Empresa reactivada recupera acceso.
- Limites de plan bloquean creacion excedente.
- Branding se muestra por empresa.
- HPSQ-SOFT no puede modificar ventas/pagos sin herramienta auditada.

## Rollback

Por fase:

- Si solo se agregan columnas nullable, rollback puede ser no usar columnas nuevas.
- Si se cambian unicidades o NOT NULL, rollback requiere backup.
- Si se migra permisos, mantener tablas antiguas hasta validar.

Regla:

- No eliminar columnas ni tablas antiguas hasta cerrar QA multi-compania.

## Riesgos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Backfill incorrecto | CRITICO | Backup, script idempotente, conteos antes/despues. |
| Endpoint sin filtro tenant | CRITICO | Matriz endpoint tenant y tests negativos. |
| Permisos mezclados | CRITICO | Mantener compatibilidad, migrar por compania, QA por rol. |
| Roles SaaS visibles a cliente | CRITICO | Namespace `SAAS_*`, rutas privadas y pruebas negativas. |
| Suspension mal migrada | ALTO | Estado historico, pruebas de login y reactivacion. |
| Performance | MEDIO | Indices compuestos desde fases tempranas. |
| RC actual se rompe | ALTO | Feature flag/compatibilidad y fases pequenas. |

## Siguiente paso recomendado

Crear una matriz de tablas y endpoints con columna tenant requerida antes de escribir la primera migracion.
