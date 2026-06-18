# ITEM-Z5 - Reporte handoff idempotencia y trazabilidad de reservas

Fecha: 2026-06-09 14:57:44
Rama: `feature/item-z5-reservation-idempotency-handoff`
Tipo: auditoria documental, sin implementacion funcional.

## Resultado

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z5B`

## Comandos ejecutados

Iniciales:

```powershell
git branch --show-current
git status
git log --oneline -30
git --no-pager log --oneline --all --decorate --grep="ITEM-Z1"
git --no-pager log --oneline --all --decorate --grep="ITEM-Z2"
git --no-pager log --oneline --all --decorate --grep="ITEM-Z3A"
git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"
git --no-pager log --oneline --all --decorate --grep="ITEM-Z4"
```

Auditoria:

```powershell
git grep -n "ReservationService|ReservationRepository|reserveIfAvailable|create|reservation|ReservationStatus|ACTIVE|CANCELLED|COMPLETED|EXPIRED|idempotency|Idempotency|requestId|clientRequestId|correlationId" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs ':!node_modules' ':!.expo' ':!dist' ':!build'
git grep -n "live reservation|DO_LIVE_RESERVATION|apartado|reservar|double submit|doble submit|doble click|concurrencia|duplicada|duplicado|trace|audit|auditoria|event" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'
git grep -n "unique|constraint|index|idx|uq|reservation.*item|item_id.*reservation|active reservation|reserva activa" -- backend/control-ropa/src/main/resources backend/control-ropa/src/main/java docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'
```

Archivos leidos con comandos no interactivos:

```powershell
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationStatus.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventService.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java
Get-Content backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java
Get-Content backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java
Get-Content services/reservationService.ts
Get-Content docs/ITEM_Z3A_RESERVATION_ATOMICITY_HANDOFF.md
Get-Content docs/ITEM_Z3B_RESERVATION_ATOMIC_UPDATE.md
Get-Content docs/ITEM_Z4_LIVE_ACTIVE_ITEM_UX_CONSISTENCY.md
```

## Historial confirmado

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5748040 ITEM-Z3A documenta handoff atomicidad reservas`
- `92e937a ITEM-Z3B protege reserva atomica`
- `ce0e2b5 ITEM-Z4 distingue prenda al aire en selector live`

## Archivos revisados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/main/resources/db/migration/V1__schema_consolidado_v2.sql`
- `backend/control-ropa/src/main/resources/db/migration/V24__system_movement_audit_log.sql`
- `backend/control-ropa/src/main/resources/db/migration/V48__live_reservation_operational_status.sql`
- `backend/control-ropa/src/main/resources/db/migration/V49__live_operational_events.sql`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- `services/reservationService.ts`
- `app/live.tsx`
- `docs/ITEM_Z3A_RESERVATION_ATOMICITY_HANDOFF.md`
- `docs/ITEM_Z3B_RESERVATION_ATOMIC_UPDATE.md`
- `docs/ITEM_Z4_LIVE_ACTIVE_ITEM_UX_CONSISTENCY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

## Hallazgos

1. `ReservationService.create` ya esta bajo `@Transactional`.
2. `ReservationService.create` usa `ItemRepository.reserveIfAvailable(...)`.
3. `reserveIfAvailable(...)` filtra por company, branch, item y status `AVAILABLE`, y actualiza a `RESERVED`.
4. Si el update atomico devuelve `0`, no se crea reserva.
5. La reserva LIVE usa el mismo flujo de `ReservationService.create`.
6. Existe concepto de reserva activa mediante `ReservationStatus.ACTIVE` y `findByItemIdAndStatus(...)`.
7. No existe idempotency key ni `clientRequestId` en backend o frontend.
8. No existe constraint unico de reserva activa por item.
9. `live_events` registra eventos positivos de LIVE, pero no rechazos de reserva.
10. `system_movement_audit_log` audita mutaciones exitosas; no audita respuestas `>= 400`.
11. El frontend usa `isSavingReservation` para reducir doble click, pero no sustituye idempotencia backend.

## Riesgos

- Retry por red puede devolver error aunque la primera reserva haya quedado creada.
- Doble submit exacto no tiene respuesta deterministica.
- Sin constraint, una ruta futura fuera de `ReservationService.create` podria crear duplicidad activa.
- Los intentos rechazados por competencia no quedan trazados como evento de negocio.
- Cualquier solucion futura debe respetar company/branch para no romper tenant isolation.

## Recomendacion tecnica

Orden recomendado:

1. `ITEM-Z5B`: idempotencia de reservas con `clientRequestId`/`idempotencyKey`.
2. `ITEM-Z5D`: trazabilidad de intentos rechazados.
3. `ITEM-Z5C`: constraint/reserva activa por item con preflight y aprobacion de migracion.

## No implementacion

No se modifico:

- backend funcional;
- inventario real;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- permisos;
- RBAC;
- endpoints;
- migraciones;
- frontend funcional.

## Validaciones

Ejecutadas:

- `npm.cmd run lint`: PASS con 53 warnings preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: solo artefactos ITEM-Z5 staged antes del commit.

No se ejecuta Maven porque esta fase no toca backend.

## GO/NO-GO para ITEM-Z5B

`GO` condicionado para disenar/implementar ITEM-Z5B si arquitectura aprueba:

- nombre y ubicacion de la idempotency key;
- scope por company/branch/user/canal;
- persistencia en columna vs tabla;
- TTL/retencion;
- comportamiento ante mismo key con payload distinto.

`NO-GO` para crear constraint de reserva activa sin preflight de datos ni diseno MySQL aprobado.

## Estado final esperado

- Handoff tecnico creado.
- Reporte QA/documental creado.
- Evidencia git generada.
- Commit documental creado si validaciones pasan.
