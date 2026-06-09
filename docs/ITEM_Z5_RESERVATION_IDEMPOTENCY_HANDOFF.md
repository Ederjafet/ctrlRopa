# ITEM-Z5 - Handoff tecnico de idempotencia y trazabilidad de reservas

Fecha: 2026-06-09
Rama: `feature/item-z5-reservation-idempotency-handoff`
Tipo: handoff tecnico/documental, sin implementacion funcional.

## Resumen ejecutivo

ITEM-Z5 audita el flujo real de reserva normal y reserva LIVE despues de ITEM-Z3B. La proteccion principal actual ya evita que dos solicitudes ganen la misma prenda mediante update atomico `AVAILABLE -> RESERVED`, pero aun no existe idempotencia para reintentos exactos, ni constraint unico de reserva activa por item, ni trazabilidad de intentos rechazados.

Resultado de esta fase:

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z5B`

## Estado previo validado

Commits relevantes encontrados en historial:

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5748040 ITEM-Z3A documenta handoff atomicidad reservas`
- `92e937a ITEM-Z3B protege reserva atomica`
- `ce0e2b5 ITEM-Z4 distingue prenda al aire en selector live`

Estado funcional previo:

- `items.status` es la fuente real de disponibilidad.
- `ReservationService.create` corre bajo `@Transactional`.
- `ReservationService.create` usa `ItemRepository.reserveIfAvailable(...)`.
- `reserveIfAvailable(...)` cambia `AVAILABLE -> RESERVED` solo si company, branch, item y status coinciden.
- Si el update atomico afecta `0` filas, no se crea reserva y se lanza `La prenda ya no esta disponible para apartar`.
- La reserva LIVE usa el mismo flujo de `ReservationService.create`.
- `lives.active_item_id` representa la prenda al aire y no cambia `items.status`.
- ITEM-Z4 distingue visualmente la prenda al aire sin cambiar inventario.

## Estado actual real

### Como se crea una reserva

El flujo real de `ReservationService.create`:

1. Obtiene `userId` desde `CurrentUser`.
2. Valida la branch solicitada con `TenantAccessGuard`.
3. Carga el item por id y valida su branch activa.
4. Rechaza si `item.status` no es `AVAILABLE`.
5. Carga customer, branch y sales channel.
6. Valida que item y customer pertenezcan a la branch indicada.
7. Valida permisos por canal:
   - LIVE: `DO_LIVE_RESERVATION`.
   - Puerta/apartado: `DO_DOOR_RESERVATION`.
8. Si hay `liveId`, valida live, branch, status `OPEN/ACTIVE` y canal `LIVE`.
9. Busca reserva activa existente con `ReservationRepository.findByItemIdAndStatus(itemId, ACTIVE)`.
10. Ejecuta `ItemRepository.reserveIfAvailable(companyId, branchId, itemId, AVAILABLE, RESERVED)`.
11. Si el update devuelve `1`, crea la reserva.
12. Si el update devuelve `0`, rechaza y no guarda reserva.
13. Crea/actualiza la orden abierta del cliente.
14. Si es LIVE, registra `LIVE_RESERVATION_CREATED`.

### Proteccion AVAILABLE -> RESERVED

`ItemRepository.reserveIfAvailable(...)` usa JPQL con `@Modifying`:

```sql
UPDATE items
SET status = 'RESERVED'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'AVAILABLE'
```

Esto protege la carrera principal entre dos usuarios o dos solicitudes que intentan reservar la misma prenda cuando ambas observan `AVAILABLE`.

### Que pasa si el update atomico afecta 0 filas

El servicio lanza:

```text
La prenda ya no esta disponible para apartar
```

No se ejecuta `repository.save(...)` de la reserva, no se crea customer order item y no se registra evento LIVE de reserva creada.

### Status de reserva

`ReservationStatus` actual:

- `ACTIVE`
- `CANCELLED`
- `CONVERTED_TO_SALE`

El concepto de reserva activa existe en codigo mediante `ReservationStatus.ACTIVE` y consultas como:

- `ReservationRepository.findByItemIdAndStatus(itemId, ACTIVE)`
- consumidores en items, pagos, ventas y paquetes que revisan reserva activa por item.

### Reserva activa por item

Existe chequeo de servicio para detectar una reserva activa existente, pero no existe constraint unico en base de datos que impida por estructura mas de una reserva `ACTIVE` para el mismo item.

La tabla `reservations` tiene indices por `item_id`, `status`, branch, live y otros campos, pero no un indice unico parcial tipo "una reserva activa por item".

### Idempotencia

No se encontro:

- `idempotencyKey`;
- `clientRequestId`;
- header `X-Idempotency-Key`;
- tabla de idempotencia;
- columna de idempotencia en `reservations`;
- endpoint que retorne la misma reserva ante reintento exacto.

El frontend usa `isSavingReservation` para deshabilitar el boton mientras guarda, pero eso solo reduce doble click en una sesion. No protege:

- reintento por red;
- reload;
- dos dispositivos;
- repeticion manual del request;
- respuesta perdida despues de una reserva creada.

### Trazabilidad de intentos rechazados

Existe trazabilidad positiva:

- `system_movement_audit_log` registra mutaciones exitosas con status HTTP menor a 400.
- `live_events` registra `LIVE_RESERVATION_CREATED` cuando la reserva LIVE se crea.

No se encontro trazabilidad especifica para:

- intento de reserva rechazado porque el update atomico devolvio `0`;
- intento rechazado por reserva activa existente;
- doble submit exacto;
- intento LIVE rechazado por competencia con otro operador.

`LiveEventType` no incluye un evento de reserva rechazada. `SystemMovementAuditInterceptor` omite respuestas `>= 400`, por lo que un rechazo de reserva no queda auditado alli.

## Riesgos detectados

| Riesgo | Severidad | Estado actual |
| --- | --- | --- |
| Doble click del mismo operador | Media | UI deshabilita durante guardado, pero backend no identifica reintento exacto. |
| Reintento por red | Alta | Si la primera reserva se creo y la respuesta se pierde, el reintento puede devolver error en lugar de la reserva original. |
| Dos operadores reservando misma prenda | Alta | Mitigado por update atomico; el perdedor recibe rechazo. |
| Reserva creada pero respuesta perdida | Alta | Sin idempotencia, soporte no puede distinguir facilmente retry legitimo vs nueva operacion. |
| Multiples reservas historicas para un item | Baja/Media | Permitido por diseno si reservas previas estan canceladas/convertidas. |
| Multiples reservas activas para un item | Alta | El servicio lo bloquea, pero la base no tiene constraint estructural. |
| Falta de trazabilidad de rechazo | Media/Alta | Los rechazos por competencia no quedan como evento de negocio. |
| Multi-tenant/company/branch | Alta | El update atomico filtra company y branch; cualquier constraint futuro debe respetar ese scope. |
| Rollback transaccional | Media | `@Transactional` mitiga rollback; idempotencia futura debe mantener atomicidad. |
| UX ante competencia | Media | El mensaje backend existe; falta contrato y checklist UX/API para reintento/idempotencia. |

## Opciones tecnicas evaluadas

### Opcion 1 - Mantener solo update atomico actual

Ventajas:

- Ya protege la carrera principal `AVAILABLE -> RESERVED`.
- No requiere migracion adicional.
- Es sencillo de mantener.

Limites:

- No identifica doble submit exacto.
- No devuelve la misma reserva ante reintento de red.
- No agrega trazabilidad de intentos rechazados.
- No protege estructuralmente si otra ruta futura crea reservas sin pasar por `ReservationService.create`.

Decision: suficiente como base, insuficiente para cerrar ITEM-Z5.

### Opcion 2 - Idempotency key en request de reserva

Propuesta:

- Agregar un identificador estable generado por cliente por intento de reserva.
- Usar scope por company, branch, user y canal.
- Si llega el mismo key con el mismo payload, devolver la reserva ya creada.
- Si llega el mismo key con payload distinto, rechazar como conflicto.

Ventajas:

- Resuelve reintentos por red y respuesta perdida.
- Mejora UX en doble click/retry exacto.
- Permite soporte rastrear un intento.

Riesgos:

- Requiere contrato API y persistencia.
- Debe evitar reusar keys entre tenants/branches.
- Debe definir TTL o ventana de retencion.

Decision: recomendada como ITEM-Z5B.

### Opcion 3 - Constraint unico para reserva activa por item

Propuesta:

- Agregar defensa de base de datos para impedir dos reservas activas por item.
- Debe respetar company/branch/item.

Consideracion MySQL:

- MySQL no tiene indices parciales simples tipo `WHERE status = 'ACTIVE'`.
- Un unique directo `(company_id, branch_id, item_id, status)` bloquearia mas de una reserva historica cancelada si status se repite.
- Alternativas:
  - columna generada nullable que solo tenga valor cuando status es `ACTIVE`;
  - tabla separada de locks/reservas activas;
  - migracion con preflight de duplicados antes de crear constraint.

Decision: valiosa, pero debe ir despues de idempotencia y con aprobacion de migracion. Candidata ITEM-Z5C.

### Opcion 4 - Tabla/evento de intentos rechazados

Propuesta:

- Registrar rechazo cuando:
  - hay reserva activa existente;
  - `reserveIfAvailable(...)` devuelve `0`;
  - el item dejo de estar `AVAILABLE`.
- Para LIVE, evaluar `live_events` con nuevo tipo `LIVE_RESERVATION_REJECTED`.
- Para reserva general, evaluar tabla de auditoria de negocio o `system_movement_audit_log` ampliado con cuidado.

Ventajas:

- Mejora trazabilidad y soporte.
- Permite explicar competencia entre operadores.
- No toca pagos/caja.

Riesgos:

- Debe evitar guardar datos sensibles o cuerpos completos.
- Si se registra dentro de la misma transaccion que falla, el evento podria hacer rollback; podria requerir transaccion separada o evento controlado.

Decision: recomendada como ITEM-Z5D o subfase junto a Z5B si arquitectura aprueba.

### Opcion 5 - Bloqueo frontend temporal

Estado actual:

- `/live` ya usa `isSavingReservation` para deshabilitar el boton `Apartar ahora` mientras guarda.

Ventajas:

- Reduce doble click accidental.
- Mejora feedback visual.

Limites:

- No sustituye backend.
- No resuelve red/retry/dos dispositivos.

Decision: mantener como complemento, no considerarlo cierre de idempotencia.

## Recomendacion de implementacion

### ITEM-Z5B - Idempotencia de reservas

Objetivo:

- Resolver doble submit exacto y reintentos por red para reserva normal y reserva LIVE.

Alcance sugerido:

- Agregar `clientRequestId` o `idempotencyKey` a `CreateReservationRequest`.
- Generar key en frontend por intento de reserva.
- Persistir key con scope:
  - company;
  - branch;
  - user solicitante;
  - canal;
  - item;
  - payload hash o campos relevantes.
- Si el mismo key ya produjo reserva, devolver la reserva existente.
- Si el mismo key llega con payload distinto, rechazar como conflicto.
- Mantener `reserveIfAvailable(...)` como proteccion principal de disponibilidad.

Archivos probables:

- `ReservationService`
- `ReservationController` solo si el contrato cambia a header o DTO versionado.
- `ReservationRepository`
- `CreateReservationRequest`
- `services/reservationService.ts`
- `app/live.tsx`
- tests de `ReservationService`
- migracion Flyway para persistir key si se elige columna/tabla.

Migracion:

- Probable. Evaluar una columna en `reservations` o una tabla `reservation_idempotency_keys`.
- Requiere preflight de duplicados solo si se agrega unique.

Tests minimos:

- Primer request con key crea reserva.
- Retry con misma key y mismo payload devuelve la misma reserva.
- Retry con misma key y payload distinto rechaza.
- Retry con respuesta perdida no crea segunda reserva.
- LIVE usa la misma idempotencia.
- Company/branch/user distintos no comparten key indebidamente.

GO/NO-GO:

- `GO` si reintento exacto es deterministico y no duplica reserva.
- `NO-GO` si el key se valida solo en frontend o no queda scoped por tenant/branch/user.

### ITEM-Z5C - Constraint/reserva activa si aplica

Objetivo:

- Agregar defensa estructural contra multiples reservas activas para un mismo item.

Alcance sugerido:

- Ejecutar preflight SQL para detectar duplicados activos.
- Disenar constraint compatible con MySQL:
  - columna generada `active_item_id` nullable;
  - unique `(company_id, branch_id, active_item_id)`;
  - o tabla separada de active reservation locks.
- Mantener historial de reservas canceladas/convertidas.

Archivos probables:

- migracion Flyway nueva;
- entidad `Reservation` si se agrega columna;
- repositorios/tests de integracion si aplica.

GO/NO-GO:

- `GO` solo si no bloquea historicos y el rollback esta claro.
- `NO-GO` si el unique impide mas de una reserva cancelada historica del mismo item.

### ITEM-Z5D - Trazabilidad de intentos rechazados

Objetivo:

- Registrar intentos rechazados por no disponibilidad, reserva activa o competencia.

Alcance sugerido:

- Para LIVE, agregar evento de negocio `LIVE_RESERVATION_REJECTED` o equivalente.
- Para reserva general, definir tabla/evento de auditoria operativa no financiera.
- Payload minimo:
  - companyId;
  - branchId;
  - itemId;
  - liveId si aplica;
  - actorUserId;
  - reasonCode;
  - timestamp;
  - idempotencyKey hash si existe.

GO/NO-GO:

- `GO` si no se guardan passwords, tokens ni cuerpos completos.
- `NO-GO` si la auditoria depende de logs tecnicos no consultables.

## Orden recomendado

1. `ITEM-Z5B`: idempotencia de reservas.
2. `ITEM-Z5D`: trazabilidad de rechazos, al menos para eventos LIVE si se aprueba.
3. `ITEM-Z5C`: constraint/reserva activa, despues de preflight de datos y aprobacion de migracion.

Este orden reduce primero la confusion operativa del usuario, luego mejora soporte, y finalmente agrega una defensa estructural de base de datos con menor riesgo de bloquear historicos.

## Rollback recomendado

Para ITEM-Z5B:

1. Revertir frontend/DTO/service de idempotency key.
2. Si hay migracion aditiva, conservar columna/tabla sin usar o ejecutar rollback controlado solo si arquitectura lo aprueba.
3. Mantener ITEM-Z3B; no revertir `reserveIfAvailable(...)`.

Para ITEM-Z5C:

1. Remover constraint/indice nuevo si bloquea operacion.
2. Mantener datos historicos.
3. No alterar `items.status` ni reservas existentes sin script de remediacion aprobado.

Para ITEM-Z5D:

1. Desactivar registro de evento nuevo.
2. Mantener eventos ya persistidos, salvo politica de retencion.

## Alcance explicito

ITEM-Z5 no implementa:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- permisos nuevos;
- RBAC;
- endpoints nuevos;
- migraciones;
- venta financiera;
- persistencia de prenda preparada.

## Criterios de aprobacion arquitectonica para ITEM-Z5B

Antes de implementar ITEM-Z5B, arquitectura debe aprobar:

- key en header vs DTO;
- nombre del campo (`clientRequestId` o `idempotencyKey`);
- scope exacto de unicidad;
- retencion/TTL;
- si se usa columna en `reservations` o tabla separada;
- comportamiento ante mismo key con payload distinto;
- comportamiento ante mismo key de otro usuario/branch/company;
- formato de error para conflicto de idempotencia;
- si se agrega trazabilidad de rechazos en la misma fase o en Z5D.

## QA requerido futuro

Casos minimos para Z5B/Z5C/Z5D:

1. Doble click rapido del mismo usuario crea una sola reserva.
2. Retry por red con la misma key devuelve la misma reserva.
3. Retry con la misma key y payload distinto se rechaza.
4. Dos usuarios compiten por la misma prenda: uno gana, otro recibe error accionable.
5. Si el perdedor esta en LIVE, queda evento o evidencia de rechazo si Z5D se implementa.
6. Reserva cancelada historica no bloquea nueva reserva valida si el item vuelve a `AVAILABLE`.
7. Cross-tenant/cross-branch no comparte idempotency key ni constraint.

## GO / NO-GO

Resultado de ITEM-Z5:

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z5B`

Recomendacion:

- `GO` para preparar ITEM-Z5B si arquitectura aprueba contrato de idempotencia y migracion.
- `NO-GO` para crear constraint de reserva activa sin preflight de datos y diseno MySQL aprobado.
