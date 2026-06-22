# PACKAGE-ITEM-REMOVE-A - Quitar prenda de paquete sin abono aplicado

Fecha: 2026-06-22

## Problema detectado

En `/customer-package-detail?id=1` era posible agregar una prenda al paquete, pero no existia una accion visible para quitarla si se agregaba por error.

El caso observado tenia una prenda nueva con:

- precio: `$1,600.00 MXN`;
- pagado aplicado: `$0.00 MXN`;
- pendiente: `$1,600.00 MXN`.

Aunque el paquete tenia abonos aplicados a otras prendas, esa linea no tenia pago aplicado y debia poder retirarse antes de preparar el envio.

## Regla implementada

Una prenda se puede quitar del paquete si:

- la linea pertenece al paquete;
- el paquete esta en estado `OPEN`;
- la linea tiene `paidAmount = 0`;
- el usuario tiene permiso `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- el paquete no esta listo para envio, enviado, entregado o cancelado.

La accion queda bloqueada si:

- la linea ya tiene abono aplicado;
- el paquete no esta editable;
- falta permiso;
- la linea ya no pertenece al paquete.

## Backend

Se agrego endpoint:

`DELETE /api/customer-packages/{packageId}/items/{packageItemId}`

El backend valida:

- permiso `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- pertenencia del paquete al tenant mediante la busqueda existente;
- pertenencia de la linea al paquete;
- estado editable del paquete;
- pago aplicado de la linea.

Si pasa las validaciones, elimina solo la relacion `customer_package_items` y devuelve el detalle actualizado del paquete.

## Que pasa con la prenda y la reserva

La fase usa la regla mas segura:

- Si la prenda venia de un apartado, el apartado permanece activo fuera del paquete.
- Si la prenda fue agregada desde inventario libre, se conserva la reserva creada por el flujo actual.
- No se cancela el apartado automaticamente.
- No se libera inventario automaticamente.
- No se toca ningun pago.

El flujo para quitar prendas con abono aplicado queda fuera de alcance porque requiere ajuste de pago o generacion de saldo a favor.

## Frontend

En `Prendas del paquete` se agrega accion por linea:

- `Ver prenda`;
- `Quitar`.

`Quitar` aparece como accion secundaria y se deshabilita con explicacion cuando no aplica.

Antes de ejecutar se muestra confirmacion con:

- codigo o ID de la prenda;
- precio;
- pagado aplicado;
- aviso de recalculo de total y saldo;
- aclaracion de que la reserva se conserva fuera del paquete.

Despues de quitar:

- se actualiza la lista de prendas;
- se actualiza total;
- se actualiza abonado;
- se actualiza saldo pendiente;
- se conserva el estado de envio;
- se muestra `Prenda quitada del paquete correctamente.`

## Mensajes

Pago aplicado:

`No se puede quitar esta prenda porque ya tiene abono aplicado.`

Estado no editable:

`No puedes quitar prendas cuando el paquete ya esta listo para envio, enviado, cerrado o cancelado.`

Permiso:

`No tienes permiso para quitar prendas del paquete.`

No encontrada:

`La prenda ya no pertenece a este paquete.`

## Permisos

Se reutiliza `CREATE_CLOSE_CUSTOMER_PACKAGE`.

Tambien se agrego la accion `Quitar prenda del paquete` al modal `Ver permisos` de `customerPackageDetail`.

## Tests

Se agregaron pruebas unitarias para:

- quitar linea sin pago aplicado;
- recalcular total y saldo;
- bloquear linea con pago aplicado;
- bloquear paquete listo para envio;
- bloquear usuario sin permiso.

## Backlog

- Quitar prenda con abono aplicado generando saldo a favor.
- Mover prenda entre paquetes.
- Unir paquetes.
- Historial/auditoria de cambios de paquete.
- Flujo explicito para liberar inventario cuando la prenda fue agregada por error desde inventario libre.

## Validaciones

- `./mvnw.cmd test`
- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Decision

GO para correccion de paquetes antes de pago/envio: el operador puede retirar lineas sin abono aplicado y el backend bloquea los casos que requieren flujo financiero controlado.
