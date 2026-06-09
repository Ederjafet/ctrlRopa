# ITEM-Z3A - Reservation atomicity handoff report

Fecha: 2026-06-09 12:08:27

Rama: `feature/item-z3a-reservation-atomicity-handoff`

## Resultado

- `HANDOFF_TECNICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z3B`

No se tocaron backend funcional, inventario real, pagos, caja, precio LIVE, devoluciones, autorizaciones, migraciones, endpoints, RBAC ni permisos.

## Historial validado

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `5c7aced LIVE-PERM-A2 ajusta capacidades live por rol`
- `c818cb1 LIVE-PERM-A3 documenta smoke visual por rol`

## Comandos ejecutados

Iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -25`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`

Auditoria:

- `git grep -n "ReservationService|createReservation|create|ItemStatus|AVAILABLE|RESERVED|SOLD|DISABLED|ON_CONSIGNMENT|setStatus|save" -- ...`
- `git grep -n "Transactional|Lock|PESSIMISTIC|OPTIMISTIC|Version|@Version|findById|find.*ForUpdate|update.*status|where.*status" -- ...`
- `git grep -n "reservation|reserve|apartado|reservar|doble|concurrencia|atomic|race|double submit" -- ...`
- Las busquedas se repitieron con `git grep -n -E` para obtener alternancia regex real en este entorno.

Archivos revisados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/Item.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemStatus.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `backend/control-ropa/src/main/resources/db/migration/V1__schema_consolidado_v2.sql`
- `backend/control-ropa/src/main/resources/db/migration/V41__items_tenant_company.sql`
- `backend/control-ropa/src/main/resources/db/migration/V42__items_company_unique_scope.sql`
- `docs/ITEM_Z1_LIVE_INVENTORY_ARCHITECTURAL_HANDOFF.md`
- `docs/ITEM_Z2_LIVE_ACTIVE_ITEM_ELIGIBILITY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`

## Hallazgos

- `ReservationService` esta anotado con `@Transactional`.
- `create` carga item con `itemRepository.findById`.
- Valida branch/tenant despues de cargar el item.
- Valida `item.status == AVAILABLE`.
- Busca reserva activa con `findByItemIdAndStatus`.
- Cambia status con `item.setStatus(ItemStatus.RESERVED)`.
- Guarda item con `itemRepository.save(item)`.
- Guarda reserva con `repository.save(entity)`.
- No se encontro `@Version` en `Item` ni `Reservation`.
- No se encontro locking pesimista/optimista en repositorios de item/reserva.
- No se encontro metodo `find...ForUpdate`.
- No se encontro update condicional `WHERE status = AVAILABLE` para reservar.
- No se encontro constraint unico que impida mas de una reserva activa por item.
- No se encontraron tests de concurrencia o doble submit.

## Riesgos

- Doble submit desde frontend.
- Dos usuarios reservando la misma prenda al mismo tiempo.
- Race condition entre validar `AVAILABLE` y guardar `RESERVED`.
- Competencia entre reserva LIVE y reserva puerta/general.
- Inconsistencia si `lives.active_item_id` se interpreta como bloqueo de inventario.
- Segundo usuario necesita mensaje accionable si pierde la competencia.

## Recomendacion tecnica

ITEM-Z3B debe implementar un MVP backend con update atomico condicional:

```sql
UPDATE items
SET status = 'RESERVED'
WHERE company_id = ?
  AND branch_id = ?
  AND id = ?
  AND status = 'AVAILABLE'
```

El resultado esperado:

- `1` fila afectada: crear reserva.
- `0` filas afectadas: rechazar con mensaje claro.

Mantener `@Transactional` para que si falla crear reserva/orden/evento, el update de item haga rollback.

No se recomienda como MVP:

- depender solo de `@Transactional`;
- solo deshabilitar boton frontend;
- agregar `@Version` en items sin fase mas amplia;
- crear constraint unico complejo sin auditoria de datos.

## GO / NO-GO para ITEM-Z3B

Recomendacion: `GO_CONDICIONADO`.

Condiciones:

- Aprobar update atomico condicional.
- No tocar pagos/caja/precio/autorizaciones/RBAC.
- Agregar pruebas backend para exito, item no disponible y update atomico fallido.
- Confirmar mensaje accionable para segundo intento.
- Mantener rollback claro.

## Validaciones de esta fase

Resultado final:

- `npm.cmd run lint`: PASS, 0 errores y 53 warnings historicos fuera de alcance.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.

Maven no se ejecuto porque esta fase no toca backend funcional.
