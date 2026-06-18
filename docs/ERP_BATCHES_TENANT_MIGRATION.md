# ERP - Migracion batches tenant-aware

Fecha: 2026-05-17  
Fase: 2M - batches tenant-aware runtime  
Rama: `feature/fase2m-batches-tenant-aware-runtime`  
Tipo: implementacion incremental P0 no financiera

## Objetivo

Convertir `batches` / lotes en una tabla tenant-aware usando `company_id`, manteniendo compatibilidad con el contrato actual del frontend y sin tocar ventas, pagos, live, reservaciones ni reportes.

## Alcance implementado

- Migracion `V43__batches_tenant_company.sql`.
- `batches.company_id` obligatorio.
- Backfill desde `branches.company_id`.
- FK `fk_batches_company`.
- Unicidad de folio por compania: `uq_batches_company_folio`.
- Indices tenant-aware:
  - `idx_batches_company_branch_status`
  - `idx_batches_company_folio`
  - `idx_batches_company_supplier`
- `Batch.company`.
- Consultas tenant-aware en `BatchRepository`.
- `BatchService` resolviendo tenant activo con `TenantResolver`.
- Validacion branch-company antes de crear/listar lote.
- Validacion batch-company para consultas por id y folio.
- `generateUniqueFolio` scoped por company.
- `itemCount` tenant-aware usando `items.company_id`.
- Proteccion de cancelacion ante mismatch `item.company_id != batch.company_id`.
- `batch_classification_details` se mantiene sin `company_id`, accediendo solo desde batch previamente tenant-validado.

## Fuera de alcance

- Ventas.
- Pagos.
- Live.
- Reservaciones.
- Reportes.
- Consola SaaS.
- Billing.
- Impersonation.
- UI multi-compania.
- `suppliers.company_id`.
- Dataset Empresa A/B.

## Archivos modificados

- `backend/control-ropa/src/main/resources/db/migration/V43__batches_tenant_company.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/Batch.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/batch/BatchServiceTests.java`

## Endpoints afectados

- `GET /api/batches/branch/{branchId}`
- `GET /api/batches/{id}`
- `GET /api/batches/folio/{folio}`
- `POST /api/batches/branch/{branchId}`
- `PATCH /api/batches/{id}/receive`
- `PUT /api/batches/{id}/classification`
- `PATCH /api/batches/{id}/reconcile`
- `PATCH /api/batches/{id}/cancel`

## Cambios tecnicos

### Migracion

`V43__batches_tenant_company.sql` agrega `company_id`, lo puebla desde la sucursal del lote y reemplaza la unicidad global de `folio` por unicidad dentro de la compania.

Validaciones esperadas antes de aplicar:

- Todos los batches existentes deben tener `branch_id`.
- Todas las branches deben tener `company_id`.
- No deben existir folios duplicados dentro de la misma company.

Validaciones esperadas despues de aplicar:

- Todos los batches tienen `company_id`.
- `batches.company_id = branches.company_id`.
- El mismo folio puede existir entre companies distintas, pero no dentro de la misma.

### Backend

`BatchService` ya no consulta lotes operativos con `findById` o `findByFolio` global para endpoints directos. Las rutas principales resuelven company activa desde la sesion tenant-aware y consultan:

- `findByCompanyIdAndId`
- `findByCompanyIdAndFolio`
- `findByCompanyIdAndBranchIdOrderByCreatedAtDesc`
- `existsByCompanyIdAndFolio`

La creacion de batch valida que la sucursal pertenezca a la company activa y asigna `Batch.company` desde `Branch.company`.

### Classification details

No se agrego `company_id` a `batch_classification_details` en esta fase. La proteccion se mantiene en el servicio:

1. Resolver batch por `id + company_id`.
2. Validar branch-company.
3. Acceder detalles por `batch_id`.

Este patron es aceptable como compatibilidad temporal, pero debe mantenerse prohibido consultar detalles directamente desde endpoints o servicios nuevos sin validar previamente el batch.

### Item count y cancelacion

`itemCount` usa `countByCompanyIdAndBatchId`.

La cancelacion valida primero que el total legacy por `batch_id` coincida con el total tenant por `company_id + batch_id`. Si hay mismatch, bloquea la operacion para evitar que un lote de una company oculte prendas de otra.

## Pruebas automatizadas

Comando ejecutado desde `backend/control-ropa`:

```powershell
.\mvnw.cmd test
```

Resultado:

- `BUILD SUCCESS`.
- `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`.
- Flyway valido `43 migrations`.
- Schema local quedo en `V43`.

Pruebas agregadas:

- Listado de batches usa company activa.
- Creacion asigna company desde branch y folio scoped por company.
- Lookup por folio es tenant-aware.
- Branch de otra company queda bloqueada antes de consultar.
- Cancelacion usa itemCount tenant-aware.
- Cancelacion bloquea mismatch item-company-batch.

## Runtime QA ejecutado

Ambiente local:

- Backend: `http://localhost:8090`.
- Usuario: `qa.admin@local.test`.
- Company activa: `DEFAULT`.
- Branch activa: `QA_CTR`.

Validaciones:

- Login QA: OK.
- `/api/tenant/current`: OK.
- Crear batch: OK.
- Recibir batch: OK.
- Guardar clasificacion: OK.
- Reconciliar batch: OK.
- Buscar por id: OK.
- Buscar por folio: OK.
- Listar batches por branch: OK.
- Cancelar batch sin items: OK.
- Inventario/items sigue respondiendo: OK.
- Customers sigue respondiendo: OK.
- Logs backend sin 500 relevantes en endpoints validados.

Evidencia runtime principal:

```json
{
  "tenantCompany": "DEFAULT",
  "tenantBranch": "QA_CTR",
  "supplierId": 1,
  "batchId": 5,
  "folio": "L-2026-47C61C",
  "receivedStatus": "RECEIVED",
  "classifiedQuantity": 2,
  "reconciledStatus": "RECONCILED",
  "byId": 5,
  "byFolio": 5,
  "batchListCount": 2,
  "itemListCount": 15,
  "customerListCount": 5
}
```

Evidencia cancelacion:

```json
{
  "cancelledBatchId": 6,
  "folio": "L-2026-A08C70",
  "status": "CANCELLED",
  "itemCount": 0
}
```

## Impacto indirecto detectado

- La validacion runtime necesito proveedor activo. Si QA no tiene proveedor activo, crear batch devuelve validacion amigable: `Selecciona el proveedor del lote`.
- `suppliers` sigue sin `company_id`, por lo que proveedores aun no deben considerarse tenant-safe.
- `batch_classification_details` depende de batch tenant-validado, pero no tiene aislamiento propio.
- Los consumidores legacy que llamen `BatchRepository.findById` fuera de `BatchService` deben revisarse antes de migrar live, ventas o reportes.
- La validacion cross-company real aun no existe porque falta dataset Empresa A/B.

## Riesgos pendientes

| Riesgo | Severidad | Estado | Mitigacion |
|---|---|---|---|
| Proveedores globales | ALTO | Pendiente | Tenantizar suppliers antes de SaaS real |
| Dataset Empresa A/B ausente | ALTO | Pendiente | Crear QA multi-company antes de declarar aislamiento real |
| Consumers legacy de batch | CRITICO | Pendiente | Revisar live/reservations/sales/reports en fases separadas |
| Classification details sin company_id | ALTO | Mitigado temporal | Mantener acceso solo desde batch validado |
| Folios cross-company no probados runtime | MEDIO | Pendiente | Crear Empresa B y probar duplicado permitido entre companies |

## Rollback

- Antes de release, rollback principal: revertir rama/cambios Java y restaurar backup de BD previo a V43.
- Si `V43` ya fue aplicada en un ambiente, no editar la migracion existente; crear migracion correctiva posterior o restaurar backup.
- Si se requiere volver a unicidad global de folio, validar primero que no existan folios duplicados entre companies.
- Validar despues del rollback:
  - Company `DEFAULT` sigue activa.
  - Branch `QA_CTR` sigue operativa.
  - Login QA funciona.
  - Dashboard e inventario cargan.

## Decision GO/NO-GO

Decision: `GO condicionado` para considerar batches tenant-aware dentro de company `DEFAULT`.

Condiciones:

- No declarar SaaS multi-company real hasta tener dataset Empresa A/B.
- No migrar ventas, pagos, live ni reportes con esta fase.
- No exponer soporte/consola SaaS sobre lotes hasta auditar permisos y acciones.
- Siguiente P0 debe mantenerse no financiera o preparar QA cross-company antes de tocar flujos criticos.

