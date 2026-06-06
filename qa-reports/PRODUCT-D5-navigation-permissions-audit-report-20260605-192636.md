# PRODUCT-D5 — Navigation permissions audit report

Fecha: 2026-06-05 19:26
Rama: `feature/product-d5-categorized-navigation`

## Objetivo

Cerrar hallazgos QA sobre navegacion plana, ausencia de Venta puerta, permisos tecnicos visibles, textos de `/system` sin i18n y pantallas legacy fuera del sistema visual premium.

## Alcance ejecutado

- Auditoria de rutas reales en `app/`.
- Reorganizacion de menu en categorias.
- Alta de `Venta puerta` en navegacion si el usuario tiene permiso real.
- Traduccion visual de permisos tecnicos en pantallas administrativas.
- Conexion i18n de textos hardcodeados de `/system`.
- Documentacion de pantallas legacy pendientes de migracion visual.

## Decision sobre Venta puerta

Resultado: existe ruta funcional.

- Archivo: `app/door-sale.tsx`
- Ruta: `/door-sale`
- Canal: `DOOR_SALE`
- Permiso: `DO_DOOR_SALE`
- Accion: agregada al menu en `Operacion` como `Venta puerta`.

## Categorias creadas

- Inicio
- Operacion
- Inventario
- Administracion
- Reportes
- Seguridad
- Desarrollo

Las categorias vacias se filtran. El drawer mobile y el sidebar desktop usan la misma fuente.

## Permisos usados

- `DO_DOOR_SALE` para Venta puerta.
- `DO_DOOR_RESERVATION` para Apartado puerta.
- `VIEW_CUSTOMERS` para Clientes.
- `VIEW_INVENTORY` / `MANAGE_INVENTORY` para Inventario.
- `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_BRANCH_CHANNELS` para Administracion.
- `VIEW_REPORTS` para Reportes.
- `VIEW_SECURITY_AUDIT` para Auditoria de seguridad.
- ADMIN para Desarrollo / UI Kit y opciones dev.

## i18n corregido

`/system` ya no depende de textos hardcodeados para:

- subtitulo de pantalla;
- contexto de topbar;
- tiles de Roles;
- Canales operativos;
- Logs de soporte;
- Seguridad dev;
- Sesiones y bloqueos;
- Auditoria de seguridad.

Se actualizaron `locales/es/common.json` y `locales/en/common.json`.

## Permisos tecnicos traducidos visualmente

Se reforzo `formatPermissionCode` para mostrar labels humanos. Ejemplos:

- `CANCEL_SALE` -> Cancelar venta
- `CREATE_CUSTOMER` -> Crear cliente
- `DO_LIVE_RESERVATION` -> Apartar en LIVE
- `DO_DOOR_SALE` -> Venta puerta
- `REGISTER_PAYMENTS` -> Registrar pagos
- `VIEW_INVENTORY` -> Ver inventario
- `VIEW_REPORTS` -> Ver reportes

## Pantallas legacy detectadas

Pendientes de migracion visual completa:

- `/appearance`
- `/system-roles`
- `/system-channels`
- `/system-security-audit`
- `/users-form`
- `/report-daily-store`
- `/report-deliveries`
- `/report-deposits`
- `/report-cancellations`
- `/report-live`
- `/report-remissions`

Decision: no se migraron masivamente en PRODUCT-D5 para evitar romper formularios/reportes. Se dejaron visibles por menu cuando el permiso aplica y se documento deuda visual.

## Validaciones tecnicas

- `npm.cmd run lint`: OK, con warnings preexistentes del repo.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: pendiente de corrida final posterior a evidencia.

## Riesgos

- GO visual parcial: las rutas legacy siguen requiriendo una fase de migracion UI incremental.
- El menu expone mas rutas existentes; requiere smoke manual por rol para confirmar expectativas reales de negocio.
- Algunas rutas existentes de dominio no se agregaron al menu para no ampliar el alcance sin matriz QA especifica.

## GO/NO-GO

- GO tecnico: OK condicionado a `git diff --check` final y commit limpio.
- GO visual: parcial, con deuda documentada.

## Siguiente fase recomendada

PRODUCT-D6 o PRODUCT-E visual:

- migrar reportes legacy y pantallas de administracion a AppShell premium;
- cerrar i18n completo de formularios legacy;
- ejecutar smoke manual por rol sobre el nuevo menu categorizado.
