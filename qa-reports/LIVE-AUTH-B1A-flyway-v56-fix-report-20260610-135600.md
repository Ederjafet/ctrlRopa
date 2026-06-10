# LIVE-AUTH-B1A flyway V56 fix report

Fecha: 2026-06-10
Rama: `feature/live-auth-b1a-flyway-v56-fix`

## Resultado ejecutivo

Se creo una migracion V56 aditiva para completar la diferencia detectada entre la V55 aplicada localmente y la V55 canonica commiteada.

Resultado final:

- V56 creada.
- V55 no modificada.
- Repair local DEV ejecutado despues de confirmar DB `localhost:3306/control_ropa`.
- Backend tests PASS con V56 aplicada.

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -20`
- busqueda de `V55*` y `V56*` en `backend/control-ropa/src/main/resources/db/migration`
- `git status --short backend/control-ropa/src/main/resources/db/migration`
- `git --no-pager show --stat --oneline 290369c`
- `git --no-pager show --name-only --oneline 290369c`
- auditorias `git grep` de permisos, roles y migraciones
- `git --no-pager diff --check`
- `./mvnw.cmd test` con `.env` cargado sin imprimir secretos
- helper temporal Java con Flyway API para `repair` local DEV
- `./mvnw.cmd test` posterior al repair con `.env` cargado sin imprimir secretos
- verificacion JDBC de `flyway_schema_history` version 55/56 y permisos `SELLER`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

## V55 identificada

- `backend/control-ropa/src/main/resources/db/migration/V55__live_operational_authorizations_mvp.sql`
- Commited en `290369c LIVE-AUTH-B1 implementa autorizaciones operativas`
- Sin cambios pendientes

## V56 creada

- `backend/control-ropa/src/main/resources/db/migration/V56__live_operational_authorizations_rbac_backfill.sql`

Backfill:

- asigna `UNDO_LIVE_OPERATIONAL_SALE` a `SELLER`;
- usa `INSERT IGNORE`;
- no falla si el rol o permiso no existen;
- no duplica en DB limpia donde V55 canonica ya hizo la asignacion.

## Repair

Ejecutado.

Justificacion:

- DB confirmada como local DEV: `localhost:3306/control_ropa`;
- V55 actual esta commiteada en `290369c` y es la version canonica;
- V56 ya cubria la diferencia real detectada;
- la estructura aplicada de V55 existia y el backfill faltante quedo cubierto por V56;
- no se imprimieron secretos.

Comando/mecanismo:

- helper temporal Java usando Flyway API `Flyway.configure().dataSource(...).locations(...).load().repair()`;
- credenciales cargadas desde `.env` en memoria del proceso;
- sin imprimir password ni token.

Resultado:

- V55 reparada a checksum `1317462819`;
- V56 aplicada con exito;
- `SELLER` quedo con `REQUEST_LIVE_OPERATION_AUTHORIZATION` y `UNDO_LIVE_OPERATIONAL_SALE`.

## Validaciones

- `git --no-pager diff --check`: PASS.
- `./mvnw.cmd test` antes de repair: FAIL esperado por checksum mismatch V55.
- `./mvnw.cmd test` despues de repair: PASS; Flyway valido 56 migraciones y aplico V56.
- `npm.cmd run lint`: PASS con advertencias preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --cached --check`: PASS.
- `git status`: cambios esperados staged antes del commit.

## Alcance

No se toco pagos, caja, precio LIVE, devoluciones ni venta financiera.

No se modifico V55.

## Estado

- `GO_TECNICO_REPAIR_LOCAL`
