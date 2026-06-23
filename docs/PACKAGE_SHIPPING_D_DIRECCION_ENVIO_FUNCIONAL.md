# PACKAGE-SHIPPING-D Direccion y envio funcional

Fecha: 2026-06-22

## Problema detectado

En `/customer-package-detail?id=1`, la seccion `Direccion y envio` podia quedar bloqueada con datos parciales:

- paquete `Listo para envio`;
- costo de envio capturado;
- paqueteria y guia capturadas;
- `deliveryType` pendiente;
- fuente de direccion pendiente;
- boton `Guardar direccion y envio` deshabilitado.

Esto impedia completar la prueba operativa de envio aun cuando el paquete todavia no estaba enviado, entregado, cerrado ni cancelado.

## Causa raiz

El frontend usaba la misma regla de edicion general del paquete para el formulario logistico. Esa regla solo permitia editar paquetes `OPEN`, por lo que un paquete `READY` dejaba deshabilitados tipo de entrega, direccion, costo, guia y guardado.

El backend tenia la misma restriccion en `PATCH /api/customer-packages/{packageId}/shipping`: rechazaba cualquier paquete que no estuviera `OPEN`. El resultado era doble bloqueo: UI deshabilitada y backend incompatible con completar logistica despues de marcar listo.

Adicionalmente, los selectores de tipo de entrega podian verse como botones disponibles sin explicar por que estaban bloqueados.

## Regla corregida

Un paquete puede completar datos logisticos mientras este en:

- `OPEN`;
- `READY`.

Se bloquea la edicion logistica en estados no editables:

- enviado;
- entregado;
- cerrado;
- cancelado;
- equivalentes futuros no preparables.

La regla no permite cambiar pagos ni liberar paquetes con saldo pendiente; solo permite completar tipo de entrega, direccion, costo, paqueteria, guia y notas antes del despacho real.

## UX funcional

La seccion mantiene el flujo por pasos:

1. Tipo de entrega.
2. Direccion o recoleccion.
3. Costo, guia y paqueteria.
4. Guardar direccion y envio.

Los tipos de entrega ahora pueden seleccionarse en paquetes `READY` no enviados. Cuando una accion esta bloqueada, el usuario ve la razon:

- falta permiso;
- paquete no editable para envio;
- cliente sin direccion principal;
- sin direcciones guardadas;
- campos requeridos pendientes.

El boton `Guardar direccion y envio` ya no queda deshabilitado sin contexto; usa la misma regla de edicion logistica y conserva los datos parciales existentes como costo, paqueteria y guia.

## Compatibilidad con datos parciales

Si un paquete ya tiene costo, guia o paqueteria pero no tiene tipo de entrega, la UI no borra esos datos. El usuario puede seleccionar el tipo correcto, completar direccion si aplica y guardar.

Ejemplo de caso heredado:

- costo: `$190.00 MXN`;
- paqueteria: `Local`;
- guia: `478521678`;
- tipo: pendiente.

La correccion permite completar `Entrega local` o el tipo correcto sin perder costo ni guia.

## Backend

Se ajusto `CustomerPackageService` para aceptar actualizacion de shipping en paquetes `OPEN` y `READY`.

Los metodos afectados conservan validaciones de:

- permiso;
- tenant/company/branch;
- costo no negativo;
- direccion obligatoria cuando el tipo la requiere;
- modalidad sin costo, por cobrar o guia del cliente;
- recalculo de totales.

## Validaciones

- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: OK.
- `./mvnw.cmd test`: OK cargando `.env` local en memoria sin imprimir secretos. El primer intento sin `.env` fallo por MySQL local sin password (`using password: NO`).
- `npm run lint`: OK, 0 errores y warnings historicos del proyecto.
- `npx tsc --noEmit`: OK.
- `git diff --check`: OK.

## Fuera de alcance

- integracion real con paqueterias;
- mapas;
- cotizacion automatica;
- facturacion;
- migraciones nuevas;
- cambio de reglas de pagos.
