# APP_MODA_SHIP_F_SCOPE - Reportes operativos de saldos y pagos de envio

Fecha: 2026-07-01
Rama: `feature/ship-f-reportes-envio`
Base: `4f8205d Cierra pagos y operacion de envios SHIP-D/SHIP-E`

## Resumen ejecutivo

SHIP-F debe agregar visibilidad operativa de saldos y pagos de envio dentro del modulo Envios, manteniendo separados los conceptos de mercancia y envio.

El objetivo no es construir reportes financieros generales ni modificar el Centro del negocio. El objetivo es que operacion pueda responder, desde Envios:

- que envios tienen saldo de envio pendiente;
- que envios ya tienen envio pagado;
- cuanto cuesta realmente el envio;
- cuanto se asigno a clientes/paquetes;
- cuanto se pago de envio;
- cuanto queda pendiente de envio;
- en que estado logistico se encuentra cada envio.

Decision inicial: `GO_SCOPE`.

## Contexto validado

SHIP-D y SHIP-E ya dejaron implementada la separacion conceptual:

- Paquetes conserva mercancia, prendas, abonos de mercancia y saldo de mercancia.
- Envios concentra logistica, costo real, reparto, pagos reales de envio y saldo de envio.
- Los pagos de envio viven separados de los pagos de mercancia.
- El cierre operativo bloquea dispatch/confirmacion con saldo de envio pendiente.

## Auditoria del estado actual

### Frontend

Archivos revisados:

- `app/shipments.tsx`
- `app/shipment-detail.tsx`
- `services/shipmentService.ts`

Hallazgos:

- `/shipments` ya es la bandeja operativa principal de envios.
- `/shipments` mezcla paquetes listos para preparar envio y envios reales ya creados.
- La bandeja muestra datos logisticos compactos: folio, estado, guia, cliente, paquete, prendas, costo envio y destino.
- La bandeja no muestra todavia total asignado, pagado de envio ni saldo de envio.
- `app/shipment-detail.tsx` si muestra reparto, pagos y saldo de envio, pero solo al abrir un envio individual.
- `services/shipmentService.ts` ya tiene tipos para `ShipmentShippingPaymentsResponse`, `assignedTotal`, `paidTotal`, `shippingBalance`, `absorbedAmount` y `overAssignedAmount`.
- El tipo `Shipment` del listado no trae esos campos.

### Backend

Archivos/clases revisadas:

- `Shipment`
- `ShipmentStatus`
- `ShipmentService`
- `ShipmentController`
- `ShipmentRepository`
- `ShipmentResponse`
- `ShipmentPaymentsResponse`
- `ShipmentCostShare`
- `ShipmentPayment`
- `ShipmentCostShareRepository`
- `ShipmentPaymentRepository`

Hallazgos:

- `GET /api/shipments/branch/{branchId}` devuelve `ShipmentResponse`.
- `ShipmentResponse` trae costo real/logistico (`shippingCostAmount`) y estado, pero no trae `assignedTotal`, `paidTotal` ni `shippingBalance`.
- `GET /api/shipments/{id}/shipping-payments` devuelve `ShipmentPaymentsResponse` con los campos necesarios para saldo y pagos, pero solo para un envio individual.
- `ShipmentService.resolveShippingPaymentState(...)` ya centraliza el calculo de:
  - costo real de envio;
  - total asignado;
  - total pagado registrado;
  - saldo de envio;
  - absorbido por tienda;
  - sobreasignado.
- `paidTotal` solo considera pagos `REGISTERED`; pagos `CANCELLED` no deben contar.
- `shippingBalance = assignedTotal - paidTotal`.
- Los filtros actuales del repository son basicos: `findByBranchIdOrderByCreatedAtDesc`.

### Estados actuales

Enum real actual:

- `OPEN`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CLOSED_WITH_INCIDENTS`
- `CANCELLED`

Nota UX: si negocio usa el nombre `DISPATCHED`, en UI puede mostrarse como `Enviado`, pero tecnicamente debe mapearse a `OUT_FOR_DELIVERY`. No se recomienda agregar `DISPATCHED` como nuevo enum en SHIP-F.

### Permisos actuales

Hallazgos:

- En backend, `ShipmentService` usa `assertCanManageShipments()` y permiso `MANAGE_SHIPMENTS` tambien para lectura.
- En frontend, `/shipments` y acciones relacionadas validan `MANAGE_SHIPMENTS`.
- No se encontro un permiso separado `VIEW_SHIPMENTS` en uso productivo para la pantalla.

Recomendacion SHIP-F MVP:

- Mantener `MANAGE_SHIPMENTS` para ver los reportes operativos de envio.
- No crear permisos nuevos en SHIP-F salvo decision explicita posterior.
- Documentar como mejora futura un permiso de solo lectura, por ejemplo `VIEW_SHIPMENTS`, si negocio necesita usuarios que vean saldos de envio pero no operen envios.

## Objetivo SHIP-F

Implementar visibilidad operativa de saldos y pagos de envio sin mezclar con mercancia.

Debe permitir responder:

- Envios con saldo pendiente de envio.
- Envios con envio pagado.
- Costo real de envio.
- Total asignado a clientes/paquetes.
- Total pagado de envio.
- Saldo de envio.
- Estado logistico del envio.
- Cliente o clientes incluidos.
- Fecha de creacion, envio o recepcion segun estado.

## Fuera de alcance

No implementar en SHIP-F:

- Centro del negocio.
- Reportes financieros generales.
- Cuentas por cobrar globales.
- Mezcla de saldo de mercancia con saldo de envio.
- Inventario valorizado.
- Utilidad, margen o rentabilidad.
- Corte de caja formal.
- Conciliacion bancaria.
- Comisiones.
- Reportes contables.
- Nuevos estados logisticos.
- Nuevas reglas de pago o reparto.
- Migraciones, salvo que durante implementacion se detecte una necesidad tecnica inevitable.

## Propuesta UX

### Ubicacion recomendada

Implementar SHIP-F dentro de `/shipments`, como segunda capa operativa del modulo Envios.

No llevarlo aun a `/reports` ni al Centro del negocio.

Propuesta de estructura:

```text
Envios
├── Bandeja operativa
├── Saldos de envio
└── Historial / filtros existentes
```

Puede resolverse con tabs o un selector compacto:

- `Operacion`
- `Saldos de envio`

### Tarjetas resumen

En la vista `Saldos de envio`, mostrar tarjetas compactas:

```text
Envios con saldo pendiente
Saldo total de envio
Envios pagados
Pagado de envio
Costo real de envio
Absorbido por tienda
```

Reglas de texto:

- Usar `Saldo de envio`, no `saldo de paquete`.
- Usar `Pagado de envio`, no `abono`.
- Usar `Costo real de envio`, no `total paquete`.
- Agregar nota clara:

```text
Estos importes corresponden solo al envio. No modifican ni representan saldo de mercancia.
```

### Tabla/lista operativa

Columnas o campos por fila:

```text
Envio / folio
Estado logistico
Cliente(s)
Paquetes
Costo real de envio
Asignado a clientes
Pagado de envio
Saldo de envio
Absorbido por tienda
Fecha relevante
Siguiente accion
```

Para envios compartidos, mostrar:

```text
Ana Lopez + 2 clientes
```

Y en detalle expandido o modal:

```text
Cliente
Paquete
Asignado
Pagado
Saldo
```

### Filtros recomendados

MVP seguro:

- Estado logistico:
  - Todos
  - OPEN
  - OUT_FOR_DELIVERY / Enviado
  - DELIVERED
  - CLOSED_WITH_INCIDENTS
  - CANCELLED
- Estado de pago de envio:
  - Todos
  - Con saldo pendiente
  - Pagado
  - Sin reparto
  - Sin costo real
  - Absorbido por tienda
- Busqueda por folio, cliente, telefono, paquete o guia.

Deseables si la infraestructura ya esta simple:

- Cliente.
- Rango de fechas `from` / `to` sobre `createdAt` como primera version.

No bloquear SHIP-F MVP si cliente/rango requiere UI o backend adicional mas grande. Puede quedar como fase F2.

## Propuesta backend

### Opcion recomendada

Crear endpoint read-only especifico:

```text
GET /api/shipments/branch/{branchId}/shipping-balances
```

Query params sugeridos:

```text
status
paymentState
customerId
from
to
```

Ventajas:

- Mantiene `/api/shipments/branch/{branchId}` como bandeja operativa actual.
- Evita inflar `ShipmentResponse` si la pantalla principal no necesita todos los importes.
- Permite optimizar agregados sin afectar el flujo existente de Envios.
- Reduce riesgo de romper despacho, detalle o pagos.

### DTO sugerido

Crear DTOs read-only:

```text
ShipmentShippingBalanceReportResponse
ShipmentShippingBalanceRowResponse
ShipmentShippingBalanceCustomerLineResponse
```

Respuesta conceptual:

```text
branchId
from
to
summary:
  totalShipments
  pendingBalanceShipments
  paidShipments
  unassignedShipments
  realShippingCostTotal
  assignedTotal
  paidTotal
  shippingBalanceTotal
  absorbedTotal
  overAssignedTotal
rows[]:
  shipmentId
  folio
  status
  deliveryType
  createdAt
  dispatchedAt
  receivedAt
  packageCount
  customerSummary
  realShippingCost
  assignedTotal
  paidTotal
  shippingBalance
  absorbedAmount
  overAssignedAmount
  paymentState
  nextStep
  blockedReason
  customers[]:
    customerId
    customerName
    packageId
    packageFolio
    assignedAmount
    paidAmount
    balanceAmount
```

### Calculos

Reutilizar la logica de SHIP-D:

```text
paidTotal = suma de ShipmentPayment amount donde status = REGISTERED
shippingBalance = assignedTotal - paidTotal
absorbedAmount = realShippingCost - assignedTotal si assignedTotal < realShippingCost
overAssignedAmount = assignedTotal - realShippingCost si assignedTotal > realShippingCost
```

No usar `realShippingCost` como deuda del cliente. La deuda del cliente es `assignedAmount` menos pagos registrados.

### Estado de pago operativo

Calcular etiqueta backend o frontend:

```text
NO_REAL_COST       -> realShippingCost es null
NO_SHARE           -> realShippingCost > 0 y no hay reparto
PENDING_BALANCE    -> shippingBalance > 0
PAID               -> assignedTotal > 0 y shippingBalance = 0
STORE_ABSORBED     -> absorbedAmount > 0
OVER_ASSIGNED      -> overAssignedAmount > 0
CANCELLED          -> shipment.status = CANCELLED
```

Si hay combinaciones, priorizar:

1. `CANCELLED`
2. `NO_REAL_COST`
3. `NO_SHARE`
4. `PENDING_BALANCE`
5. `OVER_ASSIGNED`
6. `STORE_ABSORBED`
7. `PAID`

### Performance

Evitar N+1 por envio si el branch crece.

Recomendacion:

- Obtener envios por branch y filtros base.
- Obtener `shipment_packages`, `shipment_cost_shares` y `shipment_payments` por lista de shipment IDs.
- Agrupar en memoria por `shipmentId`.
- Reusar un helper comun para calcular `ShippingPaymentState` por envio.

Si se decide extender `ShipmentResponse`, evitar llamar `shipmentPaymentRepository.findByShipmentId...` por cada envio dentro de `toResponse` sin medir impacto.

### Tenant/branch safety

Mantener:

- `tenantAccessGuard.requireBranch(branchId, ...)`.
- Validar que todos los envios procesados pertenezcan al branch autorizado.
- No permitir filtrar `customerId` de otro tenant de forma que exponga datos.
- Si se filtra por cliente, resolverlo por paquetes asociados dentro del branch/tenant activo.

## Propuesta frontend

### Servicios

Agregar en `services/shipmentService.ts`:

```text
ShipmentShippingBalanceReport
ShipmentShippingBalanceRow
ShipmentShippingBalanceCustomerLine
getShipmentShippingBalances(branchId, filters)
```

No reutilizar `getShipmentShippingPayments(id)` para armar el listado desde frontend, porque produciria multiples requests por envio.

### Pantalla `/shipments`

Agregar una seccion/tab `Saldos de envio`:

- carga independiente del reporte;
- estados de carga/vacio/error;
- filtros simples;
- tarjetas resumen;
- lista compacta;
- boton `Ver envio` para abrir detalle.

Mantener la bandeja actual como operacion principal.

### Textos UX

Usar:

- `Saldos de envio`
- `Pagado de envio`
- `Saldo de envio`
- `Costo real de envio`
- `Asignado a clientes`
- `Absorbido por tienda`
- `Estos importes corresponden solo al envio.`

Evitar:

- `Abono` para envio.
- `Saldo paquete`.
- `Corte de caja`.
- `Cuentas por cobrar`.
- `Finanzas` como nombre principal.

## Pruebas backend sugeridas

Agregar pruebas en `ShipmentServiceTests` o clase focalizada nueva:

1. Reporte lista envio con saldo pendiente.
2. Reporte lista envio pagado.
3. Pagos `CANCELLED` no cuentan en `paidTotal`.
4. `shippingBalance = assignedTotal - paidTotal`.
5. Envios con `realShippingCost` null quedan `NO_REAL_COST`.
6. Envios con costo real y sin reparto quedan `NO_SHARE`.
7. Absorbido por tienda se calcula cuando asignado < costo real.
8. Sobreasignado se calcula cuando asignado > costo real.
9. Filtro por status funciona.
10. Filtro por cliente incluido en envio compartido funciona.
11. Filtro por fecha no cruza datos fuera del rango.
12. Tenant/branch safety: no expone envios de otra sucursal/tenant.
13. Permiso: usuario sin `MANAGE_SHIPMENTS` no accede.

## Validaciones frontend sugeridas

Ejecutar:

```text
npx.cmd tsc --noEmit
npm.cmd run lint
npx.cmd expo export --platform web
git --no-pager diff --check
```

Smoke manual:

- Admin ve `Saldos de envio`.
- Envio con saldo pendiente aparece en filtro `Con saldo pendiente`.
- Envio pagado aparece en filtro `Pagado`.
- Envio compartido muestra varios clientes/paquetes.
- Abrir `Ver envio` navega al detalle correcto.
- Vendedor sin `MANAGE_SHIPMENTS` no ve datos ni acciones indebidas.
- Paquetes sigue limpio y enfocado en mercancia.
- Centro del negocio no cambia.

## Riesgos

1. Duplicar calculos de saldo de envio.
   - Mitigacion: reutilizar helper `resolveShippingPaymentState` o extraer helper privado compartido dentro de `ShipmentService`.

2. N+1 queries al calcular saldos por cada envio.
   - Mitigacion: endpoint dedicado con carga por listas y agrupacion por `shipmentId`.

3. Confundir deuda de envio con deuda de mercancia.
   - Mitigacion: textos explicitos y no tocar Paquetes/Centro del negocio.

4. Exponer importes a usuarios sin permiso.
   - Mitigacion: conservar `MANAGE_SHIPMENTS` en MVP.

5. Estados nombrados distinto entre negocio y enum.
   - Mitigacion: mapear `DISPATCHED` visual a `OUT_FOR_DELIVERY`, sin agregar enum nuevo.

6. Filtrado por cliente en envios compartidos.
   - Mitigacion: filtrar por cualquier paquete/share asociado al cliente, no solo cliente principal.

## Plan de fases

### SHIP-F1 - Reporte operativo dentro de Envios

- Crear endpoint read-only de saldos de envio.
- Agregar DTOs de reporte.
- Agregar tab/seccion `Saldos de envio` en `/shipments`.
- Agregar filtros por estado logistico y estado de pago de envio.
- Mostrar resumen y lista operativa.
- Agregar tests backend focalizados.

### SHIP-F2 - Filtros avanzados

- Cliente con selector si existe componente reutilizable.
- Rango de fechas con calendario si se quiere homologar con reportes.
- Export/impresion solo si negocio lo pide.

### SHIP-F3 - Integracion futura con Centro del negocio

- Solo despues de validar SHIP-F operativo.
- Llevar metricas agregadas a Centro del negocio sin mezclar mercancia/envio.
- Nombrar como `Saldos de envio`, no cartera general.

## Decision inicial

Decision: `GO_SCOPE`.

Motivo:

- El modelo actual ya tiene costo real, reparto, pagos reales y calculos de saldo de envio.
- La bandeja de Envios ya es el lugar correcto para visibilidad operativa.
- Falta exponer agregados de saldo/pago en un endpoint read-only eficiente.
- El alcance puede implementarse sin tocar Centro del negocio, reportes financieros generales, inventario ni reglas de mercancia.