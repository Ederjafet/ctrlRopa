# LIVE-Z6C Correctivo - Jerarquia visual consola LIVE

## Contexto

- Rama: `feature/live-z6-operational-rules-and-shell`
- Fecha: 2026-06-04 16:03
- Alcance: ajuste correctivo visual sobre LIVE-Z6C.

## Problema corregido

El grid visual de LIVE-Z6C envolvia demasiados bloques y hacia que:

- Prenda al aire.
- Preparar siguiente prenda.
- Precio.
- Cliente.

parecieran columnas equivalentes.

Esto podia confundir porque el precio podia leerse como asociado a la prenda preparada y la prenda al aire perdia protagonismo.

## Cambios aplicados

- `Prenda al aire ahora` vuelve a ser bloque protagonista de ancho completo.
- `Preparar siguiente prenda` queda debajo como seccion secundaria.
- El grid responsive aplica solo a:
  - Precio.
  - Cliente / Interesado.
- `Reserva` queda debajo de Precio + Cliente.
- `Reservas recientes` se mantiene debajo.
- `Finalizar en vivo` se mantiene al final.
- Se quitaron estilos de flex genericos que hacian que todas las secciones compitieran como columnas equivalentes.

## Orden visual resultante

1. Prenda al aire ahora.
2. Preparar siguiente prenda.
3. Precio + Cliente / Interesado.
4. Reserva.
5. Reservas recientes.
6. Finalizar en vivo.

## Que NO se cambio

- Backend.
- AUTH/RBAC.
- Capacidades LIVE.
- `services/liveCapabilities.ts`.
- `services/liveActorResolver.ts`.
- `accessControl`.
- Reglas de cancelacion.
- Reglas de vendido operativo.
- Precio LIVE.
- Logica de reserva.
- Pagos/caja/reportes/billing/IA.

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.

## Validaciones pendientes

- Ninguna tecnica.

## Git final

- `git status --short --untracked-files=all`: cambios en `app/live.tsx`, docs/locales/servicios LIVE; nuevos `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`, `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`, `services/liveCapabilities.ts`.
- `git diff --stat`: 7 archivos tracked modificados, 440 inserciones, 297 eliminaciones.
- `git diff --name-only`: OK.
- `git diff --check`: OK funcional; solo warnings LF/CRLF.
- Evidencias `qa-reports/` y `git-diffs/` generadas, pero ignoradas por `.gitignore`.

## GO/NO-GO

GO tecnico para el correctivo LIVE-Z6C.
GO visual condicionado a QA manual responsive.
