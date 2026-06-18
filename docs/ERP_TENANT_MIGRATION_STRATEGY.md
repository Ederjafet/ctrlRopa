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

Estado Fase 2D:

- Implementado bootstrap minimo en `V38__tenant_bootstrap_companies.sql`.
- Creada tabla `companies`.
- Creada company default `DEFAULT / HPSQ-SOFT Default Company`.
- No se migraron ventas, pagos, live, reportes ni tablas P0 operativas.

Diseno:

- Crear `companies`.
- Crear company inicial para datos existentes.
- Registrar estado `ACTIVE`.
- Crear historial inicial.

Validacion:

- Company default existe.
- No cambia login.
- No cambia dashboard.

Estado de validacion Fase 2E:

- Validacion manual reportada como OK para company default, backend, dashboard y navegacion.
- Pruebas Maven OK.
- Validacion HTTP autenticada de `/api/tenant/current` queda pendiente por runtime no sincronizado con rama actual.

### MC-2 - Branches tenant

Estado Fase 2D:

- Implementado `branches.company_id`.
- Backfill de sucursales actuales hacia company default.
- Agregado indice `idx_branches_company_status`.
- Cambiada unicidad de `branches.code` global a `(company_id, code)`.
- Agregada FK `fk_branches_company`.

Diseno:

- Agregar `branches.company_id`.
- Backfill con company default.
- Indice `(company_id, status)` y unicidad `(company_id, code)`.

Validacion:

- Todas las branches tienen company.
- No hay branch sin company.
- Usuario actual sigue viendo sus branches.

Estado de validacion Fase 2E:

- Validacion manual reporta todas las sucursales actuales con `company_id = 1`.
- Sucursales siguen visibles y operativas.
- Pendiente capturar evidencia SQL/HTTP formal en QA despues de reinicio/despliegue.

### MC-3 - Usuarios y sesiones

Estado Fase 2F:

- Implementado `user_companies`.
- Backfill inicial de usuarios actuales hacia company default derivada de `users.branch_id`.
- `user_api_sessions` ahora puede guardar `active_company_id` y `active_branch_id`.
- Login nuevo crea sesion con tenant activo.
- `TenantResolver` resuelve tenant desde sesion activa cuando existe token.
- Se conserva fallback temporal desde `users.branch_id` para compatibilidad con sesiones antiguas.
- No se implemento selector/cambio de tenant.
- No se implementaron permisos por company.

Diseno pendiente:

- Crear selector/cambio de tenant auditado.
- Definir active company/branch en refresh token si se implementa.
- Revocar o recalcular sesiones cuando company se suspenda.
- Migrar roles/permisos a company scope.

Validacion:

- Todos los usuarios activos tienen company.
- Usuarios QA login OK.
- Usuario sin company no opera.
- Usuario no puede operar branch fuera de su company.
- `/api/tenant/current` devuelve company/branch activa con token valido.

Estado de pruebas Fase 2F:

- `.\mvnw.cmd test` exitoso.
- Flyway valido `39 migrations`.
- Validacion runtime real queda pendiente despues de reiniciar/desplegar backend.

Estado de validacion Fase 2G:

- Backend reiniciado en `localhost:8090`.
- Flyway `V39` confirmado por SQL.
- Company `DEFAULT` activa confirmada.
- `branches`: `5/5` con `company_id`.
- `user_companies`: `14` registros.
- Login `qa.admin@local.test` OK y sesion nueva con `active_company_id=1`, `active_branch_id=4`.
- `/api/tenant/current` sin token devuelve `401`.
- `/api/tenant/current` con token devuelve company/branch activa.
- Dashboard y sucursales activas responden OK.
- `qa.sinpermisos`, `qa.reportes` y `qa.soporte` no existen en la base runtime actual; completar dataset antes de P0.
- Decision: `NO-GO` para migrar primera tabla P0 hasta repetir smoke con dataset QA completo.

Preparacion Fase 2H:

- Creado script QA `docs/qa/06-usuarios-tenant-qa.sql`.
- El script prepara `qa.sinpermisos`, `qa.reportes` y `qa.soporte` con branch `QA_CTR`, company `DEFAULT` y `user_companies`.
- El script revoca sesiones legacy de esos usuarios para forzar login tenant-aware.
- No es migracion Flyway y no debe ejecutarse en PROD.
- P0 sigue bloqueado hasta ejecutar el script en QA y repetir smoke tenant-aware.

Estado de validacion Fase 2I:

- `docs/qa/06-usuarios-tenant-qa.sql` ejecutado en QA local.
- `qa.admin`, `qa.sinpermisos`, `qa.reportes` y `qa.soporte` validan login.
- Los cuatro usuarios resuelven `/api/tenant/current` con `DEFAULT / QA_CTR`.
- Sesiones nuevas guardan `active_company_id=1` y `active_branch_id=4`.
- `qa.sinpermisos` recibe 403 esperado en `/api/users` y reportes.
- `qa.reportes` accede a reportes y recibe 403 esperado en `/api/users`.
- `qa.soporte` conserva acceso tecnico esperado.
- Maven test OK.
- Decision: `GO condicionado` para primera tabla P0 de bajo riesgo.
- Restriccion: no migrar ventas, pagos, live ni reportes en la primera P0.
- Pendiente: dataset Empresa A/B para validar fuga cross-company real.

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

Fase 2D implementa el bootstrap minimo: `companies`, company default, `branches.company_id`, `CurrentTenantContext`, `TenantResolver` y `/api/tenant/current`. La siguiente fase no debe tocar flujos financieros todavia; conviene validar runtime QA, login, sucursales y dashboard con company default antes de migrar tablas P0 operativas.

## Avance Fase 2J - customers P0

Completado:

- `customers.company_id` agregado por `V40__customers_tenant_company.sql`.
- Backfill de clientes existentes desde `branches.company_id`.
- FK `fk_customers_company`.
- Indices por company/branch/status/phone.
- Endpoints directos de clientes filtran por company activa.
- Create/update/list/search/find/deactivate de clientes usan tenant activo.

Compatibilidad:

- `branch_id` se mantiene para contrato frontend y operacion actual.
- Company `DEFAULT` conserva datos existentes.
- Metodos legacy en `CustomerRepository` se mantienen para no tocar ventas, pagos, live ni reportes.

Pendiente:

- Dataset Empresa A/B para validar fuga cross-company real.
- Migrar `customer_addresses` y `customer_owner_history` como P1 derivado.
- Migrar consumidores de `CustomerRepository.findById` en ventas/pagos/reservas/paquetes/reportes en fases separadas.

Decision:

- Avance permitido solo a otra P0 de bajo riesgo.
- No migrar flujos financieros hasta completar entidad base y QA cross-company.

## Avance Fase 2K - items P0

Completado:

- `items.company_id` agregado por `V41__items_tenant_company.sql`.
- Backfill de items existentes desde `branches.company_id`.
- FK `fk_items_company`.
- Indices por company/branch/status/code/qr/batch/storage location.
- `V42__items_company_unique_scope.sql` cambia unicidad de codigo/QR de global a scoped por company.
- Endpoints directos de items filtran por company activa.
- Create/update/list/find/lookup code/lookup QR/location usan tenant activo o validan branch-company.

Compatibilidad:

- `branch_id` se mantiene para contrato frontend y operacion actual.
- Company `DEFAULT` conserva datos existentes.
- Metodos legacy en `ItemRepository` se mantienen para no tocar ventas, pagos, live, paquetes, envios ni reportes.

Pendiente:

- Dataset Empresa A/B para validar fuga cross-company real.
- Migrar consumidores de `ItemRepository.findById` en ventas/pagos/reservas/live/paquetes/envios/reportes en fases separadas.
- Decidir si `batches`, `storage_locations` y catalogos quedan company-scoped o globales administrados.

Decision:

- Avance permitido solo a otra P0 no financiera de bajo riesgo.
- No migrar flujos financieros ni reportes hasta completar QA cross-company.

## Avance Fase 2L - batches plan

Completado:

- Plan tecnico para migrar `batches` como siguiente P0 no financiera.
- Propuesta `V43__batches_tenant_company.sql`.
- Backfill desde `branches.company_id`.
- FK futura `fk_batches_company`.
- Unicidad futura `uq_batches_company_folio`.
- Indices por company/branch/status, company/folio y company/supplier.
- Validaciones SQL previas y posteriores.
- Riesgos de `batch_classification_details` y `items.batch_id` documentados.

Compatibilidad propuesta:

- Mantener contrato HTTP actual.
- Mantener `branch_id`.
- Mantener metodos legacy temporalmente para consumidores fuera de alcance.
- Acceder a `batch_classification_details` solo despues de validar tenant del batch.
- Usar items tenant-aware para conteos/cancelacion.

Pendiente:

- Implementar Fase 2M en rama separada.
- Agregar tests unitarios de `BatchService`.
- Ejecutar runtime smoke con `qa.admin@local.test`.
- Crear dataset Empresa A/B antes de declarar aislamiento SaaS real.

Decision:

- `GO documental` para implementar batches en fase posterior.
- No tocar ventas, pagos, live ni reportes.

## Avance Fase 2M - batches P0

Completado:

- `batches.company_id` agregado por `V43__batches_tenant_company.sql`.
- Backfill de lotes existentes desde `branches.company_id`.
- FK `fk_batches_company`.
- Unicidad `uq_batches_company_folio`.
- Indices:
  - `(company_id, branch_id, status)`
  - `(company_id, folio)`
  - `(company_id, supplier_id)`
- Endpoints directos de lotes filtran por company activa.
- Create/list/find/folio/receive/classification/reconcile/cancel usan tenant activo.
- `itemCount` usa items tenant-aware.

Compatibilidad:

- `branch_id` se mantiene para contrato frontend y operacion actual.
- Company `DEFAULT` conserva datos existentes.
- Metodos legacy se mantienen temporalmente para no tocar ventas, pagos, live ni reportes.
- `batch_classification_details` no recibe `company_id` todavia; queda protegido por acceso desde batch tenant-validado.

Validacion:

- `.\mvnw.cmd test` exitoso.
- Flyway valido `43 migrations`.
- Runtime local validado con `qa.admin@local.test`.
- Se valido crear, recibir, clasificar, reconciliar, buscar por id, buscar por folio, listar por branch y cancelar lote sin items.

Pendiente:

- Dataset Empresa A/B para validar fuga cross-company real.
- Tenantizar proveedores antes de operar SaaS real.
- Revisar consumidores legacy en live, reservaciones, ventas, pagos y reportes en fases separadas.
- Evaluar si `batch_classification_details` requiere `company_id` propio despues de estabilizar consumidores.

Decision:

- `GO condicionado` para considerar batches tenant-aware en company `DEFAULT`.
- No migrar flujos financieros ni live/reportes hasta completar QA cross-company.

## Avance Fase 2N - dataset Empresa A/B

Completado:

- Preparado script QA `docs/qa/07-empresa-ab-tenant-qa.sql`.
- El script crea companies `QA_A` y `QA_B`.
- El script crea branches `QA_A_CTR` y `QA_B_CTR`.
- El script crea usuarios admin/vendedor por company.
- El script asigna `user_companies` y `user_branches`.
- El script crea customers/items/batches duplicados por company para pruebas negativas.
- El script revoca sesiones legacy y limpia lock solo de usuarios A/B.
- Se creo plan de validacion `docs/ERP_TENANT_COMPANY_AB_QA_PLAN.md`.

Compatibilidad:

- `DEFAULT` no se modifica.
- No se borran datos historicos.
- No se truncaron tablas.
- No hay migracion Flyway nueva.
- No se modifico Java ni frontend.

Pendiente:

- Ejecutar script en QA con respaldo previo.
- Validar login A/B.
- Validar `/api/tenant/current` A/B.
- Validar aislamiento de customers/items/batches.
- Confirmar que `DEFAULT` sigue operativo.

Decision:

- `GO documental` para ejecutar dataset A/B en QA.
- `NO-GO` para declarar aislamiento SaaS real hasta completar evidencia runtime A/B.

## Avance Fase 2O - runtime Empresa A/B

Completado:

- Validacion SQL de companies `DEFAULT`, `QA_A`, `QA_B`.
- Validacion SQL de branches `QA_A_CTR`, `QA_B_CTR`.
- Validacion SQL de usuarios A/B activos y ligados a su company/branch.
- Validacion API de login para admin/vendedor A/B.
- Validacion API de `/api/tenant/current`.
- Validacion API de customers duplicados por company.
- Validacion API de items duplicados por company.
- Validacion API de lookup por code y QR.
- Validacion API de batches duplicados por folio.
- Validacion negativa cross-company con `404` esperado.
- Validacion de company `DEFAULT` con `qa.admin@local.test`.
- Validacion CORS preflight basico.
- Revision de logs sin 500 en ventana revisada.

Resultado:

- Aislamiento confirmado en endpoints directos de customers/items/batches.
- `DEFAULT` sigue operativo.

Pendiente:

- Revocar sesiones legacy `NULL/NULL` antes de release SaaS real.
- Tenantizar proveedores.
- Definir permisos por company.
- Mantener ventas, pagos, live, reservaciones y reportes fuera de alcance.

Decision:

- `GO condicionado` para continuar con P0 no financiera o hardening tenant.
- `NO-GO` para SaaS real completo.
