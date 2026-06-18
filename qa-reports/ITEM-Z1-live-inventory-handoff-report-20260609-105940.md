# ITEM-Z1 - Reporte handoff inventario LIVE

Fecha: 2026-06-09 10:59:40

## Rama

`feature/item-z1-live-inventory-handoff`

## Resultado

- `HANDOFF_ARQUITECTONICO_COMPLETO`
- `NO_IMPLEMENTATION`
- `PENDING_APPROVAL_FOR_ITEM_Z2`

## Comandos ejecutados

Comandos iniciales:

- `git branch --show-current`
- `git status`
- `git log --oneline -25`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`

Auditoria:

- `git grep -n "VIEW_LIVE\|OPERATE_LIVE\|PREPARE_LIVE_ITEM\|CHANGE_LIVE_ACTIVE_ITEM\|REMOVE_LIVE_ACTIVE_ITEM\|DO_LIVE_RESERVATION" -- . ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "Inventory\|Item\|Product\|Garment\|Stock\|Reservation\|LiveService\|ReservationService\|activeItem\|preparedItem\|sold\|available\|reserved" -- backend/control-ropa/src/main/java app services components docs ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "PRENDA AL AIRE\|prenda al aire\|preparar prenda\|cambiar prenda\|retirar prenda\|reservar\|apartado\|vendido operativo\|disponible\|reservada" -- app services components locales docs ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `rg -n "preparedItem|prepare|setPrepared|activeItem|setLiveActiveItem|handle.*Active|operational|Reservation|availability|available|sold|reserved" app/live.tsx`
- `rg -n "status|ItemStatus|setStatus|update|AVAILABLE|RESERVED|SOLD|DISABLED|ON_CONSIGNMENT" backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item`
- `rg -n "liveOperationalStatus|updateLiveOperationalStatus|OPERATIONAL_SOLD|setStatus|item.setStatus|hasPayment|payment|paid|balance" backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation`
- `rg -n "prepared|activeItem|setActiveItem|ItemStatus|AVAILABLE|RESERVED|SOLD|event|audit" backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live`

Lecturas relevantes:

- `services/itemService.ts`
- `services/liveService.ts`
- `services/reservationService.ts`
- `services/liveCapabilities.ts`
- `app/live.tsx`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/Item.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/Live.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java`
- `backend/control-ropa/src/main/resources/db/migration/V47__live_active_product_state.sql`
- `backend/control-ropa/src/main/resources/db/migration/V48__live_reservation_operational_status.sql`
- `backend/control-ropa/src/main/resources/db/migration/V49__live_operational_events.sql`
- `backend/control-ropa/src/main/resources/db/migration/V50__live_minimal_permissions.sql`
- `backend/control-ropa/src/main/resources/db/migration/V51__live_permission_view_dependency_backfill.sql`
- `docs/LIVE_PERM_A0_ARCHITECTURAL_HANDOFF.md`
- `docs/LIVE_PERM_A1_MINIMAL_LIVE_PERMISSIONS.md`
- `docs/LIVE_PERM_A1B_LIVE_PERMISSION_DEPENDENCIES.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/PROJECT_BACKLOG_PRIORITIZED.md`

## Hallazgos

1. `items.status` es la fuente canonica de disponibilidad de prenda.
2. `ReservationService.create` bloquea reservas si el item no esta `AVAILABLE`.
3. Al crear reserva, el backend cambia la prenda a `RESERVED`.
4. Al cancelar reserva activa, el backend regresa la prenda a `AVAILABLE`.
5. `lives.active_item_id` representa la prenda al aire, pero no cambia estado de inventario.
6. `LiveService.setActiveItem` valida permisos, tenant/branch y live cerrado, pero no valida actualmente `ItemStatus`.
7. La prenda preparada se observa como estado temporal frontend, no como campo backend persistido.
8. `live_operational_status = OPERATIONAL_SOLD` es operativo; no procesa pagos, caja ni venta financiera.
9. La UI de LIVE tiene filtros y bloqueos de disponibilidad, pero reglas criticas deben mantenerse en backend.
10. No se observo lock/constraint unico para evitar doble reserva concurrente; queda como riesgo para ITEM-Z3.

## Riesgos

- Doble reserva por concurrencia.
- Poner al aire prenda reservada, vendida o deshabilitada si el frontend tiene datos stale.
- Confusion entre venta operacional LIVE y venta real con pago/caja.
- Preparacion de prenda no persistida entre multiples operadores.
- Reversa/cancelacion de apartados con pago sin flujo formal de autorizacion.
- Tenant/branch isolation debe conservarse en cualquier cambio futuro.

## No implementacion

Confirmado:

- No se modifico backend funcional.
- No se modifico inventario real.
- No se tocaron pagos, caja, devoluciones ni autorizaciones.
- No se crearon migraciones.
- No se crearon endpoints.
- No se modifico RBAC.
- No se crearon permisos.

## Recomendacion para ITEM-Z2

`GO_CONDICIONADO` para implementar una fase minima y segura:

- Reforzar `LiveService.setActiveItem` con elegibilidad backend de prenda.
- Mantener `lives.active_item_id` como referencia de prenda al aire.
- No cambiar `items.status` por solo estar al aire.
- Mantener `DO_LIVE_RESERVATION` como permiso de apartado LIVE.
- No tocar precio, pagos, caja ni autorizaciones.

## Estado final esperado

- Documento de handoff creado.
- Evidencia git generada.
- Validaciones frontend/documentales ejecutadas.
- Commit documental de ITEM-Z1 si todo pasa.

## Validaciones ejecutadas

| Validacion | Resultado | Nota |
| --- | --- | --- |
| `npm.cmd run lint` | PASS | 0 errores; 53 warnings preexistentes fuera de alcance documental. |
| `npx.cmd tsc --noEmit` | PASS | Sin errores. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS | Export web generado en `C:/tmp/control-ropa-web-export`. |
| Maven backend | NO EJECUTADO | No se toco backend funcional. |

## Estado de alcance

Esta corrida fue documental. No hubo QA visual ni API runtime, por lo que no se marca `QA_PASS`.

Estado recomendado:

- `GO_TECNICO_DOCUMENTAL`
- `PENDING_APPROVAL_FOR_ITEM_Z2`
