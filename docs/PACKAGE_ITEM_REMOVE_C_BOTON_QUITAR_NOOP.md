# PACKAGE-ITEM-REMOVE-C - Boton Quitar sin no-op

Fecha: 2026-06-22

## Bug detectado

En `/customer-package-detail?id=1` el boton `Quitar` aparecia en las prendas del paquete, pero al presionarlo no daba respuesta visible:

- no abria confirmacion;
- no quitaba la prenda;
- no mostraba bloqueo;
- no mostraba error.

## Causa raiz

El flujo de `Quitar` dependia de `Alert.alert` para abrir la confirmacion. En la superficie web/Expo usada en el smoke, esa alerta no daba feedback confiable y la accion se sentia como un no-op.

Ademas, para lineas bloqueadas se pasaba `disabled` al `AppButton`. Ese boton intenta mostrar `disabledReason` tambien con `Alert.alert`, por lo que una linea bloqueada podia verse con `Quitar`, pero al presionarla no mostraba una razon visible.

No fue problema de endpoint ni de ID:

- el servicio frontend llama `DELETE /api/customer-packages/{packageId}/items/{packageItemId}`;
- `item.id` en `CustomerPackageItemLine` corresponde al `packageItemId`;
- el backend conserva la validacion final por permiso, estado y pago aplicado de la linea.

## Correccion aplicada

`Quitar` ya no depende de `Alert.alert`.

Ahora:

- si la linea puede quitarse, el boton abre un `AppBottomModal` de confirmacion;
- si la linea esta bloqueada, el boton sigue respondiendo y muestra un aviso visible con la razon;
- la tarjeta de la linea muestra una razon corta debajo del boton cuando esta bloqueada;
- el modal muestra prenda, precio, pagado aplicado y pendiente de la linea;
- el modal muestra vista previa de subtotal, envio, total, abonado y pendiente despues de quitar;
- confirmar llama el endpoint real con `packageItemId`;
- si backend rechaza, el error queda visible en el modal y en el aviso superior.

## Regla funcional

La regla se mantiene por linea:

- se permite quitar si `paidAmount = 0`, el paquete esta editable y el usuario tiene `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- desde PACKAGE-ITEM-REMOVE-D, si `paidAmount > 0`, se permite quitar solo con confirmacion explicita, `APPLY_CUSTOMER_BALANCE` y generacion de saldo a favor;
- no se bloquea por pagos de otras prendas;
- no se bloquea por costo de envio confirmado;
- se bloquea si falta permiso o el paquete no esta editable.

## Impacto en envio y pagos

Al quitar una linea sin abono:

- no se eliminan pagos registrados;
- no se elimina el costo de envio;
- no se cancela la reserva;
- el detalle actualizado viene del backend;
- el total y saldo se recalculan con envio incluido.

Al quitar una linea con abono despues de PACKAGE-ITEM-REMOVE-D:

- el pago historico no se borra;
- se registra saldo a favor por el monto pagado de la linea;
- se conserva el envio;
- el detalle actualizado viene del backend.

## Smoke esperado

1. Presionar `Quitar` en linea removible abre modal.
2. Confirmar ejecuta DELETE y actualiza el detalle.
3. Presionar `Quitar` en linea con abono muestra `Esta prenda ya tiene abono aplicado...`.
4. Presionar `Quitar` sin permiso muestra razon de permiso.
5. El boton ya no queda como accion muerta.

## Validaciones

- `./mvnw.cmd test`
- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Decision

GO: el boton `Quitar` tiene respuesta visible en todos los estados y el backend sigue siendo la autoridad final.
