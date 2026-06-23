# SHIPMENT-DETAIL-UX-A Detalle operativo de envio

Fecha: 2026-06-22

> Actualizacion SHIPMENT-BUTTONS-A: las acciones criticas del detalle ya no usan `Alert.alert` como confirmacion. `Marcar enviado`, `Cancelar envio` y `Reabrir envio` usan modal propio, loading y aviso visible. El despacho toma la guia del shipment o del paquete relacionado si el shipment aun no la tiene.

## Problema

`/shipment-detail` cargaba el envio y sus paquetes, pero la pantalla se sentia aislada: mostraba datos en bloques simples, no explicaba el siguiente paso, no destacaba destino/guia/costo y no exponia prendas del paquete. Tambien dependia de alertas nativas para feedback y no guiaba bien el regreso a `/shipments`.

## Modelo actual

El detalle se carga desde:

- `GET /api/shipments/{id}`

El endpoint devuelve:

- datos base del envio;
- estado;
- tipo de entrega;
- guia/referencia si existe;
- lineas de paquetes del envio con cliente, direccion snapshot/resuelta, costo, modo de cobro y estado.

Para mostrar prendas sin tocar backend, la pantalla carga el detalle de cada paquete relacionado con:

- `GET /api/customer-packages/{packageId}`

El backend no expone en esta fase un endpoint para editar guia de un shipment ya creado. La guia se define al crear/preparar el envio desde `/shipments` o se hereda desde la guia del paquete al despachar.

## Cambios visuales

- Cabecera compacta: `Detalle de envio`, folio, paquete y cliente.
- Boton contextual `Volver a Envios` cuando `returnTo=/shipments`.
- Bloque superior de estado con siguiente paso operativo.
- Metricas compactas: paquetes, prendas, guia y fecha de creacion.
- Seccion `Destino` con recibe, telefono, tipo de entrega, direccion snapshot, referencias y fuente.
- Seccion `Paqueteria y guia` con guia, costo, cobro y bloqueo visible si falta guia.
- Seccion `Paquete relacionado` con total, envio, estado de pago, estado del paquete y acciones.
- Seccion `Prendas incluidas` usando el detalle del paquete.
- Linea de tiempo compacta: creado, guia registrada, enviado, recibido/resuelto y cancelado.
- Acciones ordenadas por contexto.

## Cambios funcionales

- La pantalla respeta `returnTo` y vuelve a la ruta recibida, manteniendo `/shipments` como fallback seguro.
- Al abrir un paquete desde el envio se pasa `returnTo` hacia el mismo detalle de envio para no perder contexto.
- `Marcar enviado` queda bloqueado si:
  - falta `MANAGE_SHIPMENTS`;
  - el envio no esta abierto;
  - no tiene paquetes;
  - es paqueteria y falta guia/referencia;
  - hay otra accion en proceso.
- Si una accion esta bloqueada, `AppButton` muestra `disabledReason`.
- Los exitos y errores quedan visibles como aviso en pantalla.
- `Confirmar recibido` usa el flujo existente de resolver linea de paquete.
- `Marcar enviado`, `Cancelar envio` y `Reabrir envio` usan `AppBottomModal` para no depender de alertas nativas en web.

## Permisos

- Ver/operar envio: `MANAGE_SHIPMENTS`.
- Ver paquete relacionado: `CREATE_CLOSE_CUSTOMER_PACKAGE`.

`services/screenPermissions.ts` se actualizo para que `shipmentDetail` muestre las acciones reales: agregar paquete, marcar enviado, confirmar entrega, cancelar/reabrir envio y ver paquete relacionado.

No se agregaron permisos ni migraciones.

## Fuera de alcance

- editar guia de un shipment ya creado;
- tracking real;
- etiquetas PDF;
- evidencia/foto de entrega;
- mapas;
- integracion DHL/Estafeta/FedEx;
- facturacion.

## Validaciones

- `npx.cmd eslint app/shipment-detail.tsx`: OK.
- `npx.cmd tsc --noEmit --pretty false`: OK.

Validaciones finales completas se registran en la respuesta de cierre de la fase.
