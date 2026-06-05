# LIVE-Z6B - Capabilities and Operational Rules QA Report

## Contexto

- Rama: `feature/live-z6-operational-rules-and-shell`
- Fecha: 2026-06-04 14:24
- Alcance: matriz de capacidades LIVE y reglas operativas sobre `/live`.

## Base

- LIVE-Z6A ya integro `/live` a `AppShell`.
- Z6B no crea actores paralelos; deriva capacidades desde AUTH real.

## Auditoria `/api/me`

API usada: `http://192.168.0.128:8090`.

Usuarios revisados:

- `qa.admin@local.test`: rol `ADMIN`; permisos LIVE/inventario/clientes/reportes/cancelacion detectados; sin `VIEW_PAYMENTS` listado.
- `qa.vendedor.centro@local.test`: rol `SELLER`; permisos `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `REGISTER_PAYMENTS`.
- `qa.supervisor.centro@local.test`: rol `SUPERVISOR`; permisos `DO_LIVE_RESERVATION`, `VIEW_REPORTS`, inventario/clientes/cancelacion/caja.
- `qa.sinpermisos@local.test`: login respondio `403 Forbidden`; no se obtuvo `/api/me`.

Detalle completo en `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`.

## Archivos revisados

- `app/live.tsx`
- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `services/accessControl.ts`
- `services/reservationService.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## Archivos modificados

- `app/live.tsx`
- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## Archivos creados

- `services/liveCapabilities.ts`
- `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`
- `qa-reports/LIVE-Z6-operational-rules-and-shell-report-20260604-142459.md`

## Cambios aplicados

- Se creo `resolveLiveCapabilities`.
- `liveActorResolver` deriva vista visual desde capacidades, no desde permisos paralelos.
- `livePermissionGuards` delega reglas LIVE al resolver central.
- `/live` controla acciones con capacidades especificas:
  - iniciar/cerrar live;
  - preparar/poner/sacar prenda al aire;
  - reservar;
  - cancelar apartado;
  - marcar pendiente;
  - marcar vendido operativo;
  - cambiar precio LIVE;
  - pagos/caja solo si aplican capacidades.
- `Cancelar apartado` ahora abre modal de motivo.
- `Marcar vendido` cambio a `Marcar vendido operativo`.
- Vendido operativo pide confirmacion y aclara que no confirma pago.
- Precio LIVE aclara que no modifica precio base.
- Si no hay permiso para cambiar precio LIVE, el campo queda solo lectura.

## Gaps documentados

- `VIEW_LIVE`
- `START_LIVE`
- `CLOSE_LIVE`
- `SET_LIVE_ACTIVE_ITEM`
- `CLEAR_LIVE_ACTIVE_ITEM`
- `CHANGE_LIVE_PRICE`
- `RELEASE_LIVE_RESERVED_ITEM`
- `VIEW_LIVE_DASHBOARD`
- Nota libre persistida para motivo `Otro`.
- Flujo formal de liberacion segura de prenda.

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.

## Validaciones pendientes de cierre

- Ninguna tecnica.

## Git final

- `git status --short`: cambios en `app/live.tsx`, docs/locales/servicios LIVE; nuevos `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`, `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`, `services/liveCapabilities.ts`.
- `git diff --stat`: OK, 7 archivos tracked modificados, 304 inserciones, 193 eliminaciones.
- `git diff --name-only`: OK.
- `git diff --check`: OK funcional; solo warnings LF/CRLF.
- Evidencias `qa-reports/` y `git-diffs/` generadas, pero ignoradas por `.gitignore`.

## QA manual esperado

ADMIN / Operador:
- ve consola operativa;
- puede iniciar/cerrar segun capacidades;
- puede poner prenda al aire;
- puede reservar;
- no puede doble reservar prenda ya apartada;
- cancelar apartado pide motivo;
- vendido operativo muestra confirmacion de no-pago.

Vendedor / Presentadora:
- ve apoyo visual;
- no ve dashboard supervisor;
- no ve acciones operativas si la vista/capacidad no corresponde.

Supervisor:
- ve dashboard de monitoreo/control;
- no cae en vista vendedor;
- acciones solo si se exponen por capacidades reales.

NO_ACCESS:
- queda bloqueado.

## Warnings

- Lint conserva 60 warnings preexistentes del repo.
- Se esperan warnings CRLF en `git diff --check`.
- Backend conserva warnings preexistentes de MySQL 5.7 y Mockito dynamic agent.

## GO/NO-GO

GO tecnico para LIVE-Z6B.

GO visual condicionado a QA manual por usuario/rol y revision de logs sin rafagas de pagos.
