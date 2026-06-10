# ITEM-Z5B - Idempotencia backend de reservas

Fecha: 2026-06-09
Rama: `feature/item-z5b-reservation-idempotency`
Tipo: implementacion backend minima, frontend tecnico, documentacion y evidencia.

## Resumen ejecutivo

ITEM-Z5B implementa idempotencia minima para la creacion de reservas. El objetivo es proteger doble submit exacto, doble click, reintentos por red y respuestas perdidas sin modificar pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.

Resultado esperado de la fase:

- `GO_TECNICO` si pruebas backend/frontend pasan.
- `PENDING_QA_VISUAL` si no hay navegador o screenshots reales.
- No se declara `QA_PASS` sin evidencia humana/visual.

## Contexto previo validado

ITEM-Z3B ya protegia la carrera principal de inventario con update atomico:

```sql
UPDATE items
SET status = 'RESERVED'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'AVAILABLE'
```

Ese mecanismo evita que dos solicitudes simultaneas ganen la misma prenda. ITEM-Z5B no reemplaza esa proteccion; la complementa para reconocer reintentos exactos de una misma operacion.

## Contrato elegido

Se eligio header HTTP opcional:

```text
X-Idempotency-Key
```

Motivos:

- Mantiene compatibilidad del DTO existente de reserva.
- Evita mezclar metadatos de transporte con datos de negocio.
- Permite a clientes web/mobile generar una llave por intento sin cambiar la pantalla.
- Si el header no viene, el flujo legacy conserva el comportamiento actual.

## Scope de idempotencia

La llave se evalua con este scope:

- `company_id`
- `branch_id`
- `user_id`
- operacion `RESERVATION_CREATE`
- `idempotency_key`

Esto evita que una misma llave colisione entre tenants, sucursales o usuarios.

## Persistencia

Se crea la tabla:

```text
reservation_idempotency_keys
```

Campos principales:

- `company_id`
- `branch_id`
- `user_id`
- `operation`
- `idempotency_key`
- `request_hash`
- `reservation_id`
- `status`
- `error_message`
- `created_at`
- `updated_at`
- `expires_at`

Constraint unico:

```text
company_id + branch_id + user_id + operation + idempotency_key
```

La tabla guarda hash SHA-256 del payload relevante. No guarda payload completo, tokens, passwords ni datos sensibles innecesarios.

## Hash del request

El hash estable incluye:

- item id;
- customer id;
- branch id;
- live id si aplica;
- sales channel id;
- seller user id si aplica;
- precio capturado si aplica;
- notas.

El hash normaliza valores nulos y monto decimal para comparar reintentos equivalentes.

## Comportamiento

### Sin `X-Idempotency-Key`

El backend conserva el flujo actual:

- valida tenant/branch/permisos;
- valida disponibilidad;
- ejecuta `AVAILABLE -> RESERVED`;
- crea reserva si el update atomico afecta 1 fila;
- rechaza si la prenda ya no esta disponible.

### Misma llave y mismo payload

Si ya existe una reserva completada para el mismo scope, llave y hash:

- no crea otra reserva;
- devuelve la reserva existente o una respuesta equivalente.

### Misma llave y payload distinto

Si la llave se reutiliza con datos distintos:

- rechaza con conflicto;
- no crea reserva;
- no cambia inventario.

### Llave en proceso

Si otra solicitud con la misma llave esta en `IN_PROGRESS`:

- rechaza con mensaje seguro;
- no crea reserva duplicada.

### Falla de disponibilidad

Si la prenda ya no esta `AVAILABLE`:

- no crea reserva;
- no cambia otros datos;
- la transaccion revierte el registro de idempotencia si se habia iniciado en el mismo intento.

## Frontend

`services/reservationService.ts` genera una llave unica por intento y la envia en `X-Idempotency-Key`.

La proteccion visual `isSavingReservation` sigue siendo util para UX, pero la proteccion real ante reintentos queda en backend.

No se redisenaron pantallas ni se cambio el flujo operativo.

## Migracion

Migracion creada:

```text
V52__reservation_idempotency_keys.sql
```

La migracion solo crea infraestructura de idempotencia para reservas. No modifica pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.

## Pruebas agregadas

Se agregaron pruebas para:

- creacion normal sin idempotency key;
- creacion con idempotency key;
- reintento con misma llave y mismo payload;
- reutilizacion de llave con payload distinto;
- llave en proceso;
- reserva LIVE con idempotencia y permiso `DO_LIVE_RESERVATION`;
- conservacion del update atomico `AVAILABLE -> RESERVED`.

## No alcance

ITEM-Z5B no implementa:

- constraint unico de reserva activa por item;
- limpieza automatica por TTL;
- auditoria de intentos rechazados;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- nuevos permisos;
- cambios RBAC;
- venta financiera.

## Pendientes

- ITEM-Z5C: evaluar constraint estructural de reserva activa por item.
- ITEM-Z5D: trazabilidad/auditoria de intentos rechazados.
- Fase futura: job de limpieza de llaves expiradas si se aprueba patron de jobs.
- QA visual/API real con usuarios operativos.

## Rollback

Rollback tecnico:

1. Revertir commit de ITEM-Z5B.
2. Si la migracion fue aplicada en ambiente QA/dev, revisar si la tabla `reservation_idempotency_keys` puede permanecer sin uso o debe retirarse con rollback controlado por DBA.
3. Validar que `ReservationService.create` siga usando `reserveIfAvailable(...)`.
4. Ejecutar pruebas backend y smoke de reserva normal/LIVE.

## GO/NO-GO

GO tecnico condicionado a:

- Maven test PASS;
- lint PASS;
- TypeScript PASS;
- expo export PASS;
- `git diff --check` PASS;
- no secretos versionados;
- no cambios fuera de alcance.

QA visual/API real queda pendiente si no se ejecuta navegador o smoke autenticado con credenciales QA.
