# CUSTOMER-UX-A Cliente 360, pedidos y direcciones

Fecha: 2026-06-22

## Problema detectado

Las pantallas de cliente estaban separadas y poco conectadas:

- `/customers/[id]` mostraba datos basicos y direcciones, pero no funcionaba como ficha operativa.
- `/customer-orders` solo mostraba pedidos operativos y no daba contexto de paquetes, saldos o envio.
- `/customer-addresses-create` era un formulario simple, sin `returnTo`, sin estado claro ni explicacion de uso en paquetes.
- `/customers/4s` podia intentar operar con un ID no numerico.

## Pantallas mejoradas

- `/customers/[id]`
- `/customer-orders?customerId=...&returnTo=...`
- `/customer-addresses-create?customerId=...`
- `/customer-addresses/[id]?customerId=...&returnTo=...`

## Cliente 360

La ficha del cliente ahora muestra:

- cabecera con cliente, telefono, sucursal y estado;
- metricas operativas: apartados activos, paquetes abiertos, saldo pendiente, saldo a favor, pagado y direcciones;
- datos de contacto editables solo con permiso;
- direcciones con principal, editar, marcar principal y agregar direccion;
- actividad reciente de paquetes y apartados;
- acciones rapidas para nuevo apartado, paquetes, pedidos y direccion;
- resumen de pagos/saldo cuando el rol tiene permiso.

## Pedidos del cliente

`/customer-orders` ahora funciona como bandeja de actividad del cliente:

- paquetes reales del cliente cuando el rol tiene `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- pedidos operativos existentes;
- resumen superior de abiertos, listos para envio, enviados, pendiente de pago y saldo a favor;
- filtros por todos, pedidos, abiertos, pendientes, listos, enviados y cerrados;
- busqueda por paquete, guia, estado o pedido;
- navegacion a paquete, envio y detalle de pedido conservando `returnTo`.

## Direcciones

La alta y edicion de direcciones ahora tienen:

- cabecera con cliente y boton `Ver permisos`;
- validaciones por campo;
- feedback visible de exito/error;
- opcion para marcar como principal;
- regreso por `returnTo` o a `/customers/{customerId}`;
- texto aclarando que la direccion del cliente sirve como base y que cada paquete conserva snapshot propio.

El modelo actual de `customer_addresses` guarda etiqueta y domicilio. Destinatario y telefono final se capturan en el paquete al definir direccion/envio.

## ReturnTo

Se respeta `returnTo` en:

- pedidos del cliente;
- crear direccion;
- editar direccion;
- abrir paquete desde cliente/pedidos;
- abrir envio desde pedidos.

Si no existe `returnTo`, se usa una ruta segura al cliente o a la lista de clientes.

## Ruta invalida

Si la ruta contiene un ID no numerico, por ejemplo `/customers/4s`, la app muestra `Cliente no valido` y ofrece volver a clientes. No llama al backend con un ID roto.

## Permisos

Se agregaron screenKeys:

- `customerDetail`;
- `customerOrders`;
- `customerAddressesCreate`.

Permisos usados:

- `VIEW_CUSTOMERS` para ver cliente, actividad y direcciones;
- `EDIT_CUSTOMER` para editar cliente y administrar direcciones;
- `CREATE_CLOSE_CUSTOMER_PACKAGE` para ver paquetes;
- `DO_DOOR_RESERVATION` para nuevo apartado;
- `VIEW_PAYMENTS` para pagos/saldo;
- `MANAGE_SHIPMENTS` para abrir seguimiento de envios.

Backend ahora valida `VIEW_CUSTOMERS`/`EDIT_CUSTOMER` en direcciones de cliente, manteniendo tenant isolation por sucursal.

## Limitaciones

- No se agregaron campos nuevos a `customer_addresses`.
- No se implemento validacion externa de codigo postal.
- No se implementaron mapas.
- No se integro paqueteria real.
- El timeline completo del cliente queda para fase futura.

## Backlog

- Edicion avanzada de direcciones con destinatario y telefono guardados.
- Preferencias de envio por cliente.
- Timeline unico de cliente con paquetes, pagos, apartados, envios y saldos.
- Validacion CP/colonia por catalogo local o proveedor externo.
- Mapa/ruta de entrega.
