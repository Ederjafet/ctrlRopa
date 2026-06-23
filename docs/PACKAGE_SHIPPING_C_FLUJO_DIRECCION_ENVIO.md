# PACKAGE-SHIPPING-C Flujo de direccion y envio

Fecha: 2026-06-22

> Actualizacion SHIPMENT-DETAIL-UX-A: `/shipment-detail` muestra la direccion snapshot y la modalidad de entrega proveniente del paquete para que logistica no dependa de la direccion actual del cliente.

## Problema

La seccion `Direccion y envio` en `/customer-package-detail` mezclaba resumen, botones e inputs. En paquetes con datos parciales podia mostrar estados contradictorios, por ejemplo tipo sin definir con direccion/costo como confirmados.

## Causa raiz

El frontend evaluaba banderas por separado:

- `shippingCostConfirmed`;
- `shippingAddressConfirmed`;
- `shippingAddressSource`;
- `deliveryType`.

Ademas el formulario inicializaba `deliveryType` como `PARCEL_SERVICE` aunque el paquete viniera sin tipo guardado. Eso hacia que el formulario pareciera tener modalidad seleccionada, mientras el resumen leia `detail.deliveryType` como vacio.

## Correccion

Se agrego un estado compuesto de envio:

- `Incompleto`;
- `Direccion pendiente`;
- `Costo pendiente`;
- `Listo para cobrar`;
- `Listo para envio`.

El estado general solo se considera completo si existen tipo, direccion cuando aplica, costo/modalidad confirmado y saldo cubierto.

## Flujo visual

La seccion ahora se organiza en cuatro pasos:

1. Tipo de entrega.
2. Direccion o recoleccion.
3. Costo, guia y paqueteria.
4. Guardar y confirmar.

Cada paso muestra si esta guardado, pendiente, pendiente de guardar o no aplica.

## Tipos soportados

- `PARCEL_SERVICE`: requiere direccion y costo o por cobrar.
- `LOCAL_DELIVERY`: requiere direccion y costo o envio sin costo.
- `STORE_PICKUP`: no requiere direccion y confirma costo cero.
- `CUSTOMER_PROVIDED_LABEL`: no suma costo al paquete; requiere guia o nota al guardar.
- `COLLECT_SHIPPING`: requiere direccion y no suma costo al paquete.

## Datos parciales

Si un paquete tiene costo, guia o direccion capturados pero no tiene `deliveryType`, la UI muestra `Datos parciales heredados` y pide completar tipo de entrega antes de liberar envio.

## Marcar listo para envio

El bloqueo ahora prioriza razones accionables:

1. falta permiso;
2. estado de paquete no editable;
3. faltan prendas;
4. falta tipo de entrega;
5. falta direccion requerida o snapshot valido;
6. falta costo/modalidad confirmada;
7. existe saldo pendiente.

## Alcance

No se tocaron backend, migraciones ni reglas de pago. El endpoint existente `PATCH /api/customer-packages/{packageId}/shipping` se conserva.

## Validaciones

- `npx tsc --noEmit`: OK.
- `npm run lint`: OK, con warnings historicos del proyecto.
- `git diff --check`: OK.
