# ERP - Plan QA Empresa A/B tenant-aware

Fecha: 2026-05-17  
Fase: 2N - dataset Empresa A/B  
Rama: `feature/fase2n-dataset-empresa-ab`  
Tipo: dataset QA y plan de validacion, sin codigo Java ni migraciones Flyway

## Objetivo

Preparar un dataset QA controlado para validar aislamiento real multi-company entre dos empresas dentro de la misma base de datos, sin borrar historicos, sin reiniciar la base y manteniendo `DEFAULT` intacto.

## Alcance

Script creado:

- `docs/qa/07-empresa-ab-tenant-qa.sql`

El script crea o actualiza:

- Companies:
  - `QA_A`
  - `QA_B`
- Branches:
  - `QA_A_CTR`
  - `QA_B_CTR`
- Usuarios:
  - `qa.a.admin@local.test`
  - `qa.b.admin@local.test`
  - `qa.a.vendedor@local.test`
  - `qa.b.vendedor@local.test`
- Password:
  - `Qa12345!`
- Relaciones:
  - `user_companies`
  - `user_branches`
  - `user_roles`
- Datos duplicados por company:
  - Customer `Cliente Duplicado QA` con telefono `5550000001`
  - Item `QA-DUP-001`
  - QR `QR-QA-DUP-001`
  - Batch `QA-DUP-BATCH-001`

## Fuera de alcance

- Ventas.
- Pagos.
- Live.
- Reportes.
- Reservaciones.
- Migraciones Flyway.
- Cambios Java.
- Frontend.
- Borrado o truncado de datos.
- Modificacion de company `DEFAULT`.

## Reglas de seguridad del dataset

- El script es solo QA.
- No debe ejecutarse en PROD.
- No elimina datos historicos.
- Solo revoca sesiones y limpia lock de login para usuarios `qa.a.*` y `qa.b.*`.
- La validacion de aislamiento debe hacerse desde backend runtime, no por inspeccion visual solamente.

## Preparacion

1. Confirmar que la base tiene migraciones hasta `V43`.
2. Hacer respaldo de QA.
3. Confirmar que `DEFAULT` sigue intacto.
4. Ejecutar:

```sql
SOURCE docs/qa/07-empresa-ab-tenant-qa.sql;
```

5. Reiniciar o cerrar sesiones existentes de los usuarios QA si el runtime no toma cambios.

## Validaciones SQL esperadas

### Companies

```sql
SELECT code, name, status
FROM companies
WHERE code IN ('DEFAULT', 'QA_A', 'QA_B')
ORDER BY code;
```

Esperado:

- `DEFAULT` existe y no fue modificado.
- `QA_A` existe activa.
- `QA_B` existe activa.

### Branches

```sql
SELECT c.code AS company_code, b.code AS branch_code, b.status
FROM branches b
JOIN companies c ON c.id = b.company_id
WHERE b.code IN ('QA_A_CTR', 'QA_B_CTR')
ORDER BY c.code, b.code;
```

Esperado:

- `QA_A_CTR` pertenece a `QA_A`.
- `QA_B_CTR` pertenece a `QA_B`.

### Usuarios tenant-aware

```sql
SELECT c.code AS company_code, b.code AS branch_code, u.email, u.status
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
WHERE u.email IN (
  'qa.a.admin@local.test',
  'qa.b.admin@local.test',
  'qa.a.vendedor@local.test',
  'qa.b.vendedor@local.test'
)
ORDER BY u.email;
```

Esperado:

- Usuarios A apuntan a `QA_A / QA_A_CTR`.
- Usuarios B apuntan a `QA_B / QA_B_CTR`.
- Todos activos.

### Datos duplicados

```sql
SELECT c.code AS company_code, cu.name, cu.phone
FROM customers cu
JOIN companies c ON c.id = cu.company_id
WHERE cu.name = 'Cliente Duplicado QA'
  AND cu.phone = '5550000001'
ORDER BY c.code;
```

```sql
SELECT c.code AS company_code, i.code, i.qr_code, i.price
FROM items i
JOIN companies c ON c.id = i.company_id
WHERE i.code = 'QA-DUP-001'
ORDER BY c.code;
```

```sql
SELECT c.code AS company_code, b.folio, b.status
FROM batches b
JOIN companies c ON c.id = b.company_id
WHERE b.folio = 'QA-DUP-BATCH-001'
ORDER BY c.code;
```

Esperado:

- Existen registros duplicados en `QA_A` y `QA_B`.
- Mismo telefono, item code, QR y folio existen separados por company.

## Validaciones runtime esperadas

### Login y tenant current

Usuarios:

- `qa.a.admin@local.test`
- `qa.b.admin@local.test`
- `qa.a.vendedor@local.test`
- `qa.b.vendedor@local.test`

Para cada usuario:

1. Login con `Qa12345!`.
2. Consumir `GET /api/tenant/current`.
3. Validar company/branch:
   - `qa.a.*` debe devolver `QA_A / QA_A_CTR`.
   - `qa.b.*` debe devolver `QA_B / QA_B_CTR`.

### Customers

1. Login `qa.a.admin@local.test`.
2. Buscar `Cliente Duplicado QA` o telefono `5550000001`.
3. Confirmar que solo devuelve el customer de `QA_A`.
4. Login `qa.b.admin@local.test`.
5. Repetir busqueda.
6. Confirmar que solo devuelve el customer de `QA_B`.

Resultado esperado:

- QA_A no ve customers QA_B.
- QA_B no ve customers QA_A.

### Items

1. Login `qa.a.admin@local.test`.
2. Buscar por code `QA-DUP-001`.
3. Buscar por QR `QR-QA-DUP-001`.
4. Confirmar que solo devuelve el item de `QA_A`.
5. Repetir con `qa.b.admin@local.test`.

Resultado esperado:

- QA_A no ve items QA_B.
- QA_B no ve items QA_A.
- Mismo code/QR funciona separado por company.

### Batches

1. Login `qa.a.admin@local.test`.
2. Buscar folio `QA-DUP-BATCH-001`.
3. Confirmar que devuelve batch de `QA_A`.
4. Repetir con `qa.b.admin@local.test`.

Resultado esperado:

- Mismo folio funciona separado por company.
- No hay fuga cross-company por folio.

## Criterio GO/NO-GO

GO para continuar si:

- Los cuatro usuarios hacen login.
- `/api/tenant/current` devuelve company/branch correcto.
- QA_A no ve datos QA_B.
- QA_B no ve datos QA_A.
- No hay errores 500.
- No hay 401/403 inesperados para usuarios con permisos.
- `DEFAULT` sigue funcionando.

NO-GO si:

- Cualquier usuario A ve datos B o viceversa.
- Lookup por code/QR/folio devuelve dato de otra company.
- Login crea sesion con `active_company_id` incorrecto.
- `DEFAULT` se modifica o queda inaccesible.
- El script falla por constraint o dato null.

## Rollback

Rollback recomendado en QA:

1. Revocar sesiones de usuarios `qa.a.*` y `qa.b.*`.
2. Desactivar usuarios `qa.a.*` y `qa.b.*` si se desea retirar acceso.
3. Desactivar branches `QA_A_CTR` y `QA_B_CTR`.
4. Desactivar companies `QA_A` y `QA_B`.
5. No borrar datos si ya se usaron para evidencia; conservarlos como historico QA.

Rollback fuerte:

- Restaurar respaldo QA previo a ejecutar `07-empresa-ab-tenant-qa.sql`.

## Riesgos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Script ejecutado fuera de QA | ALTO | Header `SOLO QA`, respaldo previo, no ejecutar en PROD |
| Permisos de ADMIN globales aun no son company-scoped | ALTO | Validar aislamiento por tenant resolver, no por permisos solamente |
| Proveedores siguen globales | MEDIO | No validar suppliers en esta fase |
| Reportes/live/ventas no tenantizados | CRITICO | No incluir esos flujos en validacion A/B |
| Sesiones previas contaminan evidencia | MEDIO | Script revoca sesiones de usuarios A/B |

## Siguiente fase recomendada

Fase 2O: ejecutar runtime smoke Empresa A/B con evidencia real:

- Login A/B.
- `/api/tenant/current`.
- Customers A/B.
- Items A/B code/QR.
- Batches A/B folio.
- Confirmar que `DEFAULT` sigue operativo.

