# LIVE-PRICE-C price authorization report

Fecha: 2026-06-10 15:38:28
Rama: `feature/live-price-c-price-authorization`

## Resultado ejecutivo

Se implemento MVP seguro de autorizacion de cambio de precio LIVE sobre `reservations.price`, reutilizando `operational_authorization_requests`.

Resultado esperado:

- `GO_TECNICO`
- `PENDING_QA_VISUAL`
- `PENDING_QA_API_MUTATION`

No se marca `QA_PASS` porque no hubo evidencia visual ni smoke API mutante real de esta fase.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -140`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B3"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B1"`
- `git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-Z10B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- auditorias `git grep` de precio, autorizaciones operativas, LIVE/items/reservas y permisos
- lectura no interactiva de entidades `Item`, `Reservation`, `Sale`, `PermissionCode`, `OperationalAuthorizationService` y diseno `LIVE_Z10B`

## Historial validado

- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `385c1b9 LIVE-AUTH-B2 agrega UI autorizaciones operativas`
- `290369c LIVE-AUTH-B1 implementa autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`
- `72235e8 LIVE-Z10B diseña autorizacion de precio live`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Modelo de precio encontrado

- `items.price`: precio sugerido/base.
- `reservations.price`: precio confirmado del apartado.
- `sales.price`: precio historico de venta.

No se encontro precio LIVE temporal independiente. Por eso el MVP aplica solo sobre reserva LIVE activa sin pago.

## Implementacion

Backend:

- `LIVE_PRICE_CHANGE` en `OperationalAuthorizationType`.
- `PermissionCode` agrega permisos de precio LIVE.
- `OperationalAuthorizationService` valida solicitud, aprobacion y aplicacion.
- `V57__live_price_authorization_permissions.sql` agrega permisos/asignaciones idempotentes.
- `LiveEventType.LIVE_PRICE_CHANGE_APPLIED`.
- Tests focalizados en `OperationalAuthorizationServiceTests`.

Frontend:

- `/operational-authorizations` incluye `LIVE_PRICE_CHANGE`.
- Formulario exige ID de apartado LIVE y precio solicitado.
- UI envia `payloadJson` con `requestedPrice`.
- Aplicacion soportada cuando backend y permisos lo permiten.

## Permisos / migraciones / endpoints

Permisos creados:

- `REQUEST_LIVE_PRICE_CHANGE`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`
- `CHANGE_LIVE_PRICE`

Migracion:

- `V57__live_price_authorization_permissions.sql`

Endpoints nuevos:

- Ninguno. Se reutilizan `/api/operational-authorizations`.

## Validaciones

- `./mvnw.cmd -Dtest=OperationalAuthorizationServiceTests test`: PASS, 8 tests.
- `./mvnw.cmd test`: PASS, 122 tests, Flyway valido 57 migraciones.
- `npm.cmd run lint`: PASS sin errores; 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS, incluye `/operational-authorizations`.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: staged esperado previo al commit; limpieza final se valida despues del commit.

## Alcance excluido

- pagos;
- caja;
- devoluciones;
- venta financiera;
- ventas cerradas;
- precio temporal LIVE sin apartado;
- cambio de `items.price` base.

## Resultado

- `GO_TECNICO`
- `PENDING_QA_VISUAL`
- `PENDING_QA_API_MUTATION`
