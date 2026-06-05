# PRODUCT-C / PRODUCT-C1 - Global Premium Visual System + Client Visual Identity Presets

Fecha: 2026-06-05 09:11:55
Rama: feature/product-c-premium-visual-system

## Direccion visual elegida

PRODUCT-C1 consolida una direccion visual enterprise retail premium: shell sobrio, cards elevadas, estados semanticos consistentes, jerarquia de botones clara, dark mode tipo consola y light mode ejecutivo. La aplicacion autenticada debe sentirse como producto comercial vendible, no como pantallas administrativas aisladas.

## Presets visuales implementados

Se agrego una base controlada de identidad visual local mediante presets semanticos:

- retailPremium
- darkConsole
- blueCorporate
- boutique
- classicErp

Los presets viven en `theme/designPresets.ts` y definen tokens semanticos para light/dark. No hay editor libre de colores, endpoints, migraciones ni persistencia backend.

## Cambio de plantilla desde UI

`/ui-kit` incluye la seccion "Identidad visual" con selector de plantilla visual. La seleccion se guarda localmente con AsyncStorage/local storage y afecta el tema global consumido por AppShell, pantallas y componentes base.

Texto visible documentado:

- Plantilla visual
- Identidad visual
- Configuracion local en esta fase

## Persistencia local y pendiente cliente/tenant

Queda local:

- seleccion de preset visual;
- modo claro/oscuro;
- aplicacion global en frontend.

Pendiente futuro:

- persistencia por cliente/tenant;
- administracion centralizada;
- validacion backend de presets permitidos;
- auditoria de cambios de identidad visual.

## Pantallas auditadas

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`

## Pantallas modificadas

- `app/customers.tsx`
- `app/live.tsx`
- `app/reports.tsx`
- `app/reservations.tsx`
- `app/system.tsx`
- `app/ui-kit.tsx`
- `app/users.tsx`

## Pantallas no modificadas y motivo

- `app/index.tsx`: ya estaba integrada al AppShell y al sistema visual actual; no se detecto necesidad de cambio adicional en esta subfase.
- `app/reservation-detail.tsx`: se mantuvo sin cambios nuevos en esta subfase para no tocar el manejo 403/404, RestrictedSection ni pagos.

## Componentes base modificados

- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/appNavigation.ts`
- `components/ui/ActionTile.tsx`
- `components/ui/AppCard.tsx`
- `components/ui/AppInfoCard.tsx`
- `components/ui/AppText.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/RestrictedSection.tsx`
- `components/ui/SectionHeader.tsx`
- `components/ui/StatusBadge.tsx`

## Tokens modificados

- `theme/designTokens.ts`
- `theme/designPresets.ts`
- `context/AppThemeContext.tsx`

Se reforzaron tokens semanticos para `primarySoft`, superficies, bordes, textos, inputs, estados, sombras, overlay, radius y density por preset.

## Reglas visuales aplicadas

- Sidebar como navegacion y usuario principal.
- TopBar como contexto de pantalla y acciones globales.
- Sin duplicidad de usuario completo en desktop.
- Reservada usa danger/dangerSoft premium, no ambar dominante.
- Presets no exponen colores sueltos por componente.
- Las pantallas consumen tokens semanticos a traves del contexto de tema.

## Warnings web corregidos o pendientes

Corregido:

- `pointerEvents` en AppShell se movio al estilo.

Pendiente documentado:

- Migracion completa de `shadow*` a `boxShadow` en todos los componentes multiplataforma. No se hizo una sustitucion masiva para no romper mobile; queda recomendado para PRODUCT-C2.

## Validaciones ejecutadas

- `git branch --show-current`: OK, `feature/product-c-premium-visual-system`.
- `git status`: OK, cambios esperados antes del commit.
- `git log --oneline -12`: OK.
- `git --no-pager diff --stat`: OK.
- `git --no-pager diff --name-only`: OK.
- `git --no-pager diff --check`: OK, solo warnings LF/CRLF.
- `npm.cmd run lint`: OK, 0 errores, 60 warnings existentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `cd backend/control-ropa; .\\mvnw.cmd test`: OK, 73 tests.
- `cd backend/control-ropa; .\\mvnw.cmd -q -DskipTests package`: OK.

## Warnings

- ESLint mantiene 60 warnings historicos/preexistentes, sin errores.
- Maven muestra warnings preexistentes de Mockito dynamic agent, MySQL 5.7 fuera de soporte comunitario y password generada por Spring Security en contexto de test.
- Git informa conversion LF a CRLF en Windows; `diff --check` no reporta errores.

## Riesgos

- La seleccion de preset todavia es local, por lo que otro dispositivo/usuario no hereda la identidad visual.
- No existe control backend de presets por tenant.
- Los presets agregan amplitud visual; se recomienda validacion manual por preset en desktop/tablet/mobile.
- Queda pendiente una limpieza multiplataforma cuidadosa de sombras web.

## GO/NO-GO

GO para commit de PRODUCT-C1 si el staged diff tambien pasa `git diff --cached --check`.

## Siguiente fase recomendada

PRODUCT-C2 / PRODUCT-E: persistencia de identidad visual por cliente/tenant, politica de presets permitidos, auditoria de cambios visuales, y migracion controlada de sombras web a `boxShadow` compatible.
