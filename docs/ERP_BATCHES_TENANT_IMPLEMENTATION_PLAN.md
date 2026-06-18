# ERP - Batches tenant-aware implementation plan

Fecha: 2026-05-17  
Rama: `feature/fase2l-batches-tenant-aware`  
Tipo: diseno/documentacion, sin implementacion

## Objetivo

Preparar la implementacion futura de `batches` / lotes como tabla P0 tenant-aware, sin modificar codigo, migraciones, frontend, ventas, pagos, live ni reportes en esta fase.

## 1. Estado actual detectado

Tablas involucradas:

- `batches`
- `batch_classification_details`
- `items`
- `branches`
- `companies`
- `suppliers`
- `product_types`

Entidades y componentes revisados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/Batch.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchClassificationDetail.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchClassificationDetailRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/Item.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`

Endpoints actuales:

- `GET /api/batches/branch/{branchId}`
- `GET /api/batches/{id}`
- `GET /api/batches/folio/{folio}`
- `POST /api/batches/branch/{branchId}`
- `PATCH /api/batches/{id}/receive`
- `PUT /api/batches/{id}/classification`
- `PATCH /api/batches/{id}/reconcile`
- `PATCH /api/batches/{id}/cancel`

Consultas actuales de riesgo:

- `BatchRepository.findByFolio(String folio)` es global.
- `BatchRepository.existsByFolio(String folio)` es global.
- `BatchRepository.findByBranchIdOrderByCreatedAtDesc(Long branchId)` no incluye `company_id`.
- `BatchService.findEntity(Long id)` usa `findById` global.
- `BatchService.cancel` y `toResponse` cuentan items por `batch_id` sin `company_id`.
- `BatchService.toResponse` y `getClassifiedQuantity` consultan `batch_classification_details` por `batch_id`.

Dependencias actuales:

- `batches.branch_id` depende de `branches.id`.
- `branches.company_id` ya existe por tenant bootstrap.
- `items.batch_id` depende de `batches.id`.
- `items.company_id` ya existe por Fase 2K.
- `batch_classification_details.batch_id` depende de `batches.id`.
- Recepcion, clasificacion, reconciliacion y cancelacion cargan el lote por id global antes de operar.

## 2. Riesgos tenant

| Riesgo | Severidad | Mitigacion futura |
|---|---|---|
| `findById` sin `company_id` | CRITICO | Usar `findByCompanyIdAndId`. |
| `findByFolio` global | CRITICO | Usar `findByCompanyIdAndFolio`. |
| Listado por branch sin validar company | CRITICO | Validar `TenantResolver.assertBranchBelongsToCompany`. |
| Cancelacion usando items sin validar company | ALTO | Contar items con `company_id + batch_id`. |
| Classification details por batch sin validacion tenant previa | ALTO | Consultar detalles solo despues de validar batch. |
| `batches.folio` unico global | ALTO | Reemplazar por `uq_batches_company_folio`. |
| `item.company_id != batch.company_id` | CRITICO | Validacion SQL y service item/batch/company. |
| `batch.branch.company_id != batch.company_id` | CRITICO | Backfill desde branch y validacion service. |
| Fuga por `itemCount` | ALTO | Count tenant-aware. |
| N+1 al agregar validaciones | MEDIO | Indices compuestos y queries especificas. |
| Romper consumidores legacy | ALTO | Mantener metodos legacy temporalmente y no tocar live/reservations/sales/reports. |

## 3. Migracion propuesta

Migracion futura: `V43__batches_tenant_company.sql`.

Cambios:

- Agregar `batches.company_id`.
- Backfill desde `branches.company_id`.
- FK `fk_batches_company`.
- Reemplazar `uq_batches_folio` por `uq_batches_company_folio`.
- Agregar indices:
  - `(company_id, branch_id, status)`
  - `(company_id, folio)`
  - `(company_id, supplier_id)`

SQL propuesto:

```sql
ALTER TABLE batches
  ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id;

UPDATE batches b
JOIN branches br ON br.id = b.branch_id
SET b.company_id = br.company_id
WHERE b.company_id IS NULL;

ALTER TABLE batches
  MODIFY company_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_batches_company FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE batches
  DROP INDEX uq_batches_folio,
  ADD UNIQUE KEY uq_batches_company_folio (company_id, folio);

ALTER TABLE batches
  ADD INDEX idx_batches_company_branch_status (company_id, branch_id, status),
  ADD INDEX idx_batches_company_folio (company_id, folio),
  ADD INDEX idx_batches_company_supplier (company_id, supplier_id);
```

Validaciones previas:

```sql
SELECT COUNT(*) AS batches_without_branch FROM batches WHERE branch_id IS NULL;
SELECT COUNT(*) AS branches_without_company FROM branches WHERE company_id IS NULL;

SELECT br.company_id, b.folio, COUNT(*) AS duplicates
FROM batches b
JOIN branches br ON br.id = b.branch_id
GROUP BY br.company_id, b.folio
HAVING COUNT(*) > 1;
```

Validaciones posteriores:

```sql
SELECT COUNT(*) AS batches_without_company FROM batches WHERE company_id IS NULL;

SELECT COUNT(*) AS batch_branch_company_mismatch
FROM batches b
JOIN branches br ON br.id = b.branch_id
WHERE b.company_id <> br.company_id;

SELECT company_id, folio, COUNT(*) AS duplicates
FROM batches
GROUP BY company_id, folio
HAVING COUNT(*) > 1;
```

## 4. Cambios backend propuestos

`Batch`:

- Agregar relacion `Company company`.
- Usar `@JsonIgnore` para evitar inyeccion desde frontend.
- Cambiar unicidad JPA de folio global a `company_id + folio`.

`BatchRepository`:

- `Optional<Batch> findByCompanyIdAndId(Long companyId, Long id)`
- `Optional<Batch> findByCompanyIdAndFolio(Long companyId, String folio)`
- `boolean existsByCompanyIdAndFolio(Long companyId, String folio)`
- `List<Batch> findByCompanyIdAndBranchIdOrderByCreatedAtDesc(Long companyId, Long branchId)`

`BatchService`:

- Inyectar `TenantResolver`.
- Resolver `CurrentTenantContext`.
- Validar branch-company en listados y creacion.
- Validar batch-company en `findById`, `findByFolio`, `receive`, `classification`, `reconcile` y `cancel`.
- Validar item-company-batch para conteos y cancelacion.
- Ajustar `generateUniqueFolio` a company activa.
- Ajustar `toResponse` e `itemCount` para usar `company_id`.
- Acceder a classification details solo desde batch tenant-validado.

`BatchClassificationDetailRepository`:

- Puede mantenerse por `batch_id` si solo se llama despues de validar batch.
- Mejora futura: agregar queries con join por `batch.company.id`.

`ItemRepository`:

- Usar `findByCompanyIdAndBatchIdOrderByCreatedAtAsc`.
- Preferible agregar `countByCompanyIdAndBatchId`.

## 5. Endpoints afectados

- `GET /api/batches/branch/{branchId}`
- `GET /api/batches/{id}`
- `GET /api/batches/folio/{folio}`
- `POST /api/batches/branch/{branchId}`
- `PATCH /api/batches/{id}/receive`
- `PUT /api/batches/{id}/classification`
- `PATCH /api/batches/{id}/reconcile`
- `PATCH /api/batches/{id}/cancel`

No cambiar contrato frontend; la proteccion debe estar en backend.

## 6. Pruebas necesarias

- Crear batch tenant-aware.
- Listar batches por branch/company.
- Buscar por id tenant-aware.
- Buscar por folio tenant-aware.
- Recibir lote.
- Guardar clasificacion.
- Reconciliar.
- Cancelar lote sin items.
- Bloquear lote de otra compania.
- Bloquear branch fuera de compania.
- Validar `itemCount` tenant-aware.
- Validar folio duplicado permitido entre companias pero no dentro de la misma.
- Validar que no se rompen customers/items ya tenant-aware.
- Validar que el frontend actual sigue funcionando.

## 7. Runtime QA esperado

1. Login `qa.admin@local.test`.
2. `GET /api/tenant/current`.
3. Crear lote QA.
4. Recibir lote QA.
5. Clasificar lote QA.
6. Reconciliar lote QA cuando aplique.
7. Cancelar un lote QA sin items.
8. Validar dashboard/sucursales/inventario.
9. Validar logs sin `500`.
10. Validar que no haya `401/403` inesperados.

## 8. Compatibilidad temporal y deuda tecnica

Consultas legacy que podrian mantenerse temporalmente:

- `findByFolio`
- `existsByFolio`
- `findByBranchIdOrderByCreatedAtDesc`
- `findById` heredado

No deben usarse desde endpoints directos de `BatchService` despues de la migracion.

Consumidores a revisar despues:

- `ItemService` con `batchId`.
- Dashboard.
- Reportes de inventario y movimientos.
- Transferencias.
- Incidencias/devoluciones.
- Live, reservations, sales y packages si infieren batch por item.

Deuda pendiente:

- `suppliers` aun no es tenant-aware completo.
- `product_types`, `brands`, `sizes` requieren decision global vs tenant.
- `batch_classification_details` no tendra `company_id` propio en esta propuesta.
- Reports/live/reservations/sales siguen fuera de alcance tenant completo.

Estrategia para no romper RC:

- No cambiar rutas HTTP.
- No tocar frontend.
- Mantener company `DEFAULT`.
- Mantener metodos legacy mientras consumidores externos no migren.
- Agregar pruebas unitarias.
- Ejecutar `.\mvnw.cmd test`.
- Validar runtime con `qa.admin@local.test`.

## 9. Rollback

Codigo futuro:

- Revertir cambios en `Batch.java`, `BatchRepository.java`, `BatchService.java` y pruebas asociadas.
- No revertir customers/items.

Rollback DB en QA, solo con backup y si no hay dependencias nuevas:

```sql
ALTER TABLE batches DROP FOREIGN KEY fk_batches_company;
ALTER TABLE batches DROP INDEX idx_batches_company_branch_status;
ALTER TABLE batches DROP INDEX idx_batches_company_folio;
ALTER TABLE batches DROP INDEX idx_batches_company_supplier;
ALTER TABLE batches DROP INDEX uq_batches_company_folio;
ALTER TABLE batches ADD UNIQUE KEY uq_batches_folio (folio);
ALTER TABLE batches DROP COLUMN company_id;
```

Consideraciones Flyway:

- No editar `V43` despues de aplicada.
- Crear `V44` si se requiere ajuste posterior.
- Revertir unicidad de folio solo si no existen folios duplicados globales.

Validar DEFAULT despues del rollback:

- Login `qa.admin@local.test`.
- `/api/tenant/current`.
- `GET /api/batches/branch/4`.
- Crear lote QA.
- Dashboard/sucursales/inventario sin errores.

## 10. Criterio GO/NO-GO

GO:

- Tests pasan.
- Runtime no rompe customers/items.
- Batch queda filtrado por company activa.
- No hay folios duplicados dentro de la misma company.
- Branch cross-company se bloquea.
- `itemCount` usa company activa.
- Classification details solo se consultan despues de validar batch.

NO-GO:

- Hay `500`.
- Hay fuga tenant.
- Hay folios cruzados dentro de la misma company.
- Branch cross-company es aceptada.
- Hay `item.company_id != batch.company_id`.
- Hay `batch.branch.company_id != batch.company_id`.
- Frontend actual deja de listar/recibir/clasificar/reconciliar lotes.
- Customers/items tenant-aware se rompen.

## Siguiente fase recomendada

Fase 2M: `feature/fase2m-batches-tenant-aware-runtime`.

Alcance recomendado:

- Migracion `V43`.
- `Batch.company`.
- `BatchRepository` tenant-aware.
- `BatchService` tenant-aware.
- Tests unitarios.
- Runtime smoke de endpoints directos de lotes.
- Documentacion de evidencia.

No tocar:

- Ventas.
- Pagos.
- Live.
- Reportes.
- SaaS console.
- Billing.
- Refactor masivo.
- Multi-company UI completa.
