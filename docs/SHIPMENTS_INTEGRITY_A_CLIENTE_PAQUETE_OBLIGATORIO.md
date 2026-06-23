# SHIPMENTS-INTEGRITY-A Cliente y paquete obligatorio en envios

Fecha: 2026-06-22

## Problema detectado

En el smoke de `/shipments` se detectaron dos fallas operativas:

- La bandeja de envios mostraba guia, paqueteria y estado, pero no daba suficiente contexto del cliente, telefono, paquete, prendas, destino, costo o siguiente paso.
- Existia al menos un envio real sin paquete asociado. Ese registro aparecia como envio abierto con `0 paquetes`, lo cual no es valido para el flujo actual de AppModa.

## Causa raiz

El endpoint de lista de envios devolvia un `ShipmentResponse` muy delgado: tenia datos propios del shipment y conteo de paquetes, pero no enriquecia la respuesta con el paquete principal, cliente, direccion snapshot, costo o totales.

Ademas, el frontend creaba envios en dos pasos: primero `POST /api/shipments` y luego `addPackageToShipment`. Si el segundo paso fallaba o no se completaba, quedaba un shipment huerfano. Tambien existia una accion de envio manual capaz de iniciar un shipment sin paquete.

## Regla final

Un envio operativo debe nacer desde un paquete listo para envio.

Para crear un shipment:

- `customerPackageId` es obligatorio.
- El paquete debe existir y pertenecer a la misma sucursal/tenant del usuario.
- El paquete debe estar en estado listo para envio.
- El paquete no debe estar asignado a otro shipment activo.
- La creacion del shipment agrega el paquete en la misma operacion de servicio.

## Bandeja enriquecida

`/shipments` ahora puede mostrar, para envios reales:

- shipment y folio;
- cliente y telefono;
- paquete principal y estado;
- numero de prendas;
- destinatario y telefono de destino;
- direccion resumida, ciudad, estado y codigo postal cuando existen;
- tipo de entrega;
- paqueteria y guia efectiva;
- costo de envio;
- total del paquete;
- estado operativo;
- siguiente paso;
- razon de bloqueo o atencion.

Los datos salen del shipment y del paquete asociado. El backend usa la primera linea de `shipment_packages` como paquete principal para el MVP actual y calcula el resumen desde `CustomerPackage`, `CustomerPackageItem` y el snapshot de direccion/envio del paquete.

## Envios huerfanos existentes

No se borran automaticamente.

Si ya existe un shipment con `0 paquetes`:

- se marca como `requiresAttention`;
- aparece en el filtro `Con atencion`;
- muestra razon `Sin paquete asociado`;
- no se trata como envio normal;
- no puede marcarse enviado;
- no puede confirmarse recibido;
- en `shipment-detail` se muestra una alerta y solo queda disponible cancelar si el estado y permisos lo permiten.

## Acciones

Envio normal con paquete:

- Detalle;
- Ver paquete;
- Marcar enviado, si aplica;
- Confirmar recibido, si aplica.

Envio sin paquete:

- Detalle;
- Cancelar envio invalido, si aplica;
- sin `Marcar enviado`;
- sin `Confirmar recibido`;
- sin `Agregar paquete` desde el detalle.

## Permisos

Se mantienen los permisos reales:

- `MANAGE_SHIPMENTS` para crear/preparar/cancelar/despachar/confirmar envios.
- `CREATE_CLOSE_CUSTOMER_PACKAGE` para abrir el paquete relacionado desde la operacion.

Backend conserva la autoridad final.

## Tests

Se agregaron pruebas en `ShipmentServiceTests` para:

- bloquear creacion sin `customerPackageId`;
- crear shipment con paquete listo y asociarlo;
- enriquecer lista con cliente, telefono, paquete, direccion y totales;
- marcar envios sin paquete como incidencia;
- bloquear despacho de shipment sin paquetes;
- bloquear confirmacion de recibido de shipment sin paquetes.

## Backlog

- Soporte multi-paquete real con flujo de agregacion controlado.
- Reasignar paquete a shipment huerfano mediante correccion administrativa auditada.
- Auditoria avanzada para correcciones logisticas.
- Limpieza administrativa de envios invalidos con autorizacion.
