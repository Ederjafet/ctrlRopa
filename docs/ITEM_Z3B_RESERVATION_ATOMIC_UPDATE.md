# ITEM-Z3B - Reserva atomica AVAILABLE -> RESERVED

Fecha: 2026-06-09
Rama: `feature/item-z3b-reservation-atomic-update`
Tipo: hardening backend minimo de reservas e inventario.

## Resumen ejecutivo

ITEM-Z3B implementa una proteccion backend real contra doble reserva usando una actualizacion atomica condicional de inventario:

```sql
UPDATE items
SET status = 'RESERVED'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'AVAILABLE'
```

Si la actualizacion afecta una fila, la reserva continua. Si afecta cero filas, el backend rechaza la reserva con un mensaje claro y no crea el apartado.

## Problema

Antes de esta fase, `ReservationService.create` corria bajo `@Transactional` y validaba que la prenda estuviera `AVAILABLE`, pero la transicion real a `RESERVED` se hacia despues con `item.setStatus(...)` y `save(...)`.

Ese patron puede quedar expuesto a dos solicitudes concurrentes que lean `AVAILABLE` antes de que una guarde `RESERVED`.

## Cambio implementado

- `ItemRepository` agrega `reserveIfAvailable(...)` con `@Modifying` y JPQL condicional.
- `ReservationService.create` usa `reserveIfAvailable(...)` antes de crear la reserva.
- Si `reserveIfAvailable(...)` devuelve `0`, se lanza:
  - `La prenda ya no esta disponible para apartar`
- Si hay precio override en la solicitud, el servicio conserva el precio existente y guarda el item con `status RESERVED` despues del update atomico.
- Si la transaccion falla despues del update atomico, el rollback revierte tambien el cambio de status.

## Reglas cubiertas

- Solo una solicitud puede mover una prenda de `AVAILABLE` a `RESERVED`.
- No se crea reserva si la prenda ya no esta disponible.
- La validacion mantiene filtro por company, branch e item.
- `DO_LIVE_RESERVATION` se conserva para apartados LIVE.
- ReservationService sigue siendo el responsable de bloquear inventario al apartar.

## Pruebas agregadas

Se agrego `ReservationServiceTests` con cobertura para:

- reserva exitosa cuando el item esta `AVAILABLE`;
- rechazo cuando el item esta `RESERVED`;
- rechazo cuando el item esta `SOLD`;
- rechazo cuando el item esta `DISABLED`;
- rechazo cuando el item esta `ON_CONSIGNMENT`;
- rechazo si el update atomico afecta `0` filas;
- reserva LIVE conserva `DO_LIVE_RESERVATION` y usa update atomico;
- no se guarda reserva ni orden cuando la transicion atomica falla.

## Fuera de alcance

No se implemento:

- migracion;
- endpoints nuevos;
- permisos nuevos;
- cambios RBAC;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- venta financiera;
- persistencia backend de prenda preparada.

## Riesgos pendientes

- No se agrego idempotency key para doble submit exacto del mismo cliente.
- No se agrego constraint unico de reserva activa por item.
- No se agrego `@Version` ni locking optimista/pesimista.
- La QA visual/API con usuarios reales sigue pendiente.
- Los flujos financieros y de reversa siguen fuera de esta fase.

## Rollback

Rollback tecnico:

1. Revertir el commit de ITEM-Z3B.
2. Validar que `ReservationService.create` vuelva al comportamiento previo.
3. Ejecutar `./mvnw.cmd test`.
4. No requiere rollback Flyway porque no se creo migracion.

## QA requerido

Casos recomendados:

1. Reservar una prenda `AVAILABLE` y confirmar que queda `RESERVED`.
2. Intentar reservar una prenda ya `RESERVED` y confirmar error accionable.
3. Intentar doble submit rapido y confirmar que solo una reserva se crea.
4. Reservar desde LIVE y confirmar que `DO_LIVE_RESERVATION` sigue funcionando.
5. Confirmar que no se tocaron pagos, caja ni venta financiera.

## GO/NO-GO

Resultado esperado:

- `GO_TECNICO` si Maven, lint, TypeScript, export web y checks Git pasan.
- `PENDING_QA_VISUAL` hasta ejecutar QA visual/API con datos reales.
