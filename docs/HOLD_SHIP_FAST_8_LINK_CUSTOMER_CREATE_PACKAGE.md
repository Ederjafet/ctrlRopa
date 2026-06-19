# HOLD-SHIP-FAST-8 - Vincular cliente y crear paquetes desde apartados

## Resumen ejecutivo

HOLD-SHIP-FAST-8 convierte dos acciones preparadas en flujo funcional dentro de `/reservations`: vincular un apartado con alias/interesado a un cliente formal existente y crear un paquete desde apartados activos de ese cliente. El objetivo operativo queda alineado a:

`Apartado -> Cliente formal / interesado -> Paquete -> Caja -> Pago -> Envio`

## Regla final del flujo

- Un apartado puede nacer con cliente formal.
- Un apartado puede nacer con alias/interesado.
- Un apartado con alias/interesado debe vincularse a cliente formal antes de paquete.
- Un paquete solo puede crearse con cliente formal.
- No se crean clientes falsos automaticamente.
- El envio debe liberarse desde paquete valido, pagado y con datos suficientes.

## Vincular cliente

`/reservations` ahora muestra `Vincular cliente` como accion principal para apartados con `interestedAlias` y sin `customerId`. La accion abre un modal con:

- alias/interesado actual;
- busqueda de clientes formales existentes de la sucursal;
- resultados reales de `/api/customers/branch/{branchId}`;
- boton confirmar deshabilitado hasta seleccionar cliente real.

Al confirmar se usa el endpoint existente:

`PATCH /api/reservations/{reservationId}/customer`

Request:

```json
{
  "customerId": 123
}
```

El backend conserva `interestedAlias` como referencia historica, pero los read-models y la UI priorizan el cliente formal cuando `customerId` existe.

## Alias no es cliente fake

El alias se usa como texto inicial de busqueda, pero no se inserta ni se muestra como cliente si no existe en la base. Esta fase no crea cliente nuevo ni convierte automaticamente alias a cliente formal.

## Crear paquete

`Crear paquete` queda disponible solo si el apartado tiene cliente formal, esta activo y el usuario tiene `CREATE_CLOSE_CUSTOMER_PACKAGE`. La accion abre un modal que:

- preselecciona el apartado de origen;
- lista apartados activos del mismo cliente formal;
- excluye apartados con alias sin cliente;
- consulta paquetes activos del cliente para excluir reservas ya incluidas;
- calcula prendas seleccionadas y subtotal desde precios de reserva;
- crea paquete y agrega reservas seleccionadas.

Endpoint base usado:

`POST /api/customer-packages/from-reservation/{reservationId}`

Para reservas adicionales se usa:

`POST /api/customer-packages/{packageId}/items`

## Backend ajustado

Se reutilizo el modelo existente `customer_packages` / `customer_package_items`. No se crearon migraciones ni tablas. Se ajusto `CustomerPackageService` para permitir crear paquete desde reserva activa con cliente formal aunque todavia no tenga caja, porque el flujo visual aprobado coloca paquete antes de caja. Tambien se agrego validacion para impedir agregar reservas no activas a paquetes.

## Paquetes y envios

Ya existian rutas funcionales:

- `/customer-packages`
- `/customer-package-detail`
- `/shipments`
- `/shipment-detail`

Se agregaron accesos al menu lateral bajo Operacion cuando el usuario tiene permisos existentes:

- `Paquetes` con `CREATE_CLOSE_CUSTOMER_PACKAGE`;
- `Envios` con `MANAGE_SHIPMENTS`.

## Pendientes

- Costo de envio no se persiste en `customer_packages`; queda para la fase de cobro/envio.
- Convertir alias en cliente formal queda pendiente con decision explicita del usuario.
- Editar alias queda pendiente con auditoria.
- Liberar envio sigue dependiendo de paquete pagado y validaciones de shipment.
- Backend pagination para grandes volumenes queda como mejora futura.

## Validaciones

- `npm.cmd run lint`: PASS con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `git --no-pager diff --check`: PASS.
- `.\mvnw.cmd test`: primer intento bloqueado por DB local sin password cargado (`using password: NO`).
- `.\mvnw.cmd test` cargando `.env` al proceso sin imprimir secretos: PASS.

## Smoke QA recomendado

1. Crear o ubicar apartado con alias.
2. Presionar `Vincular cliente`, buscar cliente real y confirmar.
3. Confirmar que el apartado muestra `Cliente`.
4. Presionar `Crear paquete` sobre apartado con cliente formal.
5. Confirmar que el modal lista solo apartados activos del mismo cliente.
6. Confirmar que no lista alias sin cliente ni reservas ya empacadas.
7. Crear paquete y abrir detalle.
8. Confirmar que `Paquetes` y `Envios` no apuntan a rutas rotas.

## Riesgos

- Si existen paquetes activos con muchos items, el modal consulta detalles al abrir para excluir reservas ya empacadas. No afecta el listado principal y evita N+1 permanente.
- Si una reserva queda empacada entre abrir modal y confirmar, backend rechaza la duplicidad.
- El costo de envio aun no forma parte del modelo de paquete.

## Siguiente fase recomendada

HOLD-SHIP-FAST-9: cobro/abono y costo de envio sobre paquete, con validacion de saldo antes de liberar envio.
