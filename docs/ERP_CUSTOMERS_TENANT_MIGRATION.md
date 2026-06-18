# ERP - Customers tenant-aware migration

Fecha: 2026-05-13  
Rama: `feature/fase2j-customers-tenant-aware`  
Alcance: primera tabla P0 operativa tenant-aware (`customers`)  
Decision: `GO condicionado` para validar la siguiente P0 de bajo riesgo; `NO-GO` para ventas, pagos, live y reportes.

## Objetivo

Convertir `customers` en la primera entidad operativa con `company_id` obligatorio y consultas filtradas por company activa, manteniendo compatibilidad con la company `DEFAULT` y el comportamiento actual por sucursal.

## Archivos afectados

- `backend/control-ropa/src/main/resources/db/migration/V40__customers_tenant_company.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/Customer.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/customer/CustomerServiceTests.java`

## Migracion

Migracion creada: `V40__customers_tenant_company.sql`

Cambios:

- Agrega `customers.company_id`.
- Pobla `customers.company_id` desde `branches.company_id`.
- Convierte `company_id` a `NOT NULL`.
- Agrega FK `fk_customers_company`.
- Agrega indices:
  - `idx_customers_company_branch`
  - `idx_customers_company_branch_status`
  - `idx_customers_company_phone`

Backfill usado:

```sql
UPDATE customers c
JOIN branches b ON b.id = c.branch_id
SET c.company_id = b.company_id
WHERE c.company_id IS NULL;
```

## Endpoints afectados

Endpoints directos de clientes:

- `GET /api/customers/branch/{branchId}`
- `GET /api/customers/{id}`
- `GET /api/customers/branch/{branchId}/phone/{phone}`
- `GET /api/customers/branch/{branchId}/generic/{genericType}`
- `POST /api/customers/branch/{branchId}`
- `PUT /api/customers/{id}`
- `PATCH /api/customers/{id}/deactivate`

No se modificaron endpoints de ventas, pagos, live ni reportes.

## Queries tenant-aware

El repositorio agrega consultas por company activa:

- `findByCompanyIdAndId`
- `findByCompanyIdAndBranchIdOrderByNameAsc`
- `findByCompanyIdAndBranchIdAndPhone`
- `existsByCompanyIdAndBranchIdAndPhone`
- `findByCompanyIdAndBranchIdAndIsGenericTrueAndGenericType`

Se conservaron metodos legacy para no romper dependencias fuera de alcance. Esos usos quedan como riesgo pendiente hasta migrar sus modulos.

## Seguridad

Validaciones aplicadas en `CustomerService`:

- Resuelve tenant activo desde `TenantResolver.resolveCurrent()`.
- Valida que el `branchId` solicitado pertenece a la company activa con `assertBranchBelongsToCompany`.
- Busca clientes por `company_id` + `id` para evitar acceso por id directo a otra company.
- Crea clientes asignando `company` desde la sucursal validada.
- Evita que el frontend pueda inyectar `company` por JSON usando `@JsonIgnore`.

## Compatibilidad

- Se mantiene `branch_id` como eje visible para frontend.
- No cambia el contrato de `CustomerResponse`.
- Si `createdByUserId` no viene en el request, se asigna desde el usuario autenticado del tenant.
- Se mantiene company `DEFAULT` para datos existentes.

## QA ejecutado

Automatizado:

- `.\mvnw.cmd test`
- Resultado: `BUILD SUCCESS`, `18 tests`, `0 failures`, `0 errors`.
- Flyway valido `40 migrations` y la base local quedo en version `40`.

Runtime local:

- `GET http://localhost:8090/api/health` -> `200 OK`.
- Login `qa.admin@local.test` -> OK.
- `/api/tenant/current` con token -> company `DEFAULT`, branch `QA_CTR`.
- `POST /api/customers/branch/4` -> cliente QA creado con id `23`.
- `GET /api/customers/branch/4` -> lista clientes de `QA_CTR`.
- `GET /api/customers/branch/4/phone/{phone}` -> devuelve el cliente creado.
- `PUT /api/customers/23` -> actualiza nombre del cliente.
- `PATCH /api/customers/23/deactivate` -> estado `INACTIVE`.

## Riesgos pendientes

- No existe dataset Empresa A/B en runtime para probar fuga cross-company real con dos companies.
- `customer_addresses` y `customer_owner_history` siguen clasificados como P1 derivado en la matriz tenant.
- Ventas, pagos, reservas, paquetes, reportes y dashboard aun pueden usar clientes por `findById` o joins legacy; no se tocaron por alcance explicito.
- La unicidad actual `uq_customers_branch_phone` sigue por sucursal. Si el negocio requiere telefono unico por company completa, debe definirse en fase posterior.

## Rollback

Codigo:

- Revertir cambios en `Customer.java`, `CustomerRepository.java`, `CustomerService.java` y `CustomerServiceTests.java`.

Base de datos:

- Requiere backup previo si V40 ya fue aplicada en ambiente compartido.
- Rollback manual posible en QA si no hay dependencias nuevas:

```sql
ALTER TABLE customers DROP FOREIGN KEY fk_customers_company;
ALTER TABLE customers DROP INDEX idx_customers_company_branch;
ALTER TABLE customers DROP INDEX idx_customers_company_branch_status;
ALTER TABLE customers DROP INDEX idx_customers_company_phone;
ALTER TABLE customers DROP COLUMN company_id;
```

No aplicar rollback en produccion sin ventana, backup y validacion de dependencias.

## Decision

`GO condicionado` para siguiente P0 de bajo riesgo, siempre que antes exista evidencia Empresa A/B para cross-company.  
`NO-GO` para ventas, pagos, live y reportes hasta completar aislamiento en entidades base relacionadas.
