# RESERVATIONS-SHIPPED-A Ocultar apartados enviados de activos

Fecha: 2026-06-22

## Problema detectado

La bandeja `/reservations` mostraba apartados que ya estaban dentro de un paquete enviado o entregado. Operativamente eso dejaba prendas ya despachadas junto a apartados vivos, con acciones como crear paquete o agregar a paquete todavia visibles.

## Causa raiz

El listado de apartados no tenia un estado operativo derivado desde paquete/envio. El frontend cargaba reservas activas por `reservation.status`, pero no recibia ni aplicaba de forma consistente el estado del paquete o del envio asociado.

Ademas, el mapa de paquetes de la pantalla trataba `SHIPPED` como estado activo y podia omitir estados finales, haciendo que algunas reservas historicas parecieran apartados sin paquete.

## Regla final de apartado activo

Un apartado aparece en la vista activa si:

- la reserva sigue en estado `ACTIVE`;
- no esta en un paquete enviado, entregado o cancelado;
- no tiene envio en ruta, entregado, cerrado con incidencias o cancelado;
- todavia puede requerir accion operativa.

Se consideran activos:

- reservas sin paquete;
- reservas en paquete `OPEN`;
- reservas en paquete `READY`.

`READY` se mantiene activo porque el paquete esta listo para envio, pero todavia no salio ni fue entregado.

## Regla final de historial

Un apartado pasa a historial cuando:

- su paquete esta `SHIPPED`, `DELIVERED` o `CANCELLED`;
- o su envio esta `OUT_FOR_DELIVERY`, `DELIVERED`, `CLOSED_WITH_INCIDENTS` o `CANCELLED`;
- o la reserva ya no esta en estado activo.

El historial no borra informacion. Solo cambia el scope de consulta y las acciones disponibles.

## Backend

`GET /api/reservations/branch/{branchId}` ahora acepta:

- `scope=active`, default;
- `scope=history`;
- `scope=all`.

El DTO de reserva incluye campos derivados:

- `customerPackageId`;
- `customerPackageFolio`;
- `customerPackageStatus`;
- `shipmentId`;
- `shipmentFolio`;
- `shipmentStatus`;
- `operationalStatus`;
- `operationalStatusLabel`;
- `activeReservation`;
- `historicalReservation`.

El backend conserva tenant/branch isolation con la validacion existente de sucursal.

## Frontend

`/reservations` carga `scope=all` para poder construir las pestanas de activos e historial con la misma regla del backend.

La vista default es `Activos`.

Filtros operativos:

- Activos;
- Sin paquete;
- En paquete;
- Listas para envio;
- Enviadas / historial;
- Todos.

En historial se conservan acciones de consulta:

- Ver detalle;
- Ver paquete;
- Ver envio, si existe.

No se muestran acciones operativas de apartado vivo para reservas historicas.

## Item status

No se cambia el estado fisico de la prenda en esta fase. La visibilidad se deriva del paquete/envio para no romper inventario ni reglas financieras existentes.

Backlog:

- estado explicito `FULFILLED` o equivalente para reservas;
- transicion controlada de prenda a `SOLD`/`DELIVERED`;
- timeline consolidado del cliente;
- historial unificado de pedidos.

## Validaciones

- `ReservationServiceTests`: agrega cobertura de activos, historial y all.
- `npm run lint`: OK con warnings historicos.
- `npx tsc --noEmit`: OK.
- `git diff --check`: pendiente de validacion final.
- `./mvnw.cmd test`: requiere base local disponible; en esta corrida fallo por credenciales MySQL de `ControlRopaApplicationTests`.
