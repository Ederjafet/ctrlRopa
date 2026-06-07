# PRODUCT-D6.2B - Cierre de idioma visible y hardcodes

Fecha: 2026-06-06

## Objetivo

Cerrar hardcodes visibles de idioma en pantallas principales antes de continuar con migraciones visuales legacy. La fase se enfoca en textos seguros: headers, botones comunes, helpers, filtros y secciones principales.

No se modifica backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints, permisos ni reglas LIVE.

## Causa encontrada

`/system` ya estaba conectado a i18n en esta rama, pero seguian existiendo hardcodes visibles en componentes y pantallas cercanas a AppShell:

- `AppBackButton` mostraba `Volver` y `Menu principal` sin i18n.
- `/reports` mantenia titulos, descripciones y ayuda en espanol.
- `/system-roles` tenia textos principales, modal y acciones en espanol.
- `/system-channels` tenia titulos, ayudas, errores, botones y descripciones en espanol.
- `/system-security-audit` tenia encabezado, filtros, botones y alertas en espanol.

## Pantallas corregidas

| Pantalla / componente | Correccion |
| --- | --- |
| `components/ui/AppBackButton.tsx` | `Volver` y `Menu principal` usan `common.back` y `common.mainMenu`. |
| `app/reports.tsx` | Hub de reportes usa claves `reports.*`. |
| `app/system-roles.tsx` | Titulos, ayudas, modal, botones y labels principales usan `systemRoles.*`. |
| `app/system-channels.tsx` | Titulos, ayudas, estados, alertas y botones usan `systemChannels.*`. |
| `app/system-security-audit.tsx` | Encabezado, filtros, exportacion, paginacion y alertas principales usan `securityAudit.*`. |
| `app/system.tsx` | Auditado; ya consumia `system.*`, `language.*` y `topBar/navigation/theme` desde D6.2. |

## Textos movidos a i18n

Se agregaron o reforzaron claves en:

- `common.*`: `back`, `mainMenu`, `retry`, `loading`, `save`, `saving`, `filters`, `date`, `branch`, `search`.
- `reports.*`: titulos y descripciones del hub de reportes.
- `systemRoles.*`: rol, modal, permisos visibles y acciones principales.
- `systemChannels.*`: reglas, disponibilidad, canales, errores y acciones.
- `securityAudit.*`: auditoria, eventos bloqueados, filtros, exportacion y paginacion.

## Pantallas pendientes para D6.3

Las siguientes pantallas siguen siendo candidatas a migracion/traduccion mas profunda porque conservan layout legacy o muchos textos internos:

- reportes detallados: `/report-daily-store`, `/report-deliveries`, `/report-deposits`, `/report-cancellations`, `/report-live`, `/report-remissions`;
- `/appearance`;
- `/users-form`;
- pantallas legacy fuera de AppShell que usan `AppScreen` + `AppBackButton`.

En esta fase se evita redisenarlas o reestructurarlas para no mezclar i18n con migracion visual.

## Actualizacion PRODUCT-D6.3

PRODUCT-D6.3 migro las pantallas listadas a `AppShellPage`/`AppShell`, retiro la navegacion legacy `Volver` / `Menu principal` como barra superior y amplio i18n visible en `appearance`, `users-form`, reportes detallados y auditoria de seguridad.

La deuda restante queda acotada a estados/codigos retornados por backend y a pantallas fuera del listado D6.3 que QA pueda identificar posteriormente.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/system`.
3. Seleccionar Espanol y confirmar pantalla, menu, logout y theme toggle en espanol.
4. Seleccionar English y confirmar screen, menu, sign out y theme toggle en ingles.
5. Abrir `/reports` y confirmar titulos/descripciones en el idioma activo.
6. Abrir `/system-roles`, `/system-channels`, `/system-security-audit` y confirmar textos principales traducidos.
7. Abrir una pantalla con `AppBackButton` y confirmar `Back/Main menu` o `Volver/Menu principal` segun idioma.
8. Validar light/dark y drawer mobile.

## Decision

GO tecnico condicionado a corrida visual manual. La deuda restante queda acotada a D6.3: migracion/traduccion profunda de pantallas legacy.
