# ERP - Matriz de endpoints

Fuente: controladores bajo `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`.

## Endpoints por modulo

| Modulo | Endpoint base | Operaciones detectadas |
|---|---|---|
| Auth | `/api/auth` | `POST /login`, `POST /logout`, `POST /change-password` |
| Me | `/api/me` | `GET`, `GET /permissions`, `GET /channels` |
| Access | `/api/access` | `GET /can` |
| Apariencia | `/api/appearance` | `GET`, `PUT` |
| Seguridad | `/api/security/settings` | `GET /public`, `GET`, `PUT` |
| Sesiones | `/api/security/sessions` | `GET`, `POST /users/{userId}/unlock`, `POST /users/{userId}/revoke-sessions`, `POST /{sessionId}/revoke`, `POST /revoke-all` |
| Usuarios | `/api/users` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate`, `PUT /{id}/roles`, `PUT /{id}/permissions` |
| Roles | `/api/roles` | `GET`, `POST`, `PUT /{id}`, `PUT /{id}/permissions` |
| Permisos | `/api/permissions` | `GET` |
| Sucursales | `/api/branches` | `GET`, `GET /active`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Canales sucursal | `/api/branch-sales-channels` | `GET /branch/{branchId}`, `POST`, `PUT /{id}` |
| Catalogos | `/api/catalogs` | `GET /bootstrap` |
| Proveedores | `/api/suppliers` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Tipos producto | `/api/product-types` | `GET`, `GET /active`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Marcas | `/api/brands` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Tallas | `/api/sizes` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Metodos pago | `/api/payment-methods` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Canales venta | `/api/sales-channels` | `GET`, `GET /active`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/global-enabled`, `PATCH /{id}/deactivate` |
| Clientes | `/api/customers` | `GET /branch/{branchId}`, `GET /{id}`, `GET /branch/{branchId}/phone/{phone}`, `GET /branch/{branchId}/generic/{genericType}`, `POST /branch/{branchId}`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Direcciones cliente | `/api/customer-addresses` | `GET /customer/{customerId}`, `POST /customer/{customerId}`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Historial dueno cliente | `/api/customer-owner-history` | `GET /customer/{customerId}`, `POST /reassign` |
| Lotes | `/api/batches` | `GET /branch/{branchId}`, `GET /{id}`, `GET /folio/{folio}`, `POST /branch/{branchId}`, `PATCH /{id}/receive`, `PUT /{id}/classification`, `PATCH /{id}/reconcile`, `PATCH /{id}/cancel` |
| Items | `/api/items` | `GET /branch/{branchId}`, `GET /{id}`, `GET /code/{code}`, `GET /lookup/code/{code}`, `GET /lookup/qr/{qrCode}`, `POST`, `PUT /{id}`, `PATCH /{id}/location/{storageLocationId}` |
| Ubicaciones | `/api/storage-locations` | `GET /branch/{branchId}`, `GET /branch/{branchId}/active`, `GET /{id}`, `GET /{id}/detail`, `POST /branch/{branchId}`, `PUT /{id}`, `PATCH /{id}/deactivate`, `PATCH /{id}/activate` |
| Cajas fisicas | `/api/boxes` | `GET /branch/{branchId}`, `GET /branch/{branchId}/active`, `GET /{id}`, `GET /{id}/detail`, `GET /{id}/content`, `POST /branch/{branchId}`, `PUT /{id}`, `PATCH /{id}/deactivate`, `PATCH /{id}/activate` |
| Live | `/api/lives` | `GET /branch/{branchId}`, `GET /{id}`, `POST /branch/{branchId}`, `PATCH /{id}/activate`, `PATCH /{id}/close` |
| Reservas | `/api/reservations` | `GET /branch/{branchId}`, `GET /branch/{branchId}/without-box`, `GET /box/{boxId}`, `GET /{id}`, `POST`, `PATCH /{reservationId}/box/{boxId}`, `PATCH /{reservationId}/remove-box`, `PATCH /{reservationId}/cancel` |
| Ventas | `/api/sales` | `GET /branch/{branchId}`, `GET /{id}`, `POST`, `PATCH /{saleId}/cancel` |
| Pagos | `/api/payments` | `POST`, `POST /item-code/{code}`, `POST /qr/{qrCode}`, `POST /package-folio/{folio}`, `GET /{id}`, `GET /customer/{customerId}`, `GET /reservation/{reservationId}`, `PATCH /{paymentId}/void` |
| Saldo | `/api/balance` | `POST /apply-to-order`, `POST /reverse-application`, `GET /{customerId}`, `GET /{customerId}/history`, `GET /branch/{branchId}/customer-phone/{phone}`, `GET /package-folio/{folio}` |
| Pedidos | `/api/customer-orders` | `GET /customer/{customerId}`, `GET /branch/{branchId}/pending-payment`, `GET /{id}`, `GET /{id}/settlement` |
| Paquetes | `/api/customer-packages` | `POST`, `POST /from-order/{orderId}`, `GET /customer/{customerId}`, `GET /{id}`, `GET /folio/{folio}`, `POST /{id}/items`, `POST /folio/{folio}/items/item-code/{code}`, `POST /folio/{folio}/items/qr/{qrCode}`, `PATCH /{id}/ready`, `PATCH /folio/{folio}/ready`, `PATCH /{id}/cancel`, `PATCH /folio/{folio}/cancel` |
| Envios | `/api/shipments` | `POST`, `GET /{id}`, `GET /folio/{folio}`, `GET /branch/{branchId}`, `POST /{id}/packages`, `POST /folio/{shipmentFolio}/packages/package-folio/{packageFolio}`, `PATCH /{id}/dispatch`, `PATCH /folio/{folio}/dispatch`, `PATCH /{shipmentId}/packages/{shipmentPackageId}/resolve`, `PATCH /folio/{shipmentFolio}/packages/{shipmentPackageId}/resolve`, `PATCH /{id}/cancel`, `PATCH /folio/{folio}/cancel`, `PATCH /{id}/reopen`, `PATCH /folio/{folio}/reopen` |
| Transferencias | `/api/transfers` | `POST`, `GET /{id}`, `GET /folio/{folio}`, `GET /branch/{branchId}`, `GET /status/{status}`, `POST /{transferId}/items/{itemId}`, `PATCH /{transferId}/send`, `PATCH /{transferId}/receive-item`, `PATCH /{transferId}/cancel` |
| Consignaciones | `/api/consignments` | `POST`, `GET /{id}`, `GET /folio/{folio}`, `GET /branch/{branchId}`, `GET /status/{status}`, `POST /{consignmentId}/items`, `PATCH /{consignmentId}/deliver`, `POST /{consignmentId}/settlements`, `PATCH /{consignmentId}/cancel` |
| Consignatarios | `/api/consignees` | `GET /branch/{branchId}`, `GET /branch/{branchId}/active`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/deactivate` |
| Devoluciones | `/api/returns` | `POST`, `POST /{id}/items`, `PATCH /{id}/process`, `PATCH /{id}/cancel`, `GET /{id}`, `GET /sale/{saleId}`, `GET`, `POST /item-code/{code}`, `POST /qr/{qrCode}` |
| Reembolsos | `/api/refunds` | `POST`, `PATCH /{id}/approve`, `PATCH /{id}/process`, `PATCH /{id}/cancel`, `GET /{id}`, `GET /return/{returnId}`, `GET /customer/{customerId}`, `GET`, `GET /lookup/code/{code}`, `GET /lookup/qr/{qrCode}` |
| Cierre caja | `/api/cash-closures` | `POST`, `GET /{id}`, `GET /branch/{branchId}`, `GET /branch/{branchId}/date/{date}`, `PUT /{id}`, `POST /{id}/expenses`, `PATCH /{closureId}/expenses/{expenseId}/cancel`, `PATCH /{id}/close`, `PATCH /{id}/cancel` |
| Reportes | `/api/reports/*` | `GET` en `daily-deliveries`, `remissions`, `live-control`, `daily-deposits`, `daily-cancellations`, `daily-store`, `movement-history` |
| Incidencias | `/api/incidents` | `GET /{id}`, `GET /branch/{branchId}`, `GET /shipment/{shipmentId}`, `GET`, `PATCH /{id}/status` |
| Sistema logs | `/api/system/logs` | `GET` |
| Salud | `/api/health` | `GET` |

## Riesgo de seguridad

Debe verificarse por prueba que cada endpoint sensible ejecuta validacion de permiso en su servicio. El filtro global no bloquea por ruta.

## Endpoints criticos para regresion operacional

| Endpoint | Criticidad | Permiso esperado | Validacion pendiente |
|---|---|---|---|
| `POST /api/auth/login` | CRITICA | Publico controlado | Bloqueo, credenciales invalidas, respuesta amigable. |
| `POST /api/auth/logout` | ALTA | Usuario autenticado | Token/sesion valida. |
| `POST /api/auth/change-password` | ALTA | Usuario autenticado | Politica password y sesion. |
| `POST /api/users` | CRITICA | `MANAGE_USERS` | Alta solo admin. |
| `PUT /api/users/{id}/roles` | CRITICA | `MANAGE_ROLES` | No escalamiento indebido. |
| `PUT /api/security/settings` | CRITICA | `MANAGE_SECURITY_SETTINGS` | Solo admin seguridad. |
| `POST /api/batches/branch/{branchId}` | ALTA | `MANAGE_INVENTORY` | Sucursal/proveedor/cantidad. |
| `PATCH /api/batches/{id}/receive` | ALTA | `MANAGE_INVENTORY` | Calidad/cantidad/estado. |
| `PATCH /api/batches/{id}/reconcile` | ALTA | `MANAGE_INVENTORY` | Clasificacion igual a recibido. |
| `POST /api/lives/branch/{branchId}` | ALTA | `DO_LIVE_RESERVATION` | Canal/sucursal habilitada. |
| `PATCH /api/lives/{id}/close` | ALTA | `DO_LIVE_RESERVATION` | Estado de live. |
| `POST /api/reservations` | ALTA | Canal live/puerta | Cliente/prenda/precio/canal. |
| `PATCH /api/reservations/{id}/cancel` | ALTA | `CANCEL_RESERVATION` | Motivo/autorizacion futura. |
| `POST /api/sales` | CRITICA | `DO_DOOR_SALE` | Cliente/prenda/precio/pago/canal. |
| `PATCH /api/sales/{saleId}/cancel` | CRITICA | `CANCEL_SALE` | Motivo y auditoria. |
| `POST /api/payments` | CRITICA | `REGISTER_PAYMENTS` | Monto/metodo/origen. |
| `PATCH /api/payments/{paymentId}/void` | CRITICA | `VOID_PAYMENT` | Motivo/auditoria. |
| `POST /api/customer-packages` | ALTA | `CREATE_CLOSE_CUSTOMER_PACKAGE` | Cliente/sucursal. |
| `PATCH /api/customer-packages/{id}/ready` | ALTA | `CREATE_CLOSE_CUSTOMER_PACKAGE` | Items/estado. |
| `POST /api/shipments` | ALTA | `MANAGE_SHIPMENTS` | Sucursal/tipo. |
| `PATCH /api/shipments/{id}/dispatch` | ALTA | `MANAGE_SHIPMENTS` | Paquetes listos. |
| `POST /api/cash-closures` | CRITICA | `MANAGE_CASH_CLOSURES` | Sucursal/fecha unica. |
| `PATCH /api/cash-closures/{id}/close` | CRITICA | `MANAGE_CASH_CLOSURES` | Totales/estado. |
| `GET /api/reports/*` | MEDIA/ALTA | `VIEW_REPORTS` | Sucursal/fecha/perfil. |
| `GET /api/system/logs` | ALTA | Perfil tecnico/admin | No visible a operativos. |

## Nota Fase 1C

Esta seccion es preparatoria. No implica cambios en `SecurityConfig.java`, `AccessService.java`, controladores ni servicios.
