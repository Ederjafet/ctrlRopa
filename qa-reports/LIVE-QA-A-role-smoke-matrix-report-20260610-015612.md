# LIVE-QA-A - Reporte QA tecnico por roles

Fecha: 2026-06-10 01:56
Rama: `feature/live-qa-a-role-smoke-matrix`
Estado: `GO_TECNICO_API` / `PENDING_QA_VISUAL` / `PENDING_MUTATION_DATASET`

## Resumen

LIVE-QA-A preparo la matriz QA LIVE por roles y ejecuto smoke API no destructivo contra backend local en `http://localhost:8090`. No se implemento funcionalidad nueva.

Se validaron healthcheck, `/api/me` sin token, login y `/api/me` para usuarios QA documentados. No se ejecutaron mutaciones de LIVE/reservas porque no se identifico dataset desechable seguro.

## Comandos ejecutados

Preflight:

- `git branch --show-current`
- `git status`
- `git log --oneline -80`

Historial:

- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z4"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z5D"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6B"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z6C"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`

Auditoria:

- `git grep -n "[qa.admin@local.test](mailto:qa.admin@local.test)|qa.supervisor.centro|qa.vendedor.centro|qa.sinpermisos" -- docs backend app services qa-reports ...`
- `git grep -n "VIEW_LIVE|OPERATE_LIVE|PREPARE_LIVE_ITEM|CHANGE_LIVE_ACTIVE_ITEM|REMOVE_LIVE_ACTIVE_ITEM|DO_LIVE_RESERVATION" -- backend/control-ropa/src/main/java backend/control-ropa/src/main/resources app services docs qa-reports ...`
- `git grep -n "ReservationService|LiveService|setActiveItem|reserveIfAvailable|releaseIfReserved|OPERATIONAL_SOLD|LIVE_OPERATIONAL_SOLD|X-Idempotency-Key" -- backend/control-ropa/src/main/java backend/control-ropa/src/test app services docs qa-reports ...`
- `git grep -n "login|/api/me|/api/reservations|/api/lives|health|auth" -- backend/control-ropa/src/main/java app services docs qa-reports ...`

Smoke API no destructivo:

- `GET http://localhost:8080/api/health`
- `GET http://localhost:8090/api/health`
- `GET http://localhost:8090/api/me` sin token
- `POST http://localhost:8090/api/auth/login` para usuarios QA documentados, sin imprimir passwords ni tokens
- `GET http://localhost:8090/api/me` con token para usuarios con login OK, sin imprimir token
- `POST http://localhost:8090/api/auth/logout` para cerrar sesiones creadas por el smoke

## Commits confirmados

- `5f5cf4d` LIVE-PERM-A1 agrega permisos live minimos
- `4975138` LIVE-PERM-A1B corrige dependencias de permisos live
- `6c757c9` LIVE-PERM-A1 documenta cierre final
- `5c7aced` LIVE-PERM-A2 ajusta capacidades live por rol
- `c818cb1` LIVE-PERM-A3 documenta smoke visual por rol
- `92e937a` ITEM-Z3B protege reserva atomica
- `ce0e2b5` ITEM-Z4 distingue prenda al aire en selector live
- `6f1ee15` ITEM-Z5B agrega idempotencia de reservas
- `ef8d255` ITEM-Z5C protege reserva activa por item
- `3826a43` ITEM-Z5D registra rechazos de reserva
- `7490809` ITEM-Z6B libera reservas de forma segura
- `5c0cf22` ITEM-Z6C documenta smoke liberacion reservas
- `a5541e4` ITEM-Z7 asegura vendido operativo live
- `90ab2eb` ITEM-Z8 valida consistencia live inventario reservas

## Usuarios QA encontrados

Se encontraron referencias documentales a:

- `qa.admin@local.test`
- `qa.supervisor.centro@local.test`
- `qa.vendedor.centro@local.test`
- `qa.sinpermisos@local.test`

La password QA se obtuvo desde documentacion local y no se imprimio.

## Resultado smoke API

| Check | Resultado |
|---|---|
| `GET /api/health` en `localhost:8080` | sin servidor disponible |
| `GET /api/health` en `localhost:8090` | 200 |
| `GET /api/me` sin token en `localhost:8090` | 401 |
| `qa.admin@local.test` login | OK |
| `qa.admin@local.test` `/api/me` | OK |
| `qa.supervisor.centro@local.test` login | OK |
| `qa.supervisor.centro@local.test` `/api/me` | OK |
| `qa.vendedor.centro@local.test` login | OK |
| `qa.vendedor.centro@local.test` `/api/me` | OK |
| `qa.sinpermisos@local.test` login | 403 esperado |

Permisos LIVE observados:

| Usuario | Permisos LIVE |
|---|---|
| `qa.admin@local.test` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.supervisor.centro@local.test` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.vendedor.centro@local.test` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `VIEW_LIVE` |
| `qa.sinpermisos@local.test` | ninguno, login 403 |

Hallazgo esperado:

- Vendedor no tiene `REMOVE_LIVE_ACTIVE_ITEM`.
- Admin y supervisor tienen los 6 permisos LIVE.
- Usuario sin permisos no obtiene sesion.

## Smoke no ejecutado

No se ejecutaron:

- crear/activar/cerrar LIVE;
- poner prenda al aire;
- crear reserva;
- reintento idempotente;
- cancelacion;
- `OPERATIONAL_SOLD`;
- consulta de eventos sobre dataset real.

Motivo:

- No habia dataset desechable identificado para mutar inventario/reservas sin riesgo.
- No hubo navegador/screenshots reales.

Resultado pendiente:

- `PENDING_QA_VISUAL`
- `PENDING_MUTATION_DATASET`

## Archivos creados

- `docs/LIVE_QA_A_ROLE_SMOKE_MATRIX.md`
- `qa-reports/LIVE-QA-A-role-smoke-matrix-report-20260610-015612.md`
- `git-diffs/20260610-LIVE-QA-A-role-smoke-matrix.diff`
- `git-diffs/20260610-LIVE-QA-A-role-smoke-matrix-stat.txt`

## Validaciones tecnicas

- `./mvnw.cmd test`: `PASS` cargando `.env` en el proceso sin imprimir valores.
- `npm.cmd run lint`: `PASS` con 53 warnings preexistentes y 0 errores.
- `npx.cmd tsc --noEmit`: `PASS`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: `PASS`.
- `git --no-pager diff --check`: primer intento detecto linea en blanco al EOF en el documento nuevo; corregido antes del commit.
- `git --no-pager diff --cached --check`: `PASS`.

## Restricciones confirmadas

No se tocaron:

- backend funcional;
- frontend funcional;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- RBAC;
- permisos;
- endpoints;
- migraciones;
- venta financiera.

## Resultado

Resultado tecnico actual:

- `GO_TECNICO_API` para smoke no destructivo.
- `PENDING_QA_VISUAL` por falta de navegador/screenshots.
- `PENDING_MUTATION_DATASET` por falta de dataset desechable para flujo mutante completo.

Siguiente fase recomendada:

- LIVE-QA-B: ejecutar flujo visual/API completo con dataset LIVE desechable y capturas por rol.
