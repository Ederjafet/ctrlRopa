# PRODUCT-D6.2B - Visible i18n hardcodes report

Fecha: 2026-06-06 17:14

## Objetivo

Auditar y corregir hardcodes visibles para evitar mezcla de espanol/ingles en pantallas principales, especialmente `/system` y administracion/reportes cercanos al AppShell.

## Causa encontrada

`/system` ya estaba preparado con i18n, pero componentes comunes y pantallas admin/reportes seguian exponiendo textos hardcodeados. El caso mas transversal era `AppBackButton`, que afectaba pantallas legacy con `Volver` y `Menu principal`.

## Correcciones aplicadas

- `AppBackButton`: usa `common.back` y `common.mainMenu`.
- `/reports`: hub traducible con `reports.*`.
- `/system-roles`: titulos, ayudas, modal, botones, labels y permisos visibles principales traducibles.
- `/system-channels`: titulos, ayudas, descripciones de canales, alertas y botones traducibles.
- `/system-security-audit`: encabezado, filtros, exportacion y paginacion principales traducibles.
- Locales ES/EN ampliados sin cambiar claves internas tecnicas.

## Pantallas auditadas

- `/system`
- `/reports`
- `/system-roles`
- `/system-channels`
- `/system-security-audit`
- `components/ui/AppBackButton`
- `components/layout/*`

Tambien se revisaron pantallas de reportes detallados, `appearance`, `users-form`, `customers`, `reservations`, `items-create` y `live`; las migraciones profundas quedan para D6.3 si conservan layout legacy o volumen alto de hardcodes.

## Validaciones tecnicas

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK con warnings heredados, sin errores.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK, sin errores.
- `git --no-pager diff --cached --check`: OK, sin errores.

## Warnings

Lint conserva warnings heredados en legacy: BOM, dependencias de hooks, variables no usadas y `Array<T>`. Las pantallas tocadas mantienen patrones existentes de carga; no se cambia logica funcional.

## GO/NO-GO

GO tecnico. Validaciones completas OK; listo para commit.
