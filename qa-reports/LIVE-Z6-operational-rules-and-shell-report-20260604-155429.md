# LIVE-Z6C - Pulido visual consola LIVE QA Report

## Contexto

- Rama: `feature/live-z6-operational-rules-and-shell`
- Fecha: 2026-06-04 15:54
- Alcance: pulido visual incremental de `/live` despues de Z6A/Z6B.

## Objetivo

Convertir la vista Operador de un formulario largo con muchas cajas apiladas a una consola operativa mas compacta y profesional, sin cambiar reglas funcionales, permisos, backend ni contratos.

## Archivos revisados

- `app/live.tsx`
- `components/live/LiveCommerceCards.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`

## Archivos modificados

- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`

## Cambios visuales aplicados

- Se suavizo el contenedor general del Operador:
  - fondo neutro;
  - borde del tema;
  - menos protagonismo naranja.
- Se compacto el header interno LIVE:
  - actor/vista;
  - `Reservas y seguimiento`;
  - Live #id;
  - sucursal;
  - ultima reserva;
  - estado.
- Se reordeno visualmente Operador:
  1. Prenda al aire ahora.
  2. Preparar siguiente prenda.
  3. Precio.
  4. Cliente / Interesado.
  5. Reserva.
- Precio, cliente y reserva se agruparon en grid responsive.
- Se elimino duplicacion del mensaje de prenda reservada dentro de la card de prenda al aire.
- La alerta de prenda reservada se muestra una sola vez como motivo operativo compacto.
- `RESERVAR AHORA` baja jerarquia visual cuando la prenda ya tiene reserva activa, pero conserva feedback por `disabledReason`.
- Reservas recientes son mas compactas al quitar una card anidada dentro de cada fila.
- Se redujeron paddings/alturas de cards, chips, placeholders y acciones de prenda.

## Que NO se cambio

- Backend.
- AUTH/RBAC.
- `services/liveCapabilities.ts`.
- `services/liveActorResolver.ts`.
- Reglas de Z6B.
- Cancelacion con motivo.
- Vendido operativo.
- Precio LIVE vs precio base.
- Bloqueo de doble reserva.
- Pagos/caja/reportes/billing/IA.
- Contratos API.

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.

## Validaciones pendientes de cierre

- Ninguna tecnica.

## Git final

- `git status --short --untracked-files=all`: cambios en `app/live.tsx`, docs/locales/servicios LIVE; nuevos `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`, `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`, `services/liveCapabilities.ts`.
- `git diff --stat`: 7 archivos tracked modificados, 427 inserciones, 294 eliminaciones.
- `git diff --name-only`: OK.
- `git diff --check`: OK funcional; solo warnings LF/CRLF.
- Evidencias `qa-reports/` y `git-diffs/` generadas, pero ignoradas por `.gitignore`.

## QA manual esperado

ADMIN / Operador:
- `/live` se ve como consola mas compacta.
- Prenda al aire es protagonista.
- Prenda reservada no repite mensaje.
- Reserva bloqueada muestra motivo.
- Reservas recientes ocupan menos alto.
- Flujo operativo sigue funcionando.

Vendedor / Presentadora:
- Vista de apoyo no se rompe.

Supervisor:
- Dashboard supervisor no se rompe.

NO_ACCESS:
- Sigue bloqueado.

## Warnings

- Lint conserva 60 warnings preexistentes.
- Backend conserva warnings preexistentes de MySQL 5.7 y Mockito dynamic agent.
- Se esperan warnings LF/CRLF en Git.

## GO/NO-GO

GO tecnico para LIVE-Z6C.
GO visual condicionado a QA manual desktop/tablet/mobile.
