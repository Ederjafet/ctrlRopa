# ITEM-Z3B - Reservation atomic update report

Fecha: 2026-06-09 13:05:13
Rama: `feature/item-z3b-reservation-atomic-update`
Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Objetivo

Implementar proteccion backend real contra doble reserva usando update atomico condicional `AVAILABLE -> RESERVED`.

## Historial previo validado

Comandos ejecutados:

- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z2"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`

Commits confirmados:

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5748040 ITEM-Z3A documenta handoff atomicidad reservas`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `5c7aced LIVE-PERM-A2 ajusta capacidades live por rol`
- `c818cb1 LIVE-PERM-A3 documenta smoke visual por rol`

## Archivos tocados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceTests.java`
- `docs/ITEM_Z3B_RESERVATION_ATOMIC_UPDATE.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

## Implementacion

- Se agrego `ItemRepository.reserveIfAvailable(...)` con `@Modifying` y JPQL condicional.
- `ReservationService.create` ahora intenta reservar con filtro por company, branch, item y `ItemStatus.AVAILABLE`.
- Si el update afecta `1` fila, se crea la reserva.
- Si el update afecta `0` filas, se rechaza con `La prenda ya no esta disponible para apartar`.
- No se creo migracion.
- No se crearon endpoints.
- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.

## Tests agregados

`ReservationServiceTests` cubre:

- reserva exitosa con item `AVAILABLE`;
- rechazo de item `RESERVED`;
- rechazo de item `SOLD`;
- rechazo de item `DISABLED`;
- rechazo de item `ON_CONSIGNMENT`;
- rechazo si el update atomico afecta cero filas;
- reserva LIVE conserva `DO_LIVE_RESERVATION` y usa update atomico.

Resultado del test especifico:

- Tests run: 7
- Failures: 0
- Errors: 0
- Skipped: 0

## Validaciones ejecutadas

- PASS: `./mvnw.cmd test`
- PASS: `npm.cmd run lint`
  - 0 errores.
  - 53 warnings historicos fuera de alcance.
- PASS: `npx.cmd tsc --noEmit`
- PASS: `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

Validaciones Git:

- PASS: `git --no-pager diff --check`
- PASS: `git --no-pager diff --cached --check`
- PASS: `git status`

## Observaciones

- Maven mostro warning historico de Logback por acceso denegado al archivo local `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`; no fallo pruebas.
- No se ejecuto QA visual ni API manual con usuarios reales en navegador.

## Riesgos pendientes

- Idempotency key para doble submit exacto.
- Constraint unico de reserva activa por item.
- Auditoria de negocio mas granular.
- QA API/visual con datos reales.

## GO/NO-GO

- `GO_TECNICO`: backend/frontend pasan validaciones tecnicas.
- `PENDING_QA_VISUAL`: falta evidencia visual/API real.
- `NO_GO`: no aplica en esta corrida.
