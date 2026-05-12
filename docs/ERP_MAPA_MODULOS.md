# ERP - Mapa de modulos

## Modulos funcionales detectados

| Modulo | Frontend | Backend | Servicios frontend | Estado |
|---|---|---|---|---|
| Login y sesion | `app/login.tsx`, `app/change-password.tsx` | `auth`, `security` | `authService.ts`, `sessionStorage.ts` | MEDIO |
| Menu operativo | `app/(tabs)/index.tsx` | `operation` | PENDIENTE DE VALIDAR | MEDIO |
| Dashboard | `app/dashboard.tsx` | `dashboard` | `dashboardService.ts` | MEDIO |
| Usuarios | `app/users.tsx`, `app/users-form.tsx` | `useradmin` | `userAdminService.ts` | MEDIO |
| Roles y permisos | `app/system-roles.tsx` | `useradmin` | `permissionService.ts` | MEDIO |
| Sucursales | `app/branches.tsx`, `app/branches-form.tsx` | `branch` | `branchAdminService.ts` | MEDIO |
| Canales | `app/channels.tsx`, `app/system-channels.tsx` | `branch`, `catalog` | `branchChannelService.ts` | MEDIO |
| Catalogos | `app/catalogs.tsx`, `app/catalog-list.tsx`, `app/catalog-form.tsx` | `catalog` | `adminCatalogService.ts`, `catalogService.ts`, `supplierService.ts` | MEDIO |
| Proveedores | Catalogo via `supplierService.ts` | `catalog/Supplier*` | `supplierService.ts` | FRAGIL |
| Clientes | `app/customers.tsx`, `app/customers/[id].tsx`, `app/customers-create.tsx` | `customer` | `customerService.ts` | MEDIO |
| Inventario | `app/items.tsx`, `app/items/[id].tsx`, `app/items-create.tsx` | `item`, `inventory` | `itemService.ts`, `boxService.ts` | MEDIO |
| Lotes | `app/batches.tsx`, `app/batch-form.tsx`, `app/batch-detail.tsx` | `batch` | `batchService.ts` | MEDIO |
| Live | `app/live.tsx` | `live`, `reservation` | `liveService.ts`, `reservationService.ts` | FRAGIL |
| Apartados | `app/door-reservation.tsx`, `app/reservations.tsx`, `app/reservation-detail.tsx` | `reservation` | `reservationService.ts` | MEDIO |
| Venta puerta | `app/door-sale.tsx` | `sale`, `payment` | `saleService.ts` | FRAGIL |
| Pagos | `app/payments.tsx` | `payment`, `balance` | `paymentService.ts` | MEDIO |
| Pedidos | `app/customer-orders.tsx`, `app/customer-order-detail.tsx` | `order` | `customerOrderService.ts` | MEDIO |
| Paquetes | `app/customer-packages.tsx`, `app/customer-package-detail.tsx` | `customerpackage` | `customerPackageService.ts` | MEDIO |
| Envios | `app/shipments.tsx`, `app/shipment-detail.tsx` | `shipment` | `shipmentService.ts` | MEDIO |
| Transferencias | `app/transfers.tsx`, `app/transfer-detail.tsx` | `transfer` | `transferService.ts` | MEDIO |
| Consignacion | `app/consignments.tsx`, `app/consignment-detail.tsx`, `app/consignees.tsx` | `consignment` | `consignmentService.ts` | MEDIO |
| Devoluciones | `app/returns.tsx`, `app/return-create.tsx`, `app/return-detail.tsx` | `returns` | `returnService.ts` | MEDIO |
| Reembolsos | `app/refunds.tsx`, `app/refund-create.tsx`, `app/refund-detail.tsx` | `refund` | `refundService.ts` | MEDIO |
| Caja | `app/cash-closures.tsx`, `app/cash-closure-detail.tsx` | `cash` | `cashClosureService.ts` | MEDIO |
| Reportes | `app/reports.tsx`, `app/report-*.tsx`, `app/movement-history.tsx` | `report` | `reportService.ts` | FRAGIL |
| Incidencias | `app/incidents.tsx`, `app/incident-detail.tsx` | `incident` | `incidentService.ts` | MEDIO |
| Logs sistema | `app/system-logs.tsx` | `system` | `systemLogService.ts` | TECNICO |
| Apariencia | `app/appearance.tsx` | `appearance` | `appearanceService.ts` | MEDIO |

## Modulos mas estables

- Catalogos base: producto, marca, talla, metodo de pago.
- Usuarios y roles.
- Inventario basico.

## Modulos mas debiles

- Auditoria funcional.
- UX de validaciones.
- Reportes.
- Proveedores integrados a reportes.
- Cancelaciones con autorizacion.

