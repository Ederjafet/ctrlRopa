# ITEM-Z8 - Reporte QA tecnico de consistencia LIVE, inventario y reservas

Fecha: 2026-06-10 00:54
Rama: `feature/item-z8-live-inventory-reservation-consistency`
Estado: `GO_TECNICO` / `PENDING_QA_API_OR_VISUAL`

## Resumen

ITEM-Z8 audito la consistencia final entre `lives.active_item_id`, `items.status`, `reservations.status`, estado operativo LIVE y eventos. No se detecto una inconsistencia funcional nueva que requiriera cambios de backend o frontend.

La fase genero documentacion y evidencia, sin modificar pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints ni migraciones.

## Comandos ejecutados

Preflight e historial:

- `git branch --show-current`
- `git status`
- `git log --oneline -70`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z2"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z4"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`

Auditoria:

- `git grep -n "setActiveItem|active_item_id|activeItem|ItemStatus.AVAILABLE|ItemStatus.RESERVED|ItemStatus.SOLD|ItemStatus.DISABLED|ItemStatus.ON_CONSIGNMENT" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "ReservationService|ReservationStatus.ACTIVE|ReservationStatus.CANCELLED|ReservationStatus.CONVERTED_TO_SALE|reserveIfAvailable|releaseIfReserved|active_reservation_item_id|uq_reservations_active_item" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources backend/control-ropa/src/test docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "OPERATIONAL_SOLD|LIVE_OPERATIONAL_SOLD|updateLiveOperationalStatus|LiveOperationalStatus|vendido operativo|VENDIDO OPERATIVO|operational sold" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources backend/control-ropa/src/test app services components locales docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "Actualmente al aire|Al aire ahora|Libre|Reservada|Apartada|Disponible para apartado|PRENDA AL AIRE|Seleccionar prenda" -- app services components locales docs qa-reports ':!node_modules' ':!.expo' ':!dist' ':!build'`
- Lecturas por rango de `LiveService.java`, `ReservationService.java`, `ItemRepository.java`, `V53__active_reservation_item_constraint.sql`, `app/live.tsx`, `services/liveService.ts` y `services/reservationService.ts`.

Smoke no destructivo:

- `Invoke-WebRequest http://localhost:8080/api/health`

Validaciones:

- `./mvnw.cmd test`
- Reintento backend cargando `.env` sin imprimir secretos y ejecutando `./mvnw.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

## Historial confirmado

- `5f5cf4d` LIVE-PERM-A1 agrega permisos live minimos
- `4975138` LIVE-PERM-A1B corrige dependencias de permisos live
- `6c757c9` LIVE-PERM-A1 documenta cierre final
- `5c7aced` LIVE-PERM-A2 ajusta capacidades live por rol
- `c818cb1` LIVE-PERM-A3 documenta smoke visual por rol
- `80a8aa1` ITEM-Z2 valida elegibilidad de prenda live
- `92e937a` ITEM-Z3B protege reserva atomica
- `ce0e2b5` ITEM-Z4 distingue prenda al aire en selector live
- `6f1ee15` ITEM-Z5B agrega idempotencia de reservas
- `ef8d255` ITEM-Z5C protege reserva activa por item
- `3826a43` ITEM-Z5D registra rechazos de reserva
- `7490809` ITEM-Z6B libera reservas de forma segura
- `5c0cf22` ITEM-Z6C documenta smoke liberacion reservas
- `a5541e4` ITEM-Z7 asegura vendido operativo live

## Hallazgos tecnicos

### Prenda al aire

- `LiveService.setActiveItem(...)` valida que el item pertenezca al mismo branch del live.
- Solo permite poner/cambiar prenda al aire si `item.status == AVAILABLE`.
- Al poner/cambiar prenda al aire solo asigna `live.activeItem`; no cambia `items.status`.
- Al retirar prenda al aire limpia `activeItem`; no cambia inventario.

### Reserva

- `ReservationService.create(...)` busca reserva `ACTIVE` previa por item.
- Usa `ItemRepository.reserveIfAvailable(...)` para transicion atomica `AVAILABLE -> RESERVED`.
- Si el update afecta 0 filas, registra rechazo `ITEM_NOT_AVAILABLE` y no crea reserva.
- `V53__active_reservation_item_constraint.sql` protege una sola reserva `ACTIVE` por item/branch.
- `X-Idempotency-Key` se conserva desde ITEM-Z5B para reintentos exactos.

### Cancelacion/liberacion

- `ReservationService.cancel(...)` solo permite cancelar `ACTIVE`.
- Rechaza `CANCELLED` y `CONVERTED_TO_SALE`.
- Bloquea cancelacion normal si hay `PaymentAllocation` con `PaymentStatus.ACTIVE`.
- Solo libera con `releaseIfReserved(...)`, es decir `RESERVED -> AVAILABLE` condicional.

### Vendido operativo LIVE

- `ReservationService.updateLiveOperationalStatus(...)` valida que la reserva pertenezca a LIVE.
- `OPERATIONAL_SOLD` requiere reserva `ACTIVE`.
- Rechaza `CANCELLED`, `CONVERTED_TO_SALE` y apartado LIVE operacional `CANCELLED`.
- Requiere que el item siga `RESERVED`.
- No cambia `ReservationStatus`, no cambia `ItemStatus`, no crea `Sale`, no crea `Payment` y no toca caja.
- Conserva evento `LIVE_OPERATIONAL_SOLD`.

### UI

- `app/live.tsx` deshabilita la misma prenda que ya esta al aire en el selector.
- La etiqueta visible usa `live.activeItemSelectorOnAirBadge`.
- En espanol el texto es `Actualmente al aire`.
- El modal de vendido operativo muestra advertencia de que no registra pago.

## Implementacion realizada

No hubo cambios funcionales.

Archivos creados/actualizados:

- `docs/ITEM_Z8_LIVE_INVENTORY_RESERVATION_CONSISTENCY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `qa-reports/ITEM-Z8-live-inventory-reservation-consistency-report-20260610-005437.md`
- `git-diffs/20260610-ITEM-Z8-live-inventory-reservation-consistency.diff`
- `git-diffs/20260610-ITEM-Z8-live-inventory-reservation-consistency-stat.txt`

## Smoke API/visual

No hubo smoke API mutante ni visual real.

Resultado del smoke no destructivo:

- `http://localhost:8080/api/health` no respondio porque no habia servidor local disponible en ese puerto.

No se ejecutaron mutaciones sobre reservas LIVE porque no habia ambiente, credenciales y dataset desechable seguro.

Resultado:

- `PENDING_QA_API_OR_VISUAL`

## Validaciones

- Backend primer intento: `FAIL_ENV`, Spring intento conectar a MySQL como root sin password.
- Backend reintento con `.env` cargado sin imprimir secretos: `PASS`.
- `npm.cmd run lint`: `PASS` con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: `PASS`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: `PASS`.
- `git --no-pager diff --check`: primer intento detecto lineas en blanco al EOF en archivos nuevos; corregido antes del commit.
- `git --no-pager diff --cached --check`: `PASS` despues de normalizar el artefacto `.diff`.

## Restricciones confirmadas

No se tocaron:

- pagos funcionalmente;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- RBAC;
- permisos;
- endpoints;
- migraciones;
- venta financiera.

## Riesgos restantes

- Falta QA API/visual real con dataset LIVE controlado.
- Datos legacy inconsistentes, si existen, requieren correccion administrativa.
- Conversion financiera real de LIVE a venta/pago/caja sigue pendiente y fuera de ITEM-Z8.

## Checklist QA pendiente

1. Poner prenda `AVAILABLE` al aire y confirmar que sigue `AVAILABLE`.
2. Confirmar badge `Actualmente al aire` en selector LIVE.
3. Apartar la prenda al aire y confirmar `AVAILABLE -> RESERVED`.
4. Intentar doble apartado y confirmar rechazo.
5. Marcar `OPERATIONAL_SOLD` sobre reserva LIVE `ACTIVE` + item `RESERVED`.
6. Confirmar que no se crea venta, pago ni movimiento de caja.
7. Confirmar evento `LIVE_OPERATIONAL_SOLD`.
8. Intentar `OPERATIONAL_SOLD` sobre `CANCELLED`, `CONVERTED_TO_SALE` y item no `RESERVED`.
9. Cancelar reserva `ACTIVE` sin pago y confirmar `RESERVED -> AVAILABLE`.
10. Cancelar reserva con pago activo y confirmar bloqueo.

## Resultado

`GO_TECNICO` / `PENDING_QA_API_OR_VISUAL`.

Siguiente fase recomendada:

- QA API/visual real con dataset LIVE desechable, o handoff de conversion financiera LIVE si arquitectura lo aprueba.
