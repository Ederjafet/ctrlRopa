# PACKAGE-ITEM-REMOVE-B - Fix linea sin abono en paquete con pagos/envio

Fecha: 2026-06-22

## Bug detectado

En `/customer-package-detail?id=1` una prenda con `Pagado $0.00` no podia quitarse del paquete aunque esa linea no tenia abono aplicado.

El paquete si tenia pagos en otras prendas y costo de envio confirmado:

- subtotal prendas: `$2,299.00 MXN`;
- envio: `$190.00 MXN`;
- total: `$2,489.00 MXN`;
- abonado: `$699.00 MXN`;
- pendiente: `$1,790.00 MXN`;
- prendas: `3`.

La linea que debia poder quitarse era:

- precio: `$1,600.00 MXN`;
- pagado: `$0.00 MXN`;
- pendiente: `$1,600.00 MXN`.

## Causa raiz

La fase anterior dejo el endpoint y la accion de UI, pero la pantalla seguia decidiendo la habilitacion con logica local. El backend tampoco devolvia una decision explicita por linea para que el frontend pudiera distinguir con certeza:

- pago aplicado a esta linea;
- pago global aplicado a otras lineas;
- costo de envio confirmado.

Esto abria la puerta a bloquear una linea removible por contexto global del paquete o a mostrar una razon poco exacta.

## Regla corregida

La autorizacion operativa de `Quitar` se calcula por linea:

- paquete en estado editable `OPEN`;
- usuario con `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- `customer_package_items.id` pertenece al paquete;
- `paidAmount` de esa linea es `0`;
- no importa que el paquete tenga pagos aplicados a otras lineas;
- no importa que exista costo de envio confirmado.

Se bloquea si:

- la linea tiene `paidAmount > 0`;
- la linea no pertenece al paquete;
- el paquete ya esta listo, enviado, entregado o cancelado;
- falta permiso.

## Backend

`CustomerPackageDetailResponse.ItemLine` ahora expone:

- `canRemove`;
- `removeBlockedReason`.

`CustomerPackageService` calcula esos campos desde la misma regla que protege:

`DELETE /api/customer-packages/{packageId}/items/{packageItemId}`

El endpoint sigue siendo la autoridad final. Aunque el frontend habilite el boton, el backend vuelve a validar permiso, pertenencia, estado y pago por linea antes de borrar la relacion.

## Recalculo con envio

Al quitar una linea sin pago:

- se borra solo la relacion `customer_package_items`;
- no se eliminan pagos;
- no se elimina el costo de envio;
- no se cancela la reserva;
- no se libera inventario automaticamente.

El detalle se recalcula asi:

- subtotal prendas = suma de lineas restantes;
- envio = costo confirmado del paquete;
- total = subtotal prendas + envio;
- abonado = pagos aplicados a lineas restantes + pagos de envio;
- pendiente = total - abonado.

Caso cubierto:

- antes: subtotal `$2,299.00`, envio `$190.00`, total `$2,489.00`, abonado `$699.00`, pendiente `$1,790.00`;
- despues de quitar linea de `$1,600.00` pagada en `$0.00`: subtotal `$699.00`, envio `$190.00`, total `$889.00`, abonado `$699.00`, pendiente `$190.00`.

## Frontend

`/customer-package-detail` consume `canRemove` y `removeBlockedReason` por linea.

El boton `Quitar`:

- queda habilitado si el backend reporta `canRemove = true`;
- muestra la razon exacta si `canRemove = false`;
- conserva confirmacion previa;
- llama al endpoint con `packageItemId`, no con `itemId`;
- actualiza el detalle completo con la respuesta del backend.

## Tests

Se agrego regresion unitaria en `CustomerPackageServiceTests`:

- paquete con dos lineas pagadas y una linea sin pago;
- envio confirmado por `$190.00`;
- se permite quitar la linea sin pago;
- se conserva el envio;
- subtotal, total, abonado y pendiente quedan correctos.

Tambien se mantienen pruebas para bloquear lineas con pago, estados no editables y usuario sin permiso.

## Smoke esperado

Para el caso reportado:

1. La prenda de `$1,600.00` con `Pagado $0.00` muestra `Quitar` habilitado.
2. Las prendas de `$199.00` y `$500.00` pagadas quedan bloqueadas.
3. Al quitar la prenda sin pago, el paquete queda con 2 prendas.
4. El envio de `$190.00` se conserva.
5. El saldo pendiente baja a `$190.00`.

## Decision

GO para la correccion: la regla queda por linea, el backend devuelve la decision a la UI y existe prueba de regresion con pagos parciales y envio confirmado.
