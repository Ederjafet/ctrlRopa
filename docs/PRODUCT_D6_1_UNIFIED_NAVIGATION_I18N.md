# PRODUCT-D6.1 - Unificar navegacion e idioma del AppShell

Fecha: 2026-06-05

## Objetivo

Unificar la navegacion autenticada para que las pantallas que usan `AppShell` consuman una sola fuente de menu, respeten los mismos permisos, muestren las mismas categorias y reaccionen al idioma activo.

Esta fase no modifica backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Causa encontrada

La navegacion categorizada de PRODUCT-D5 ya existia en `components/layout/appNavigation.ts`, pero varias pantallas seguian construyendo menus locales:

- `app/index.tsx`
- `app/live.tsx`
- `app/reservation-detail.tsx`
- `app/ui-kit.tsx`

Esos builders locales usaban labels hardcodeados y categorias antiguas como `Operacion`, `Control` y `Desarrollo`. Por eso una pantalla podia mostrar el menu nuevo y otra pantalla podia seguir mostrando una estructura vieja.

Tambien se encontro que `appNavigation.ts` tenia labels en espanol como fallback, pero no exponia claves i18n para que el `Sidebar` cambiara de idioma junto con el resto de la app.

## Estrategia aplicada

- `buildMainNavSections(session)` queda como fuente unica de navegacion para las pantallas AppShell auditadas.
- `Sidebar` traduce titulos de seccion con `titleKey`.
- `SidebarNavItem` traduce labels y helpers con `labelKey` y `helperKey`.
- `appNavigation.ts` conserva labels fallback, pero agrega claves i18n por seccion e item.
- El estado activo del sidebar ahora acepta key, ruta y aliases `activeFor`.
- `reservation-detail` deja de renderizar un boton explicito de `Menu principal` dentro del contenido AppShell.

## Pantallas corregidas

| Pantalla | Cambio aplicado | Active state |
| --- | --- | --- |
| `/` | Usa `buildMainNavSections` | `home` |
| `/live` | Elimina builder local `buildLiveNavSections` | `live` |
| `/reservation-detail?id=...` | Elimina builder local y usa navegacion central | `reservations` |
| `/ui-kit` | Elimina builder local | `ui-kit` |
| `/customers` | Ya usaba navegacion central; queda documentada como validacion objetivo | `customers` |
| `/reservations` | Ya usaba navegacion central; queda documentada como validacion objetivo | `reservations` |
| `/users` | Ya usaba navegacion central; queda documentada como validacion objetivo | `users` |
| `/system` | Ya usaba navegacion central; ahora el menu puede traducirse | `system` |
| `/reports` | Ya usaba navegacion central; queda documentada como validacion objetivo | `reports` |

## Claves i18n agregadas

Se agrego el bloque `navigation` en:

- `locales/es/common.json`
- `locales/en/common.json`

Incluye:

- marca y acciones del sidebar: `brandHelp`, `closeMenu`, `signOut`;
- secciones: `home`, `operation`, `inventory`, `administration`, `reports`, `security`, `development`;
- items: `homeSummary`, `live`, `doorSale`, `doorHold`, `holds`, `customers`, `itemsInventory`, `createItems`, `batches`, `users`, `roles`, `channels`, `system`, `appearance`, `reportsGeneral`, `dailyStore`, `dailyDeliveries`, `dailyDeposits`, `dailyCancellations`, `liveControl`, `remissions`, `securityAudit`, `devSecurity`, `sessionsLocks`, `uiKit`.

## Active state

El sidebar ahora resuelve activo si `activeRoute` coincide con:

- `item.key`;
- `item.route`;
- key/ruta sin slash inicial;
- algun alias de `item.activeFor`.

Esto permite marcar correctamente rutas como:

- `/live` -> En vivo
- `/customers` -> Clientes
- `/reservations` y `/reservation-detail` -> Apartados
- `/door-sale` -> Venta puerta
- `/door-reservation` -> Apartado puerta
- `/items` -> Prendas / Inventario
- `/items-create` -> Alta de prendas
- `/system-roles` -> Roles
- `/system-channels` -> Canales operativos
- `/system-security-audit` -> Auditoria de seguridad
- `/report-*` -> reporte especifico

## Pendientes

Esta rama no contiene el documento `docs/PRODUCT_D6_LEGACY_SCREENS_APPSHELL.md`, y aun existen pantallas legacy fuera de AppShell en el arbol `app/`. Esas pantallas quedan fuera del alcance de D6.1 y deben cerrarse en una fase de migracion visual legacy o rebase/merge con el trabajo D6 si ya existe en otra rama.

## Nota PRODUCT-D6.2

PRODUCT-D6.2 completa la correccion de idioma del shell: `TopBar`, boton de tema y fallback de rol ahora consumen `useTranslation('common')`, y `services/i18n.ts` usa AsyncStorage como persistencia local global del idioma activo.

## Nota PRODUCT-D6.2B

La navegacion traducible se complementa con el cierre de hardcodes visibles en botones comunes y pantallas admin/reportes principales. La regla se mantiene: no traducir codigos tecnicos ni permisos internos, solo labels visibles.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Poner idioma Espanol.
3. Abrir `/system` y confirmar menu + pantalla en espanol.
4. Cambiar idioma a English.
5. Confirmar menu + pantalla en ingles.
6. Abrir `/customers`, `/live`, `/reservations`, `/users`, `/reports`, `/ui-kit`.
7. Confirmar que usan las mismas categorias para el mismo usuario.
8. Confirmar que no aparece el menu viejo `Operacion / Control` en pantallas AppShell corregidas.
9. Confirmar active state correcto.
10. Validar light/dark y drawer mobile.

## Decision

GO tecnico condicionado a validacion visual manual en navegador. La navegacion AppShell queda centralizada y lista para idioma activo; las pantallas legacy fuera de AppShell siguen como pendiente operativo.
