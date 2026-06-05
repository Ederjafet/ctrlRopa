# LIVE-Z8D / PRODUCT-B4.2 - Premium visual redesign pass

Fecha: 2026-06-04 23:43 CST

Rama: `feature/live-z8-authorization-requests`

## Objetivo

Hacer una pasada visual fuerte y visible sobre AppShell, UI Kit y LIVE para acercar la app a un panel operativo premium, sin cambiar reglas funcionales ni backend.

## Cambios visuales aplicados

### Tokens

Se agregaron tokens semanticos:

- `backgroundElevated`
- `surfaceElevated`
- `borderSubtle`
- `accentSoft`

### Shell

- AppShell agrega superficie ambiental superior para dar profundidad.
- TopBar usa borde sutil, sombra premium, eyebrow contextual y composicion mas clara.
- Sidebar usa brand panel, secciones con mas aire y footer de sesion como tarjeta.
- SidebarNavItem activo usa `accentSoft` + acento en lugar de bloque solido pesado.

### Componentes UI

- `AppCard` usa superficie elevada, borde sutil y sombra mas visible.
- `ActionTile` gana radio, elevacion e icono con `accentSoft`.
- `MetricCard` agrega linea de acento para jerarquia.
- `EntitySummaryCard` y `EmptyState` heredan el look premium.
- `AppButton` agrega variante `ghost`.
- `AppInput` conserva contraste y agrega profundidad ligera.
- `LiveCommerceCards` usa superficie elevada y sombras consistentes.

### LIVE

- Preparar siguiente prenda usa action tiles con mas intencion visual.
- Prenda al aire usa superficie elevada y acento lateral en lugar de fondos verdes/ambar pesados.
- Prenda reservada mantiene warning elegante con superficie integrada.
- No se tocaron capacidades, permisos, autorizaciones ni reglas de reserva.

### UI Kit

- Se agrego preview de boton `ghost`.
- Se agregaron inputs editable y solo lectura.
- Se agrego panel LIVE premium con ejemplos de:
  - prenda preparada;
  - prenda al aire disponible;
  - prenda reservada/bloqueada.

## Archivos revisados/modificados

- `context/AppThemeContext.tsx`
- `theme/designTokens.ts`
- `components/layout/AppShell.tsx`
- `components/layout/TopBar.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/SidebarNavItem.tsx`
- `components/ui/AppButton.tsx`
- `components/ui/AppCard.tsx`
- `components/ui/AppInput.tsx`
- `components/ui/ActionTile.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/EntitySummaryCard.tsx`
- `components/ui/EmptyState.tsx`
- `components/live/LiveCommerceCards.tsx`
- `app/live.tsx`
- `app/ui-kit.tsx`
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

## No se cambio

- Backend.
- AUTH/RBAC.
- Pagos/caja/reportes/billing/IA.
- Reglas operativas LIVE.
- Capacidades LIVE.
- AuthorizationRequestPanel.
- Logout.

## QA visual recomendado

Validar en claro y oscuro:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`

Usuarios:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

Confirmar:

- AppShell se ve mas premium.
- Sidebar activo y footer de usuario se ven pulidos.
- TopBar no duplica usuario en desktop.
- LIVE se siente mas consola operativa y menos formulario.
- Precio LIVE sigue legible.
- No hay datos fake.
- No hay overflow en desktop/tablet/mobile.

## GO / NO-GO

GO tecnico: validaciones automatizadas OK.

GO visual condicionado a QA manual en navegador/dispositivo.
