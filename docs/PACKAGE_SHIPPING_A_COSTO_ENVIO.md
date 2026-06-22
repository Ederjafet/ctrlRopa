# PACKAGE-SHIPPING-A - Costo de envio en paquetes

Fecha: 2026-06-22

## Problema detectado

`/customer-package-detail` permitia intentar `Marcar listo para envio`, pero no existia un lugar claro para capturar el costo de paqueteria. Eso dejaba una brecha operativa: el costo de envio podia quedar fuera del total cobrado antes de liberar el paquete.

## Regla de negocio

Antes de marcar un paquete como listo para envio debe ocurrir uno de estos escenarios:

- Envio con costo: se captura un monto mayor a 0 y el costo se suma al total del paquete.
- Envio sin costo: se confirma explicitamente como `Envio sin costo`, con costo 0.

Ademas, el saldo pendiente del paquete debe ser 0.

## Modelo de datos

Se agrego `V65__package_shipping_cost.sql`.

Campos agregados a `customer_packages`:

- `shipping_cost_amount`
- `shipping_cost_confirmed`
- `shipping_cost_waived`
- `shipping_carrier`
- `tracking_number`
- `shipping_notes`

Se agrego `payment_allocations.customer_package_id` para aplicar una parte del pago del paquete al cargo de envio confirmado. Esto evita tratar el costo de envio como pago; sigue siendo un cargo a cobrar dentro del total del paquete.

## Endpoint

Nuevo endpoint:

`PATCH /api/customer-packages/{id}/shipping-cost`

Payload con costo:

```json
{
  "shippingCostAmount": 180,
  "shippingCostWaived": false,
  "shippingCarrier": "Estafeta",
  "trackingNumber": null,
  "shippingNotes": "Cliente paga envio"
}
```

Payload sin costo:

```json
{
  "shippingCostAmount": 0,
  "shippingCostWaived": true,
  "shippingNotes": "Envio sin costo autorizado"
}
```

Permiso usado:

- `CREATE_CLOSE_CUSTOMER_PACKAGE`

## Calculo financiero

El detalle de paquete ahora expone:

- `itemSubtotalAmount`
- `shippingCostAmount`
- `shippingCostConfirmed`
- `shippingCostWaived`
- `totalAmount`
- `paidAmount`
- `pendingAmount`

Formula:

`totalAmount = itemSubtotalAmount + shippingCostAmount confirmado`

`paidAmount = pagos aplicados a prendas + pagos aplicados al cargo de envio`

`pendingAmount = totalAmount - paidAmount`

Si el envio no esta confirmado, el total mostrado es parcial y la UI avisa que falta definir paqueteria.

## UI

En `/customer-package-detail` se agrego el bloque compacto `Envio / Paqueteria`.

Permite:

- capturar costo de envio;
- confirmar `Envio sin costo`;
- capturar paqueteria;
- capturar guia/referencia;
- capturar notas;
- guardar datos de envio.

El resumen financiero superior muestra:

- subtotal de prendas;
- costo de envio;
- total paquete;
- abonado;
- saldo pendiente;
- saldo a favor;
- prendas.

## Bloqueos

`Marcar listo para envio` se bloquea si:

- falta permiso `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- el paquete no tiene prendas;
- el costo de envio no esta confirmado;
- hay saldo pendiente;
- el paquete no esta en preparacion.

Mensajes principales:

- `Antes de marcar listo para envio, captura el costo de paqueteria o marca el envio como sin costo.`
- `No puedes marcar listo para envio porque el paquete tiene saldo pendiente de $X.XX MXN.`
- `No tienes permiso para preparar paquetes. Permiso requerido: CREATE_CLOSE_CUSTOMER_PACKAGE.`

Despues de PACKAGE-READY-A, el detalle del paquete expone `canMarkReadyForShipment` y `markReadyForShipmentBlockedReason`. La pantalla usa esos campos del backend para que la accion y el motivo de bloqueo coincidan. El saldo se normaliza a 2 decimales antes de decidir si el paquete esta liquidado.

## Pagos

Los pagos del paquete siguen siendo abonos. No se mezclo el costo de envio con `payments` como si fuera un pago separado.

Cuando el envio esta confirmado y existe saldo por envio, `createPaymentByPackageFolio` asigna el remanente del pago al cargo de envio mediante `payment_allocations.customer_package_id`.

## Tests

Tests agregados o ajustados:

- guardar envio sin costo;
- rechazar costo negativo;
- bloquear `markReady` si envio no esta confirmado;
- asignar remanente de pago del paquete al cargo de envio.
- permitir `markReady` si el paquete esta pagado y el envio confirmado;
- permitir `markReady` si el envio esta confirmado sin costo;
- bloquear con monto exacto si falta saldo de envio;
- permitir `markReady` cuando solo existe residuo sub-centavo que redondea a `0.00`.

## Backlog

- catalogo de paqueterias;
- guia obligatoria por estado;
- comprobantes de paqueteria;
- integracion real con paqueterias;
- costo por zona;
- auditoria before/after del costo de envio.

## Validaciones

- `./mvnw.cmd test`
- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Decision

GO funcional si las validaciones pasan con entorno DB configurado: el costo de envio queda claro, suma al total y bloquea la liberacion del paquete hasta confirmarse y liquidarse.
