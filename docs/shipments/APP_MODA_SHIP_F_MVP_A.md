# APP_MODA_SHIP_F_MVP_A - Reporte operativo de saldos de envio

Fecha: 2026-07-01
Rama: `feature/ship-f-reportes-envio`
Base: `0c36649 Documenta alcance de reportes de envio SHIP-F`

## Resumen ejecutivo

SHIP-F-MVP-A agrega visibilidad operativa de saldos y pagos de envio dentro del modulo `Envios`.

El reporte permite revisar costo real, monto asignado a clientes/paquetes, monto pagado de envio y saldo pendiente de envio. Es un reporte operativo de envio: no mezcla pagos de mercancia, no toca Paquetes, no modifica el Centro del negocio y no crea reportes financieros generales.

Decision sugerida inicial: `GO_INTERNO` si backend, frontend y export pasan en el entorno local.

## Que implementa

- Endpoint read-only `GET /api/shipments/branch/{branchId}/shipping-balances`.
- DTO backend `ShipmentShippingBalanceResponse`.
- Metodo `ShipmentService.findShippingBalancesByBranch(branchId)`.
- Servicio frontend `getShippingBalances(branchId)`.
- Vista `Saldos de envio` dentro de `/shipments`.
- Tarjetas resumen de saldos/pagos de envio.
- Filtros frontend: todos, pendientes, parciales, pagados y sobrepagados.
- Lista compacta por envio con folio, cliente, estado logistico, costo real, asignado, pagado, saldo y estado de pago.
- Tests backend focalizados en calculos del reporte.

## Que no implementa

- No modifica Centro del negocio.
- No crea reportes financieros generales.
- No mezcla saldos de mercancia con saldos de envio.
- No toca Paquetes ni detalle de paquete.
- No modifica pagos de mercancia.
- No usa `PaymentService` para pagos de envio.
- No crea migraciones.
- No agrega permisos nuevos.
- No implementa filtros backend avanzados por rango de fechas o cliente.

## Endpoint

```text
GET /api/shipments/branch/{branchId}/shipping-balances
```

Permiso MVP:

```text
MANAGE_SHIPMENTS
```

Respuesta por envio:

```text
shipmentId
shipmentFolio
shipmentStatus
customerId
customerName
packageCount
realShippingCost
assignedShippingAmount
paidShippingAmount
pendingShippingBalance
absorbedAmount
overassignedAmount
overpaidAmount
paymentStatus
createdAt
dispatchedAt
deliveredAt
```

## Calculos

- `assignedShippingAmount`: suma de `ShipmentCostShare.assignedAmount` del envio.
- `paidShippingAmount`: suma de `ShipmentPayment.amount` con estado `REGISTERED`.
- `pendingShippingBalance`: `max(assignedShippingAmount - paidShippingAmount, 0)`.
- `overpaidAmount`: `max(paidShippingAmount - assignedShippingAmount, 0)`.
- `absorbedAmount`: `max(realShippingCost - assignedShippingAmount, 0)`.
- `overassignedAmount`: `max(assignedShippingAmount - realShippingCost, 0)`.

No se leen pagos de mercancia ni se invoca `PaymentService`.

## Estados operativos de pago

```text
NO_COST   -> sin costo real, sin asignacion y sin pago
PENDING   -> asignado > 0 y pagado = 0
PARTIAL   -> pagado > 0 y pagado < asignado
PAID      -> pagado = asignado, o asignado = 0 sin deuda para cliente
OVERPAID  -> pagado > asignado
```

## Frontend

En `/shipments` se agrega un selector compacto:

```text
Operacion
Saldos de envio
```

La vista `Saldos de envio` muestra una nota de alcance:

```text
Estos importes corresponden solo al envio. No modifican ni representan saldo de mercancia.
```

Resumen mostrado:

```text
Envios con saldo pendiente
Total saldo pendiente
Envios pagados
Total pagado de envio
```

Lista por envio:

```text
Folio envio
Cliente
Estado logistico
Costo real
Asignado
Pagado
Saldo
Absorbido
Estado de pago
```

Cada fila mantiene accion `Ver envio` para abrir el detalle operativo existente.

## Tests backend agregados

Cobertura focalizada en `ShipmentServiceTests`:

- Envio sin costo/asignacion/pago -> `NO_COST`.
- Asignado 120 y pagado 0 -> `PENDING`, saldo 120.
- Asignado 120 y pagado 50 -> `PARTIAL`, saldo 70.
- Asignado 120 y pagado 120 -> `PAID`, saldo 0.
- Asignado 120 y pagado 150 -> `OVERPAID`.
- Costo real 120 y asignado 0 -> absorbido 120.
- Costo real 120 y asignado 150 -> sobreasignado 30.
- Validacion explicita de que no se invoca `PaymentService`.

## Riesgos y limites

- El endpoint calcula por envio usando repositorios existentes. Para volumen alto, conviene optimizar con queries por lista de shipment IDs en una fase posterior.
- Los filtros de cliente/rango de fechas quedan para SHIP-F2.
- Se mantiene `MANAGE_SHIPMENTS`; un permiso futuro de solo lectura podria llamarse `VIEW_SHIPMENTS` si negocio lo necesita.
- `PAID` con asignado 0 significa que no hay saldo de envio asignado al cliente, no que exista un pago financiero.

## Validaciones esperadas

Backend:

```text
cd backend/control-ropa
.\mvnw.cmd -Dtest=ShipmentServiceTests test
```

Frontend:

```text
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo export --platform web
```

Git/calidad:

```text
git status --short
git diff --stat
git diff --name-only
git --no-pager diff --check
rg -n "<patron mojibake>" app components services locales backend/control-ropa/src docs/shipments
```


## Resultado de validaciones en este worktree

Dependencias locales:

```text
npm.cmd ci
```

Resultado: `OK`. Se restauraron dependencias locales en `node_modules` sin modificar `package.json` ni `package-lock.json`. `npm ci` reporto 20 vulnerabilidades del arbol actual; no se ejecuto `npm audit fix`.

Backend focalizado:

```text
cd backend/control-ropa
.\mvnw.cmd -Dtest=ShipmentServiceTests test
```

Resultado: `OK`. `ShipmentServiceTests` ejecuto 56 pruebas, 0 failures, 0 errors, 0 skipped.

Frontend:

```text
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo export --platform web
```

Resultados:

- `npx.cmd tsc --noEmit`: `OK`.
- `npm.cmd run lint`: `OK`, 0 errores y 72 warnings preexistentes fuera de SHIP-F.
- `npx.cmd expo export --platform web`: `OK`, export web generado correctamente.

Git/calidad:

- `git --no-pager diff --check`: `OK`, solo warnings CRLF del worktree Windows.
- Mojibake: el barrido detecta mojibake preexistente en `app/report-*`, `app/users-form.tsx` y documentos previos; no aparece en `app/shipments.tsx`, `services/shipmentService.ts` ni backend SHIP-F tocado.

Decision de implementacion: `GO_INTERNO`.

## Decision

Decision sugerida: `GO_INTERNO`. Backend focalizado, TypeScript, lint y export web quedaron OK.