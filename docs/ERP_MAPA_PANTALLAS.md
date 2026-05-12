# ERP - Mapa de pantallas

## Pantallas principales detectadas

Menu y acceso:

- `app/index.tsx`
- `app/(tabs)/index.tsx`
- `app/login.tsx`
- `app/change-password.tsx`
- `app/access-denied.tsx`

Administracion:

- `app/system.tsx`
- `app/system-roles.tsx`
- `app/system-security.tsx`
- `app/system-sessions.tsx`
- `app/system-logs.tsx`
- `app/users.tsx`
- `app/users-form.tsx`
- `app/branches.tsx`
- `app/branches-form.tsx`
- `app/channels.tsx`
- `app/system-channels.tsx`
- `app/appearance.tsx`

Catalogos:

- `app/catalogs.tsx`
- `app/catalog-list.tsx`
- `app/catalog-form.tsx`

Operacion:

- `app/dashboard.tsx`
- `app/live.tsx`
- `app/door-sale.tsx`
- `app/door-reservation.tsx`
- `app/payments.tsx`
- `app/reservations.tsx`
- `app/reservation-detail.tsx`
- `app/customer-orders.tsx`
- `app/customer-order-detail.tsx`

Inventario:

- `app/items.tsx`
- `app/items/[id].tsx`
- `app/items-create.tsx`
- `app/batches.tsx`
- `app/batch-form.tsx`
- `app/batch-detail.tsx`

Clientes:

- `app/customers.tsx`
- `app/customers/[id].tsx`
- `app/customers-create.tsx`
- `app/customer-addresses/[id].tsx`
- `app/customer-addresses-create.tsx`

Logistica:

- `app/customer-packages.tsx`
- `app/customer-package-detail.tsx`
- `app/shipments.tsx`
- `app/shipment-detail.tsx`
- `app/transfers.tsx`
- `app/transfer-detail.tsx`

Postventa:

- `app/returns.tsx`
- `app/return-create.tsx`
- `app/return-detail.tsx`
- `app/refunds.tsx`
- `app/refund-create.tsx`
- `app/refund-detail.tsx`

Reportes:

- `app/reports.tsx`
- `app/report-cancellations.tsx`
- `app/report-daily-store.tsx`
- `app/report-deliveries.tsx`
- `app/report-deposits.tsx`
- `app/report-live.tsx`
- `app/report-remissions.tsx`
- `app/movement-history.tsx`

## Pantallas con mayor riesgo de ruptura

- `app/live.tsx`: pantalla larga, concentra historial, captura, validaciones, modales y seleccion.
- `app/door-sale.tsx`: flujo critico de caja y validaciones recientes.
- `app/batch-detail.tsx`: recepcion, clasificacion, conciliacion, cancelacion.
- `app/payments.tsx`: pagos por reserva/pedido/item/paquete.
- `app/customer-package-detail.tsx`: busqueda, adicion de prendas, cierre/cancelacion.

