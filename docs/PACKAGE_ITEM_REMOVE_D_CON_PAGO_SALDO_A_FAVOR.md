# PACKAGE-ITEM-REMOVE-D - Quitar prenda con pago y saldo a favor

Fecha: 2026-06-22

## Decision de negocio

Se permite quitar una prenda del paquete aunque tenga abono aplicado, siempre que el paquete siga editable y el usuario confirme la advertencia.

El dinero no se pierde ni se borra: el monto pagado asociado a la linea se registra como saldo a favor del cliente.

## Modelo usado

No se crea tabla nueva.

Se reutiliza:

- `payment_allocations` para conocer el pago aplicado a la linea;
- `customer_balance_movements` para registrar saldo a favor;
- tipo de movimiento `REFUND_STORE_CREDIT`;
- `BalanceService.registerRefundStoreCredit(...)`.

`paidAmount` por linea es un calculo derivado desde las asignaciones reales de pago:

- si la linea viene de apartado, se suma `payment_allocations.reservation_id`;
- si la linea viene de venta, se suma `payment_allocations.sale_id`;
- el envio usa `payment_allocations.customer_package_id` y no se toca al quitar una prenda.

## Endpoint

Se extiende el endpoint existente:

`DELETE /api/customer-packages/{packageId}/items/{packageItemId}`

Nuevo parametro:

`confirmCredit=true`

Reglas:

- si la linea no tiene pago, puede quitarse sin `confirmCredit`;
- si la linea tiene pago y `confirmCredit=false`, backend bloquea y explica el monto que iria a saldo a favor;
- si la linea tiene pago y `confirmCredit=true`, backend exige permiso de saldo y registra el saldo a favor.

## Permisos

Para quitar cualquier prenda:

- `CREATE_CLOSE_CUSTOMER_PACKAGE`

Para quitar una prenda con abono aplicado y generar saldo a favor:

- `CREATE_CLOSE_CUSTOMER_PACKAGE`
- `APPLY_CUSTOMER_BALANCE`

## Regla final sin pago

Si `paidAmount = 0`:

- se muestra confirmacion simple;
- se borra solo la relacion `customer_package_items`;
- no se genera saldo a favor;
- se recalculan subtotal, total, abonado y pendiente.

## Regla final con pago

Si `paidAmount > 0`:

- la UI muestra advertencia fuerte;
- el usuario debe confirmar `Quitar y generar saldo a favor`;
- backend registra `REFUND_STORE_CREDIT` por el monto pagado de la linea;
- se borra solo la relacion `customer_package_items`;
- los pagos historicos y sus asignaciones no se eliminan;
- se recalculan subtotal, total, abonado y pendiente del paquete;
- el saldo a favor del cliente se refresca.

## Casos bloqueados

- paquete fuera de `OPEN`;
- paquete listo para envio, enviado, entregado, cerrado o cancelado;
- linea que no pertenece al paquete;
- usuario sin `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- linea pagada con usuario sin `APPLY_CUSTOMER_BALANCE`;
- linea pagada sin `confirmCredit=true`.

## UI

En `/customer-package-detail`, el modal de quitar cambia segun la linea:

- sin pago: `Quitar prenda del paquete`;
- con pago: `Quitar prenda con abono aplicado`.

La advertencia indica que:

- la prenda saldra del paquete;
- el pago no se borrara;
- el monto pagado quedara como saldo a favor;
- el total y saldo del paquete se recalcularan.

Despues de exito:

- sin pago: `Prenda quitada del paquete correctamente.`;
- con pago: `Prenda quitada. El abono quedo como saldo a favor del cliente.`

## Tests

Se agregan o ajustan pruebas para:

- quitar linea sin pago;
- bloquear linea con pago sin confirmacion;
- quitar linea con pago y confirmacion, generando saldo a favor;
- bloquear linea pagada sin `APPLY_CUSTOMER_BALANCE`;
- bloquear paquete no editable;
- conservar envio y recalcular totales.

## Backlog

- reembolso real;
- reasignar pago a otra prenda;
- mover prenda entre paquetes;
- auditoria before/after avanzada;
- comprobante de saldo a favor.

## Validaciones

- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: OK.
- `./mvnw.cmd test` cargando `.env` local sin imprimir secretos: OK.
- `npm run lint`: OK, con 50 warnings historicos y 0 errores.
- `npx tsc --noEmit`: OK.
- `git diff --check`: OK.

## Decision

GO funcional si las validaciones finales pasan: quitar una linea pagada queda controlado por confirmacion, permiso y saldo a favor.
