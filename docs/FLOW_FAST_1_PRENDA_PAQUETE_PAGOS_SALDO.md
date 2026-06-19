# FLOW-FAST-1 - Flujo prenda, paquete, pagos y saldo a favor

## Resumen ejecutivo

Esta fase consolida el flujo operativo entre apartados y paquetes sin tocar `main`, sin crear clientes fake y sin permitir paquetes con alias/interesado sin cliente formal. Se reutilizaron entidades y endpoints existentes para vincular cliente, crear paquetes, agregar apartados del mismo cliente, registrar abonos al paquete por folio y consultar saldo a favor.

## Flujo final objetivo

```text
Registrar prenda
-> Disponible
-> Apartado con cliente formal o interesado
-> Vincular interesado a cliente formal, si aplica
-> Crear paquete solo con cliente formal
-> Agregar apartados del mismo cliente
-> Registrar abonos
-> Heredar abonos de apartados al paquete
-> Manejar saldo a favor del cliente
-> Preparar envio desde paquete pagado
-> Marcar enviado
```

## Alta rapida de prenda

- LIVE mantiene su alta rapida existente.
- Apartados ahora expone `Nuevo apartado`, que conduce al flujo de `Apartado puerta`; ese flujo ya incluye alta rapida de prenda antes de apartar con cliente formal.
- Paquetes muestra la accion `Alta rapida` preparada y deshabilitada: el backend actual solo permite agregar al paquete prendas con venta o apartado activo, por lo que una prenda recien creada debe convertirse primero en apartado o venta del cliente.

## Apartado puerta dentro de Apartados

`/reservations` agrega la accion `Nuevo apartado` en el encabezado. La ruta `/door-reservation` se conserva viva para no romper permisos ni navegacion existente, pero la entrada operativa principal queda dentro de Apartados.

## Cliente formal vs interesado

- Un apartado puede nacer con cliente formal o con `interestedAlias`.
- El alias no crea cliente automaticamente.
- Si el apartado tiene alias, la accion principal sigue siendo `Vincular cliente`.
- Al vincular, la UI prioriza el cliente formal y el alias deja de dominar visualmente.

## Paquetes solo con cliente formal

La creacion de paquete sigue bloqueada cuando el apartado no tiene `customerId`. El backend existente `CustomerPackageService.prepareFromReservation` valida:

- reserva activa;
- cliente formal obligatorio;
- misma sucursal/tenant;
- reserva no incluida previamente en otro paquete.

## Apartados ya incluidos en paquete

`/reservations` ahora calcula membresia de paquete al cargar:

- si un apartado ya esta en paquete activo, muestra `En paquete <folio>`;
- la accion principal cambia a `Ver paquete`;
- `Crear paquete` queda bloqueado para evitar doble pertenencia;
- el tab `En paquete` queda activo.

## Crear paquete y agregar varios apartados

El modal de crear paquete mantiene la seleccion multiple de apartados activos del mismo cliente formal. Los apartados con alias/interesado no aparecen como candidatos. El primer apartado crea el paquete y los adicionales se agregan con `POST /api/customer-packages/{id}/items`.

## Abonos antes del paquete

Los abonos a apartados siguen registrandose con `POST /api/payments` usando `reservationId`. Esos pagos quedan en `payment_allocations` ligados a la reserva.

## Herencia de abonos al paquete

No se creo nueva tabla: `CustomerPackageService` ya calcula `paidAmount` y `pendingAmount` del paquete sumando las allocations de ventas y reservas incluidas. Por eso, cuando una reserva con abono previo entra al paquete, el abono se hereda automaticamente en el resumen del paquete.

## Pagos despues del paquete

Se corrigio `POST /api/payments/package-folio/{folio}` para soportar paquetes con apartados/reservas. Antes rechazaba cualquier paquete que tuviera reservas. Ahora:

- valida paquete y sucursal activa;
- rechaza paquetes cancelados, enviados o entregados;
- distribuye el pago sobre ventas y reservas del paquete;
- crea allocations por `saleId` o `reservationId`;
- actualiza estados de pago de ventas cuando aplica;
- refresca pedidos asociados;
- manda el sobrepago a saldo a favor existente.

## Saldo a favor del cliente

El saldo a favor ya existia en `customer_balance_movements`. La fase lo integra visualmente en detalle de paquete:

- consulta `GET /api/balance/package-folio/{folio}`;
- muestra saldo a favor del cliente;
- el sobrepago del pago por paquete se registra como saldo a favor via `BalanceService.registerOverage`.

La aplicacion directa de saldo a paquete queda pendiente porque el endpoint actual aplica saldo a pedido, no a paquete. Implementarla bien requiere trazabilidad especifica paquete-saldo.

## Envio

El envio sigue partiendo desde paquete. `Cerrar preparacion` permanece bloqueado si el paquete tiene saldo pendiente. La liberacion/aplicacion de saldo y marcado enviado quedan para fase posterior de envio.

## Endpoints reutilizados o creados

Reutilizados:

- `PATCH /api/reservations/{reservationId}/customer`
- `POST /api/customer-packages/from-reservation/{reservationId}`
- `POST /api/customer-packages/{id}/items`
- `GET /api/customer-packages/customer/{customerId}`
- `GET /api/customer-packages/{id}`
- `GET /api/balance/package-folio/{folio}`
- `POST /api/payments/package-folio/{folio}`

Creados: ninguno.

## Migraciones

No se crearon migraciones. La implementacion reutiliza `payment_allocations`, `customer_packages`, `customer_package_items` y `customer_balance_movements`.

## Ciclos de revision

- Ciclo tecnico: se corrigio el endpoint de pago por paquete con reservas.
- Ciclo funcional: se bloqueo crear paquete para apartados ya incluidos en paquete y se mantuvo bloqueo para alias sin cliente.
- Ciclo UX: se agrego `Nuevo apartado`, `Ver paquete`, saldo a favor y registrar abono en paquete.
- Ciclo final: lint, TypeScript, backend tests y diff check quedan documentados en la entrega final.

## Smoke QA recomendado

1. Crear apartado con alias y confirmar que no permite paquete.
2. Vincular alias a cliente formal.
3. Crear paquete desde apartado con cliente.
4. Agregar otro apartado activo del mismo cliente.
5. Registrar abono a un apartado antes de paquete y confirmar que aparece heredado.
6. Registrar abono al paquete desde detalle.
7. Probar sobrepago y confirmar saldo a favor.
8. Confirmar que `En paquete <folio>` aparece en `/reservations`.
9. Confirmar que el paquete no puede cerrarse para envio con saldo pendiente.
10. Confirmar login, LIVE, Apartados, Paquetes y Envios sin polling nuevo.

## Riesgos

- La carga de membresia de paquetes en `/reservations` consulta paquetes por cliente; para alto volumen conviene un read-model global por sucursal.
- Aplicar saldo a favor directamente a paquete requiere endpoint/migracion auditada.
- Alta rapida directa dentro de paquete requiere crear automaticamente una venta o apartado formal del cliente; se dejo pendiente para evitar datos ambiguos.

## Siguiente fase recomendada

FLOW-FAST-2 debe enfocarse en read-model global de paquetes por sucursal, aplicacion auditada de saldo a paquete y flujo de envio pagado/listo/enviado desde paquete.
