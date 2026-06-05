# LIVE-Z8C / PRODUCT-B4.1 - Premium AppShell polish

Fecha: 2026-06-04 23:26 CST

Rama: `feature/live-z8-authorization-requests`

## Objetivo

Eliminar la duplicidad de usuario/rol entre TopBar y Sidebar en desktop, manteniendo AppShell premium en claro/oscuro.

## Cambios implementados

- `TopBar` deja de mostrar nombre completo, empresa y sucursal en desktop.
- `TopBar` conserva:
  - titulo contextual;
  - subtitulo operativo;
  - toggle claro/oscuro;
  - acciones globales.
- En tablet/mobile, `TopBar` puede mostrar badge compacto de rol porque el Sidebar vive como drawer.
- `Sidebar` footer queda como ubicacion principal del usuario:
  - badge de rol;
  - nombre;
  - correo;
  - boton `Cerrar sesion`.
- El footer de Sidebar ahora usa tarjeta con `surfaceAlt`, borde sutil y logout danger premium.

## Archivos modificados por Z8C

- `components/layout/TopBar.tsx`
- `components/layout/Sidebar.tsx`
- `docs/LIVE_Z8B_DARK_THEME_STANDARDIZATION.md`
- `docs/PRODUCT_B_INTERNAL_UI_KIT_FOUNDATION.md`

## Validaciones ejecutadas

- `npx.cmd tsc --noEmit` - OK.
- `npm.cmd run lint` - OK con 60 warnings preexistentes.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` - OK.
- `./mvnw.cmd test` desde `backend/control-ropa` - OK, 73 tests.
- `./mvnw.cmd -q -DskipTests package` desde `backend/control-ropa` - OK.
- `git diff --check` - OK, solo avisos CRLF de Windows.
- `git status --short --untracked-files=all` - ejecutado.
- `git --no-pager diff --stat` - ejecutado.
- `git --no-pager diff --name-only` - ejecutado.

## Warnings

- Lint mantiene 60 warnings preexistentes.
- Maven mantiene warnings preexistentes de MySQL 5.7 y Mockito dynamic agent.
- Git muestra avisos LF -> CRLF por entorno Windows.

## QA visual recomendada

Rutas:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`

Validar en claro y oscuro:

- Desktop no duplica `ADMIN / QA Admin General / DEFAULT / QA Centro` entre TopBar y Sidebar.
- Sidebar footer es el lugar principal para usuario/rol/logout.
- TopBar se ve limpio y contextual.
- Toggle claro/oscuro sigue visible.
- Drawer mobile/tablet mantiene usuario y cerrar sesion.
- No hay textos invisibles ni overflow.

## No se cambio

- Backend.
- AUTH/RBAC.
- Pagos, caja, reportes, billing e IA.
- Reglas operativas LIVE.
- Capacidades LIVE.
- Logout funcional.

## GO / NO-GO

GO tecnico: validaciones automatizadas OK.

GO visual condicionado a QA manual de desktop/tablet/mobile.
