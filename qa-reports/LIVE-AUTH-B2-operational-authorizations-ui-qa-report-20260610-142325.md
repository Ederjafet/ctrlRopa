# LIVE-AUTH-B2 operational authorizations UI QA report

Fecha: 2026-06-10 14:23:25
Rama: `feature/live-auth-b2-operational-auth-ui-qa`

## Resultado ejecutivo

Se implemento UI minima para autorizaciones operativas LIVE usando los endpoints reales de B1.

Resultado esperado:

- `GO_TECNICO` si validaciones pasan.
- `PENDING_QA_VISUAL` si no hay navegador/screenshots reales.
- `PENDING_QA_API_MUTATION` si no se usa dataset desechable para crear/aprobar/aplicar.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -120`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B1A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-B0"`
- `git --no-pager log --oneline --all --decorate --grep="RELEASE-LIVE-BASE-RC1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C2"`
- auditorias `git grep` de operational authorizations, permisos, migraciones y patrones frontend
- lectura no interactiva de controller, DTOs, servicios, navegacion e i18n

## Historial validado

- `290369c LIVE-AUTH-B1 implementa autorizaciones operativas`
- `a1777c7 LIVE-AUTH-B1A corrige migracion autorizaciones live`
- `ed69ecf LIVE-AUTH-B0 documenta autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`

## Endpoints detectados

- `POST /api/operational-authorizations`
- `GET /api/operational-authorizations/branch/{branchId}`
- `GET /api/operational-authorizations/pending/branch/{branchId}`
- `GET /api/operational-authorizations/mine/branch/{branchId}`
- `GET /api/operational-authorizations/{id}`
- `PATCH /api/operational-authorizations/{id}/approve`
- `PATCH /api/operational-authorizations/{id}/reject`
- `PATCH /api/operational-authorizations/{id}/cancel`
- `POST /api/operational-authorizations/{id}/apply`

## UI implementada

- Servicio frontend `services/operationalAuthorizationService.ts`.
- Pantalla `/operational-authorizations`.
- Entrada de navegacion en `Operacion`.
- Textos i18n ES/EN.
- Listado, detalle, creacion, aprobacion, rechazo y aplicacion soportada por backend.

## Smoke API

Ejecutado sin mutaciones reales:

- `GET /api/health`: `200`.
- `GET /api/me` sin token: `401`.
- Login `qa.admin@local.test`: OK, sin imprimir token.
- `GET /api/me` admin: OK, branch `4`, permisos efectivos detectados.
- `GET /api/operational-authorizations/branch/4`: OK, `count=0`.
- Login `qa.vendedor.centro@local.test`: OK, sin imprimir token.
- `GET /api/me` vendedor: OK, branch `4`, permisos efectivos detectados.
- `GET /api/operational-authorizations/mine/branch/4`: OK, `count=0`.

No se ejecutaron mutaciones porque no se identifico dataset desechable para crear/aprobar/aplicar una autorizacion real.

## Validaciones

- `./mvnw.cmd test`: PASS con `.env` cargado sin imprimir secretos; Flyway valido 56 migraciones.
- `npm.cmd run lint`: PASS con 53 advertencias preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS, incluye ruta `/operational-authorizations`.
- `git --no-pager diff --check`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: cambios esperados staged antes del commit.

## Alcance

No se toco pagos, caja, precio LIVE, devoluciones, venta financiera, RBAC, permisos, endpoints ni migraciones.

## Estado

- `GO_TECNICO`
- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`
- `PENDING_QA_API_MUTATION`
