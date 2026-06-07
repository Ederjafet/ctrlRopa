# PRODUCT-D6.3 - Migracion premium de pantallas legacy a AppShell

Fecha: 2026-06-06

## Objetivo

Migrar pantallas legacy detectadas durante QA visual a `AppShell` premium, manteniendo intactas las reglas funcionales, endpoints, permisos, calculos y datos reales.

No se modifica backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA ni reglas LIVE.

## Estrategia

Se agrego `components/layout/AppShellPage.tsx` como wrapper ligero sobre `AppShell`.

El wrapper:

- obtiene o recibe la sesion actual;
- construye navegacion con `buildMainNavSections(session)`;
- usa `getSessionScopeLabel(session)` para el contexto;
- mantiene el mismo `AppShell`, sidebar, drawer, topbar, logout, tema e i18n global;
- evita duplicar carga de navegacion en cada pantalla migrada.

## Pantallas migradas

### Administracion / configuracion

- `/appearance` (`app/appearance.tsx`)
- `/system-roles` (`app/system-roles.tsx`)
- `/system-channels` (`app/system-channels.tsx`)
- `/system-security-audit` (`app/system-security-audit.tsx`)
- `/users-form` (`app/users-form.tsx`)

### Reportes

- `/report-daily-store` (`app/report-daily-store.tsx`)
- `/report-deliveries` (`app/report-deliveries.tsx`)
- `/report-deposits` (`app/report-deposits.tsx`)
- `/report-cancellations` (`app/report-cancellations.tsx`)
- `/report-live` (`app/report-live.tsx`)
- `/report-remissions` (`app/report-remissions.tsx`)

## Cambios visuales aplicados

- Se reemplazo `AppScreen` por `AppShellPage` en las pantallas objetivo.
- Se retiro `AppBackButton` como navegacion primaria legacy.
- Los titulos principales ahora viven en TopBar/AppShell.
- Sidebar categorizado queda visible en desktop y drawer en mobile/tablet.
- Los filtros y resultados conservan `AppCard`, `AppButton`, `AppInput` y componentes existentes.
- El active state del menu usa la ruta logica de cada pantalla.

## Decisiones sobre Volver / Menu principal

- Se elimino el patron legacy superior `Volver` / `Menu principal` de las pantallas migradas.
- No se agregaron botones de volver contextuales nuevos porque las rutas tienen navegacion global por sidebar/drawer.
- `users-form` conserva el flujo funcional de guardado y vuelve a `/users` como antes.

## i18n corregido

Se agregaron/reforzaron claves:

- `appearance.*` para labels principales de identidad visual;
- `usersForm.*` para formulario de usuarios y modales principales;
- `reports.query`, `reports.querying`, `reports.selectDateBranchHint`;
- `securityAudit.*` para paneles internos, metricas y detalles visibles.

No se traducen claves tecnicas, codigos de permisos, codigos de canal, estados backend ni datos retornados por API.

## Pantallas no migradas

No quedaron pantallas del listado D6.3 sin migrar. Rutas fuera del listado se dejan para fases posteriores si QA las detecta como legacy.

## Riesgos pendientes

- Algunas tablas de reportes muestran estados/codigos que vienen del backend; se mantienen como datos tecnicos.
- Lint conserva warnings heredados del proyecto en hooks, BOM y tipos `Array<T>`.
- `/appearance` mantiene campos legacy de configuracion visual backend; D6.3 solo migra shell e i18n visible, no redefine el modelo de branding.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/appearance`, `/system-roles`, `/system-channels`, `/system-security-audit`, `/users-form?id=<id valido>`.
3. Abrir `/report-daily-store`, `/report-deliveries`, `/report-deposits`, `/report-cancellations`, `/report-live`, `/report-remissions`.
4. Confirmar que todas usan AppShell/sidebar/drawer.
5. Confirmar que no aparece `Menu principal` legacy.
6. Confirmar active state correcto en sidebar.
7. Confirmar idioma espanol/ingles en headers, filtros y labels principales.
8. Confirmar light/dark y presets visuales.
9. Confirmar responsive desktop/tablet/mobile.

## GO/NO-GO

GO tecnico condicionado a validacion visual manual en navegador/AnyDesk.
