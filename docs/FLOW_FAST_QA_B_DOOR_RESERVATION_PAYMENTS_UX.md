# FLOW-FAST-QA-B Prendas multiples y Pagos

## Resumen

Se corrigio el flujo de `Nuevo apartado` para conservar varias prendas rapidas en el mismo apartado de mostrador y se rediseño `/payments` como una pantalla financiera mas clara, con resumen, filtros, listado responsivo y permisos visibles.

## Problema de prendas rapidas

En `/door-reservation?customerId=5`, al crear una prenda rapida, volver al apartado y crear otra, la pantalla podia conservar solo la ultima prenda. La prenda anterior quedaba creada en inventario, pero se perdia del flujo visual en curso.

## Causa encontrada

`/door-reservation` ya usaba un carrito/lista local, pero esa lista vivia solo en estado React. Al navegar a `/items-create` y volver con `router.replace(returnRoute)`, la pantalla podia remontarse y perder el carrito previo. El mecanismo `pendingQuickItems` solo regresaba los IDs nuevos, por eso la ultima alta reemplazaba de facto al borrador anterior.

## Correccion aplicada

Se agrego un borrador local para `Nuevo apartado`:

- guarda `customerId`;
- guarda `paymentMethodId`;
- guarda `advanceText`;
- guarda lineas `{ itemId, priceText }`;
- restaura el borrador al cargar `/door-reservation`;
- fusiona prendas nuevas por ID para evitar duplicados;
- se limpia al confirmar correctamente el apartado.

El estado de prendas sigue siendo lista (`cart`), pero ahora sobrevive al salto a alta rapida.

## Quitar una prenda

Al quitar una prenda, se elimina solo esa linea del carrito y se actualiza el borrador local. Las demas prendas se conservan.

## Pagos

`/payments` se reordeno como pantalla de Finanzas:

- encabezado compacto `FINANZAS / Pagos`;
- badges de permisos (`VIEW_PAYMENTS`, solo consulta o registro de abonos);
- tarjetas resumen con pendientes filtrados, saldo pendiente, pagos en contexto y abonado visible;
- filtros por busqueda, estado y metodo de pago;
- listado de pendientes por cobrar;
- detalle contextual cuando se selecciona pedido o apartado;
- historial de pagos como tabla compacta en desktop y cards en mobile;
- estado vacio claro cuando no hay datos con filtros.

## Permisos

- Ver `/payments`: `VIEW_PAYMENTS`.
- Registrar abonos: `REGISTER_PAYMENTS`.
- Aplicar saldo a favor sigue deshabilitado desde esta pantalla hasta contar con flujo trazable de aplicacion.

## Limitacion actual

No existe en esta fase un endpoint global de todos los pagos por sucursal. Por eso la bandeja muestra:

- pedidos pendientes de cobro por sucursal;
- pagos del pedido/apartado seleccionado;
- resumen basado en datos disponibles.

Backlog recomendado: endpoint global de consulta financiera con filtros por fecha, cliente, metodo, estado y origen.

## Validaciones

Validaciones tecnicas al cierre:

- `git --no-pager diff --check`
- `npm run lint`
- `npx tsc --noEmit`

Backend no fue tocado.

## Smoke QA recomendado

1. Entrar a `/door-reservation?customerId=5`.
2. Confirmar cliente preseleccionado.
3. Crear prenda rapida A.
4. Confirmar que A aparece en la lista.
5. Crear prenda rapida B.
6. Confirmar que A y B aparecen juntas.
7. Quitar B y confirmar que A permanece.
8. Confirmar apartado.
9. Entrar a `/payments` con `VIEW_PAYMENTS`.
10. Confirmar resumen, filtros, pendientes y listado responsivo.
11. Entrar directo a `/payments` sin permiso y confirmar acceso restringido.
12. Confirmar que `Actualizar` sigue solo en LIVE.

## Riesgos pendientes

- Consulta global de pagos requiere endpoint especifico para no depender de pedidos pendientes o contexto.
- Aplicacion de saldo a favor desde `/payments` queda pendiente hasta implementar confirmacion y trazabilidad completa.
