# PRODUCT-B - Internal UI Kit Foundation

Proyecto: control-ropa-app
Rama: feature/product-b-internal-ui-kit-foundation
Commit base: cb6fc78
Fecha: 2026-06-03

## Objetivo

Iniciar la base visual interna para una experiencia tipo ERP/admin panel sin instalar librerias externas y sin tocar backend funcional, AUTH, RBAC, pagos, caja, reportes, billing, IA ni LIVE-Z5.

PRODUCT-B1 aplica el nuevo framework visual solo a una zona segura: `app/index.tsx` como pantalla Inicio/Home Dashboard.

## Decision heredada de PRODUCT-A

GO:

- Componentes propios con `StyleSheet`.
- Formalizar UI Kit interno.

NO-GO ahora:

- Tamagui.
- NativeWind.
- gluestack UI.

GO condicionado futuro:

- React Native Paper solo en sandbox aislado si se necesita acelerar ERP/admin.

## Arquitectura visual propuesta

Se crea una estructura reusable:

- `AppShell`: layout general con sidebar, topbar y area principal.
- `Sidebar`: navegacion por modulos permitidos.
- `SidebarNavItem`: item de menu con estado activo/disabled.
- `TopBar`: encabezado con titulo, subtitulo, usuario, rol, empresa y sucursal.
- UI Kit base: badges, metric cards, action tiles, section headers, entity summary y empty states.

La arquitectura usa:

- `AppThemeContext`;
- `StyleSheet`;
- `useResponsiveLayout`;
- `@expo/vector-icons`, que ya existe en el proyecto.

No se agregan dependencias.

## AppShell

Archivo:

- `components/layout/AppShell.tsx`

Responsabilidades:

- layout general de app;
- sidebar visible en tablet/desktop;
- menu modal lateral en mobile;
- topbar/header;
- area principal scrollable;
- `activeRoute`;
- `rightContent`;
- navegacion con Expo Router;
- soporte responsive.

Uso aplicado:

```tsx
<AppShell title="Inicio" subtitle="Resumen operativo" activeRoute="home">
  {children}
</AppShell>
```

## Sidebar

Archivos:

- `components/layout/Sidebar.tsx`
- `components/layout/SidebarNavItem.tsx`

Comportamiento:

- muestra solo modulos permitidos por sesion/permisos reales;
- no muestra como disponible una ruta sin permiso;
- respeta `activeRoute`;
- desktop/tablet: lateral fijo;
- mobile: menu modal desde TopBar;
- no crea rutas nuevas.

Secciones actuales:

- Operacion: Inicio, LIVE, Clientes, Reservas.
- Control: Usuarios, Sistema, Reportes, Configuracion.

Cada item depende de permisos reales existentes (`canAccess`, `canAccessByPermission`, `canViewLive`, `isAdmin`).

## TopBar

Archivo:

- `components/layout/TopBar.tsx`

Muestra:

- titulo;
- subtitulo;
- usuario/correo;
- roles;
- empresa/sucursal;
- boton menu en mobile.

No crea nueva logica de sesion.

## Home / Dashboard inicial

Pantalla aplicada:

- `app/index.tsx`

Decision:

- Se reemplaza el redirect directo a `/(tabs)` por Inicio profesional.
- Se conserva redirect a `/login` si no hay sesion.
- Se conserva redirect a `/change-password` si aplica.
- Si el usuario es `NO_ACCESS`, no se llama dashboard operativo y se muestra estado restringido.

Datos reales usados:

- `getSession()`;
- `ensureSessionActive()`;
- `getUserDashboard()`;
- `resolveLiveActorContext()`;
- permisos visuales de `accessControl` y `livePermissionGuards`.

Se muestran:

- resumen de usuario;
- rol;
- actor operativo LIVE;
- empresa/sucursal;
- metricas reales de dashboard por sucursal;
- pendientes reales derivados de `dashboard.actions`;
- accesos rapidos permitidos.

## Componentes UI creados

- `components/ui/StatusBadge.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/ActionTile.tsx`
- `components/ui/SectionHeader.tsx`
- `components/ui/EntitySummaryCard.tsx`
- `components/ui/EmptyState.tsx`

Estos componentes son pequenos, reversibles y listos para crecer en PRODUCT-B2/B3.

## Pantallas tocadas

- `app/index.tsx`

## Pantallas no tocadas

- `app/live.tsx`
- `app/dashboard.tsx`
- `app/system.tsx`
- `app/users.tsx`
- `app/customers.tsx`
- `app/reservations.tsx`
- `app/reservation-detail.tsx`
- backend completo.

LIVE-Z5 no se reescribio ni se envolvio todavia.

## Comportamiento responsive

Desktop/tablet:

- sidebar lateral visible;
- contenido en area principal;
- cards en grid;
- topbar profesional.

Mobile:

- sidebar pasa a menu modal lateral;
- dashboard apilado;
- accesos rapidos siguen visibles;
- no se bloquea scroll.

## Comportamiento por rol

ADMIN / Operador:

- ve Inicio con resumen operativo;
- ve accesos permitidos a LIVE, reservas, clientes, usuarios/sistema/reportes si aplica.

SELLER / Vendedor:

- ve Inicio con resumen disponible;
- ve accesos permitidos;
- no ve administracion no permitida.

SUPERVISOR:

- ve Inicio con resumen de monitoreo disponible;
- ve accesos de control/reportes segun permisos reales.

NO_ACCESS:

- no se llama dashboard operativo;
- no se muestra navegacion lateral util;
- se muestra estado restringido.

## Datos no disponibles / estados vacios

No se crean endpoints nuevos.

Si no hay fuente real para clientes de seguimiento, se muestra:

- `No hay clientes para seguimiento`.

Si no hay resumen o sucursal:

- `Sin resumen por ahora`.

Si no hay pendientes:

- `Sin pendientes por ahora`.

No se usan mocks ni numeros fake.

## Seguridad visual y permisos

- El menu no es bypass de permisos.
- No se llaman pagos.
- No se consulta caja/reportes/pagos desde Inicio.
- No se crean permisos.
- No se modifica AUTH/RBAC.
- NO_ACCESS queda bloqueado.

## Riesgos

- `app/index.tsx` ahora carga dashboard real; si `/api/dashboard/me` falla, se muestra estado de error sin tumbar la pantalla.
- El shell aun no esta aplicado a pantallas internas.
- Mobile usa modal simple, no drawer avanzado.
- El menu inicial cubre modulos principales; puede ampliarse en PRODUCT-B2.

## Limitaciones

- No hay visual QA automatizado.
- No se migro `app/dashboard.tsx`; mantiene su pantalla existente.
- No se creo DataGridLite/Timeline todavia para evitar sobreingenieria.

## Validaciones

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `./mvnw.cmd test`
- `./mvnw.cmd -q -DskipTests package`
- `git diff --check`

## GO / NO-GO

GO tecnico para QA visual de Inicio/AppShell.

NO-GO para:

- migrar LIVE-Z5 todavia;
- migrar toda la app;
- instalar librerias externas;
- tocar backend/Auth/RBAC/pagos.

## Siguiente fase recomendada

PRODUCT-B2: aplicar `AppShell` de forma incremental a `app/system.tsx` o `app/users.tsx`, y extraer patrones de listas/tablas:

- `DataGridLite`;
- `TimelineEventList`;
- `RestrictedPanel`;
- `PendingList`.

Mantener una pantalla por fase y validaciones completas.

---

## PRODUCT-B2 - Design tokens y templates visuales

Fecha: 2026-06-03

### Objetivo

Fortalecer el UI Kit interno sin instalar librerias externas, creando tokens visuales y templates reutilizables para avanzar hacia una experiencia ERP/admin mas profesional y vendible.

PRODUCT-B2 no toca backend, AUTH, RBAC, pagos, caja, reportes financieros, billing, IA ni `app/live.tsx`.

### Design tokens creados

Archivo:

- `theme/designTokens.ts`

Tokens definidos:

- `colors`: primario, secundario, acento, estados, superficies, fondo, borde y textos.
- `spacing`: escala `xs` a `2xl`.
- `radius`: escala `sm` a `full`.
- `shadows`: elevaciones `card`, `floating` y `modal`.
- `typography`: tamanos base para titulo, subtitulo, cuerpo, caption y metrica.
- `layout`: ancho de sidebar, max-width de contenido, gaps y paddings por breakpoint.
- `breakpoints`: mobile, tablet y desktop.

Tambien se mantiene:

- `theme/viewVariants.ts`

Las variantes `admin`, `operator`, `seller`, `supervisor`, `noAccess` y `default` son solo presentacionales. No reemplazan AUTH ni RBAC.

### Componentes actualizados con tokens

Se conectaron tokens de forma acotada en:

- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/SidebarNavItem.tsx`
- `components/layout/TopBar.tsx`
- `components/ui/ActionTile.tsx`
- `components/ui/MetricCard.tsx`
- `components/ui/StatusBadge.tsx`
- `components/ui/SectionHeader.tsx`
- `components/ui/EntitySummaryCard.tsx`
- `components/ui/EmptyState.tsx`

No se hizo migracion masiva de estilos existentes.

### Templates creados

Ubicacion:

- `components/templates/`

Templates:

- `DashboardTemplate.tsx`: pantallas de inicio/resumen operativo.
- `OperationalTemplate.tsx`: pantallas tactiles de operacion, preparado para LIVE en fase futura.
- `MonitoringTemplate.tsx`: dashboards de supervisor/indicadores.
- `DetailTemplate.tsx`: detalle de entidades como reserva, cliente, prenda o usuario.
- `ListTemplate.tsx`: listados con header, filtros, acciones y empty state.

Estos templates son estructurales y reciben `ReactNode`; no crean logica de negocio ni llamadas a servicios.

### Home / Dashboard aplicado

Pantalla modificada:

- `app/index.tsx`

Cambios:

- Home usa `DashboardTemplate`.
- Se mantiene `AppShell`.
- Se conserva carga real con `getUserDashboard()`.
- Se conservan accesos rapidos filtrados por permisos reales.
- Se corrigio separador visual del subtitulo de resumen a ASCII.
- No se agregaron mocks ni datos falsos.

### Reglas responsive

Desktop:

- sidebar visible;
- contenido con ancho maximo por token;
- dashboard con columna principal y columna secundaria;
- metricas en grid.

Tablet:

- sidebar visible si hay espacio;
- cards touch-friendly;
- layout flexible por columnas.

Mobile:

- sidebar en menu modal;
- template apila columnas por `flexWrap`;
- accesos rapidos usan columna unica;
- no se agrega navegacion compleja.

### Variantes visuales

Las variantes se documentan como presentacion:

- `admin`: administrativo compacto.
- `operator`: touch-first operativo.
- `seller`: apoyo visual.
- `supervisor`: monitoreo.
- `noAccess`: bloqueado.
- `default`: generico.

La fuente de verdad sigue siendo la sesion, roles y permisos reales.

### Pantallas no migradas

No se tocaron:

- `app/live.tsx`
- pantallas de pagos/caja;
- reportes;
- backend;
- AUTH/RBAC;
- detalle de reserva;
- pantallas de administracion completas.

### Riesgos y limitaciones

- Los templates aun son base visual; PRODUCT-B3 debe aplicarlos a una pantalla adicional real.
- No hay QA visual automatizado.
- El mobile usa modal simple para menu, no drawer avanzado.
- Las variantes visuales no deben usarse como autorizacion.

### GO / NO-GO

GO tecnico para continuar con UI Kit interno y aplicar templates de forma incremental.

NO-GO para:

- instalar librerias externas;
- migrar LIVE-Z5 todavia;
- tocar backend/Auth/RBAC/pagos;
- usar datos fake para hacer ver mejor el dashboard.

### Siguiente fase recomendada

PRODUCT-B3: aplicar `DetailTemplate` o `ListTemplate` a una pantalla de bajo riesgo, por ejemplo `app/system.tsx` o una pantalla de consulta, manteniendo permisos reales y validaciones completas.

---

## PRODUCT-B2.1 - Logout y UI Kit Preview

Fecha: 2026-06-03

### Objetivo

Cerrar dos huecos detectados en QA visual antes de cerrar PRODUCT-B2:

- agregar una accion clara de cerrar sesion;
- crear una pantalla interna para ver tokens, componentes y templates.

No se toca backend, AUTH backend, RBAC, pagos, caja, reportes, billing, IA ni `app/live.tsx`.

### Logout en AppShell

Archivos:

- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`

Comportamiento:

- `AppShell` reutiliza `logout()` de `services/authService.ts`.
- `logout()` llama `/api/auth/logout` si esta disponible y siempre limpia sesion local con `clearSession()`.
- Despues de cerrar sesion, `AppShell` redirige a `/login`.

Desktop/tablet:

- El sidebar muestra al final:
  - rol;
  - nombre/correo;
  - boton `Cerrar sesion`.

Mobile:

- El menu lateral muestra boton `X` para cerrar.
- El overlay sigue cerrando al tocar fuera.
- Seleccionar una ruta cierra el menu.
- El boton `Cerrar sesion` tambien esta dentro del menu mobile.

### UI Kit Preview

Ruta:

- `app/ui-kit.tsx`

Titulo:

- `UI Kit`

Subtitulo:

- `Catalogo interno de componentes y templates`

Acceso:

- Visible en sidebar solo para ADMIN.
- Si un usuario no ADMIN abre `/ui-kit` directo, ve estado restringido.

Contenido:

- Design tokens: colores, radios, spacing y layout.
- Componentes UI: `StatusBadge`, `MetricCard`, `ActionTile`, `SectionHeader`, `EntitySummaryCard`, `EmptyState`.
- Templates: `DashboardTemplate`, `OperationalTemplate`, `MonitoringTemplate`, `DetailTemplate`, `ListTemplate`.
- Variantes visuales: `admin`, `operator`, `seller`, `supervisor`, `noAccess`, `default`.

Los datos usados en `/ui-kit` son ejemplos marcados como preview visual. No se introducen datos fake en pantallas reales.

### Que no se debe hacer todavia

- No usar variantes visuales como autorizacion.
- No migrar LIVE-Z5 todavia.
- No exponer `/ui-kit` como modulo comercial.
- No instalar librerias externas.
- No conectar previews con endpoints nuevos.

### Siguiente fase recomendada

PRODUCT-B3 puede elegir una pantalla real de bajo riesgo y aplicar `DetailTemplate` o `ListTemplate`. Recomendacion: una pantalla administrativa simple, no LIVE.

---

## PRODUCT-B2.2 - Responsive AppShell y Sidebar

Fecha: 2026-06-03

### Objetivo

Corregir el comportamiento responsive detectado por QA: en ancho medio/tablet el sidebar fijo ocupaba demasiado espacio y comprimía el contenido.

### Regla responsive aplicada

Desktop grande:

- `>= 1200px`
- sidebar fijo visible;
- contenido principal con max-width controlado;
- logout visible al final del sidebar.

Tablet / ancho medio:

- `< 1200px`
- sidebar deja de ser fijo;
- se usa drawer temporal desde el boton menu del TopBar;
- contenido ocupa casi todo el ancho disponible;
- padding tablet controlado por tokens.

Mobile:

- `< 768px`
- sidebar oculto por defecto;
- boton menu visible;
- drawer lateral con overlay;
- boton X visible;
- cierre al tocar fuera o navegar;
- logout dentro del drawer.

### Tokens ajustados

Archivo:

- `theme/designTokens.ts`

Cambios:

- `layout.drawerWidthMobile`
- `layout.drawerWidthTablet`
- `breakpoints.tablet = 768`
- `breakpoints.desktopWide = 1200`

### Archivos ajustados

- `hooks/use-responsive-layout.ts`
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`

### UI Kit y Home

`/` y `/ui-kit` usan el mismo `AppShell`, por lo que heredan:

- sidebar fijo solo en desktop grande;
- drawer en tablet/mobile;
- logout visible y funcional;
- contenido sin compresion lateral en ancho medio.

### Restricciones respetadas

No se tocaron backend, AUTH backend, RBAC, pagos, caja, reportes, billing, IA ni `app/live.tsx`.

### Validacion visual pendiente

Pendiente QA manual en navegador:

- desktop >= 1366px;
- tablet 800-1100px;
- mobile 360-430px;
- logout con cambio de usuario.

---

## PRODUCT-B2.3 - Pulido visual de Sidebar y Home

Fecha: 2026-06-03

### Objetivo

Pulir detalles visuales detectados por QA antes de cerrar PRODUCT-B2:

- evitar encimado visual entre `UI Kit` y rol ADMIN;
- compactar sidebar;
- mejorar jerarquia visual del menu;
- hacer Home menos plano sin cambiar datos ni logica.

### Cambios aplicados

Sidebar:

- `UI Kit` se separa en la seccion `Desarrollo`, visible solo para ADMIN.
- El badge de rol queda en TopBar/footer de usuario, no sobre items del menu.
- `layout.sidebarWidth` baja a 248px.
- Navegacion del sidebar usa scroll interno para evitar montarse con el footer/logout en alturas medianas.
- Items del menu son mas compactos y con espaciado consistente.
- Secciones usan labels pequenos en uppercase.
- Logout queda visualmente separado al final.

TopBar:

- Header mas compacto.
- En desktop grande muestra usuario/sucursal completos.
- En tablet/mobile conserva boton menu, titulo y badge de rol sin saturar.

Home dashboard:

- Metricas bajan a grid de 2 columnas en desktop dentro de la columna principal.
- `MetricCard`, `ActionTile`, `EntitySummaryCard` y `EmptyState` tienen proporciones mas compactas.
- Se mantiene `DashboardTemplate` y datos reales existentes.

UI Kit:

- Sigue disponible en `/ui-kit` solo para ADMIN.
- No se agregan nuevos previews ni datos fuera de la pantalla interna.

### Restricciones respetadas

No se instalaron librerias externas y no se tocaron backend, AUTH backend, RBAC, pagos, caja, reportes, billing, IA ni `app/live.tsx`.

### Validacion visual pendiente

- Confirmar que `UI Kit` no se encima con ADMIN.
- Confirmar sidebar compacto en desktop/AnyDesk.
- Confirmar drawer mobile/tablet.
- Confirmar Home y `/ui-kit` sin overflow.

---

## PRODUCT-B2.4 - Tema claro/oscuro y jerarquia visual aplicada a LIVE

Fecha: 2026-06-04

### Objetivo

Formalizar el sistema visual para que LIVE consuma el UI Kit interno de forma mas real: tokens, tema claro/oscuro, variantes de botones y estados consistentes.

### Cambios del sistema visual

- `AppThemeContext` expone `themeMode`, `setThemeMode` y `toggleThemeMode`.
- La preferencia `LIGHT`/`DARK` se guarda localmente con AsyncStorage.
- `TopBar` incluye un toggle visible para cambiar entre claro y oscuro.
- `AppButton` incorpora la variante `neutral` y un estilo bloqueado basado en tokens.
- El estado disabled deja de depender solo de opacidad y usa:
  - `disabledButtonBackground`;
  - `disabledButtonText`.
- Se agregan tokens de boton neutral:
  - `neutralButtonBackground`;
  - `neutralButtonText`;
  - `neutralButtonBorder`.

### UI Kit

`/ui-kit` se actualizo para mostrar:

- tema activo;
- boton para alternar claro/oscuro;
- preview de botones:
  - Primary;
  - Secondary;
  - Neutral;
  - Danger;
  - Disabled;
- badges, templates y tokens existentes.

### LIVE

`/live` ahora usa la jerarquia visual del UI Kit:

- `primary`: accion principal inmediata.
- `secondary`: accion frecuente de menor prioridad.
- `neutral`: soporte operativo/outline/subtle.
- `danger`: accion destructiva.
- disabled: accion bloqueada con motivo visible.

Tambien reemplaza colores de estado hardcodeados en cards de prenda por tokens del tema.

### Restricciones respetadas

No se instalaron librerias externas. No se tocaron backend, AUTH backend, RBAC, pagos, caja, reportes, billing, IA ni contratos de API.

### Validacion visual pendiente

- Ver `/ui-kit` en claro y oscuro.
- Ver `/live` en claro y oscuro.
- Confirmar contraste de botones y badges.
- Confirmar `reservation-detail` heredando tema desde AppShell.
