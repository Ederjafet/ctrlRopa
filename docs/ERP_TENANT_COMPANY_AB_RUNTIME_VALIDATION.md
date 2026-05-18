# ERP - Validacion runtime Empresa A/B tenant-aware

Fecha: 2026-05-18
Fase: 2O - validacion runtime Empresa A/B
Rama: `feature/fase2o-validacion-runtime-empresa-ab`
Tipo: validacion QA runtime y documentacion, sin cambios de codigo

## Objetivo

Validar en runtime real que `QA_A` y `QA_B` quedan aisladas en customers, items y batches, sin afectar la company `DEFAULT` y sin tocar ventas, pagos, live, reportes ni reservaciones.

## Ambiente

- Backend: `http://localhost:8090`.
- Base: `control_ropa`.
- Fecha/hora de validacion: 2026-05-18 aprox. 08:13 America/Mexico_City.
- SQL QA aplicado previamente: `docs/qa/07-empresa-ab-tenant-qa.sql`.

## Queries ejecutadas

### Companies

```sql
SELECT code,name,status
FROM companies
WHERE code IN ('DEFAULT','QA_A','QA_B')
ORDER BY code;
```

Resultado:

| code | name | status |
|---|---|---|
| DEFAULT | HPSQ-SOFT Default Company | ACTIVE |
| QA_A | QA Empresa A | ACTIVE |
| QA_B | QA Empresa B | ACTIVE |

### Branches

```sql
SELECT c.code AS company_code,b.code AS branch_code,b.status
FROM branches b
JOIN companies c ON c.id=b.company_id
WHERE b.code IN ('QA_A_CTR','QA_B_CTR')
ORDER BY c.code,b.code;
```

Resultado:

| company_code | branch_code | status |
|---|---|---|
| QA_A | QA_A_CTR | ACTIVE |
| QA_B | QA_B_CTR | ACTIVE |

### Usuarios

Resultado:

| company_code | branch_code | email | status |
|---|---|---|---|
| QA_A | QA_A_CTR | qa.a.admin@local.test | ACTIVE |
| QA_A | QA_A_CTR | qa.a.vendedor@local.test | ACTIVE |
| QA_B | QA_B_CTR | qa.b.admin@local.test | ACTIVE |
| QA_B | QA_B_CTR | qa.b.vendedor@local.test | ACTIVE |

### Datos duplicados

Customers:

| company_code | name | phone | customer_id |
|---|---|---|---:|
| QA_A | Cliente Duplicado QA | 5550000001 | 24 |
| QA_B | Cliente Duplicado QA | 5550000001 | 25 |

Items:

| company_code | code | qr_code | price | item_id |
|---|---|---|---:|---:|
| QA_A | QA-DUP-001 | QR-QA-DUP-001 | 111.00 | 28 |
| QA_B | QA-DUP-001 | QR-QA-DUP-001 | 222.00 | 29 |

Batches:

| company_code | folio | status | batch_id |
|---|---|---|---:|
| QA_A | QA-DUP-BATCH-001 | ANNOUNCED | 7 |
| QA_B | QA-DUP-BATCH-001 | ANNOUNCED | 8 |

## Endpoints validados

### Health

```text
GET /api/health -> 200 OK
```

### Login

Endpoint:

```text
POST /api/auth/login
```

| Usuario | Resultado | Branch |
|---|---|---|
| qa.a.admin@local.test | 200 OK | QA_A_CTR |
| qa.b.admin@local.test | 200 OK | QA_B_CTR |
| qa.a.vendedor@local.test | 200 OK | QA_A_CTR |
| qa.b.vendedor@local.test | 200 OK | QA_B_CTR |
| qa.admin@local.test | 200 OK | QA_CTR |

### Tenant current

Endpoint:

```text
GET /api/tenant/current
```

| Usuario | Resultado | Tenant |
|---|---|---|
| qa.a.admin@local.test | 200 OK | QA_A / QA_A_CTR |
| qa.b.admin@local.test | 200 OK | QA_B / QA_B_CTR |
| qa.a.vendedor@local.test | 200 OK | QA_A / QA_A_CTR |
| qa.b.vendedor@local.test | 200 OK | QA_B / QA_B_CTR |
| qa.admin@local.test | 200 OK | DEFAULT / QA_CTR |

### Customers

Endpoints:

```text
GET /api/customers/branch/{branchId}/phone/5550000001
GET /api/customers/{id}
```

| Usuario | Own customer | Cross-company id | Resultado |
|---|---:|---:|---|
| qa.a.admin@local.test | 24 | 25 | Cross 404 bloqueado |
| qa.a.vendedor@local.test | 24 | 25 | Cross 404 bloqueado |
| qa.b.admin@local.test | 25 | 24 | Cross 404 bloqueado |
| qa.b.vendedor@local.test | 25 | 24 | Cross 404 bloqueado |

### Items

Endpoints:

```text
GET /api/items/code/QA-DUP-001
GET /api/items/lookup/code/QA-DUP-001
GET /api/items/lookup/qr/QR-QA-DUP-001
GET /api/items/{id}
```

| Usuario | Own item | Lookup code | Lookup QR | Cross-company id | Resultado |
|---|---:|---:|---:|---:|---|
| qa.a.admin@local.test | 28 | 28 | 28 | 29 | Cross 404 bloqueado |
| qa.a.vendedor@local.test | 28 | 28 | 28 | 29 | Cross 404 bloqueado |
| qa.b.admin@local.test | 29 | 29 | 29 | 28 | Cross 404 bloqueado |
| qa.b.vendedor@local.test | 29 | 29 | 29 | 28 | Cross 404 bloqueado |

Nota: `lookup/code` y `lookup/qr` devuelven el item dentro de `item.id`; se valido con esa estructura.

### Batches

Endpoints:

```text
GET /api/batches/folio/QA-DUP-BATCH-001
GET /api/batches/{id}
```

| Usuario | Own batch | Cross-company id | Resultado |
|---|---:|---:|---|
| qa.a.admin@local.test | 7 | 8 | Cross 404 bloqueado |
| qa.a.vendedor@local.test | 7 | 8 | Cross 404 bloqueado |
| qa.b.admin@local.test | 8 | 7 | Cross 404 bloqueado |
| qa.b.vendedor@local.test | 8 | 7 | Cross 404 bloqueado |

### CORS/Auth

Preflight ejecutado:

```text
OPTIONS /api/tenant/current
Origin: http://localhost:8081
Access-Control-Request-Method: GET
Access-Control-Request-Headers: authorization
```

Resultado:

- `HTTP/1.1 200`.
- `Access-Control-Allow-Origin: http://localhost:8081`.
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`.
- `Access-Control-Allow-Headers: authorization`.

## Logs revisados

Archivo:

```text
C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log
```

Resultado:

- No se encontraron respuestas `500` en la ventana revisada.
- Los `404` observados corresponden a pruebas negativas cross-company esperadas.
- Hubo un `400 BAD_REQUEST` provocado por una llamada manual `curl` con JSON mal escapado durante la validacion; no corresponde a defecto del sistema.

## Sesiones

Resultado relevante:

- Usuarios QA_A tienen sesiones activas con `QA_A / QA_A_CTR`.
- Usuarios QA_B tienen sesiones activas con `QA_B / QA_B_CTR`.
- `qa.admin@local.test` tiene sesiones activas `DEFAULT / QA_CTR`.
- Persisten sesiones legacy `NULL/NULL` para `qa.admin@local.test`; riesgo ya conocido de transicion, no afecta evidencia A/B.

## Resultado

Estado: `GO condicionado`.

Se valida aislamiento runtime real para:

- Customers.
- Items.
- Lookup por code.
- Lookup por QR.
- Batches por folio.

No se detecto fuga cross-company entre `QA_A` y `QA_B` en endpoints directos validados.

## Riesgos pendientes

| Riesgo | Severidad | Estado | Mitigacion |
|---|---|---|---|
| Sesiones legacy `NULL/NULL` en `qa.admin` | MEDIO | Persistente | Revocar sesiones legacy antes de release SaaS real |
| Ventas/pagos/live/reportes no tenantizados | CRITICO | Fuera de alcance | No tocar ni habilitar SaaS real en esos modulos |
| Roles/permisos no son company-scoped completos | ALTO | Pendiente | Fase futura de permisos por company |
| Proveedores no tenant-aware | ALTO | Pendiente | Tenantizar suppliers antes de SaaS real |
| QA A/B aun no cubre UI completa | MEDIO | Pendiente | Validar frontend despues de endpoints P0 |

## Decision GO/NO-GO

GO:

- Avanzar a siguiente fase tecnica no financiera de tenant-aware o hardening de sesiones/permisos.

NO-GO:

- No migrar ventas, pagos, live, reservaciones ni reportes todavia.
- No declarar SaaS multi-company real todavia.

## Siguiente fase recomendada

Fase 2P recomendada:

- Tenantizar `suppliers` o preparar hardening de sesiones legacy y permisos por company.
- Mantener ventas/pagos/live/reportes fuera de alcance hasta que permisos y auditoria tenant-aware esten mas firmes.
