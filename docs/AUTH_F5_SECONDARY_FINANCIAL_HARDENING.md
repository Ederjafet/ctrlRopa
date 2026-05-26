# AUTH-F5 - Hardening de consumidores secundarios y financieros derivados

Fecha: 2026-05-25  
Rama: `feature/auth-f5-secondary-financial-hardening`  
Estado: implementado tecnico con validacion automatizada

## Objetivo

Extender el hardening cross-tenant posterior a AUTH-F4 hacia consumidores secundarios y financieros derivados. La regla aplicada es que ningun endpoint debe devolver, modificar o inferir datos de una company/branch distinta a la activa en el token.

## Alcance

Modulos revisados:

- Reportes.
- Dashboard/metrica operativa.
- Reservaciones.
- Paquetes de cliente.
- Envios/shipments.
- Saldos de cliente.
- Devoluciones/refunds.
- Customer orders.
- Customer addresses.
- Historial propietario.

Fuera de alcance:

- Cambios de calculo financiero.
- Cambios funcionales de ventas, pagos o reportes.
- Migraciones SQL.
- Cambios de roles productivos.

## Endpoints revisados

| Modulo | Endpoints principales | Riesgo revisado | Resultado |
|---|---|---|---|
| Reportes | `/api/reports/daily-store`, `/daily-deposits`, `/daily-deliveries`, `/daily-cancellations`, `/live-control`, `/remissions`, `/movement-history` | `branchId` explicito sin validar branch activa | Corregido con `TenantAccessGuard.requireBranch` antes de consultar datos. |
| Reservaciones | `/api/reservations/**` | `findById`, `branchId`, `boxId`, `itemId`, `customerId`, `liveId` globales | Corregido con validacion de branch activa para reserva, branch, item, cliente, caja y live. |
| Customer addresses | `/api/customer-addresses/**` | `customerId` y address id globales | Corregido validando el cliente/direccion contra branch activa. |
| Owner history | `/api/customer-owner-history/**` | Historial por customer global | Corregido validando cliente contra branch activa. |
| Balance | `/api/balance/**` | `customerId`, `branchId`, `movementId`, `packageFolio`, `orderId` externos | Corregido validando branch activa en cliente, orden, movimiento y paquete. |
| Customer orders | `/api/customer-orders/**` | `orderId`, `branchId`, `customerId` externos | Corregido validando branch activa en orden y listados por branch. |
| Customer packages | `/api/customer-packages/**` | `packageId`, `folio`, `customerId`, `itemId`, `saleId`, `reservationId` externos | Corregido validando paquete, customer, item, venta y reserva contra branch activa; lookups item code/QR ahora usan company activa. |
| Shipments | `/api/shipments/**` | `shipmentId`, `folio`, `packageId`, `addressId`, `branchId` externos | Corregido validando envio, paquete, direccion y branch activa. |
| Refunds | `/api/refunds/**` | `refundId`, `returnId`, `customerId`, lookup code/QR global, status global | Corregido validando refund/return/customer por branch activa y lookup item por company activa. |
| Dashboard | `/api/dashboard/**` | Metricas por branches del usuario | Revisado: ya usa sucursales del usuario y controles por branch. |

## Fixes aplicados

Se creo `TenantAccessGuard` como helper central de bajo alcance:

- Resuelve `CurrentTenantContext`.
- Valida que `branchId` pertenezca a la company activa.
- Si la sesion tiene `active_branch_id`, exige que el recurso pertenezca exactamente a esa branch.
- Devuelve `AccessDeniedException` para acceso cross-branch/cross-company.

Servicios endurecidos:

- `ReservationService`.
- `CustomerAddressService`.
- `CustomerOwnerHistoryService`.
- `BalanceService`.
- `CustomerOrderService`.
- `CustomerPackageService`.
- `ShipmentService`.
- `RefundService`.
- Servicios de reportes diarios/movimientos/remisiones/control live.

## Pruebas agregadas

Se agrego `TenantAccessGuardTests`:

- Permite branch activa.
- Bloquea branch distinta dentro de la sesion activa.
- Bloquea branch de otra company.

Estas pruebas cubren la regla central reutilizada por los consumidores secundarios. Se conservan las pruebas previas AUTH-F3/F4 para clientes, items, batches, pagos y ventas.

## Runtime QA sugerido

Comandos base para repetir smoke cross-tenant:

```bash
curl -s -X POST http://localhost:8090/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"qa.a.admin@local.test\",\"password\":\"Qa12345!\"}"
curl -s -X POST http://localhost:8090/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"qa.b.admin@local.test\",\"password\":\"Qa12345!\"}"
```

Casos a ejecutar con token QA_A y QA_B:

- QA_A branch `6` contra `/api/reservations/branch/6` debe devolver `200`.
- QA_A contra branch QA_B debe devolver `403`.
- QA_A contra paquete/envio/refund/orden de QA_B o DEFAULT debe devolver `403`.
- QA_A lookup por item code/QR en paquetes/refunds no debe resolver item de QA_B.
- Reportes con branch ajena deben devolver `403`.

## Validaciones ejecutadas

- OK: `.\mvnw.cmd test` desde `backend/control-ropa`.
- Resultado: `BUILD SUCCESS`, 47 tests, 0 failures, 0 errors.
- Flyway valido 44 migraciones y no aplico cambios nuevos.
- Runtime local:
  - `GET /api/health` respondio `200`.
  - Login `qa.a.admin@local.test` respondio company `QA_A` y branch `QA_A_CTR` (`branchId=6`).
  - `GET /api/reports/daily-store?branchId=4&date=2026-05-25` con token QA_A respondio `403`, validando bloqueo de reporte cross-branch.

## Pendientes

- Ejecutar smoke curl completo QA_A/QA_B para todos los endpoints secundarios documentados.
- Crear pruebas de servicio especificas por modulo si se detecta regresion en runtime.
- Evaluar permisos finos futuros para reportes por tipo, paquetes, envios y saldos.
