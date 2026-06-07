# PRODUCT-D5 — Navegacion categorizada, rutas legacy, permisos e i18n

Fecha: 2026-06-05

## Objetivo

Ordenar la navegacion autenticada por categorias, exponer rutas existentes segun permisos reales, corregir labels visibles de permisos tecnicos y cerrar el hallazgo de i18n visible en `/system`.

Esta fase no modifica backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Decision sobre Venta puerta

`Venta puerta` si existe como pantalla funcional:

- Ruta: `/door-sale`
- Archivo: `app/door-sale.tsx`
- Canal requerido: `DOOR_SALE`
- Permiso requerido: `DO_DOOR_SALE`
- Decision: se agrega al menu dentro de `Operacion`.

No se invento permiso ni ruta. La visibilidad queda filtrada por el mismo canal/permiso que ya valida la pantalla.

## Categorias del menu

La navegacion principal ahora se agrupa desde `components/layout/appNavigation.ts`:

- Inicio
- Operacion
- Inventario
- Administracion
- Reportes
- Seguridad
- Desarrollo

## Nota PRODUCT-D6.1

PRODUCT-D6.1 refuerza esta decision: las pantallas AppShell auditadas deben consumir `buildMainNavSections(session)` como unica fuente de navegacion. Las secciones e items agregan claves i18n para que el sidebar/drawer respete Espanol/Ingles y no quede mezclado con el idioma de la pantalla.

## Nota PRODUCT-D6.2

La navegacion traducible depende de la fuente global `i18next` + AsyncStorage (`app_language`). El shell comun (`Sidebar`, `TopBar`, logout y theme toggle) debe usar `useTranslation('common')` para evitar mezclas de idioma entre menu y contenido.

## Nota PRODUCT-D6.4

Las rutas operativas expuestas desde D5 en el menu (`/door-sale`, `/door-reservation`, `/items`, `/items-create`, `/batches`) fueron migradas en PRODUCT-D6.4 a `AppShellPage`, manteniendo los mismos permisos/canales documentados en esta matriz.

## Nota PRODUCT-D6.5

Las rutas de Seguridad expuestas desde D5 (`/system-security` y `/system-sessions`) fueron migradas en PRODUCT-D6.5 a `AppShellPage`, manteniendo visibilidad ADMIN y active state de la navegacion categorizada.

Reglas aplicadas:

- No se muestran categorias vacias.
- Cada item conserva filtro por permiso/canal real.
- `NO_ACCESS` no recibe navegacion util.
- Desktop y drawer mobile usan la misma fuente de navegacion.
- El footer de usuario/logout se mantiene separado del listado.

## Items principales agregados o reubicados

| Categoria | Item | Ruta | Permiso/canal |
| --- | --- | --- | --- |
| Inicio | Resumen operativo | `/` | Sesion con acceso |
| Operacion | En vivo | `/live` | Capacidades LIVE reales |
| Operacion | Venta puerta | `/door-sale` | `DOOR_SALE` + `DO_DOOR_SALE` |
| Operacion | Apartado puerta | `/door-reservation` | `DOOR_RESERVATION` + `DO_DOOR_RESERVATION` |
| Operacion | Apartados | `/reservations` | Apartado puerta o LIVE |
| Operacion | Clientes | `/customers` | `VIEW_CUSTOMERS` |
| Inventario | Prendas / Inventario | `/items` | `VIEW_INVENTORY` o `MANAGE_INVENTORY` |
| Inventario | Alta de prendas | `/items-create` | `MANAGE_INVENTORY` |
| Inventario | Lotes | `/batches` | `VIEW_INVENTORY` o `MANAGE_INVENTORY` |
| Administracion | Usuarios | `/users` | `MANAGE_USERS` o ADMIN |
| Administracion | Roles | `/system-roles` | `MANAGE_ROLES` o ADMIN |
| Administracion | Canales operativos | `/system-channels` | `MANAGE_BRANCH_CHANNELS` o ADMIN |
| Administracion | Sistema | `/system` | permisos de sistema o ADMIN |
| Administracion | Apariencia / Branding | `/appearance` | ADMIN |
| Reportes | Reportes generales | `/reports` | `VIEW_REPORTS` o ADMIN |
| Reportes | Diario tienda | `/report-daily-store` | `VIEW_REPORTS` o ADMIN |
| Reportes | Entregas diarias | `/report-deliveries` | `VIEW_REPORTS` o ADMIN |
| Reportes | Depositos diarios | `/report-deposits` | `VIEW_REPORTS` o ADMIN |
| Reportes | Cancelaciones diarias | `/report-cancellations` | `VIEW_REPORTS` o ADMIN |
| Reportes | Control Live | `/report-live` | `VIEW_REPORTS` o ADMIN |
| Reportes | Remisiones | `/report-remissions` | `VIEW_REPORTS` o ADMIN |
| Seguridad | Auditoria de seguridad | `/system-security-audit` | `VIEW_SECURITY_AUDIT` o ADMIN |
| Seguridad | Seguridad dev | `/system-security` | ADMIN |
| Seguridad | Sesiones y bloqueos | `/system-sessions` | ADMIN |
| Desarrollo | UI Kit | `/ui-kit` | ADMIN |

## Rutas auditadas

Se auditaron rutas reales en `app/`, incluyendo:

- Operacion: `/live`, `/door-sale`, `/door-reservation`, `/reservations`, `/customers`
- Inventario: `/items`, `/items-create`, `/batches`
- Administracion: `/users`, `/users-form`, `/system`, `/system-roles`, `/system-channels`, `/appearance`
- Reportes: `/reports`, `/report-daily-store`, `/report-deliveries`, `/report-deposits`, `/report-cancellations`, `/report-live`, `/report-remissions`
- Seguridad: `/system-security-audit`, `/system-security`, `/system-sessions`
- Desarrollo: `/ui-kit`

Tambien existen rutas adicionales de dominio (`payments`, `shipments`, `transfers`, `returns`, `refunds`, `consignments`, `catalogs`, etc.) que no se agregaron en esta fase para no exponer opciones sin validar UX/permisos en QA visual.

## Permisos visibles

Se reforzo `services/permissionDependencies.ts` para que el label visible use nombres operativos en espanol:

- `CANCEL_SALE` -> Cancelar venta
- `CREATE_CUSTOMER` -> Crear cliente
- `DO_LIVE_RESERVATION` -> Apartar en LIVE
- `DO_DOOR_RESERVATION` -> Apartar en puerta
- `DO_DOOR_SALE` -> Venta puerta
- `EDIT_CUSTOMER` -> Editar cliente
- `REGISTER_PAYMENTS` -> Registrar pagos
- `VIEW_CUSTOMERS` -> Ver clientes
- `VIEW_INVENTORY` -> Ver inventario
- `VIEW_SALES` -> Ver ventas
- `VIEW_REPORTS` -> Ver reportes
- `MANAGE_USERS` -> Administrar usuarios

El codigo interno se conserva para administracion tecnica, pero ya no es el label principal en roles, usuarios y restricted sections.

## i18n corregido

Pantalla `/system`:

- Se conectaron a i18n el subtitulo, contexto y tiles de sistema.
- Se agregaron equivalentes en `locales/es/common.json` y `locales/en/common.json`.
- Los textos reportados por QA quedan cubiertos por `t('system.*')` o por las nuevas claves de tiles.

## Pantallas legacy

Pantallas detectadas con layout legacy o navegacion contextual `Volver/Menu principal`:

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

Decision PRODUCT-D5:

- Se exponen en menu las rutas seguras ya existentes y protegidas.
- No se migro toda la estructura legacy a AppShell en esta fase para evitar romper formularios/reportes sin corrida visual puntual.
- Pendiente recomendado: PRODUCT-D6 o PRODUCT-E visual para migracion incremental de legacy screens a AppShell premium.

## Roles esperados

- ADMIN: ve categorias completas segun permisos administrativos.
- VENDEDOR: ve Operacion y rutas con permisos reales, incluyendo Venta puerta si tiene `DO_DOOR_SALE`.
- SUPERVISOR: ve rutas permitidas por sus permisos reales, sin desarrollo si no es admin.
- NO_ACCESS: no ve navegacion util.

## Riesgos y pendientes

- Algunas rutas profundas siguen con layout legacy.
- Algunas pantallas adicionales existentes no se agregaron al menu para no ampliar alcance sin QA por permisos.
- La traduccion completa de todos los formularios legacy sigue pendiente.

## GO/NO-GO

GO tecnico condicionado a validaciones automatizadas.

GO visual parcial: navegacion, Venta puerta, `/system` i18n y permisos visibles quedan corregidos. Migracion completa de pantallas legacy queda pendiente documentado.
