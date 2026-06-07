# PRODUCT-D6.5 - Legacy Route Audit Report

Fecha/hora: 2026-06-06 18:45:43

## Objetivo

Auditar rutas `app/*.tsx`, detectar layout legacy y migrar rutas seguras a `AppShellPage`, sin tocar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Resultado de auditoria

- Rutas top-level auditadas: 68
- Rutas con patron legacy antes de D6.5: 46
- Rutas migradas en D6.5: 2
- Rutas con patron legacy despues de D6.5: 44

Patrones detectados:

- `AppScreen`
- `AppBackButton`
- `Menu principal`
- ausencia de `AppShell` / `AppShellPage`

## Rutas migradas

- `/system-security` (`app/system-security.tsx`)
- `/system-sessions` (`app/system-sessions.tsx`)

Cambios:

- `AppShellPage` como layout principal.
- Active routes:
  - `system-security`
  - `system-sessions`
- Eliminacion de `AppBackButton` como navegacion superior legacy.
- i18n ES/EN para titulos, subtitulos, labels, acciones y mensajes principales.
- Sin cambios en servicios, formularios, switches, validaciones ni permisos.

## Rutas no migradas

Se documentan como pendientes o excluidas:

- Caja/pagos: `cash-*`, `payments`.
- Auth/especiales: `login`, `access-denied`, `change-password`, `modal`, `(tabs)`.
- Rutas hijas o contextuales: `batch-*`, `items/[id]`, `customers/[id]`, `customer-*`.
- Flujos funcionales amplios: `shipments`, `returns`, `refunds`, `transfers`, `consignments`, `catalogs`, `branches`, `channels`, `incidents`.
- `system-logs`: documentada como observabilidad no navegada.

## Validaciones tecnicas

- `git branch --show-current`: OK, `feature/product-d6-5-legacy-route-audit`
- `git status`: OK inicial limpio
- `git --no-pager diff --check`: OK inicial y OK final sin errores
- `npm.cmd run lint`: OK, 0 errores, 53 warnings heredados/estructurales
- `npx.cmd tsc --noEmit`: OK
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors
- `./mvnw.cmd -q -DskipTests package`: OK

Warnings relevantes:

- Lint mantiene warnings existentes de hooks, BOM y tipos en rutas fuera de alcance.
- En rutas migradas quedan warnings de dependencias de hooks; no se modificaron para evitar cambios funcionales en la carga de datos.
- Maven registra warnings conocidos de MySQL 5.7 y Mockito/dynamic agent, sin afectar el resultado.

## Riesgos

- El conteo de legacy sigue alto porque muchas rutas pertenecen a dominios no incluidos en D6.5.
- Caja/pagos no se migran por exclusion explicita.
- Flujos como envios, devoluciones, reembolsos, transferencias, consignaciones y catalogos requieren fase propia para no mezclar visual con logica funcional.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/system-security`.
3. Confirmar AppShell/sidebar/drawer.
4. Confirmar que no aparece `Menu principal` ni barra superior `Volver`.
5. Confirmar idioma Espanol/English.
6. Confirmar light/dark y presets.
7. Abrir `/system-sessions`.
8. Confirmar AppShell/sidebar/drawer, active state e i18n.
9. Validar mobile/drawer.

## GO/NO-GO

GO tecnico. GO visual queda sujeto a validacion manual en navegador/AnyDesk.
