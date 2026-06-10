# LIVE-AUTH-B1 operational authorizations MVP report

Fecha: 2026-06-10 13:26:34
Rama: feature/live-auth-b1-operational-authorizations-mvp

## Resultado ejecutivo

Se implemento MVP backend de autorizaciones operativas LIVE siguiendo B0.

Resultado esperado:

- `GO_TECNICO` si validaciones completas pasan.
- `PARTIAL_GO_BACKEND` porque la UI queda pendiente documentada.
- `PENDING_QA_VISUAL` porque no hubo navegador/screenshots.

No se implemento pagos/caja, precio LIVE, devoluciones ni venta financiera.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -120`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B0"`
- `git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-FIX-A1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git grep -n "LIVE_AUTH_B0|OPERATIONAL_AUTHORIZATION|REQUEST_LIVE_OPERATION_AUTHORIZATION|APPROVE_LIVE_OPERATION_AUTHORIZATION|APPLY_LIVE_OPERATION_AUTHORIZATION|CANCEL_RESERVATION_WITH_PAYMENT|UNDO_LIVE_OPERATIONAL_SALE|REASSIGN_RESERVATION|EDIT_LOCKED_ITEM" -- ...`
- `git grep -n "PermissionCode|permissions|role_permissions|V5|V54|V53|V52|Flyway|INSERT INTO.*permission" -- ...`
- `git grep -n "ReservationService|LiveService|PaymentAllocation|PaymentStatus.ACTIVE|OPERATIONAL_SOLD|LIVE_OPERATIONAL_SOLD|cancel|reassign|assign|edit.*item|ItemStatus.RESERVED" -- ...`
- `git grep -n "Controller|@RestController|RequestMapping|PostMapping|PatchMapping|security|AccessService|assertCan|hasPermission" -- ...`
- `Get-Content docs/LIVE_AUTH_B0_OPERATIONAL_AUTHORIZATIONS_HANDOFF.md`
- `Get-Content` de controladores, repositorios, migraciones y tests relevantes.
- `./mvnw.cmd -Dtest=OperationalAuthorizationServiceTests test`

## Validacion de historial

- `ed69ecf LIVE-AUTH-B0 documenta autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`
- `a5541e4 ITEM-Z7 asegura vendido operativo live`
- `7490809 ITEM-Z6B libera reservas de forma segura`
- `3826a43 ITEM-Z5D registra rechazos de reserva`

## Archivos tocados

Backend:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/operationauth/*`
- `backend/control-ropa/src/main/resources/db/migration/V55__live_operational_authorizations_mvp.sql`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/operationauth/OperationalAuthorizationServiceTests.java`

Docs/reportes:

- `docs/LIVE_AUTH_B1_OPERATIONAL_AUTHORIZATIONS_MVP.md`
- `docs/ERP_BITACORA_CAMBIOS.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`
- `qa-reports/LIVE-AUTH-B1-operational-authorizations-mvp-report-20260610-132634.md`

## Migracion

Nueva migracion:

- `V55__live_operational_authorizations_mvp.sql`

Incluye:

- permisos nuevos;
- tabla `operational_authorization_requests`;
- asignacion `ADMIN`/`SUPERVISOR` para solicitud/vista/aprobacion/aplicacion y acciones finas;
- asignacion `SELLER` solo para solicitud y `UNDO_LIVE_OPERATIONAL_SALE`.

## Permisos

Permisos creados:

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`

## Endpoints

Base: `/api/operational-authorizations`.

- `POST /api/operational-authorizations`
- `GET /api/operational-authorizations/branch/{branchId}`
- `GET /api/operational-authorizations/pending/branch/{branchId}`
- `GET /api/operational-authorizations/mine/branch/{branchId}`
- `GET /api/operational-authorizations/{id}`
- `PATCH /api/operational-authorizations/{id}/approve`
- `PATCH /api/operational-authorizations/{id}/reject`
- `PATCH /api/operational-authorizations/{id}/cancel`
- `POST /api/operational-authorizations/{id}/apply`

## Implementacion

Se implemento:

- entidad `OperationalAuthorizationRequest`;
- estados `REQUESTED`, `APPROVED`, `REJECTED`, `APPLIED`, `EXPIRED`, `CANCELLED`;
- tipos `CANCEL_RESERVATION_WITH_PAYMENT`, `RELEASE_RESERVED_ITEM`, `UNDO_LIVE_OPERATIONAL_SALE`, `REASSIGN_RESERVATION`, `EDIT_LOCKED_ITEM`;
- snapshot minimo con hash;
- bloqueo de duplicado pendiente;
- bloqueo de self-approval;
- expiracion lazy;
- aplicacion solo para `UNDO_LIVE_OPERATIONAL_SALE` sin pago activo;
- evento `LIVE_OPERATIONAL_SOLD_UNDONE`.

No se implemento:

- aplicacion de cancelacion con pago;
- reversa financiera;
- caja;
- precio LIVE;
- devoluciones;
- venta financiera;
- frontend/cola visual.

## Tests

Focal:

- `./mvnw.cmd -Dtest=OperationalAuthorizationServiceTests test`: PASS, 5 tests.

Cobertura:

- permiso de solicitud y permiso fino;
- self-approval bloqueado;
- seller/no aprobador bloqueado si `AccessService` deniega;
- rechazadas no aplican;
- deshacer vendido operativo sin pago revierte a `RESERVED` y registra evento.

## Validaciones tecnicas

- `./mvnw.cmd -Dtest=OperationalAuthorizationServiceTests test`: PASS, 5 tests.
- `./mvnw.cmd test`: FAIL por ambiente local, `Access denied for user 'root'@'localhost' (using password: NO)` al inicializar Flyway en `ControlRopaApplicationTests`. Los tests unitarios focalizados de B1 si pasan.
- `npm.cmd run lint`: PASS con advertencias preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: cambios esperados staged antes del commit.

## GO/NO-GO

- `PARTIAL_GO_BACKEND`: backend MVP implementado y test focalizado PASS; frontend/cola visual queda pendiente.
- `PENDING_QA_VISUAL`: no hubo navegador/screenshots.
- `PENDING_FULL_BACKEND_ENV`: suite backend completa bloqueada por credenciales locales de base de datos, no por fallo del test focalizado B1.

## Confirmacion de alcance

- No se toco precio LIVE.
- No se implementaron pagos/caja.
- No se creo venta financiera.
- No se implementaron devoluciones.
- No se cambio flujo financiero.
- No se borro data.
- No se marco `QA_PASS`.
