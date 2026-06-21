# RC-CLIENTE-A Validacion integral para instalacion cliente AppModa

Fecha: 2026-06-21

Rama validada:

- `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Objetivo

Congelar nuevas funcionalidades y validar AppModa como release candidate para instalacion cliente. La validacion se enfoco en base local, Flyway, backend, frontend, Platform Owner, tenant admin, aislamiento tenant, permisos, pagos y navegacion critica.

Regla aplicada:

- No se agregaron funcionalidades nuevas.
- Solo se corrigio un hallazgo P0/P1 de permisos de pagos.

## Ambiente usado

- Windows PowerShell en `E:\CtrlPan\2026\control-ropa-app`.
- Git Bash para ejecutar scripts `.sh`.
- Backend local en puerto `8090`.
- MySQL local `5.7.17`.
- Java `21.0.11`.
- Base local `control_ropa`.

## Comandos ejecutados

Inspeccion inicial:

```bash
git status -sb
git branch --show-current
git log --oneline -10
```

Reset local:

```bash
./scripts/reset-db-local.sh
```

Backend / Flyway:

```bash
./scripts/dev-backend.sh
```

Backend tests con `.env`:

```bash
set -a
source .env
set +a
cd backend/control-ropa
./mvnw.cmd test
```

Frontend:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

## Resultado reset DB

Resultado: OK.

Evidencia:

- `reset-db-local.sh` valido cliente MySQL.
- Se creo backup local antes del reset:
  `backups/db/control_ropa_backup_20260621_112001.sql`
- La base `control_ropa` fue eliminada y recreada correctamente.

Nota:

- El backup local no debe subirse al repositorio.

## Resultado backend y Flyway

Resultado: OK.

Evidencia:

- El backend respondio en `http://localhost:8090`.
- Flyway valido `62` migraciones.
- La migracion `V62__rc_cliente_a_payment_view_backfill.sql` quedo aplicada.
- El esquema quedo en version `62`.

Observaciones de entorno:

- Al ejecutar via PowerShell, el cargador de `.env` debe retirar comillas simples y dobles de valores como `CONTROL_ROPA_DB_URL`; si no, MySQL rechaza la URL JDBC.
- En este equipo aparece warning de escritura de log a `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log` por permisos locales. No detuvo el arranque ni las pruebas.
- `scripts/dev-backend.cmd` puede corromper patrones con `%d/%i` al expandir variables batch. Para esta validacion se uso `scripts/dev-backend.sh` desde Git Bash.

## Resultado backend test

Resultado: OK.

Resumen:

- `./mvnw.cmd test`: OK.
- Tests: `149`.
- Failures: `0`.
- Errors: `0`.
- Skipped: `0`.

## Resultado frontend

Resultado: OK.

Resumen:

- `git --no-pager diff --check`: OK.
- `npm.cmd run lint`: OK, con `51` warnings preexistentes y `0` errores.
- `npx tsc --noEmit`: OK.

Nota:

- En PowerShell, `npm run lint` invoco `npm.ps1` y fue bloqueado por Execution Policy. La validacion correcta se repitio con `npm.cmd run lint`.

## Smoke Platform Owner

Resultado: OK por API.

Usuario:

- `platform@appmoda.local`

Validaciones realizadas:

- Login Platform Owner: OK.
- Endpoint Platform Owner disponible.
- Creacion de cliente QA: OK.
- Creacion de sucursal secundaria QA: OK.
- Creacion de admin cliente QA: OK.
- Backend bloqueo de tenant sobre endpoints `/api/platform/**`: validado en smoke admin cliente.

Datos creados:

- Compania: `Cliente Instalacion QA`
- Sucursal principal: `Sucursal Principal`
- Sucursal adicional: `Sucursal QA Secundaria`
- Admin: `admin.instalacion.qa@local.test`

## Smoke Admin Cliente

Resultado: OK por API.

Usuario:

- `admin.instalacion.qa@local.test`

Validaciones:

- Login tenant admin: OK.
- Company activa: `Cliente Instalacion QA`.
- Acceso a `/api/platform/companies`: bloqueado con `403`.
- `/api/users`: muestra solo usuarios del tenant QA.
- Usuarios platform visibles al tenant: `0`.
- `/api/branches`: muestra `2` sucursales del tenant QA.
- No se observo fuga cross-tenant en los endpoints validados.

## Smoke Operacion

Resultado: parcial por API/inspeccion tecnica.

Validaciones realizadas:

- Rutas y permisos criticos revisados en frontend.
- `Apartado puerta` no esta como item independiente en el sidebar principal.
- `/door-reservation` queda activo bajo `Apartados`.
- `Pagos` aparece en `Finanzas` solo con `VIEW_PAYMENTS`.
- El patron `Ver permisos` existe como componente reusable y esta aplicado en pantallas de operacion.

Pendiente:

- Smoke visual manual completo en navegador para alta de prendas, LIVE, apartados, paquetes, pagos, prendas libres y envios.

## Smoke Permisos

Hallazgo P0/P1:

- El admin tenant creado podia tener permisos de dinero (`REGISTER_PAYMENTS`, `APPLY_CUSTOMER_BALANCE`) pero no `VIEW_PAYMENTS`.
- Esto bloqueaba la opcion `Finanzas / Pagos`, aunque el usuario ya podia operar dinero.

Correccion aplicada:

- Se agrego `V62__rc_cliente_a_payment_view_backfill.sql`.
- La migracion asigna `VIEW_PAYMENTS` a roles y usuarios que ya tienen `REGISTER_PAYMENTS`, `APPLY_CUSTOMER_BALANCE` o `VOID_PAYMENT`.

Revalidacion:

- Admin QA tiene `VIEW_PAYMENTS`: OK.
- Admin QA conserva `REGISTER_PAYMENTS`: OK.
- Admin QA conserva `APPLY_CUSTOMER_BALANCE`: OK.
- Acceso tenant a Platform Owner sigue bloqueado: OK.

## Actualizar y Sidebar

Resultado: OK por inspeccion tecnica.

Validaciones:

- Texto literal `Actualizar` solo aparece como key/traduccion en `services/apiError.ts`.
- El handler visible de refresh operativo esta en `app/live.tsx`.
- Se detectan callbacks `onRefresh` de listas en pantallas de datos, pero no boton global `Actualizar` fuera de LIVE.
- `Pagos` esta en seccion `Finanzas` y depende de `VIEW_PAYMENTS`.
- `door-reservation` esta mapeado como activo de `Apartados`, no como opcion principal propia.

## Bugs encontrados

1. P0/P1 permisos de pagos:
   - Usuarios/roles que ya podian registrar/aplicar/anular pagos podian no tener `VIEW_PAYMENTS`.
   - Impacto: dinero operable sin acceso claro a consulta financiera consolidada.
   - Estado: corregido con `V62`.

2. Riesgo de entorno local:
   - Carga manual de `.env` en PowerShell debe quitar comillas simples.
   - Estado: documentado; pruebas se ejecutaron correctamente tras normalizar comillas.

3. Riesgo de script Windows:
   - `scripts/dev-backend.cmd` puede expandir `%d/%i` del patron de logs.
   - Estado: documentado como riesgo operativo; la validacion RC uso `scripts/dev-backend.sh`.

4. Riesgo de permisos de carpeta de logs:
   - El equipo local no pudo escribir en la ruta configurada de logs.
   - Estado: documentado; no bloqueo pruebas ni backend.

## Correcciones aplicadas

Archivo agregado:

- `backend/control-ropa/src/main/resources/db/migration/V62__rc_cliente_a_payment_view_backfill.sql`

Comportamiento:

- Backfill idempotente con `INSERT IGNORE`.
- No cambia endpoints.
- No agrega funcionalidad nueva.
- Alinea consulta de pagos con permisos de operacion financiera ya existentes.

## Backlog P2 / pendientes no implementados

- Smoke visual manual completo en navegador antes de instalacion fisica.
- Corregir o reemplazar carga de `.env` en `scripts/dev-backend.cmd` para patrones con `%`.
- Revisar permisos de carpeta local de logs por ambiente.
- Facturacion real SaaS.
- Impersonacion auditada.
- Union/movimiento de paquetes.
- Roles personalizados por compania.
- Appearance tenant-aware.

## Decision final

Decision tecnica RC:

- `GO_INSTALACION_CLIENTE` condicionado a ejecutar smoke visual manual final en navegador con el usuario cliente.

Causa:

- Reset DB, Flyway, backend tests, aislamiento tenant y permisos financieros criticos quedaron validados.
- Se corrigio el unico hallazgo P0/P1 encontrado.
- Queda pendiente evidencia visual manual completa de pantallas operativas antes de entrega presencial.
