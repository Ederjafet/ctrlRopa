# LIVE-QA-B - Reporte QA real asistido por rol

Fecha: 2026-06-10 09:09:13 -06:00
Rama: `feature/live-qa-b-real-role-smoke`
Resultado: `GO_TECNICO_API` / `PENDING_QA_API_OR_VISUAL`

## Resumen

LIVE-QA-B ejecuto smoke API real no destructivo por rol contra `http://localhost:8090`, confirmo frontend Expo Web levantado en `http://localhost:8081` y `http://192.168.0.128:8081`, y documento bloqueos para visual/mutaciones. No se aplicaron fixes ni cambios funcionales.

No se marca `QA_PASS` porque faltan screenshots/navegador real y dataset desechable identificado para ejecutar flujo mutante completo.

## Comandos ejecutados

Preflight:

- `git branch --show-current`
- `git status`
- `git log --oneline -90`

Historial:

- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`

Auditoria:

- `git grep -n "qa.admin@local.test\|qa.supervisor.centro\|qa.vendedor.centro\|qa.sinpermisos" -- docs backend app services qa-reports ...`
- `git grep -n "login\|/api/me\|auth\|token\|permissions\|roles\|LIVE_QA_A\|LIVE-QA-A" -- backend/control-ropa/src/main/java app services docs qa-reports ...`
- `git grep -n "VIEW_LIVE\|OPERATE_LIVE\|PREPARE_LIVE_ITEM\|CHANGE_LIVE_ACTIVE_ITEM\|REMOVE_LIVE_ACTIVE_ITEM\|DO_LIVE_RESERVATION" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources app services docs qa-reports ...`
- `git grep -n "setActiveItem\|reserveIfAvailable\|releaseIfReserved\|OPERATIONAL_SOLD\|LIVE_OPERATIONAL_SOLD\|X-Idempotency-Key\|Currently\|Actualmente al aire" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services components locales docs qa-reports ...`
- `rg --files -g '*playwright*' -g '*e2e*' -g '*browser*'`
- `rg -n "desechable|descartable|sandbox|QA LIVE|LIVE.*QA|dataset.*LIVE|live.*dataset|item.*QA|prenda.*QA" docs qa-reports backend/control-ropa/src/main/resources ...`

Smoke API no destructivo:

- `GET http://localhost:8090/api/me` sin token.
- `GET http://localhost:8090/api/health`.
- `GET http://localhost:8081`.
- `GET http://192.168.0.128:8081`.
- `POST http://localhost:8090/api/auth/login` para usuarios QA documentados, sin imprimir password ni token.
- `GET http://localhost:8090/api/me` con token temporal por usuario con login OK.
- `POST http://localhost:8090/api/auth/logout` por sesion temporal.
- `GET http://localhost:8090/api/lives/branch/4`.
- `GET http://localhost:8090/api/items/branch/4`.
- `GET http://localhost:8090/api/reservations/branch/4`.

## Commits confirmados

- `33ba0c3` LIVE-QA-A prepara matriz smoke live por rol
- `90ab2eb` ITEM-Z8 valida consistencia live inventario reservas
- `a5541e4` ITEM-Z7 asegura vendido operativo live
- `7490809` ITEM-Z6B libera reservas de forma segura
- `3826a43` ITEM-Z5D registra rechazos de reserva
- `6c757c9` LIVE-PERM-A1 documenta cierre final
- `4975138` LIVE-PERM-A1B corrige dependencias de permisos live
- `9ad9e37` LIVE-PERM-A1 ajusta capacidades sensibles
- `5f5cf4d` LIVE-PERM-A1 agrega permisos live minimos

## Backend/frontend

| Check | Resultado |
|---|---|
| `GET /api/me` sin token | `401` esperado |
| `GET /api/health` | `200` |
| `GET http://localhost:8081` | `200` |
| `GET http://192.168.0.128:8081` | `200` |

## Usuarios QA

| Usuario | Login | `/api/me` | Permisos LIVE |
|---|---|---|---|
| `qa.admin@local.test` | OK | OK | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.supervisor.centro@local.test` | OK | OK | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.vendedor.centro@local.test` | OK | OK | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `VIEW_LIVE` |
| `qa.sinpermisos@local.test` | `403` esperado | No aplica | ninguno |

## Smoke visual

Pendiente.

Motivo:

- Browser Use no expuso `node_repl/js` en esta sesion.
- No hay Playwright/Puppeteer ni scripts e2e locales instalados.
- No se generaron screenshots.

## Dataset y mutaciones

Lecturas reales:

- branch `QA_CTR`, id `4`;
- `GET /api/lives/branch/4`: `200`, 14 registros;
- `GET /api/items/branch/4`: `200`, 90 registros;
- `GET /api/reservations/branch/4`: `200`, 43 registros;
- live activo observado: id `14`, active item `95`;
- items: `AVAILABLE:44`, `RESERVED:43`, `SOLD:3`;
- reservas: `ACTIVE:43`.

No se ejecutaron mutaciones porque no se identifico dataset LIVE desechable inequívoco. Se evitaron crear/cambiar live, apartar, cancelar, reintentar idempotencia y marcar `OPERATIONAL_SOLD`.

## Fixes

No se aplicaron fixes.

Confirmacion: no se tocaron backend funcional, frontend funcional, pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints, migraciones ni venta financiera.

## Validaciones tecnicas

- `./mvnw.cmd test`: `PASS` en tercer intento cargando `.env` en memoria sin imprimir secretos y quitando comillas envolventes de valores. Los dos primeros intentos fallaron por configuracion de entorno del proceso: primero sin `.env`, luego con comillas literales en el JDBC URL.
- `npm.cmd run lint`: `PASS` con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: `PASS`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: `PASS`.
- `git --no-pager diff --check`: `PASS`.
- `git --no-pager diff --cached --check`: `PASS`.
- `git status`: limpio despues del commit esperado.

## Resultado

Resultado tecnico: `GO_TECNICO_API`.

Estado final QA: `PENDING_QA_API_OR_VISUAL`.

No se marca `QA_PASS` por falta de evidencia visual real y flujo mutante completo sobre dataset desechable.

Siguiente fase recomendada: LIVE-QA-C con navegador real/screenshot y dataset LIVE desechable identificado.
