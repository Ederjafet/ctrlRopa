# PACKAGE-SHIPPING-B Direccion de envio por paquete

Fecha: 2026-06-22

## Problema

El detalle de paquete ya permitia capturar costo de envio, pero no guardaba la direccion exacta donde se enviaria el paquete. Eso podia perder historico si el cliente cambiaba su direccion principal despues.

## Modelo implementado

Se agrego snapshot de direccion en `customer_packages` mediante `V66__package_shipping_address_snapshot.sql`.

Campos principales:

- `delivery_type`
- `shipping_address_source`
- `shipping_address_confirmed`
- `source_customer_address_id`
- `ship_to_name`
- `ship_to_phone`
- `ship_to_line1`
- `ship_to_line2`
- `ship_to_city`
- `ship_to_state`
- `ship_to_postal_code`
- `ship_to_country`
- `ship_to_references`
- `shipping_collect`
- `customer_provided_label`

El paquete conserva copia historica de la direccion usada. Si se elige direccion principal o guardada, se copia al paquete. Si se captura direccion temporal, se guarda solo en el paquete salvo que el usuario marque guardar en cliente.

## Tipos de entrega

- `PARCEL_SERVICE`: requiere direccion y costo o envio sin costo.
- `LOCAL_DELIVERY`: requiere direccion y costo o envio sin costo.
- `STORE_PICKUP`: no requiere direccion, costo 0 confirmado.
- `CUSTOMER_PROVIDED_LABEL`: no suma costo al paquete, requiere guia o nota.
- `COLLECT_SHIPPING`: requiere direccion, costo 0 para el paquete porque el cliente paga al recibir.
- `OTHER`: preparado para casos documentados.

## Endpoint

Nuevo endpoint:

- `PATCH /api/customer-packages/{packageId}/shipping`

Se conserva `/shipping-cost` por compatibilidad, pero la UI nueva usa `/shipping`.

## UI

`/customer-package-detail` ahora muestra `Direccion y envio`:

- tipo de entrega;
- direccion principal, guardada o temporal;
- destinatario y telefono;
- referencias;
- guardar direccion en cliente;
- marcar como principal solo si se guarda;
- costo de envio, sin costo, por cobrar o guia del cliente.

## Envio listo

`Marcar listo para envio` requiere:

- prendas en el paquete;
- tipo de entrega definido;
- direccion confirmada cuando aplica;
- costo/modalidad confirmado;
- saldo pendiente 0;
- permiso `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- estado editable.

## Envio / bandeja

`/shipments` usa el snapshot del paquete para preparar envios. Si existe `source_customer_address_id`, se envia como referencia; si es direccion temporal o recoleccion, el shipment se crea sin `delivery_address_id` y muestra el snapshot.

Actualizacion `SHIPMENTS-UX-A`: la bandeja muestra el resumen de direccion y destinatario en las tarjetas de paquetes listos, ademas de estado de guia/costo y siguiente paso operativo.

Actualizacion `PACKAGE-SHIPPING-C`: el detalle de paquete organiza direccion/envio por pasos y ya no muestra direccion o costo como envio completo si falta `delivery_type`.

## Fuera de alcance

- cotizacion automatica;
- integracion con paqueterias;
- mapas;
- validacion oficial de codigo postal;
- etiquetas PDF;
- auditoria avanzada de cambios de direccion.
