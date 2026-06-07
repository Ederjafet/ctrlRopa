# PRODUCT-D6.3 - Legacy premium migration report

Fecha: 2026-06-06 17:57

## Objetivo

Migrar pantallas legacy a AppShell premium sin cambiar logica funcional, endpoints, permisos, calculos ni datos reales.

## Alcance

Pantallas migradas:

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

## Cambios realizados

- Se agrego `components/layout/AppShellPage.tsx`.
- Se reemplazo `AppScreen` por `AppShellPage` en pantallas objetivo.
- Se retiro `AppBackButton`/navegacion superior legacy en pantallas migradas.
- Se mantuvieron formularios, filtros, llamadas a servicios, permisos y calculos.
- Se agregaron claves i18n para `appearance`, `usersForm`, reportes y auditoria de seguridad.
- Se conservo la navegacion central con `buildMainNavSections(session)`.

## Pantallas no migradas

No quedaron pantallas del listado D6.3 sin migrar. Cualquier ruta legacy fuera de la lista queda para QA posterior.

## Validaciones tecnicas

- `npm.cmd run lint`: OK con warnings heredados, sin errores.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK.
- `git --no-pager diff --cached --check`: OK.

## Warnings

Lint mantiene warnings heredados de hooks, BOM, tipos `Array<T>` y variables no usadas en pantallas fuera de alcance. En pantallas tocadas se mantienen algunos warnings historicos de `appearance`, `system-roles` y `system-channels` para no cambiar patrones funcionales de carga.

## Riesgos

- La validacion visual real en navegador/AnyDesk sigue pendiente.
- Estados y codigos retornados por backend se muestran como datos tecnicos y no se traducen.
- `/appearance` conserva modelo legacy de branding backend; esta fase solo migra shell e i18n visible.

## GO/NO-GO

GO tecnico. Validaciones completas OK; listo para commit.
