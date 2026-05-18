# ERP - Backlog tecnico multi-compania

Fecha: 2026-05-13  
Fase: 2B - backlog tecnico tenant  
Rama: `feature/fase2b-matriz-tenant-endpoints`  
Tipo: backlog documental, sin implementacion

## Objetivo

Convertir el analisis de Fase 2A/2B en un backlog tecnico ordenado para implementar multi-compania con bajo riesgo, evitando fuga de datos entre clientes y manteniendo trazabilidad HPSQ-SOFT.

## Principios de ejecucion futura

- No big bang.
- Mantener RC actual estable.
- Primero infraestructura tenant, despues datos, despues permisos, despues consola SaaS.
- Cada tarea debe tener QA cross-company.
- Ningun endpoint P0 debe quedar sin validacion `company_id`.
- Toda accion HPSQ-SOFT debe auditarse antes de exponer consola.

## Backlog por epica

### EPIC-01 - Base SaaS y compania default

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Crear migracion futura `companies` | P0 | CRITICO | Matriz tablas aprobada | Existe compania default para datos actuales | Migracion QA, conteos antes/despues |
| Crear compania inicial y backfill de `branches.company_id` | P0 | CRITICO | `companies` | Todas las sucursales existentes tienen company | Login actual sigue funcionando |
| Agregar `company_id` nullable/controlado a tablas P0 | P0 | CRITICO | compania default | Tablas P0 tienen valor derivable | Conteos nulos, integridad por branch |
| Crear indices tenant P0 | P0 | ALTO | columnas P0 | Consultas criticas no degradan severamente | Smoke dashboard/reportes |

### EPIC-02 - Tenant context backend

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Definir `CurrentTenantContext` | P0 | CRITICO | `user_companies` conceptual | Contexto expone user, company, branch, soporte | Unit tests auth/context |
| Extender login para company activa | P0 | CRITICO | compania default | Usuario mono-company entra sin selector | Login QA roles existentes |
| Validar estado de company en login | P0 | CRITICO | `companies.status` | Suspendida no opera, activa entra | QA suspension/reactivacion |
| Validar branch contra company en servicio central | P0 | CRITICO | tenant context | `branchId` ajeno devuelve 403/404 | Tests negativos |

### EPIC-03 - Permisos por compania

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Crear modelo futuro `user_companies` | P0 | CRITICO | companies | Usuario asignado a company | Login y `me` |
| Migrar roles/permisos a company scope | P0 | CRITICO | user_companies | Permiso admin A no aplica en B | QA permisos cruzados |
| Separar roles SaaS `saas_user_roles` | P0 | CRITICO | roles SaaS definidos | Cliente no recibe `SAAS_*` | Prueba negativa consola |
| Actualizar `AccessService` tenant-aware | P0 | CRITICO | tenant context | `assertCan` requiere company | Tests endpoint P0 |

### EPIC-04 - Endpoints P0 tenant-safe

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Proteger usuarios/sucursales | P0 | CRITICO | tenant context/permisos | Admin solo ve su company | QA user admin A/B |
| Proteger clientes | P0 | CRITICO | customers.company_id | Customer B no visible desde A | API/UI negativo |
| Proteger inventario/items/lookups | P0 | CRITICO | items.company_id | QR/codigo B bloqueado desde A | Venta/reserva negativa |
| Proteger lotes/proveedores | P0 | CRITICO | batches/suppliers company | Lote/proveedor B no visible desde A | Inventario QA |
| Proteger ventas/pagos/caja | P0 | CRITICO | sales/payments/cash company | No hay pago/venta cross-company | QA financiero |
| Proteger live/reservas | P0 | CRITICO | lives/reservations company | Live B no visible desde A | QA live |
| Proteger paquetes/envios | P0 | CRITICO | packages/shipments company | Paquete B no agregado a envio A | QA logistica |
| Proteger dashboard/reportes | P0 | CRITICO | report queries company | Totales A no incluyen B | QA reportes cruzados |

### EPIC-05 - Unicidad e indices por company

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Cambiar folios globales a scoped por company | P1 | ALTO | backfill company | Folio igual permitido en A/B si aplica | QA create/list by company |
| Cambiar codigos/QR items segun decision | P0 | CRITICO | decision QR | Lookup no filtra otra company | QA QR negativo |
| Cambiar proveedores a scoped company | P1 | ALTO | suppliers.company_id | Mismo proveedor en A/B permitido | QA proveedores |
| Revisar catalogos globales vs tenant | P1 | MEDIO | decision producto | Catalogos no mezclan config cliente | QA catalogos |

### EPIC-06 - Auditoria tenant y SaaS

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Extender auditoria con company_id | P0 | ALTO | company_id P0 | Evento critico registra company | Revisar audit log |
| Auditar intentos cross-company | P0 | CRITICO | access tenant | Intento bloqueado queda registrado | Tests negativos |
| Crear modelo futuro auditoria SaaS | P1 | ALTO | roles SaaS | Accion HPSQ queda trazada | QA consola futura |
| Definir retencion/evidencia soporte | P2 | MEDIO | soporte SaaS | Evidencia consultable | Runbook soporte |

### EPIC-07 - Consola SaaS HPSQ-SOFT minima

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Guard/rutas SaaS privadas | P1 | CRITICO | roles SaaS | Cliente no abre consola | Prueba negativa |
| Listar empresas | P1 | ALTO | companies | HPSQ ve empresas segun rol | QA roles HPSQ |
| Crear/editar empresa | P1 | ALTO | auditoria SaaS | Alta/edicion auditada | QA audit action |
| Suspender/reactivar empresa | P1 | CRITICO | estado company | Suspension bloquea operacion y reactivacion restaura | QA suspension |
| Gestionar plan/limites | P1 | ALTO | subscriptions | Limites validados backend | QA plan limits |
| Abrir sesion soporte | P0/P1 | CRITICO | support sessions/auditoria | Soporte tiene motivo, ticket, caducidad | QA support audit |

### EPIC-08 - QA multi-compania

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion | Pruebas necesarias |
|---|---|---|---|---|---|
| Dataset QA Empresa A/B | P0 | CRITICO | companies | A y B tienen datos equivalentes | Scripts QA no destructivos |
| Usuarios QA por company/rol | P0 | CRITICO | permisos tenant | Roles no cruzan companies | Login A/B |
| Pruebas negativas por endpoint P0 | P0 | CRITICO | endpoints migrados | Usuario A no ve/modifica B | API/UI |
| Evidencia reportes/dashboards | P0 | CRITICO | reportes tenant | Totales aislados | Capturas/logs |
| Pruebas HPSQ consola | P1 | CRITICO | consola minima | Roles HPSQ respetados | QA SaaS |

## Dependencias criticas

1. No proteger endpoints antes de tener tenant context.
2. No crear consola SaaS antes de roles SaaS y auditoria.
3. No hacer `company_id NOT NULL` antes de backfill y conteos.
4. No cambiar unicidades de folio/QR sin decision de negocio.
5. No activar suspension sin prueba de reactivacion.

## Criterios generales de aceptacion

- Empresa A no puede ver, modificar, reportar ni inferir datos de Empresa B.
- Usuario multi-compania opera solo en company activa.
- Sucursal siempre pertenece a company activa.
- Reportes filtran `company_id` en todos los joins.
- HPSQ-SOFT opera con roles SaaS separados.
- Soporte HPSQ-SOFT queda auditado con motivo y caducidad.
- No hay cambios funcionales mezclados con migracion tenant.

## Siguiente fase recomendada

## Avance Fase 2D

Completado en bootstrap minimo:

- `companies` y company default.
- `branches.company_id` con backfill a company default.
- Indice `idx_branches_company_status`.
- Unicidad `uq_branches_company_code`.
- Entidad/repositorio/servicio `Company`.
- `CurrentTenantContext`, `TenantContextHolder`, `TenantResolver`.
- Endpoint autenticado `GET /api/tenant/current`.
- Validacion minima branch-company en `TenantResolver`.

Pendiente antes de tocar flujos financieros:

- Validacion runtime QA de migracion Flyway en base real.
- Smoke login/dashboard/sucursales con company default.
- Decidir si `user_api_sessions` se extiende con active company/branch en Fase 2E.
- Crear QA Empresa A/B antes de migrar tablas P0 operativas.

## Siguiente fase recomendada

Fase 2E debe validar bootstrap tenant en QA y preparar `user_companies`/sesiones tenant-aware. No conviene tocar ventas/pagos/reportes antes de validar login, sucursales y dashboard sobre company default.

## Avance Fase 2F

Completado en tenant runtime hardening minimo:

- Migracion `V39__tenant_user_company_sessions.sql`.
- Tabla `user_companies`.
- Backfill usuarios actuales hacia company default.
- Columnas `user_api_sessions.active_company_id` y `active_branch_id`.
- Backfill de sesiones existentes cuando existe usuario/sucursal/company.
- Modelo/repositorio/servicio `UserCompany`.
- Validacion usuario-company.
- Validacion usuario-branch-company.
- Login crea sesion con tenant activo.
- `TenantResolver` usa tenant activo de sesion y fallback temporal.
- `ApiTokenFilter` valida estado de company/branch activa.
- `/api/tenant/current` protegido por token.

Pruebas:

- `.\mvnw.cmd test` exitoso con `14 tests`.

Pendiente antes de tablas P0:

- Validar runtime real despues de reiniciar/desplegar backend.
- Capturar evidencia de `/api/tenant/current` autenticado.
- Confirmar SQL de `user_companies` y sesiones activas.
- Definir selector de tenant para usuarios multi-company.
- Definir permisos por company antes de endpoints operativos.

Nueva recomendacion:

Fase 2G debe ser validacion runtime y no migracion P0. Las tablas `customers`, `items`, `sales`, `payments`, `lives`, `reports` y paquetes siguen fuera de alcance hasta tener evidencia de tenant session estable.

## Avance Fase 2J

Epic: primera P0 operativa tenant-aware.

Completado:

- Migrar `customers` con `company_id`.
- Backfill desde `branches.company_id`.
- Filtrar endpoints directos de clientes por tenant activo.
- Probar create/list/search/update/deactivate en runtime local.
- Documentar rollback y riesgos.

Pendiente backlog:

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion |
|---|---|---|---|---|
| Crear dataset Empresa A/B | P0 | CRITICO | customers tenant-aware | Usuario A no puede ver cliente B |
| Migrar `customer_addresses` | P1 | ALTO | customers.company_id | Direcciones solo accesibles desde customer de company activa |
| Migrar `customer_owner_history` | P1 | ALTO | customers.company_id | Historial solo de customer/company activa |
| Revisar consumidores legacy de `CustomerRepository.findById` | P0 | CRITICO | entidades P0 siguientes | Cada modulo valida company antes de usar customer |
| Definir unicidad telefono por company o branch | P1 | MEDIO | decision negocio | Constraint documentado y probado |

## Avance Fase 2K

Epic: segunda P0 operativa tenant-aware, inventario/items.

Completado:

- Migrar `items` con `company_id`.
- Backfill desde `branches.company_id`.
- FK `fk_items_company`.
- Indices por company/branch/status/code/qr/batch/storage location.
- Unicidad de `code` y `qr_code` scoped por company.
- Filtrar endpoints directos de items por tenant activo.
- Probar update/list/lookup codigo/lookup QR en runtime local.
- Documentar rollback y riesgos.

Pendiente backlog:

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion |
|---|---|---|---|---|
| Crear dataset Empresa A/B | P0 | CRITICO | customers/items tenant-aware | Usuario A no puede ver cliente/item B |
| Revisar consumidores legacy de `ItemRepository.findById` | P0 | CRITICO | ventas/pagos/live/reportes futuros | Cada modulo valida company antes de usar item |
| Migrar `batches` | P0/P1 | ALTO | items.company_id | Items y lotes no cruzan companies |
| Migrar `storage_locations` | P1 | ALTO | branch/company | Ubicacion solo acepta items de su company |
| Definir catalogos globales vs tenant | P1 | MEDIO | decision negocio | Product types/brands/sizes no mezclan configuracion privada |

## Avance Fase 2L

Epic: planificacion de lotes tenant-aware, sin implementacion.

Completado:

- Analizar `Batch`, `BatchRepository`, `BatchService`, `BatchController` y `BatchClassificationDetail`.
- Documentar riesgos de `findById`, `findByFolio`, `itemCount` y clasificacion por `batch_id`.
- Proponer migracion futura `V43__batches_tenant_company.sql`.
- Definir cambios backend futuros y pruebas necesarias.
- Crear `docs/ERP_BATCHES_TENANT_IMPLEMENTATION_PLAN.md`.

Pendiente backlog:

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion |
|---|---|---|---|---|
| Implementar `batches.company_id` | P0 | CRITICO | customers/items tenant-aware | Lote pertenece a company activa |
| Reemplazar unicidad `folio` por company | P0 | ALTO | migracion V43 | Folio duplicado permitido entre companies, bloqueado dentro de la misma |
| Tenantizar `BatchRepository` | P0 | CRITICO | `company_id` | Id/folio/listado no exponen otra company |
| Tenantizar `itemCount` | P0 | ALTO | items tenant-aware | Conteo no infiere items cross-company |
| Proteger classification details | P0 | ALTO | batch validado | Detalles solo visibles desde batch tenant-validado |
| QA runtime batches | P0 | ALTO | implementacion Fase 2M | Crear/recibir/clasificar/reconciliar/cancelar sin romper frontend |

## Avance Fase 2M

Epic: tercera P0 operativa tenant-aware, lotes/batches.

Completado:

- Migrar `batches` con `company_id`.
- Backfill desde `branches.company_id`.
- FK `fk_batches_company`.
- Reemplazar unicidad global de `folio` por `uq_batches_company_folio`.
- Indices por company/branch/status, company/folio y company/supplier.
- Filtrar endpoints directos de batches por company activa.
- Tenantizar create/list/find by id/find by folio/receive/classification/reconcile/cancel.
- Ajustar `itemCount` para usar `items.company_id`.
- Bloquear cancelacion si existe mismatch item-company-batch.
- Validar runtime con `qa.admin@local.test`.
- Documentar `docs/ERP_BATCHES_TENANT_MIGRATION.md`.

Pendiente backlog:

| Tarea | Prioridad | Riesgo | Dependencia | Criterio de aceptacion |
|---|---|---|---|---|
| Crear dataset Empresa A/B | P0 | CRITICO | customers/items/batches tenant-aware | Usuario A no puede ver cliente/item/lote B |
| Tenantizar `suppliers` | P0/P1 | ALTO | batches.company_id | Proveedor B no visible desde A |
| Revisar consumidores legacy de `BatchRepository.findById` | P0 | CRITICO | live/reservations/sales/reports futuros | Cada modulo valida company antes de usar batch |
| Revisar `batch_classification_details` | P1 | ALTO | batch tenant-validado | No hay endpoint/servicio que consulte detalles sin batch validado |
| Probar folio duplicado entre companies | P1 | MEDIO | dataset Empresa A/B | Folio duplicado permitido entre companies, bloqueado dentro de la misma |
| Preparar siguiente P0 no financiera | P1 | ALTO | QA cross-company | No se toca dinero ni live antes de evidencia A/B |
