# SEC-CONFIG-A1 - Dev startup script report

Fecha: 2026-06-08 10:58:28
Rama: `feature/sec-config-a1-dev-startup-script`

## Objetivo

Crear un mecanismo local seguro para levantar backend DEV despues de SEC-CONFIG-A, cargando `CONTROL_ROPA_DB_PASSWORD` desde `.env` no versionado.

## Cambios realizados

- Se agrego `scripts/dev-backend.sh` para Git Bash.
- Se agrego `scripts/dev-backend.cmd` para Windows CMD.
- `.env.example` usa `CONTROL_ROPA_DB_PASSWORD=CAMBIA_ESTE_VALOR` y comillas en valores con `&` o espacios.
- Se creo `docs/SEC_CONFIG_A1_DEV_STARTUP.md`.
- Se actualizaron tablero, backlog, handoff QA, runbook y documentacion SEC-CONFIG-A.

## Validaciones ejecutadas

Frontend:

- `npm.cmd run lint` - PASS, 0 errores; warnings preexistentes.
- `npx.cmd tsc --noEmit` - PASS.

Backend:

- `./mvnw.cmd test` - PASS, usando variable temporal local sin imprimir el valor.
- `./mvnw.cmd -q -DskipTests package` - PASS.

Scripts:

- `C:\Program Files\Git\bin\bash.exe -n scripts/dev-backend.sh` - PASS.
- `C:\Program Files\Git\bin\bash.exe scripts/dev-backend.sh` sin `.env` - FAIL esperado con mensaje claro.
- `cmd /c scripts\dev-backend.cmd` sin `.env` - FAIL esperado con mensaje claro.

Git:

- `git --no-pager diff --check` - PASS.

## Observaciones

- No existe `.env` local en el workspace.
- No se ejecuto `spring-boot:run` completo porque requiere password real en `.env`; queda como validacion manual de QA/dev.
- `.env` no esta staged ni versionado.
- No se agregaron passwords reales en scripts, docs ni `.env.example`.

## Resultado

SEC-CONFIG-A1 queda `DONE_TECH` y `PENDING_QA`.
