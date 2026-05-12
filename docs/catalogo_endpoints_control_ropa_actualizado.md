# Catalogo de endpoints - control-ropa

Base URL local usada en pruebas: `http://192.168.100.212:8080`

Este catalogo esta alineado con los controllers actuales del backend copiado en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`.

## Health

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/health` | Verifica que el backend responda. |

## Autenticacion y sesión

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/auth/login` | Inicia sesión. |
| GET | `/api/me` | Obtiene el usuario actual. |
| GET | `/api/me/permissions` | Obtiene permisos del usuario actual. |
| GET | `/api/me/channels` | Obtiene canales permitidos del usuario actual. |
| GET | `/api/access/can` | Evalua acceso a una accion o permiso. |
| GET | `/api/operation/menu` | Devuelve el menu operativo permitido. |

## Apariencia

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/appearance` | Consulta configuración visual / branding. |
| PUT | `/api/appearance` | Actualiza configuración visual / branding. |

## Dashboard y reportes

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/dashboard/seller` | Dashboard operativo de vendedor. |
| GET | `/api/reports/daily-store` | Reporte diario de tienda. |
| GET | `/api/reports/daily-deliveries` | Reporte diario de entregas. |
| GET | `/api/reports/daily-deposits` | Reporte diario de depositos. |
| GET | `/api/reports/daily-cancellations` | Reporte diario de cancelaciones. |
| GET | `/api/reports/live-control` | Reporte de control de lives. |
| GET | `/api/reports/remissions` | Reporte de remisiones. |

## Catálogos

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/catalogs/bootstrap` | Carga inicial de catálogos. |
| GET | `/api/brands` | Lista marcas. |
| GET | `/api/brands/{id}` | Consulta marca. |
| POST | `/api/brands` | Crea marca. |
| PUT | `/api/brands/{id}` | Actualiza marca. |
| PATCH | `/api/brands/{id}/deactivate` | Desactiva marca. |
| GET | `/api/sizes` | Lista tallas. |
| GET | `/api/sizes/{id}` | Consulta talla. |
| POST | `/api/sizes` | Crea talla. |
| PUT | `/api/sizes/{id}` | Actualiza talla. |
| PATCH | `/api/sizes/{id}/deactivate` | Desactiva talla. |
| GET | `/api/product-types` | Lista tipos de producto. |
| GET | `/api/product-types/active` | Lista tipos de producto activos. |
| GET | `/api/product-types/{id}` | Consulta tipo de producto. |
| POST | `/api/product-types` | Crea tipo de producto. |
| PUT | `/api/product-types/{id}` | Actualiza tipo de producto. |
| PATCH | `/api/product-types/{id}/deactivate` | Desactiva tipo de producto. |
| GET | `/api/payment-methods` | Lista metodos de pago. |
| GET | `/api/payment-methods/{id}` | Consulta metodo de pago. |
| POST | `/api/payment-methods` | Crea metodo de pago. |
| PUT | `/api/payment-methods/{id}` | Actualiza metodo de pago. |
| PATCH | `/api/payment-methods/{id}/deactivate` | Desactiva metodo de pago. |
| GET | `/api/sales-channels` | Lista canales de venta. |
| GET | `/api/sales-channels/active` | Lista canales de venta activos. |
| GET | `/api/sales-channels/{id}` | Consulta canal de venta. |
| POST | `/api/sales-channels` | Crea canal de venta. |
| PUT | `/api/sales-channels/{id}` | Actualiza canal de venta. |
| PATCH | `/api/sales-channels/{id}/deactivate` | Desactiva canal de venta. |

## Sucursales y canales

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/branches` | Lista sucursales. |
| GET | `/api/branches/active` | Lista sucursales activas. |
| GET | `/api/branches/{id}` | Consulta sucursal. |
| POST | `/api/branches` | Crea sucursal. |
| PUT | `/api/branches/{id}` | Actualiza sucursal. |
| PATCH | `/api/branches/{id}/deactivate` | Desactiva sucursal. |
| GET | `/api/branch-sales-channels/branch/{branchId}` | Lista canales habilitados por sucursal. |
| POST | `/api/branch-sales-channels` | Habilita o crea canal por sucursal. |
| PUT | `/api/branch-sales-channels/{id}` | Actualiza canal por sucursal. |

## Usuarios y seguridad

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/users` | Lista usuarios. |
| GET | `/api/users/{id}` | Consulta usuario. |
| POST | `/api/users` | Crea usuario. |
| PUT | `/api/users/{id}` | Actualiza usuario. |
| PATCH | `/api/users/{id}/deactivate` | Desactiva usuario. |
| PUT | `/api/users/{id}/roles` | Actualiza roles del usuario. |
| PUT | `/api/users/{id}/permissions` | Actualiza permisos directos del usuario. |
| GET | `/api/roles` | Lista roles. |
| GET | `/api/permissions` | Lista permisos. |

## Clientes

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/customers/branch/{branchId}` | Lista clientes por sucursal. |
| GET | `/api/customers/{id}` | Consulta cliente. |
| GET | `/api/customers/branch/{branchId}/phone/{phone}` | Busca cliente por teléfono en sucursal. |
| GET | `/api/customers/branch/{branchId}/generic/{genericType}` | Obtiene cliente generico por tipo. |
| POST | `/api/customers/branch/{branchId}` | Crea cliente en sucursal. |
| PUT | `/api/customers/{id}` | Actualiza cliente. |
| PATCH | `/api/customers/{id}/deactivate` | Desactiva cliente. |
| GET | `/api/customer-addresses/customer/{customerId}` | Lista direcciones de cliente. |
| POST | `/api/customer-addresses/customer/{customerId}` | Crea direccion de cliente. |
| PUT | `/api/customer-addresses/{id}` | Actualiza direccion. |
| PATCH | `/api/customer-addresses/{id}/deactivate` | Desactiva direccion. |
| GET | `/api/customer-owner-history/customer/{customerId}` | Consulta historial de responsable del cliente. |
| POST | `/api/customer-owner-history/reassign` | Reasigna responsable del cliente. |

## Lotes

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/batches/branch/{branchId}` | Lista lotes por sucursal. |
| GET | `/api/batches/{id}` | Consulta lote. |
| GET | `/api/batches/folio/{folio}` | Consulta lote por folio. |
| POST | `/api/batches/branch/{branchId}` | Crea lote. |
| PATCH | `/api/batches/{id}/receive` | Registra recepcion fisica del lote. |
| PUT | `/api/batches/{id}/classification` | Guarda clasificacion del lote. |
| PATCH | `/api/batches/{id}/reconcile` | Concilia lote. |
| PATCH | `/api/batches/{id}/cancel` | Cancela lote. |

## Inventario, ubicaciones y cajas

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/items/branch/{branchId}` | Lista prendas por sucursal. |
| GET | `/api/items/{id}` | Consulta prenda. |
| GET | `/api/items/code/{code}` | Busca prenda por código interno. |
| GET | `/api/items/lookup/code/{code}` | Lookup de prenda por código. |
| GET | `/api/items/lookup/qr/{qrCode}` | Lookup de prenda por QR. |
| POST | `/api/items` | Crea prenda. |
| PUT | `/api/items/{id}` | Actualiza prenda. |
| PATCH | `/api/items/{id}/location/{storageLocationId}` | Cambia ubicacion de prenda. |
| GET | `/api/storage-locations/branch/{branchId}` | Lista ubicaciones por sucursal. |
| GET | `/api/storage-locations/branch/{branchId}/active` | Lista ubicaciones activas. |
| GET | `/api/storage-locations/{id}` | Consulta ubicacion. |
| GET | `/api/storage-locations/{id}/detail` | Consulta detalle de ubicacion. |
| POST | `/api/storage-locations/branch/{branchId}` | Crea ubicacion. |
| PUT | `/api/storage-locations/{id}` | Actualiza ubicacion. |
| PATCH | `/api/storage-locations/{id}/deactivate` | Desactiva ubicacion. |
| PATCH | `/api/storage-locations/{id}/activate` | Activa ubicacion. |
| GET | `/api/boxes/branch/{branchId}` | Lista cajas por sucursal. |
| GET | `/api/boxes/branch/{branchId}/active` | Lista cajas activas. |
| GET | `/api/boxes/{id}` | Consulta caja. |
| GET | `/api/boxes/{id}/detail` | Consulta detalle de caja. |
| GET | `/api/boxes/{id}/content` | Consulta contenido de caja. |
| POST | `/api/boxes/branch/{branchId}` | Crea caja. |
| PUT | `/api/boxes/{id}` | Actualiza caja. |
| PATCH | `/api/boxes/{id}/deactivate` | Desactiva caja. |
| PATCH | `/api/boxes/{id}/activate` | Activa caja. |

## Reservas y apartados

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/reservations/branch/{branchId}` | Lista reservas por sucursal. |
| GET | `/api/reservations/branch/{branchId}/without-box` | Lista reservas sin caja. |
| GET | `/api/reservations/box/{boxId}` | Lista reservas por caja. |
| GET | `/api/reservations/{id}` | Consulta reserva. |
| POST | `/api/reservations` | Crea reserva. |
| PATCH | `/api/reservations/{reservationId}/box/{boxId}` | Asigna reserva a caja. |
| PATCH | `/api/reservations/{reservationId}/remove-box` | Quita reserva de caja. |
| PATCH | `/api/reservations/{reservationId}/cancel` | Cancela reserva. |

Comportamiento:
- Crear una reserva debe buscar o crear un pedido activo para el cliente y sucursal.
- Varias prendas reservadas para el mismo cliente pueden quedar dentro del mismo pedido.
- El cobro natural para apartados con varias prendas debe hacerse a nivel pedido.

## Ventas

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/sales/branch/{branchId}` | Lista ventas por sucursal. |
| GET | `/api/sales/{id}` | Consulta venta. |
| POST | `/api/sales` | Crea venta. |
| PATCH | `/api/sales/{saleId}/cancel` | Cancela venta. |

Comportamiento de venta puerta:
- El cliente compra fisicamente en sucursal y se lleva sus prendas.
- La venta puerta debe quedar pagada dentro de su propio flujo.
- Si incluye varias prendas, todas deben conservar el mismo `customerOrderId`.
- No genera paquete porque no queda prenda pendiente de entrega.

## Pedidos de cliente

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/customer-orders/customer/{customerId}` | Lista pedidos de cliente. |
| GET | `/api/customer-orders/branch/{branchId}/pending-payment` | Lista pedidos con saldo pendiente para Pagos / Cobros. |
| GET | `/api/customer-orders/{id}` | Consulta detalle de pedido. |
| GET | `/api/customer-orders/{id}/settlement` | Consulta resumen de liquidacion del pedido. |

Reglas:
- Los pedidos no se crean manualmente desde UI.
- Se crean automaticamente con reservas o ventas.
- `salesChannelCode` permite mostrar si el pedido viene de `DOOR_SALE`, `DOOR_RESERVATION`, `MIXED` o `null`.
- La pantalla Pagos / Cobros debe usar los pedidos pendientes como bandeja principal.

## Pagos y saldo a favor

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/payments` | Registra pago. |
| POST | `/api/payments/item-code/{code}` | Registra pago buscando prenda por código. |
| POST | `/api/payments/qr/{qrCode}` | Registra pago buscando prenda por QR. |
| POST | `/api/payments/package-folio/{folio}` | Registra pago por folio de paquete. |
| GET | `/api/payments/{id}` | Consulta pago. |
| GET | `/api/payments/customer/{customerId}` | Lista pagos de cliente. |
| GET | `/api/payments/reservation/{reservationId}` | Lista pagos de reserva. |
| PATCH | `/api/payments/{paymentId}/void` | Anula pago. |
| POST | `/api/balance/apply-to-order` | Aplica saldo a favor a pedido. |
| POST | `/api/balance/reverse-application` | Revierte aplicacion de saldo. |
| GET | `/api/balance/{customerId}` | Consulta saldo de cliente. |
| GET | `/api/balance/{customerId}/history` | Consulta historial de saldo de cliente. |
| GET | `/api/balance/branch/{branchId}/customer-phone/{phone}` | Busca saldo por teléfono y sucursal. |
| GET | `/api/balance/package-folio/{folio}` | Busca saldo asociado a paquete. |

Reglas:
- Los pagos pueden ser parciales.
- Si el pago excede el saldo pendiente, el excedente debe quedar como saldo a favor.
- No se debe permitir pago si el saldo pendiente es 0.
- Venta puerta no se cobra desde Pagos / Cobros; se cobra dentro de su flujo.

## Paquetes de cliente

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/customer-packages` | Crea paquete de cliente. |
| GET | `/api/customer-packages/customer/{customerId}` | Lista paquetes de cliente. |
| GET | `/api/customer-packages/{id}` | Consulta paquete. |
| GET | `/api/customer-packages/folio/{folio}` | Consulta paquete por folio. |
| POST | `/api/customer-packages/{id}/items` | Agrega prendas a paquete. |
| POST | `/api/customer-packages/folio/{folio}/items/item-code/{code}` | Agrega prenda a paquete por código. |
| POST | `/api/customer-packages/folio/{folio}/items/qr/{qrCode}` | Agrega prenda a paquete por QR. |
| PATCH | `/api/customer-packages/{id}/ready` | Marca paquete listo. |
| PATCH | `/api/customer-packages/folio/{folio}/ready` | Marca paquete listo por folio. |
| PATCH | `/api/customer-packages/{id}/cancel` | Cancela paquete. |
| PATCH | `/api/customer-packages/folio/{folio}/cancel` | Cancela paquete por folio. |

## Envíos

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/shipments` | Crea envio. |
| GET | `/api/shipments/{id}` | Consulta envio. |
| GET | `/api/shipments/folio/{folio}` | Consulta envio por folio. |
| GET | `/api/shipments/branch/{branchId}` | Lista envíos por sucursal. |
| POST | `/api/shipments/{id}/packages` | Agrega paquete a envio. |
| POST | `/api/shipments/folio/{shipmentFolio}/packages/package-folio/{packageFolio}` | Agrega paquete a envio por folios. |
| PATCH | `/api/shipments/{id}/dispatch` | Despacha envio. |
| PATCH | `/api/shipments/folio/{folio}/dispatch` | Despacha envio por folio. |
| PATCH | `/api/shipments/{shipmentId}/packages/{shipmentPackageId}/resolve` | Resuelve paquete dentro de envio. |
| PATCH | `/api/shipments/folio/{shipmentFolio}/packages/{shipmentPackageId}/resolve` | Resuelve paquete por folio de envio. |
| PATCH | `/api/shipments/{id}/cancel` | Cancela envio. |
| PATCH | `/api/shipments/folio/{folio}/cancel` | Cancela envio por folio. |
| PATCH | `/api/shipments/{id}/reopen` | Reabre envio. |
| PATCH | `/api/shipments/folio/{folio}/reopen` | Reabre envio por folio. |

## Devoluciones y reembolsos

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/returns` | Crea devolucion. |
| POST | `/api/returns/{id}/items` | Agrega prendas a devolucion. |
| PATCH | `/api/returns/{id}/process` | Procesa devolucion. |
| PATCH | `/api/returns/{id}/cancel` | Cancela devolucion. |
| GET | `/api/returns/{id}` | Consulta devolucion. |
| GET | `/api/returns/sale/{saleId}` | Consulta devoluciones por venta. |
| GET | `/api/returns` | Lista devoluciones. |
| POST | `/api/returns/item-code/{code}` | Crea devolucion por código de prenda. |
| POST | `/api/returns/qr/{qrCode}` | Crea devolucion por QR. |
| POST | `/api/refunds` | Crea reembolso. |
| PATCH | `/api/refunds/{id}/approve` | Aprueba reembolso. |
| PATCH | `/api/refunds/{id}/process` | Procesa reembolso. |
| PATCH | `/api/refunds/{id}/cancel` | Cancela reembolso. |
| GET | `/api/refunds/{id}` | Consulta reembolso. |
| GET | `/api/refunds/return/{returnId}` | Lista reembolsos por devolucion. |
| GET | `/api/refunds/customer/{customerId}` | Lista reembolsos por cliente. |
| GET | `/api/refunds` | Lista reembolsos. |
| GET | `/api/refunds/lookup/code/{code}` | Lookup de reembolso por código. |
| GET | `/api/refunds/lookup/qr/{qrCode}` | Lookup de reembolso por QR. |

## Caja

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/cash-closures` | Crea corte de caja. |
| GET | `/api/cash-closures/{id}` | Consulta corte de caja. |
| GET | `/api/cash-closures/branch/{branchId}` | Lista cortes por sucursal. |
| GET | `/api/cash-closures/branch/{branchId}/date/{date}` | Consulta corte por sucursal y fecha. |
| PUT | `/api/cash-closures/{id}` | Actualiza corte. |
| POST | `/api/cash-closures/{id}/expenses` | Agrega gasto al corte. |
| PATCH | `/api/cash-closures/{closureId}/expenses/{expenseId}/cancel` | Cancela gasto. |
| PATCH | `/api/cash-closures/{id}/close` | Cierra corte. |
| PATCH | `/api/cash-closures/{id}/cancel` | Cancela corte. |

## Lives

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/lives/branch/{branchId}` | Lista lives por sucursal. |
| GET | `/api/lives/{id}` | Consulta live. |
| POST | `/api/lives/branch/{branchId}` | Crea live en sucursal. |
| PATCH | `/api/lives/{id}/activate` | Activa live. |
| PATCH | `/api/lives/{id}/close` | Cierra live. |

## Consignaciones

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/consignees/branch/{branchId}` | Lista consignatarios por sucursal. |
| GET | `/api/consignees/branch/{branchId}/active` | Lista consignatarios activos. |
| GET | `/api/consignees/{id}` | Consulta consignatario. |
| POST | `/api/consignees` | Crea consignatario. |
| PUT | `/api/consignees/{id}` | Actualiza consignatario. |
| PATCH | `/api/consignees/{id}/deactivate` | Desactiva consignatario. |
| POST | `/api/consignments` | Crea consignacion. |
| GET | `/api/consignments/{id}` | Consulta consignacion. |
| GET | `/api/consignments/folio/{folio}` | Consulta consignacion por folio. |
| GET | `/api/consignments/branch/{branchId}` | Lista consignaciones por sucursal. |
| GET | `/api/consignments/status/{status}` | Lista consignaciones por estado. |
| POST | `/api/consignments/{consignmentId}/items` | Agrega prendas a consignacion. |
| PATCH | `/api/consignments/{consignmentId}/deliver` | Marca consignacion como entregada. |
| POST | `/api/consignments/{consignmentId}/settlements` | Registra liquidacion de consignacion. |
| PATCH | `/api/consignments/{consignmentId}/cancel` | Cancela consignacion. |

## Traspasos

| Metodo | Endpoint | Uso |
|---|---|---|
| POST | `/api/transfers` | Crea traspaso. |
| GET | `/api/transfers/{id}` | Consulta traspaso. |
| GET | `/api/transfers/folio/{folio}` | Consulta traspaso por folio. |
| GET | `/api/transfers/branch/{branchId}` | Lista traspasos por sucursal. |
| GET | `/api/transfers/status/{status}` | Lista traspasos por estado. |
| POST | `/api/transfers/{transferId}/items/{itemId}` | Agrega prenda a traspaso. |
| PATCH | `/api/transfers/{transferId}/send` | Envia traspaso. |
| PATCH | `/api/transfers/{transferId}/receive-item` | Recibe prenda de traspaso. |
| PATCH | `/api/transfers/{transferId}/cancel` | Cancela traspaso. |

## Incidencias

| Metodo | Endpoint | Uso |
|---|---|---|
| GET | `/api/incidents/{id}` | Consulta incidencia. |
| GET | `/api/incidents/branch/{branchId}` | Lista incidencias por sucursal. |
| GET | `/api/incidents/shipment/{shipmentId}` | Lista incidencias por envio. |
| GET | `/api/incidents` | Lista incidencias. |
| PATCH | `/api/incidents/{id}/status` | Actualiza estado de incidencia. |

## Flujo principal resumido

Apartado puerta:
- Reserva -> Pedido -> Pagos parciales o liquidacion -> Paquete si hay entrega posterior.

Venta puerta:
- Venta -> Pedido cerrado/pagado -> Prendas vendidas -> Sin paquete.

Envio:
- Pedido liquidado -> Paquete -> Envio.

Devolucion:
- Venta o prenda vendida -> Devolucion -> Reembolso o saldo a favor segun regla aplicada.
