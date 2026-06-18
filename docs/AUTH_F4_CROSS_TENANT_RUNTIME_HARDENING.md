# AUTH-F4 - Runtime cross-tenant hardening P0

Fecha: 2026-05-25  
Rama: `feature/auth-f4-cross-tenant-runtime-hardening`

## Objetivo

Validar en runtime real que usuarios de `QA_A` y `QA_B` no puedan ver, modificar, consultar ni inferir datos de otra company/branch en endpoints P0.

Alcance P0:

- Clientes.
- Inventario / items.
- Lotes / batches.
- Pagos.
- Ventas.

Fuera de alcance:

- Cambios de calculos financieros.
- Cambios de reportes.
- Migraciones nuevas.
- Cambios de roles productivos.

## Usuarios QA usados

| Usuario | Company activa | Branch activa | Uso |
|---|---|---|---|
| `qa.a.admin@local.test` | `QA_A` / id `2` | `QA_A_CTR` / id `6` | Smoke admin A |
| `qa.b.admin@local.test` | `QA_B` / id `3` | `QA_B_CTR` / id `7` | Smoke admin B |

Credencial QA: `Qa12345!`

## Comandos curl / PowerShell reproducibles

Login QA_A:

```powershell
$body = @{ email = 'qa.a.admin@local.test'; password = 'Qa12345!' } | ConvertTo-Json
$a = Invoke-RestMethod -Uri 'http://localhost:8090/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$ha = @{ Authorization = "Bearer $($a.sessionToken)" }
```

Login QA_B:

```powershell
$body = @{ email = 'qa.b.admin@local.test'; password = 'Qa12345!' } | ConvertTo-Json
$b = Invoke-RestMethod -Uri 'http://localhost:8090/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$hb = @{ Authorization = "Bearer $($b.sessionToken)" }
```

Ejemplos de consulta:

```powershell
Invoke-RestMethod -Uri 'http://localhost:8090/api/customers/branch/6' -Headers $ha
Invoke-RestMethod -Uri 'http://localhost:8090/api/customers/branch/7' -Headers $ha
Invoke-RestMethod -Uri 'http://localhost:8090/api/items/code/QA-DUP-001' -Headers $ha
Invoke-RestMethod -Uri 'http://localhost:8090/api/batches/folio/QA-DUP-BATCH-001' -Headers $ha
Invoke-RestMethod -Uri 'http://localhost:8090/api/payments/1' -Headers $ha
Invoke-RestMethod -Uri 'http://localhost:8090/api/sales/1' -Headers $ha
```

## Evidencia runtime local

Backend local: `http://localhost:8090`  
Healthcheck: `GET /api/health -> 200`

| Caso | Usuario | Endpoint | Esperado | Real |
|---|---|---|---|---|
| Clientes propios QA_A | QA_A admin | `GET /api/customers/branch/6` | `200` | `200` |
| Clientes branch QA_B desde QA_A | QA_A admin | `GET /api/customers/branch/7` | `403/404` | `403` |
| Clientes propios QA_B | QA_B admin | `GET /api/customers/branch/7` | `200` | `200` |
| Clientes branch QA_A desde QA_B | QA_B admin | `GET /api/customers/branch/6` | `403/404` | `403` |
| Cliente propio QA_A | QA_A admin | `GET /api/customers/24` | `200` | `200` |
| Cliente QA_B desde QA_A | QA_A admin | `GET /api/customers/25` | `403/404` | `404` |
| Cliente QA_A desde QA_B | QA_B admin | `GET /api/customers/24` | `403/404` | `404` |
| Update propio QA_A | QA_A admin | `PUT /api/customers/24` | `200` | `200` |
| Update cross QA_B desde QA_A | QA_A admin | `PUT /api/customers/25` | `403/404` | `404` |
| Items propios QA_A | QA_A admin | `GET /api/items/branch/6` | `200` | `200` |
| Items branch QA_B desde QA_A | QA_A admin | `GET /api/items/branch/7` | `403/404` | `403` |
| Item propio QA_A por id | QA_A admin | `GET /api/items/28` | `200` | `200` |
| Lookup item QA_A por codigo duplicado | QA_A admin | `GET /api/items/code/QA-DUP-001` | `200` propio QA_A | `200`, id `28`, branch `6` |
| Lookup item QA_A por QR duplicado | QA_A admin | `GET /api/items/lookup/qr/QR-QA-DUP-001` | `200` propio QA_A | `200`, branch `6` |
| Lookup item QA_B por codigo duplicado | QA_B admin | `GET /api/items/code/QA-DUP-001` | `200` propio QA_B | `200`, id `29`, branch `7` |
| Batches propios QA_A | QA_A admin | `GET /api/batches/branch/6` | `200` | `200` |
| Batches branch QA_B desde QA_A | QA_A admin | `GET /api/batches/branch/7` | `403/404` | `403` |
| Batch QA_A por id | QA_A admin | `GET /api/batches/7` | `200` | `200` |
| Batch QA_A por folio duplicado | QA_A admin | `GET /api/batches/folio/QA-DUP-BATCH-001` | `200` propio QA_A | `200`, id `7`, branch `6` |
| Batch QA_B por folio duplicado | QA_B admin | `GET /api/batches/folio/QA-DUP-BATCH-001` | `200` propio QA_B | `200`, id `8`, branch `7` |
| Pago DEFAULT desde QA_A | QA_A admin | `GET /api/payments/1` | `403/404` | `403` |
| Pago DEFAULT desde QA_B | QA_B admin | `GET /api/payments/1` | `403/404` | `403` |
| Venta DEFAULT desde QA_A | QA_A admin | `GET /api/sales/1` | `403/404` | `403` |
| Venta DEFAULT desde QA_B | QA_B admin | `GET /api/sales/1` | `403/404` | `403` |
| Ventas branch QA_B desde QA_A | QA_A admin | `GET /api/sales/branch/7` | `403/404` | `403` |

## Fixes aplicados

### Clientes

- `CustomerService.findById`, `update` y `deactivate` ahora validan que el cliente pertenece a la branch activa del token, no solo a la company.
- Esto bloquea acceso por id a clientes de otra branch dentro de la misma company y mantiene bloqueo cross-company.

### Items

- `ItemService.findById`, `findByCode`, `lookupByCode`, `lookupByQrCode`, `update` y `changeLocation` validan branch activa.
- Los lookups por codigo/QR siguen resolviendo por company, pero ademas bloquean si el item encontrado no corresponde a la branch activa.
- Se evita que un operador de una sucursal use un codigo/QR para inferir una prenda de otra sucursal.

### Batches

- `BatchService.validateBatchBranch` valida contra `CurrentTenantContext`, company activa y branch activa.
- `findById`, `findByFolio`, recepcion, clasificacion, reconciliacion y cancelacion heredan esta validacion porque pasan por `findEntity`.

### Pagos

- `PaymentService.findByCustomer` y `findByReservation` validan cada pago antes de mapear respuesta.
- `PaymentService.voidPayment` valida tenant antes de anular.
- `createByItemCode` y `createByQrCode` dejaron de usar lookup global y ahora usan `company_id` + branch activa.
- `resolveTarget` valida branch activa de venta/reserva antes de registrar pago.

### Ventas

- `SaleService.findByBranch` y `findById` ya validan branch activa.
- `SaleService.create` valida branch activa para branch solicitada, item y customer antes de crear venta.

## Pruebas automatizadas agregadas

- `CustomerServiceTests`
  - cliente de otra branch activa se rechaza por id.
- `ItemServiceTests`
  - item de otra branch activa se rechaza por codigo.
- `BatchServiceTests`
  - batch de otra branch activa se rechaza por folio.
- `PaymentServiceAccessTests`
  - pagos por customer rechazan pagos de otra branch.
- Se conservan pruebas AUTH-F3 de pagos/ventas por id cross-branch.

## Validaciones ejecutadas

- `.\mvnw.cmd test`
  - Resultado: `BUILD SUCCESS`
  - Tests: 44, failures: 0, errors: 0.

## Pendientes

- Repetir smoke en QA remoto si la base QA difiere de local.
- Extender esta misma revision a reportes, reservaciones, paquetes, envios, saldos y devoluciones antes de declarar SaaS financiero completo.
- Validar con `qa.a.vendedor@local.test` y `qa.b.vendedor@local.test` en runtime si se requiere evidencia operativa por rol vendedor, no solo admin.

## Decision

Estado: `GO tecnico condicionado`.

AUTH-F4 bloquea los vectores P0 directos revisados para clientes, items, batches, pagos y ventas. La aprobacion final de SaaS multi-company completo sigue condicionada a endurecer reportes y consumidores financieros secundarios.
