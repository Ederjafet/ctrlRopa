# SHIPMENTS-UX-A Bandeja operativa de Envios

Fecha: 2026-06-22

> Actualizacion SHIPMENT-DETAIL-UX-A: al abrir un envio desde la bandeja, `/shipment-detail` ahora presenta estado, siguiente paso, destino, guia, paquete, prendas, timeline y acciones contextuales. El regreso con `returnTo=/shipments` vuelve directamente a la bandeja.

## Problema

`/shipments` mostraba paquetes listos y envios reales como una lista simple. La pantalla no dejaba distinguir rapidamente que estaba listo para preparar, que envio necesitaba guia, que estaba en ruta o que ya estaba entregado.

## Modelo usado

Se conserva el modelo mixto creado en `SHIPMENT-FLOW-A`:

- paquetes `READY` sin envio activo, consultados desde `getReadyCustomerPackagesForShipment`;
- envios reales, consultados desde `getShipmentsByBranch`.

No se agrego backend. La pantalla organiza ambas fuentes como una sola bandeja operativa.

## Cambios de UI

- Cabecera compacta con `Ver permisos` y accion secundaria `Envio manual`.
- Resumen superior: listos para envio, pendientes de guia, en preparacion, enviados, entregados y con atencion.
- Filtros: todos, listos, pendientes de guia, en preparacion, enviados, entregados, con atencion e historial.
- Busqueda por cliente, paquete, guia, paqueteria, telefono o folio.
- Cards compactas con estado, tipo de entrega, guia, costo/total, prendas, destinatario, direccion y siguiente paso.
- Estados vacios claros para bandeja sin paquetes o filtros sin resultados.

## Acciones

- Paquete listo: `Preparar envio` o `Registrar guia`, mas `Ver paquete`.
- Envio abierto: abrir detalle para registrar guia, revisar paquetes o despachar.
- Envio en ruta: abrir detalle para confirmar recibido.
- Envio entregado/historial: abrir detalle.

Las acciones que no se pueden ejecutar quedan bloqueadas con `disabledReason`; no hay botones visibles sin respuesta.

## Permisos

`/shipments` usa `MANAGE_SHIPMENTS` para:

- ver bandeja;
- crear envio manual;
- preparar paquete listo;
- registrar guia;
- marcar enviado;
- confirmar recibido.

`Ver paquete` usa `CREATE_CLOSE_CUSTOMER_PACKAGE`.

`services/screenPermissions.ts` se actualizo para que el modal de `Ver permisos` muestre las acciones reales de la bandeja.

## Duplicados

La pantalla no crea envios automaticamente al listar. Cuando prepara un paquete listo, reutiliza el flujo existente:

1. crea `Shipment`;
2. agrega el paquete al envio;
3. abre `shipment-detail`.

La lista de paquetes listos excluye paquetes con envio activo y el backend conserva la validacion de asignacion activa, por lo que no se duplican paquetes en envios.

## Fuera de alcance

- integracion real con paqueterias;
- cotizacion automatica;
- mapas;
- etiquetas PDF;
- comprobante de entrega;
- notificaciones al cliente;
- endpoint atomico `prepare-from-package`.

## Validaciones

- `npm run lint`: OK, con warnings historicos del proyecto.
- `npx tsc --noEmit`: OK.
- `git diff --check`: pendiente de validacion final.
