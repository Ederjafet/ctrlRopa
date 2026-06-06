# PRODUCT-D6.2 - Global language source report

Fecha: 2026-06-05 20:32

## Objetivo

Corregir la fuente global de idioma para que AppShell, Sidebar, TopBar, logout y theme toggle respeten el idioma activo.

## Causa encontrada

- `TopBar` aun tenia textos hardcodeados (`Panel operativo`, `Claro`, `Oscuro`, `Sin rol`).
- `services/i18n.ts` condicionaba AsyncStorage a `window`, reduciendo la consistencia de la persistencia local.
- El menu ya tenia claves i18n desde D6.1, pero los controles comunes del shell no estaban todos conectados a `useTranslation`.

## Cambios realizados

- `services/i18n.ts` usa AsyncStorage como persistencia local global.
- `changeAppLanguage` cambia primero el idioma en i18next y luego guarda la preferencia.
- `TopBar` usa `useTranslation('common')`.
- El boton Claro/Oscuro ahora muestra `Claro/Oscuro` o `Light/Dark` segun idioma activo.
- `TopBar` traduce `Panel operativo`.
- `Sidebar` traduce el fallback `Sin rol`.
- Se agregaron claves `theme`, `topBar` y `navigation.noRole` en ES/EN.

## Componentes corregidos

- `services/i18n.ts`
- `components/layout/TopBar.tsx`
- `components/layout/Sidebar.tsx`
- `locales/es/common.json`
- `locales/en/common.json`

## Validaciones tecnicas

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK con warnings heredados, sin errores.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK.

## Correccion autonoma

El primer `expo export` fallo porque AsyncStorage web intento leer `window` durante static rendering. Se corrigio `services/i18n.ts` para usar AsyncStorage solo en runtime web/native, manteniendo `i18n.changeLanguage` disponible durante SSR/export.

## Warnings

El lint conserva warnings heredados en pantallas legacy: BOM, hooks dependencies, variables no usadas y uso de `Array<T>`. No se agregan errores nuevos.

## Riesgos

- Pantallas legacy no preparadas para i18n pueden seguir mostrando textos hardcodeados.
- La validacion visual debe confirmar que el cambio de idioma refresca inmediatamente el shell en navegador y mobile drawer.

## GO/NO-GO

GO tecnico. Pendiente validacion visual manual para confirmar el refresco inmediato del shell en navegador real y drawer mobile.
