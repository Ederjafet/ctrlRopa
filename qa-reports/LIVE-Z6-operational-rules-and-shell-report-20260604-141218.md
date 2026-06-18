# LIVE-Z6A - Operational Rules and Shell QA Report

## Contexto

- Rama: `feature/live-z6-operational-rules-and-shell`
- Fecha: 2026-06-04 14:12
- Alcance: migracion visual de `/live` al nuevo `AppShell`.

## Archivos revisados

- `app/live.tsx`
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`
- `app/index.tsx`
- `components/templates/OperationalTemplate.tsx`
- `components/templates/MonitoringTemplate.tsx`
- `docs/ERP_LIVE_Z5_OPERATOR_ACTOR_UX.md`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## Archivos modificados

- `app/live.tsx`
- `docs/ERP_LIVE_Z5_OPERATOR_ACTOR_UX.md`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## Archivos creados

- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `qa-reports/LIVE-Z6-operational-rules-and-shell-report-20260604-141218.md`
- `git-diffs/20260604-LIVE-Z6-operational-rules-and-shell.diff`
- `git-diffs/20260604-LIVE-Z6-operational-rules-and-shell-stat.txt`

## Cambios aplicados

- `/live` ahora se renderiza dentro de `AppShell`.
- El header viejo de LIVE se retiro; `TopBar` muestra titulo y subtitulo.
- Se agrego `buildLiveNavSections` para usar sidebar con permisos reales.
- Se mantiene `activeRoute="live"` para resaltar LIVE.
- Se conserva logout, drawer responsive y sidebar fijo desde `AppShell`.
- Se mantuvieron modales LIVE fuera del shell para no romper flujos existentes.
- No se cambio backend ni reglas profundas.

## Decision visual

No se forzo `OperationalTemplate`/`MonitoringTemplate` en Z6A.

Motivo:
- La pantalla LIVE ya tiene layouts por dispositivo y actor.
- Reestructurar bloques internos en templates seria una migracion funcional/visual mayor.
- Z6A busca integrar shell y navegacion sin alterar reglas.

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.

## Validaciones no ejecutadas

- QA visual manual con usuarios reales: pendiente.
- Validacion multiusuario de polling: pendiente.

## Warnings

- Lint conserva 60 warnings preexistentes del repo.
- Backend reporta warnings preexistentes de MySQL 5.7 y Mockito dynamic agent.
- Git reporta conversion futura LF/CRLF en `app/live.tsx`.

## QA manual esperado

ADMIN / Operador:
- Ver AppShell/sidebar.
- Preparar prenda.
- Poner al aire.
- Reservar.
- Confirmar bloqueo de prenda ya reservada.
- Finalizar LIVE.

Vendedor / Presentadora:
- Ver AppShell.
- Ver prenda al aire y precio.
- No ver consola operador ni dashboard supervisor.

Supervisor:
- Ver AppShell.
- Ver dashboard de monitoreo/control.
- Ver prenda al aire, reservas y eventos.

NO_ACCESS:
- Queda bloqueado por guard existente.

## GO/NO-GO

GO tecnico para LIVE-Z6A.

GO visual condicionado a QA manual responsive y por actor.
