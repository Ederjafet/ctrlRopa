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

Fase 2C debe ser preparacion de modelo base y tenant context minimo: `companies`, compania default, matriz de migracion final por tabla y diseno tecnico de `CurrentTenantContext`. No conviene tocar ventas/pagos/reportes antes de cerrar esa base.
