# ITEM-Z5C - Constraint de reserva activa por item

Fecha: 2026-06-09
Rama: `feature/item-z5c-active-reservation-constraint`
Tipo: migracion minima, backend defensivo, pruebas, documentacion y evidencia.

## Resumen ejecutivo

ITEM-Z5C agrega una proteccion estructural para impedir multiples reservas activas sobre el mismo item. La proteccion complementa:

- ITEM-Z3B: update atomico `AVAILABLE -> RESERVED`;
- ITEM-Z5B: idempotencia por `X-Idempotency-Key`.

Esta fase no toca pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints nuevos ni venta financiera.

## Estado previo validado

Hallazgos confirmados:

- La tabla real es `reservations`.
- `reservations` contiene `item_id`, `branch_id` y `status`.
- `reservations` no contiene `company_id`; el scope de company se deriva por `branch_id`/item.
- `ReservationStatus` real contiene:
  - `ACTIVE`;
  - `CANCELLED`;
  - `CONVERTED_TO_SALE`.
- El unico status que cuenta como reserva activa para esta fase es `ACTIVE`.
- `CANCELLED` y `CONVERTED_TO_SALE` son historicos/no activos y no deben bloquear nuevas reservas futuras del mismo item.
- `ReservationService.create` sigue usando `ItemRepository.reserveIfAvailable(...)`.
- ITEM-Z5B sigue usando `X-Idempotency-Key` opcional.

## Problema

El servicio ya valida `findByItemIdAndStatus(itemId, ACTIVE)` y el item cambia de `AVAILABLE` a `RESERVED` de forma atomica. Aun asi, sin proteccion estructural, una ruta futura, un bug o una carrera no prevista podria insertar mas de una reserva `ACTIVE` para el mismo item.

## Diseno elegido

MySQL 5.7 no soporta indices parciales simples tipo:

```sql
CREATE UNIQUE INDEX ... WHERE status = 'ACTIVE'
```

Por eso se usa una columna generada nullable:

```sql
active_reservation_item_id =
  CASE WHEN status = 'ACTIVE' THEN item_id ELSE NULL END
```

Luego se crea un indice unico:

```sql
UNIQUE KEY uq_reservations_active_item (
  branch_id,
  active_reservation_item_id
)
```

Efecto:

- Si la reserva esta `ACTIVE`, `active_reservation_item_id = item_id` y el unique bloquea otra activa del mismo item en la misma sucursal.
- Si la reserva esta `CANCELLED` o `CONVERTED_TO_SALE`, `active_reservation_item_id = NULL`.
- MySQL permite multiples `NULL` en un unique, por lo que no bloquea historicos.

## Migracion

Migracion creada:

```text
V53__active_reservation_item_constraint.sql
```

La migracion:

1. Agrega `active_reservation_item_id` como columna generada `STORED` si no existe.
2. Agrega `uq_reservations_active_item` si no existe.
3. No borra datos.
4. No modifica reservas existentes.
5. No cambia statuses.

## Prevalidacion legacy

Antes de aplicar en ambientes con datos legacy, ejecutar:

```sql
SELECT branch_id, item_id, COUNT(*) AS active_count
FROM reservations
WHERE status = 'ACTIVE'
GROUP BY branch_id, item_id
HAVING COUNT(*) > 1;
```

Si devuelve filas, no se debe borrar nada automaticamente. Hay que resolver esas duplicidades con decision operativa antes de aplicar la migracion.

## Backend

`ReservationService.create` ahora guarda la reserva con `saveAndFlush(...)` para detectar una posible violacion del unique dentro del flujo transaccional.

Si la excepcion corresponde a `uq_reservations_active_item`, se traduce a:

```text
El item ya tiene una reserva activa
```

Otros errores de integridad se relanzan sin enmascararlos.

## Relacion con idempotencia ITEM-Z5B

ITEM-Z5B se conserva:

- sin `X-Idempotency-Key`, el flujo legacy sigue funcionando;
- con la misma key y mismo payload, se devuelve la reserva existente;
- con misma key y payload distinto, se rechaza;
- V53 no cambia la tabla `reservation_idempotency_keys`.

## Tests

Se agrego/ajusto cobertura para:

- reserva exitosa con `saveAndFlush`;
- flujo sin idempotency key;
- flujo con idempotency key;
- flujo LIVE con `DO_LIVE_RESERVATION`;
- traduccion de violacion `uq_reservations_active_item` a error de negocio;
- conservacion del update atomico `AVAILABLE -> RESERVED`.

La migracion fue validada por Flyway durante `./mvnw.cmd test` en MySQL 5.7 local.

## No alcance

No se implementa:

- auditoria de intentos rechazados;
- limpieza TTL de idempotency keys;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- nuevos permisos;
- cambios RBAC;
- endpoints nuevos;
- venta financiera.

## Rollback

Rollback tecnico sugerido:

1. Revertir commit de ITEM-Z5C.
2. En ambientes donde V53 ya fue aplicada, planear rollback DBA controlado:
   - retirar unique `uq_reservations_active_item`;
   - retirar columna generada `active_reservation_item_id` si se decide volver completamente.
3. Validar que ITEM-Z3B e ITEM-Z5B sigan activos.
4. Ejecutar `./mvnw.cmd test` y smoke de reserva normal/LIVE.

## Riesgos pendientes

- Ambientes con duplicados `ACTIVE` legacy deben resolverse antes de aplicar V53.
- No existe aun auditoria especifica de intentos rechazados.
- No existe limpieza automatica de llaves de idempotencia expiradas.
- Falta QA visual/API real con usuarios operativos.

## GO/NO-GO

GO tecnico condicionado a:

- Maven test PASS;
- lint PASS;
- TypeScript PASS;
- expo export PASS;
- `git diff --check` PASS;
- no cambios fuera de alcance.

Resultado QA visual/API real queda `PENDING_QA_VISUAL` si no hay navegador o smoke autenticado.
