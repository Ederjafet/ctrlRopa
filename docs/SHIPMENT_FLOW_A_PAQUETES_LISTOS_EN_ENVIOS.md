# SHIPMENT-FLOW-A Paquetes listos en bandeja de Envios

Fecha: 2026-06-22

> Actualizacion PACKAGE-SHIPPING-B: la bandeja de Envios ahora prepara paquetes usando el snapshot de direccion guardado en `customer_packages`. Si el paquete usa direccion temporal o recoleccion, el envio puede crearse sin `delivery_address_id` y sigue mostrando la direccion/modalidad historica.

> Actualizacion SHIPMENTS-UX-A: `/shipments` se organiza como bandeja operativa mixta con resumen, filtros, busqueda, tarjetas por siguiente paso y acciones contextuales. El modelo sigue siendo envios reales + paquetes `READY` sin envio activo.

> Actualizacion SHIPMENT-DETAIL-UX-A: el detalle de envio quedo como vista operativa con destino, guia, paquete, prendas, timeline y regreso contextual hacia `/shipments`.

> Actualizacion SHIPMENTS-INTEGRITY-A: la preparacion de un envio exige paquete asociado desde la creacion (`customerPackageId`). El servicio crea el shipment y agrega el paquete en una misma operacion, evitando shipments operativos con `0 paquetes`.

## Problema

El paquete podia marcarse como listo para envio desde `/customer-package-detail`, pero no aparecia en `/shipments`.

Causa raiz: `markReady` solo cambiaba el paquete a `CustomerPackageStatus.READY`. La pantalla `/shipments` consultaba exclusivamente registros de la tabla `shipments`, por lo que un paquete `READY` sin `Shipment` asociado quedaba invisible para logistica.

## Modelo elegido

Se eligio una bandeja mixta:

- envios reales existentes;
- paquetes `READY` sin envio activo, mostrados como `Pendiente de preparar envio`.

No se crea automaticamente `shipment_package` al marcar listo porque la tabla requiere datos logisticos confirmados. El shipment se prepara desde `/shipments` usando el paquete listo y su snapshot de direccion/envio. Desde SHIPMENTS-INTEGRITY-A esa preparacion ya no se hace en dos pasos visibles: el backend exige `customerPackageId` y agrega el paquete al crear el shipment.

## Backend

Endpoint nuevo:

- `GET /api/customer-packages/branch/{branchId}/ready-for-shipment`

Reglas:

- requiere permiso `MANAGE_SHIPMENTS`;
- valida tenant/sucursal con `TenantAccessGuard`;
- devuelve solo paquetes `READY`;
- exige prendas > 0;
- exige envio confirmado;
- exige saldo pendiente normalizado en `0.00`;
- excluye paquetes que ya tienen shipment activo `OPEN` u `OUT_FOR_DELIVERY`.

## Frontend

`/shipments` ahora carga:

- `/api/shipments/branch/{branchId}`;
- `/api/customer-packages/branch/{branchId}/ready-for-shipment`.

La bandeja muestra tarjetas de paquetes listos con:

- folio de paquete;
- cliente;
- total;
- costo de envio o sin costo;
- prendas;
- fecha listo;
- accion `Preparar`;
- accion `Paquete`.

La accion `Preparar` solicita una direccion activa del cliente, tipo de entrega y guia si aplica. Al confirmar:

1. crea un `Shipment` real;
2. agrega el paquete con `paymentMode = PREPAID`;
3. abre `/shipment-detail?id={shipmentId}`.

## Anti-duplicados

La cola excluye paquetes con envio activo. Adicionalmente, el backend existente de `addPackage` mantiene `hasActiveAssignment`, por lo que si dos usuarios intentan preparar el mismo paquete, el segundo intento queda bloqueado por backend.

## Permisos

- Ver y preparar desde bandeja: `MANAGE_SHIPMENTS`.
- Consultar/volver al paquete: permisos existentes de paquetes.
- Agregar el paquete al envio reutiliza la validacion backend actual de envios.

## Fuera de alcance

- elegir direccion automaticamente;
- catalogo avanzado de paqueterias;
- evidencia de entrega;
- notificaciones al cliente;
- integracion real con paqueterias.

## Validaciones

- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: OK.
- `npm run lint`: OK, con warnings historicos.
- `npx tsc --noEmit`: OK.

Validaciones finales completas se registran en la respuesta de cierre de la fase.
