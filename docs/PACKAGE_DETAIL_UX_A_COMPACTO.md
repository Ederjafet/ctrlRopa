# PACKAGE-DETAIL-UX-A - Detalle de paquete compacto

Fecha: 2026-06-22

## Problema detectado

`/customer-package-detail` mostraba informacion correcta, pero distribuida en tarjetas grandes y con demasiado scroll. El operador tenia que bajar para entender saldos, prendas, abonos, envio y acciones disponibles.

## Nueva estructura

La pantalla queda organizada como consola operativa:

1. Cabecera compacta con folio, cliente, sucursal, telefono y estados.
2. Resumen financiero superior en metricas pequenas.
3. Bloque de siguiente paso con una accion principal contextual.
4. Columna principal con prendas y pagos.
5. Columna lateral con acciones, envio, cliente y etiqueta.

En escritorio se usa layout de dos columnas. En tablet/movil se apila en una sola columna.

## Datos visibles arriba

- Total del paquete.
- Subtotal de prendas.
- Costo de envio confirmado o pendiente.
- Abonado.
- Saldo pendiente.
- Saldo a favor del cliente.
- Numero de prendas.
- Estado del paquete.
- Estado de pago.
- Estado de envio.

## Acciones principales

La accion destacada depende del estado:

- Si hay saldo pendiente: `Registrar abono`.
- Si falta costo de envio: `Definir envio`.
- Si esta pagado y en preparacion: `Marcar listo para envio`.
- Si esta listo/enviado: `Ir a envios` o `Ver envio`.
- Si esta cancelado/entregado: `Volver a paquetes`.

Las acciones secundarias quedan en el panel lateral: registrar abono, aplicar saldo a favor, agregar por QR, marcar listo y cancelar paquete.

## Prendas

La lista de prendas ahora usa filas compactas con:

- codigo;
- tipo, talla y marca;
- estado;
- origen;
- precio;
- pagado;
- pendiente;
- acceso a `Ver prenda`.
- accion secundaria `Quitar` cuando la linea no tiene abono aplicado y el paquete sigue editable.

Si el paquete no tiene prendas se muestra estado vacio con CTA contextual.

Despues de PACKAGE-ITEM-REMOVE-A, `Quitar` pide confirmacion y actualiza el detalle completo del paquete. Si la linea tiene pago aplicado, el paquete ya no esta `OPEN` o falta permiso, la accion queda bloqueada con explicacion. Quitar una linea solo elimina la relacion con el paquete; la reserva se conserva fuera del paquete y no se liberan prendas automaticamente.

## Pagos y abonos

La pantalla muestra resumen financiero de abonos con total, abonado, pendiente y estado. El endpoint actual devuelve acumulados, no historial detallado de pagos por paquete, por lo que no se inventan lineas de pago.

Despues de PACKAGE-SHIPPING-A, el resumen separa subtotal de prendas y costo de envio. Los pagos se aplican contra prendas y contra el cargo de envio confirmado, pero el costo de envio no se registra como pago.

Backlog: endpoint read-only de historial de pagos por paquete.

## Envio

El panel `Envio / Paqueteria` muestra y permite guardar:

- costo de envio;
- envio sin costo confirmado;
- paqueteria;
- guia o referencia;
- notas;
- estado logistico de envios asociados;
- acceso a envio si el usuario tiene `MANAGE_SHIPMENTS`.

Si no hay costo confirmado, la pantalla indica que falta capturar paqueteria o marcar envio sin costo antes de liberar el paquete.

## Permisos considerados

- `CREATE_CLOSE_CUSTOMER_PACKAGE` para preparar/cancelar paquete.
- `CREATE_CLOSE_CUSTOMER_PACKAGE` para definir costo de envio.
- `REGISTER_PAYMENTS` para registrar abonos.
- `APPLY_CUSTOMER_BALANCE` para aplicar saldo a favor.
- `MANAGE_INVENTORY` para agregar prendas al paquete.
- `MANAGE_SHIPMENTS` para navegar/gestionar envios.

El modal `Ver permisos` se mantiene en cabecera con `customerPackageDetail`.

## Fuera de alcance

- No se creo historial detallado de pagos.
- No se implemento aplicacion directa de saldo a favor al paquete.
- No se cambiaron reglas de negocio.
- No se agregaron permisos nuevos.

## Continuidad PACKAGE-SHIPPING-A

PACKAGE-SHIPPING-A si agrega backend para guardar costo de envio y bloquear `Marcar listo para envio` si falta confirmacion de paqueteria o saldo.

## Validaciones

- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Decision

GO UX frontend en PACKAGE-DETAIL-UX-A; PACKAGE-SHIPPING-A completa la regla funcional de costo de envio dentro del paquete.
