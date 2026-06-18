# ITEM-Z6A - Handoff tecnico de cancelacion y liberacion segura de apartados

Fecha: 2026-06-09
Rama: `feature/item-z6a-reservation-release-handoff`
Tipo: handoff tecnico/documental, sin implementacion funcional.

## Resumen ejecutivo

ITEM-Z6A audita el flujo real de cancelacion/liberacion de reservas despues de las protecciones de inventario agregadas en ITEM-Z3B, ITEM-Z5B, ITEM-Z5C y ITEM-Z5D.

El hallazgo principal es que `ReservationService.cancel(...)` ya cancela una reserva `ACTIVE` y libera el item con `item.setStatus(ItemStatus.AVAILABLE)`, pero esa liberacion todavia no valida de forma backend si la reserva tiene pagos activos, si fue convertida a venta, ni usa una transicion atomica `RESERVED -> AVAILABLE`.

Esta fase no cambia codigo. La recomendacion para ITEM-Z6B es endurecer la cancelacion existente antes de permitir liberaciones operativas amplias, especialmente desde LIVE.

## Estado actual real

### Creacion de reserva

- `ReservationService.create(...)` valida tenant/branch, item, cliente, canal y permisos.
- Para reserva LIVE exige `DO_LIVE_RESERVATION` sobre canal `LIVE`.
- La disponibilidad real del item se protege con `ItemRepository.reserveIfAvailable(...)`.
- La transicion de inventario de creacion es atomica:

```text
AVAILABLE -> RESERVED
```

- Si el update atomico afecta `0` filas, no se crea reserva y se registra rechazo operativo.
- La reserva creada queda con `ReservationStatus.ACTIVE`.
- Si la reserva viene de LIVE, queda con `LiveReservationOperationalStatus.RESERVED`.

### Estados de reserva

El enum real `ReservationStatus` contiene:

| Estado | Significado operativo |
|---|---|
| `ACTIVE` | Reserva/apartado vigente. Bloquea el unique de reserva activa por item. |
| `CANCELLED` | Historico cancelado. No debe bloquear nuevas reservas. |
| `CONVERTED_TO_SALE` | Historico convertido a venta. No debe cancelarse como reserva normal. |

El status que cuenta como reserva activa para el constraint de ITEM-Z5C es solo `ACTIVE`.

### Cancelacion actual

El endpoint existente es:

```text
PATCH /api/reservations/{reservationId}/cancel
```

El servicio actual:

1. Exige `CANCEL_RESERVATION`.
2. Carga la reserva con validacion tenant/branch.
3. Rechaza si la reserva no esta `ACTIVE`.
4. Cambia la reserva a `CANCELLED`.
5. Guarda `cancelledAt`, `cancelReason` y `cancelledByUserId`.
6. Si es reserva LIVE, cambia `liveOperationalStatus` a `CANCELLED` y registra `LIVE_RESERVATION_STATUS_CHANGED` / `LIVE_RESERVATION_CANCELLED`.
7. Cambia el item asociado a `ItemStatus.AVAILABLE`.
8. Guarda item y reserva.

Brecha detectada: la liberacion de item es directa, no atomica y no valida pagos activos vinculados a la reserva antes de liberar.

### Conversion a venta

`SaleService.create(...)` permite crear venta sobre item `AVAILABLE` o `RESERVED` si la reserva activa corresponde al mismo cliente, branch e item.

Cuando existe reserva activa:

- migra `PaymentAllocation.reservationId` hacia `saleId`;
- marca la reserva como `CONVERTED_TO_SALE`;
- guarda la venta;
- sincroniza estado de pago de venta;
- mantiene el item en `RESERVED` si la venta no esta pagada y lo pasa a `SOLD` cuando queda pagada.

Una reserva `CONVERTED_TO_SALE` ya no deberia entrar por cancelacion normal de reservas.

### Pagos y saldos ligados a reserva

El modelo real de pago es:

- `Payment` guarda pago recibido y estado `ACTIVE` o `VOIDED`.
- `PaymentAllocation` vincula un pago a `reservationId` o `saleId`.
- `PaymentService.findByReservation(...)` obtiene pagos desde `PaymentAllocation.reservationId`.
- `PaymentService.create(...)` permite pagar una reserva `ACTIVE`.
- `CustomerOrderService` calcula pagos activos de reserva leyendo `PaymentAllocation` y `PaymentStatus.ACTIVE`.

Brecha detectada: `ReservationService.cancel(...)` no consulta `PaymentAllocationRepository` ni `PaymentRepository` para bloquear cancelaciones con pago activo.

### Reserva LIVE

LIVE usa el mismo `ReservationService.create(...)` para crear apartados. Adicionalmente tiene estado operativo:

| Estado operativo LIVE | Efecto actual |
|---|---|
| `RESERVED` | Apartado operativo en seguimiento. |
| `OPERATIONAL_SOLD` | Cierre operativo LIVE; no es venta financiera, pago ni caja. |
| `CANCELLED` | Cancelacion operativa LIVE; por `updateLiveOperationalStatus` no libera inventario real. |

La UI LIVE ya intenta bloquear acciones sensibles si no puede ver pagos o si detecta pago registrado. Eso es una proteccion UX, no una garantia backend.

### Trazabilidad existente

- `live_events` registra eventos operativos de LIVE cuando cambia estado operativo de reserva.
- `reservation_rejection_events` registra rechazos de creacion de reserva.
- `system_movement_audit_log` existe para auditoria general de movimiento/interceptor.
- No se encontro una traza dedicada para liberacion/cancelacion segura de reserva normal.
- No hay evento especifico para intento de cancelacion bloqueado por pago.

## Riesgos detectados

| Riesgo | Severidad | Observacion |
|---|---|---|
| Liberar item con pago activo | Critico | Puede dejar dinero aplicado a un apartado cancelado y prenda disponible. |
| Liberar item convertido a venta | Critico | `CONVERTED_TO_SALE` debe tratarse por flujo de venta/reversa, no reserva normal. |
| Dejar item `RESERVED` sin reserva `ACTIVE` | Alto | Si cancelacion falla parcialmente o se bloquea liberacion sin regla clara. |
| Dejar reserva `ACTIVE` con item `AVAILABLE` | Critico | Permite nueva reserva y conserva apartado activo previo. |
| Cancelar dos veces | Medio/Alto | Hoy se rechaza por status no `ACTIVE`, pero falta trazabilidad de intento. |
| Cancelar una reserva con status operativo `OPERATIONAL_SOLD` | Alto | Puede representar cierre operativo LIVE; requiere regla explicita. |
| Inconsistencia por LIVE | Alto | `liveOperationalStatus=CANCELLED` via UI no necesariamente equivale a `ReservationStatus.CANCELLED`. |
| Perdida de trazabilidad | Alto | Falta evento especifico para liberacion o bloqueo de cancelacion. |
| Conflicto con idempotencia | Medio | La idempotencia aplica a creacion; cancelacion debe definir su propia estrategia si hay reintentos. |
| Conflicto con constraint de reserva activa | Alto | Al pasar `ACTIVE -> CANCELLED`, el unique deja de bloquear y podria permitir nueva reserva aun si el item no se libero correctamente. |
| Tenant/branch isolation | Critico | Toda liberacion debe filtrar por company/branch/item como la creacion. |

## Reglas recomendadas

### Reserva `ACTIVE` sin pago ni venta

Puede cancelarse si:

- reserva esta `ACTIVE`;
- item asociado esta `RESERVED`;
- no hay pagos `ACTIVE` aplicados a la reserva;
- no existe venta activa asociada al item/reserva;
- usuario tiene permiso actual requerido;
- branch/company coinciden con tenant activo.

Resultado esperado:

- reserva pasa a `CANCELLED`;
- item pasa de `RESERVED` a `AVAILABLE`;
- se registra motivo, usuario y evento operativo.

### Reserva `ACTIVE` con pago o saldo aplicado

No debe liberar directo.

Regla recomendada:

- bloquear cancelacion normal;
- responder con error de negocio claro;
- pedir flujo sensible posterior de reversa/autorizacion;
- no anular pagos;
- no tocar caja;
- no mover saldo;
- registrar intento bloqueado.

Mensaje sugerido:

```text
Este apartado tiene pago registrado. Para cancelar o liberar la prenda se requiere un flujo formal de reversa.
```

### Reserva `CONVERTED_TO_SALE`

No debe cancelarse como reserva normal.

Regla recomendada:

- bloquear `ReservationService.cancel(...)`;
- dirigir a flujo de venta/cancelacion financiera si se aprueba en fase futura;
- no liberar item desde reserva.

### Reserva `CANCELLED`

No debe liberar de nuevo.

Regla recomendada:

- responder idempotente/seguro o error claro, segun decision de API;
- no tocar item;
- registrar intento si aplica.

### Item asociado no esta `RESERVED`

La cancelacion debe revisar el item.

Si item ya no esta `RESERVED`:

- no cambiar inventario silenciosamente;
- responder error claro;
- registrar evidencia para soporte;
- requerir revision administrativa si hay inconsistencia.

### Cancelacion transaccional

La cancelacion debe ejecutarse en una sola transaccion:

1. validar reserva;
2. validar pagos/ventas;
3. cambiar reserva `ACTIVE -> CANCELLED`;
4. liberar item con update condicional `RESERVED -> AVAILABLE`;
5. registrar evento/traza;
6. refrescar pedido/estado asociado si aplica.

Si cualquier paso falla, no debe quedar reserva cancelada con item sin liberar ni item liberado con reserva activa.

## Opciones tecnicas evaluadas

### Opcion 1 - Mantener cancelacion actual

Ventaja:

- no requiere cambios.

Riesgo:

- conserva brecha de pagos y liberacion no atomica.

Decision:

- no recomendada para operar cancelaciones reales con pagos o LIVE.

### Opcion 2 - Endurecer `ReservationService.cancel(...)`

Ventaja:

- usa endpoint existente;
- menor cambio de contrato frontend;
- centraliza reserva normal y LIVE si comparten cancelacion real.

Cambios esperados:

- inyectar `PaymentAllocationRepository` y `PaymentRepository`;
- calcular monto activo aplicado a reservation;
- bloquear si pago activo > 0;
- bloquear `CONVERTED_TO_SALE` o status no `ACTIVE`;
- agregar update condicional `releaseIfReserved(...)`.

Decision:

- recomendada para ITEM-Z6B como MVP.

### Opcion 3 - Crear endpoint futuro de liberacion segura

Ejemplo:

```text
POST /api/reservations/{reservationId}/release
```

Ventaja:

- separa cancelacion administrativa de liberacion de inventario.

Riesgo:

- crea contrato nuevo y requiere UI/API QA adicional.

Decision:

- considerar solo si negocio quiere distinguir "cancelar apartado" de "liberar prenda" formalmente.

### Opcion 4 - Update condicional `RESERVED -> AVAILABLE`

Recomendacion tecnica para ITEM-Z6B:

```text
UPDATE items
SET status = 'AVAILABLE'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'RESERVED'
```

Si afecta `1` fila:

- continuar cancelacion.

Si afecta `0` filas:

- rechazar por inconsistencia de inventario;
- no marcar reserva cancelada;
- registrar evento/diagnostico.

Ventaja:

- simetrico con `reserveIfAvailable(...)`;
- evita liberar item que ya cambio de estado.

### Opcion 5 - Evento de cancelacion/liberacion

Opciones:

- ampliar `live_events` solo para reservas LIVE;
- crear evento operativo de reserva normal;
- usar auditoria general si el patron ya cubre mutaciones;
- crear tabla futura `reservation_release_events` si se requiere consulta operativa.

Recomendacion:

- para Z6B, registrar al menos evento LIVE cuando aplique y documentar si la traza general cubre la mutacion;
- si se necesita trazabilidad normal consultable, proponer tabla/evento especifico en una subfase posterior.

## Recomendacion para ITEM-Z6B

### Alcance minimo

Implementar cancelacion segura en backend:

- mantener endpoint actual `PATCH /api/reservations/{id}/cancel`;
- conservar permiso `CANCEL_RESERVATION`;
- validar tenant/branch;
- permitir solo `ReservationStatus.ACTIVE`;
- bloquear si hay pagos `ACTIVE` aplicados a la reserva;
- bloquear si existe conversion/venta asociada o status no activo;
- liberar item con update atomico `RESERVED -> AVAILABLE`;
- no tocar pagos;
- no tocar caja;
- no tocar precio LIVE;
- no tocar devoluciones;
- no tocar autorizaciones;
- no crear permisos;
- no cambiar venta financiera.

### Archivos probables a tocar

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentAllocationRepository.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- documentacion/evidencia de ITEM-Z6B.

### Migracion

Objetivo esperado: sin migracion.

Solo considerar migracion si se aprueba una tabla nueva de eventos de liberacion/cancelacion o si se requiere indice para consulta de pagos por reserva. No crearla sin aprobacion explicita.

### Tests necesarios

Backend:

- cancela reserva `ACTIVE` sin pago y libera item `RESERVED -> AVAILABLE`;
- bloquea reserva con pago `ACTIVE`;
- ignora pagos `VOIDED` al decidir si puede cancelar;
- bloquea reserva `CONVERTED_TO_SALE`;
- bloquea reserva `CANCELLED`;
- bloquea si item no esta `RESERVED`;
- si update `RESERVED -> AVAILABLE` afecta `0` filas, no cancela reserva;
- reserva LIVE cancelada registra estado/evento operativo conforme a regla vigente;
- conserva `DO_LIVE_RESERVATION` y `CANCEL_RESERVATION`;
- conserva idempotencia de creacion;
- conserva constraint de reserva activa por item.

Frontend/API:

- si backend devuelve bloqueo por pago, UI muestra mensaje accionable;
- LIVE no permite cancelacion silenciosa cuando no puede confirmar pago;
- no se declara QA_PASS sin smoke real.

### Mensajes de error sugeridos

```text
Solo se pueden cancelar reservas activas.
```

```text
Este apartado tiene pago registrado. Para cancelar o liberar la prenda se requiere un flujo formal de reversa.
```

```text
La prenda ya no esta en estado reservado y no puede liberarse automaticamente.
```

```text
La reserva ya fue convertida a venta y no puede cancelarse como apartado.
```

### Rollback

Rollback tecnico de Z6B:

1. Revertir cambios de `ReservationService` y `ItemRepository`.
2. Revertir pruebas/documentacion de Z6B.
3. Si se agrego migracion de evento, coordinar rollback DBA o conservar tabla inerte.
4. Ejecutar `./mvnw.cmd test`.
5. Validar reserva normal y LIVE en QA.

### Criterios GO/NO-GO para Z6B

GO si:

- tests backend pasan;
- lint/typecheck/export frontend pasan;
- no hay cambios en pagos/caja/precio/devoluciones/autorizaciones/RBAC;
- cancelacion con pago queda bloqueada por backend;
- liberacion usa update condicional `RESERVED -> AVAILABLE`;
- error de negocio es claro;
- no hay liberacion silenciosa.

NO-GO si:

- no se puede detectar pago activo de reserva;
- se requiere tocar pagos/caja para cancelar;
- se requiere crear autorizacion formal no aprobada;
- el release puede dejar reserva e item desincronizados;
- el flujo LIVE queda ambiguo entre cancelacion operativa y cancelacion real.

## No alcance de ITEM-Z6A / Z6B MVP

- No pagos.
- No caja.
- No anulacion de pagos.
- No devoluciones.
- No precio LIVE.
- No autorizaciones supervisor/admin.
- No permisos nuevos.
- No RBAC nuevo.
- No venta financiera nueva.
- No conversion inversa de venta a reserva.

## QA requerido para Z6B

Casos minimos:

| ID | Caso | Resultado esperado |
|---|---|---|
| Z6B-01 | Cancelar reserva ACTIVE sin pago | Reserva queda CANCELLED e item vuelve AVAILABLE. |
| Z6B-02 | Cancelar reserva ACTIVE con pago ACTIVE | Backend bloquea; no cambia reserva ni item. |
| Z6B-03 | Cancelar reserva con pago VOIDED solamente | Si no hay pago activo, puede cancelar segun regla aprobada. |
| Z6B-04 | Cancelar reserva CONVERTED_TO_SALE | Bloqueada; no toca item. |
| Z6B-05 | Cancelar reserva CANCELLED | Bloqueada/idempotente segura; no toca item. |
| Z6B-06 | Item no esta RESERVED al cancelar | Bloquea por inconsistencia; no cambia reserva. |
| Z6B-07 | Reserva LIVE sin pago | Cancela conforme al contrato y registra evento operativo. |
| Z6B-08 | Reserva LIVE con pago | Bloquea liberacion y muestra mensaje claro. |
| Z6B-09 | Reintento/doble click cancelacion | No libera dos veces ni deja estado inconsistente. |
| Z6B-10 | Tenant/branch ajeno | 403/errores existentes; no fuga datos. |

## Resultado de ITEM-Z6A

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z6B`
