# ERP - Items tenant-aware migration

Fecha: 2026-05-13  
Rama: `feature/fase2k-items-tenant-aware`  
Alcance: segunda tabla P0 operativa tenant-aware (`items` / inventario)  
Decision: `GO condicionado` para la siguiente P0 no financiera; `NO-GO` para ventas, pagos, live y reportes.

## Objetivo

Convertir `items` en entidad tenant-aware con `company_id` obligatorio y consultas directas filtradas por company activa, manteniendo compatibilidad con company `DEFAULT`, branch `QA_CTR` y el frontend actual.

## Archivos afectados

- `backend/control-ropa/src/main/resources/db/migration/V41__items_tenant_company.sql`
- `backend/control-ropa/src/main/resources/db/migration/V42__items_company_unique_scope.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/Item.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/item/ItemServiceTests.java`

## Migracion

Migracion base: `V41__items_tenant_company.sql`

Cambios:

- Agrega `items.company_id`.
- Pobla `items.company_id` desde `branches.company_id`.
- Convierte `company_id` a `NOT NULL`.
- Agrega FK `fk_items_company`.
- Agrega indices:
  - `idx_items_company_branch_status`
  - `idx_items_company_code`
  - `idx_items_company_qr`
  - `idx_items_company_batch`
  - `idx_items_company_storage_location`

Backfill usado:

```sql
UPDATE items i
JOIN branches b ON b.id = i.branch_id
SET i.company_id = b.company_id
WHERE i.company_id IS NULL;
```

Migracion de unicidad: `V42__items_company_unique_scope.sql`

Cambios:

- Reemplaza unicidad global de `code` y `qr_code`.
- Agrega unicidad por company:
  - `uq_items_company_code (company_id, code)`
  - `uq_items_company_qr_code (company_id, qr_code)`

Nota operacional: `V41` ya habia sido aplicada localmente durante validacion. Por eso la unicidad se separo en `V42` para respetar checksum Flyway y mantener migraciones append-only.

## Endpoints afectados

Endpoints directos de inventario/items:

- `GET /api/items/branch/{branchId}`
- `GET /api/items/{id}`
- `GET /api/items/code/{code}`
- `GET /api/items/lookup/code/{code}`
- `GET /api/items/lookup/qr/{qrCode}`
- `POST /api/items`
- `PUT /api/items/{id}`
- `PATCH /api/items/{id}/location/{storageLocationId}`

No se modificaron endpoints de ventas, pagos, live ni reportes.

## Queries tenant-aware

El repositorio agrega consultas por company activa:

- `findByCompanyIdAndId`
- `findByCompanyIdAndCode`
- `findByCompanyIdAndQrCode`
- `existsByCompanyIdAndCode`
- `existsByCompanyIdAndQrCode`
- `findByCompanyIdAndBranchIdOrderByCreatedAtDesc`
- `findByCompanyIdAndBatchIdOrderByCreatedAtAsc`
- `findByCompanyIdAndStorageLocationIdOrderByCreatedAtDesc`

Se conservaron metodos legacy para no romper dependencias fuera de alcance. Esos usos quedan como riesgo hasta migrar consumidores en ventas, pagos, live, reportes, paquetes y envios.

## Seguridad

Validaciones aplicadas en `ItemService`:

- Resuelve tenant activo desde `TenantResolver.resolveCurrent()`.
- Valida que `branchId` pertenece a company activa con `assertBranchBelongsToCompany`.
- Busca item por `company_id` + `id` para evitar acceso directo por id a otra company.
- Busca codigo y QR por `company_id` para bloquear fuga por lookup.
- Crea items asignando `company` desde la sucursal validada.
- Valida que batch y storage location pertenezcan a la company activa mediante su branch.
- Evita que el frontend pueda inyectar `company` por JSON usando `@JsonIgnore`.

## Compatibilidad

- Se mantiene `branch_id` como eje visible para frontend.
- No cambia el contrato de `ItemResponse`.
- No se cambia la pantalla ni servicios frontend.
- Si `createdByUserId` no viene en el request, se asigna desde el usuario autenticado del tenant.
- Se mantiene company `DEFAULT` para datos existentes.

## QA ejecutado

Automatizado:

- `.\mvnw.cmd test`
- Resultado: `BUILD SUCCESS`, `22 tests`, `0 failures`, `0 errors`.
- Flyway valido `42 migrations` y la base local quedo en version `42`.

Runtime local:

- Login `qa.admin@local.test` -> OK.
- `/api/tenant/current` con token -> company `DEFAULT`, branch `QA_CTR`.
- Item QA `ITEM-TENANT-172749` / `QR-TENANT-172749` creado en `QA_CTR`.
- `PUT /api/items/27` -> actualiza precio a `125.00`.
- `GET /api/items/lookup/code/ITEM-TENANT-172749` -> devuelve item `27`.
- `GET /api/items/lookup/qr/QR-TENANT-172749` -> devuelve item `27`.
- `GET /api/items/branch/4` -> devuelve lista tenant/branch actual.

Evidencia runtime resumida:

```json
{
  "tenantCompany": "DEFAULT",
  "tenantBranch": "QA_CTR",
  "updatedItemId": 27,
  "updatedPrice": 125,
  "byCode": 27,
  "byQr": 27,
  "branchItems": 15
}
```

## Riesgos pendientes

- No existe dataset Empresa A/B para probar fuga cross-company real con dos companies.
- `batches`, `storage_locations`, `boxes` y catalogos relacionados aun no son company-scoped completos.
- Modulos que consumen items desde ventas, pagos, live, paquetes, envios o reportes pueden conservar consultas legacy hasta sus fases.
- La unicidad por company permite repetir codigo/QR entre companies; esto es correcto para tenant isolation, pero requiere QA cross-company antes de SaaS real.
- `ItemLookupResponse` puede incluir contexto de venta/reserva/paquete/envio del item encontrado; como el item ya esta filtrado por company, el riesgo directo baja, pero los modulos relacionados aun deben migrarse.

## Rollback

Codigo:

- Revertir cambios en `Item.java`, `ItemRepository.java`, `ItemService.java` y `ItemServiceTests.java`.

Base de datos:

- Requiere backup previo si `V41`/`V42` ya fueron aplicadas en ambiente compartido.
- Rollback manual posible en QA si no hay dependencias nuevas:

```sql
ALTER TABLE items DROP FOREIGN KEY fk_items_company;
ALTER TABLE items DROP INDEX idx_items_company_branch_status;
ALTER TABLE items DROP INDEX idx_items_company_code;
ALTER TABLE items DROP INDEX idx_items_company_qr;
ALTER TABLE items DROP INDEX idx_items_company_batch;
ALTER TABLE items DROP INDEX idx_items_company_storage_location;
ALTER TABLE items DROP INDEX uq_items_company_code;
ALTER TABLE items DROP INDEX uq_items_company_qr_code;
ALTER TABLE items ADD UNIQUE KEY uq_items_code (code);
ALTER TABLE items ADD UNIQUE KEY uq_items_qr_code (qr_code);
ALTER TABLE items DROP COLUMN company_id;
```

No aplicar rollback en produccion sin ventana, backup y validacion de dependencias.

## Decision

`GO condicionado` para siguiente P0 no financiera y de bajo riesgo, preferentemente una entidad base relacionada con inventario o catalogos operativos.  
`NO-GO` para ventas, pagos, live y reportes hasta completar QA Empresa A/B y migrar consumidores legacy.
