# PRODUCT-C1 - Global Premium Visual Rollout

Fecha: 2026-06-05
Rama: `feature/product-c-premium-visual-system`

## Objetivo

Extender la direccion visual premium a las rutas autenticadas principales sin tocar backend, AUTH/RBAC, pagos reales, caja real, reportes backend, billing, IA, reglas LIVE, permisos LIVE, contratos de API ni migraciones.

## Direccion visual

La direccion elegida se mantiene como **Enterprise retail premium**:

- interfaz limpia, moderna y operativa;
- lenguaje consistente para shell, cards, botones, badges, inputs y estados;
- light mode ejecutivo;
- dark mode tipo consola premium;
- menos formularios planos y menos bordes duros;
- estados claros sin colores chillones;
- tablet-friendly y usable en desktop/mobile.

## Auditoria de pantallas autenticadas

Pantallas que ya usaban AppShell antes de PRODUCT-C1:

- `app/index.tsx`
- `app/live.tsx`
- `app/reservation-detail.tsx`
- `app/ui-kit.tsx`

Pantallas principales migradas visualmente en PRODUCT-C1:

- `app/customers.tsx`
- `app/reservations.tsx`
- `app/users.tsx`
- `app/system.tsx`
- `app/reports.tsx`

Pantallas principales revisadas y no migradas en esta fase:

- Formularios y detalles secundarios como `users-form`, `customers-create`, reportes individuales, items, pagos, devoluciones y consignaciones.
- Motivo: requieren una fase propia de migracion visual para evitar tocar flujos sensibles o pantallas largas con formularios legacy.

## AppShell global

Se agrego `components/layout/appNavigation.ts` para centralizar la navegacion principal del shell:

- Inicio;
- LIVE;
- Clientes;
- Reservas;
- Usuarios;
- Sistema;
- Reportes;
- Configuracion;
- UI Kit para admin.

El helper respeta permisos reales existentes y no crea roles ni permisos paralelos.

## Tokens

Se reforzaron tokens semanticos:

- `successSoft`
- `warningSoft`
- `dangerSoft`
- `infoSoft`
- `shadowSoft`

Estos tokens estan disponibles en `theme/designTokens.ts` y `context/AppThemeContext.tsx`.

## Identidad visual por presets

Se agrego base de plantillas visuales controladas:

- `retailPremium`
- `darkConsole`
- `blueCorporate`
- `boutique`
- `classicErp`

Archivo:

- `theme/designPresets.ts`

Selector:

- `/ui-kit`, seccion `Identidad visual`.

Persistencia:

- local via `AsyncStorage`;
- clave `controlRopa.localVisualPreset`.

Pendiente:

- persistencia por cliente/tenant en backend;
- auditoria de cambios de branding;
- lista blanca configurable desde administracion.

## Componentes base

Cambios principales:

- `AppCard`: variantes `default`, `elevated`, `subtle`, `selected`, `success`, `warning`, `danger`, `info`.
- `StatusBadge`: tonos `neutral`, `success`, `warning`, `danger`, `info`, `role`, `live`, `reserved`.
- `AppInfoCard`: ahora usa `AppCard variant="info"`.
- `ActionTile`: acento lateral y elevacion para accesos rapidos.
- `MetricCard`: superficie elevada y label ejecutivo.
- `SectionHeader`: acento lateral y jerarquia.
- `RestrictedSection`: warning premium.

## Regla visual: Prenda reservada

La prenda reservada deja de verse como warning ambar dominante.

Regla aplicada:

- `Reservada` usa tono `reserved`, basado en `dangerSoft`.
- Borde y chip usan `danger`.
- Fondo suave, sin rojo chillante.
- Se diferencia de:
  - disponible: verde;
  - preparada: warning/neutral suave;
  - reservada: danger suave;
  - error critico: danger fuerte.

Pantallas/componentes impactados:

- `app/live.tsx`
- `app/ui-kit.tsx`
- `StatusBadge`

## Pantallas modificadas

### Clientes

- Migra a `AppShell`.
- Conserva permisos `VIEW_CUSTOMERS` y `CREATE_CUSTOMER`.
- Usa `AppCard`, `StatusBadge`, `EmptyState` y header contextual.

### Reservas

- Migra a `AppShell`.
- Conserva filtros, refresh, detalle, `returnTo` y asignacion de caja.
- Usa `StatusBadge`, `AppCard`, `EmptyState` y acciones con jerarquia.

### Usuarios

- Migra a `AppShell`.
- Conserva guard `canManageUsers`, activar/desactivar y editar.
- Usa badges de estado, cards elevadas y estado vacio premium.

### Sistema

- Migra a `AppShell`.
- Conserva idioma, preferencias LIVE y accesos internos.
- Tiles internos usan `ActionTile`.

### Reportes

- Migra a `AppShell`.
- Lista de reportes usa `ActionTile`.
- No se tocaron reportes backend.

### UI Kit

- Agrega preview de `reserved`/danger premium.
- Mantiene cards, notices, inputs, badges y panel LIVE como referencia visual.

## Warnings web

Corregido:

- `pointerEvents` en `AppShell` pasa de prop a `style.pointerEvents`.

Pendiente:

- Hay estilos legacy con `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` y `elevation`.
- No se migro todo a `boxShadow` porque React Native nativo y Web no comparten exactamente el mismo contrato visual. Se recomienda PRODUCT-C2 para introducir un helper multiplataforma de sombras.

## No se cambio

- Backend.
- AUTH/RBAC funcional.
- Pagos reales.
- Caja real.
- Reportes backend.
- Billing.
- IA.
- Reglas LIVE.
- Permisos LIVE.
- Contratos publicos de API.

## QA visual recomendado

Validar light/dark:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`

Usuarios:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

Confirmar:

- shell consistente;
- no duplicidad de usuario;
- dark mode legible;
- light mode limpio;
- cards y botones con jerarquia;
- prenda reservada en rojo premium;
- permisos/vistas sin romper;
- sin datos fake.

## Riesgos

- La migracion visual de pantallas legacy principales cambia layout y navegacion visible, aunque mantiene servicios y acciones.
- Algunas pantallas secundarias siguen en estilo legacy.
- Warnings web de sombras quedan parcialmente pendientes.

## GO / NO-GO

GO tecnico si pasan lint, TypeScript, export web y regresion backend.

GO visual condicionado a QA manual en rutas principales.

## Siguiente fase recomendada

PRODUCT-C2:

- helper de sombras multiplataforma para eliminar warnings `shadow*` en Web;
- migracion visual de formularios y reportes individuales;
- revisar pantallas de pagos/caja solo visualmente y con guardas estrictas;
- checklist de contraste automatizable.

---

## Continuidad PRODUCT-C2

PRODUCT-C2 agrega un editor controlado de identidad visual local en `/ui-kit`. El editor mantiene el modelo seguro de PRODUCT-C1: presets como base, overrides semanticos limitados, preview en vivo y restauracion de plantilla.

La persistencia por cliente/tenant, auditoria y politica centralizada de presets siguen fuera de alcance hasta una fase backend dedicada.
