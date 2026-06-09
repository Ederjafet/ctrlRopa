# ITEM-Z2 - Live active item eligibility report

Fecha: 2026-06-09 11:51:30

Rama: `feature/item-z2-live-active-item-eligibility`

## Resumen

ITEM-Z2 implemento una validacion backend minima para que `LiveService.setActiveItem` solo acepte prendas con `ItemStatus.AVAILABLE` al poner o cambiar la prenda al aire.

Resultado:

- `GO_TECNICO`
- `PENDING_QA_VISUAL`

No hubo navegador real ni screenshots en esta corrida.

## Historial previo validado

Commits confirmados en historial:

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
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
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`

Auditoria:

- `git grep -n "setActiveItem|active_item_id|activeItem|ItemStatus|AVAILABLE|RESERVED|SOLD|DISABLED|ON_CONSIGNMENT" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components docs ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "LiveService|ReservationService|ItemRepository|ProductRepository|ItemStatus|status" -- backend/control-ropa/src/main/java backend/control-ropa/src/test docs ':!node_modules' ':!.expo' ':!dist' ':!build'`
- `git grep -n "PRENDA AL AIRE|prenda al aire|cambiar prenda|retirar prenda|apartado|reservada|vendido operativo" -- app services components locales docs ':!node_modules' ':!.expo' ':!dist' ':!build'`

Validaciones:

- `./mvnw.cmd test` con `.env` cargado en el proceso, sin imprimir secretos: PASS.
- `npm.cmd run lint`: PASS con 53 warnings preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS, solo warnings CRLF.

Nota: una ejecucion inicial de Maven sin variables de entorno fallo porque `CONTROL_ROPA_DB_PASSWORD` no estaba cargado en el proceso. La ejecucion final cargo `.env` de forma local, no imprimio passwords y paso correctamente.

## Archivos tocados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `docs/ITEM_Z2_LIVE_ACTIVE_ITEM_ELIGIBILITY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `qa-reports/ITEM-Z2-live-active-item-eligibility-report-20260609-115130.md`

## Implementacion

`LiveService.setActiveItem` ahora valida:

- `AVAILABLE`: permitido.
- `RESERVED`: rechazado.
- `SOLD`: rechazado.
- `DISABLED`: rechazado.
- `ON_CONSIGNMENT`: rechazado.

Mensaje de rechazo:

```text
Solo se pueden poner al aire prendas disponibles
```

La validacion conserva:

- permiso y tenant/branch checks existentes;
- `DO_LIVE_RESERVATION` y `ReservationService`;
- `lives.active_item_id` como referencia LIVE;
- `items.status` intacto al poner/cambiar/retirar prenda al aire.

## Pruebas agregadas/ajustadas

`LiveServiceTests`:

- `setActiveItemPersistsItemOnSameBranch`: confirma que una prenda `AVAILABLE` puede ponerse al aire y conserva su status.
- `setActiveItemRejectsUnavailableItemStatuses`: parameterized test para `RESERVED`, `SOLD`, `DISABLED`, `ON_CONSIGNMENT`.
- `clearActiveItemDoesNotChangeInventoryStatus`: confirma que retirar active item no cambia inventario.

Surefire:

- `com.hpsqsoft.ctrlropa.live.LiveServiceTests`: 9 tests, 0 failures, 0 errors, 0 skipped.

## Exclusiones confirmadas

No se tocaron:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- RBAC;
- permisos;
- endpoints;
- migraciones;
- venta financiera;
- persistencia de prenda preparada.

## Riesgos

- La doble reserva/concurrencia queda para ITEM-Z3.
- La prenda preparada sigue siendo temporal frontend.
- No hubo smoke visual/API autenticado con usuarios reales.
- El mensaje backend debe validarse en UI con los mappers de error existentes.

## Checklist QA pendiente

1. Poner al aire prenda `AVAILABLE`.
2. Intentar poner al aire prenda `RESERVED`.
3. Intentar poner al aire prenda `SOLD`.
4. Intentar poner al aire prenda `DISABLED`.
5. Intentar poner al aire prenda `ON_CONSIGNMENT`.
6. Retirar prenda al aire y confirmar que el status de inventario no cambia.
7. Apartar en LIVE y confirmar que `ReservationService` conserva el bloqueo real de inventario.

## GO / NO-GO

Resultado: `GO_TECNICO`.

Pendiente: `PENDING_QA_VISUAL`.

Siguiente fase recomendada: ITEM-Z3 para doble reserva/disponibilidad y atomicidad de `AVAILABLE -> RESERVED`.
