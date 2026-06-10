# ITEM-Z8 - Consistencia final LIVE, inventario y reservas

Fecha: 2026-06-10
Rama: `feature/item-z8-live-inventory-reservation-consistency`
Estado: `GO_TECNICO` / `PENDING_QA_API_OR_VISUAL`

## Resumen ejecutivo

ITEM-Z8 valida la consistencia final entre prenda al aire, `items.status`, reservas, estado operativo LIVE y eventos. La fase no encontro una inconsistencia funcional que requiriera ajuste de codigo; por lo tanto, se cierra como auditoria tecnica/documental con smoke no destructivo pendiente de ambiente API/visual real.

La revision confirma que:

- poner o cambiar prenda al aire solo acepta items `AVAILABLE`;
- poner una prenda al aire no cambia `items.status`;
- reservar cambia `AVAILABLE -> RESERVED` con update atomico;
- solo puede existir una reserva `ACTIVE` por item dentro de branch;
- cancelar reserva valida libera `RESERVED -> AVAILABLE` de forma condicional;
- `OPERATIONAL_SOLD` solo procede con reserva LIVE `ACTIVE` y item `RESERVED`;
- `OPERATIONAL_SOLD` no crea venta financiera, pago, caja ni cambia inventario.

## Historial validado

Se confirmaron las fases previas esperadas:

- LIVE-PERM-A1/A1B/A2/A3: permisos LIVE minimos y capacidades por rol.
- ITEM-Z2: elegibilidad de prenda al aire solo con `AVAILABLE`.
- ITEM-Z3B: reserva atomica `AVAILABLE -> RESERVED`.
- ITEM-Z4: UI distingue prenda actualmente al aire.
- ITEM-Z5B: idempotencia con `X-Idempotency-Key`.
- ITEM-Z5C: constraint de reserva `ACTIVE` por item.
- ITEM-Z5D: trazabilidad de rechazos de reserva.
- ITEM-Z6B: cancelacion y liberacion segura.
- ITEM-Z6C: smoke documental de liberacion.
- ITEM-Z7: vendido operativo LIVE seguro.

## Matriz de consistencia

| Flujo | Estado requerido | Resultado esperado | Evidencia tecnica |
|---|---|---|---|
| Poner/cambiar prenda al aire | `ItemStatus.AVAILABLE` | `lives.active_item_id` cambia; `items.status` no cambia | `LiveService.setActiveItem(...)` valida status disponible |
| Retirar prenda del aire | Live operable y permiso de retiro | `active_item_id` queda vacio; inventario no cambia | `LiveService.setActiveItem(...)` con request null |
| Crear reserva normal/LIVE | Item `AVAILABLE` y sin reserva `ACTIVE` | Update atomico a `RESERVED`; reserva queda `ACTIVE` | `ItemRepository.reserveIfAvailable(...)` |
| Doble reserva | Segunda reserva sobre item ya tomado | Rechazo y trazabilidad operativa | `reserveIfAvailable(...)` afecta 0 filas o `ACTIVE_RESERVATION_EXISTS` |
| Constraint reserva activa | Mas de una `ACTIVE` por item/branch | La base bloquea duplicado | `V53__active_reservation_item_constraint.sql` |
| Cancelar reserva | Reserva `ACTIVE`, sin pago activo, item `RESERVED` | Reserva `CANCELLED`; item `AVAILABLE` | `ReservationService.cancel(...)` + `releaseIfReserved(...)` |
| Cancelar historica | `CANCELLED` o `CONVERTED_TO_SALE` | Rechazo claro | `ReservationService.cancel(...)` |
| Vendido operativo LIVE | Reserva LIVE `ACTIVE` + item `RESERVED` | Solo cambia `live_operational_status`; registra evento | `ReservationService.updateLiveOperationalStatus(...)` |
| Vendido operativo invalido | Reserva cancelada/convertida o item no reservado | Rechazo claro | `validateOperationalSoldCandidate(...)` |

## Estados validos

### Prenda al aire

- `active_item_id` puede apuntar a un item `AVAILABLE`.
- Estar al aire no bloquea inventario por si mismo.
- Si esa prenda se aparta, el flujo de reserva cambia el item a `RESERVED`.
- Una prenda al aire con `SOLD`, `DISABLED` u `ON_CONSIGNMENT` no puede configurarse por el flujo backend actual.

### Reserva

- `ACTIVE` es la unica reserva activa.
- `CANCELLED` y `CONVERTED_TO_SALE` son historicos/no activos.
- No debe existir mas de una reserva `ACTIVE` por item/branch.
- No debe existir una reserva `ACTIVE` con item `AVAILABLE` por flujo normal.
- No debe quedar un item `RESERVED` sin reserva `ACTIVE` por flujo normal; si aparece por datos legacy, requiere correccion operativa controlada.

### Vendido operativo LIVE

- `OPERATIONAL_SOLD` es cierre operativo, no venta financiera.
- No cambia `ReservationStatus` a `CONVERTED_TO_SALE`.
- No cambia `ItemStatus` a `SOLD`.
- No libera inventario.
- No crea `Sale`, `Payment` ni movimiento de caja.
- Registra `LIVE_OPERATIONAL_SOLD` cuando el patron de `live_events` aplica.

## UI revisada

La pantalla LIVE conserva la mejora de ITEM-Z4:

- el selector muestra `Actualmente al aire`;
- la misma prenda al aire queda deshabilitada como reemplazo de si misma;
- la ayuda indica que sigue disponible para apartado, pero no para preparar el cambio;
- el modal de vendido operativo muestra advertencia de que no registra pago.

## Hallazgos reales

No se detecto una inconsistencia funcional nueva dentro del alcance de ITEM-Z8.

Hallazgos confirmados:

- El backend ya protege los caminos criticos de estado.
- La UI ya diferencia `Libre` de `Actualmente al aire` en el selector.
- `OPERATIONAL_SOLD` queda limitado a cierre operativo LIVE.
- No hay evidencia de que el flujo actual cree venta, pago, caja o libere inventario al marcar vendido operativo.

## Smoke tecnico

Se intento smoke no destructivo contra API local:

- `http://localhost:8080/api/health`

Resultado:

- No habia servidor local disponible en ese puerto al momento de la fase.
- No se ejecutaron mutaciones reales porque no habia ambiente, credenciales ni dataset desechable seguro.

Resultado QA:

- `GO_TECNICO` por auditoria, pruebas automatizadas y consistencia documental.
- `PENDING_QA_API_OR_VISUAL` para smoke real con navegador/API.

## No alcance

ITEM-Z8 no implemento ni modifico:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- RBAC;
- permisos;
- endpoints;
- migraciones;
- venta financiera.

## Checklist QA API/visual pendiente

1. Abrir `/live` con usuario con permisos LIVE.
2. Poner una prenda `AVAILABLE` al aire.
3. Confirmar que el item sigue `AVAILABLE` en inventario.
4. Abrir selector y confirmar badge `Actualmente al aire`.
5. Apartar esa prenda desde LIVE.
6. Confirmar que el item cambia a `RESERVED` y la reserva queda `ACTIVE`.
7. Intentar apartar la misma prenda de nuevo y confirmar rechazo.
8. Marcar `OPERATIONAL_SOLD` sobre reserva `ACTIVE` + item `RESERVED`.
9. Confirmar que no se crea venta, pago ni movimiento de caja.
10. Confirmar evento `LIVE_OPERATIONAL_SOLD`.
11. Intentar `OPERATIONAL_SOLD` sobre reserva `CANCELLED`.
12. Intentar `OPERATIONAL_SOLD` sobre `CONVERTED_TO_SALE`.
13. Intentar `OPERATIONAL_SOLD` cuando el item ya no este `RESERVED`.
14. Cancelar reserva `ACTIVE` sin pago y confirmar `RESERVED -> AVAILABLE`.
15. Cancelar reserva con pago activo y confirmar bloqueo.

## Riesgos restantes

- QA API/visual real sigue pendiente con dataset controlado.
- La conversion financiera real de una reserva LIVE a venta/caja sigue fuera de alcance.
- Si existen datos legacy inconsistentes (`ACTIVE` con item no `RESERVED`, o item `RESERVED` sin `ACTIVE`), deben corregirse con procedimiento administrativo y no por flujo automatico.
- La consulta operativa de trazabilidad puede requerir consola futura.

## GO/NO-GO

Resultado: `GO_TECNICO` / `PENDING_QA_API_OR_VISUAL`.

Criterio para avanzar:

- Se puede avanzar a una fase de QA API/visual real o a diseno de conversion financiera solo con dataset desechable y aprobacion explicita.
