# PRODUCT-D6.1 - Unified navigation + i18n report

Fecha: 2026-06-05 20:10

## Objetivo

Unificar la fuente de navegacion del AppShell, eliminar builders locales de menu viejo y hacer que el sidebar/drawer respete el idioma activo.

## Causa encontrada

La navegacion categorizada de PRODUCT-D5 estaba centralizada en `components/layout/appNavigation.ts`, pero `app/index.tsx`, `app/live.tsx`, `app/reservation-detail.tsx` y `app/ui-kit.tsx` aun generaban menus locales con labels hardcodeados. Eso podia producir diferencias entre rutas como `/system` y otras pantallas AppShell.

El sidebar tampoco traducia secciones/items porque los items no tenian claves i18n consumidas en render.

## Cambios realizados

- Se eliminaron builders locales de navegacion en Home, LIVE, UI Kit y reservation-detail.
- `Sidebar` traduce titulos de seccion mediante `titleKey`.
- `SidebarNavItem` traduce labels/helpers mediante `labelKey` y `helperKey`.
- `appNavigation.ts` agrega claves i18n y aliases `activeFor`.
- `locales/es/common.json` y `locales/en/common.json` agregan bloque `navigation`.
- `reservation-detail` deja de mostrar un boton explicito `Menu principal` dentro de AppShell.

## Pantallas auditadas

- `/`
- `/live`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`

Tambien se reviso la lista objetivo de rutas legacy. Esta rama no contiene PRODUCT-D6 completo, por lo que pantallas como `/appearance`, reportes detallados y pantallas de sistema legacy quedan documentadas como pendiente fuera del alcance de D6.1.

## Cambios i18n

Se agregaron labels ES/EN para:

- categorias del menu;
- items operativos;
- items de inventario;
- administracion;
- reportes;
- seguridad;
- desarrollo;
- acciones de sidebar.

## Validaciones tecnicas

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK con warnings heredados del repositorio, sin errores.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK.

## Warnings

El lint conserva warnings existentes en pantallas legacy: BOM, hooks dependencies, imports/variables no usadas y tipos `Array<T>`. No son introducidos por la centralizacion del menu, salvo que se limpiaron los imports sobrantes generados por esta fase.

## Riesgos

- La validacion visual real debe confirmar que el cambio de idioma rerenderiza el sidebar en navegador.
- Pantallas legacy fuera de AppShell siguen pendientes si esta rama no incorpora PRODUCT-D6.
- Si alguna pantalla pasa un `activeRoute` no cubierto por `activeFor`, el item puede quedar sin highlight; se agregaron aliases para las rutas principales solicitadas.

## GO/NO-GO

GO tecnico. La validacion visual manual queda recomendada para confirmar el cambio de idioma en navegador, responsive y active state por usuario real.

## Siguiente fase recomendada

Cerrar migracion de pantallas legacy fuera de AppShell o rebasear la rama que contiene PRODUCT-D6 antes de continuar QA visual final.
