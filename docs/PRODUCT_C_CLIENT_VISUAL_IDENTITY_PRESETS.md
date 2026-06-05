# PRODUCT-C - Client Visual Identity Presets

Fecha: 2026-06-05
Rama: `feature/product-c-premium-visual-system`

## Objetivo

Preparar `control-ropa-app` para identidad visual por cliente usando plantillas controladas, sin crear un editor libre de colores y sin persistir configuracion en backend.

## Principio

La identidad visual se aplica por **presets semanticos**, no por colores sueltos por pantalla.

Esto permite:

- mantener contraste minimo razonable;
- evitar combinaciones ilegibles;
- conservar consistencia entre AppShell, LIVE, Home, Clientes, Reservas, Usuarios, Sistema, Reportes, UI Kit y Detail;
- preparar una futura persistencia por cliente/tenant sin cambiar cada pantalla.

## Presets implementados

Archivo:

- `theme/designPresets.ts`

Presets activos:

- `retailPremium`
- `darkConsole`
- `blueCorporate`
- `boutique`
- `classicErp`

Cada preset define colores para light y dark:

- `primary`
- `primarySoft`
- `secondary`
- `accent`
- `accentSoft`
- `background`
- `backgroundElevated`
- `surface`
- `surfaceAlt`
- `surfaceElevated`
- `surfaceMuted`
- `border`
- `borderSubtle`
- `borderStrong`
- `textPrimary`
- `textSecondary`
- `textMuted`
- `textOnPrimary`
- `textOnAccent`
- `success`
- `successSoft`
- `warning`
- `warningSoft`
- `danger`
- `dangerSoft`
- `info`
- `infoSoft`
- `inputBackground`
- `inputBorder`
- `inputText`
- `inputPlaceholder`
- `disabledBackground`
- `disabledText`
- `shadow`
- `shadowSoft`
- `focusRing`
- `overlay`

Tambien define:

- radio visual (`standard`, `soft`, `compact`);
- densidad (`NORMAL`, `COMPACT`).

## Selector UI

Ruta:

- `/ui-kit`

Se agrego seccion:

- `Identidad visual`
- `Plantilla visual activa`

Desde ahi se puede seleccionar una plantilla visual activa.

## Persistencia actual

La seleccion se guarda localmente con `AsyncStorage`:

- `controlRopa.localVisualPreset`

Esto significa:

- sobrevive refresh;
- afecta toda la app autenticada;
- no cambia backend;
- no cambia tenant;
- no se sincroniza entre dispositivos.

## Pendiente para cliente/tenant

Persistencia futura sugerida:

- tabla/configuracion de branding por tenant o company;
- endpoint administrativo seguro para asignar preset permitido;
- no editor libre inicialmente;
- lista blanca de presets activos;
- auditoria de cambios de identidad visual;
- fallback a `retailPremium` si el preset no existe o queda inactivo.

Fase sugerida:

- PRODUCT-E - Client Branding Configuration

## Que no se puede cambiar todavia

- Logo por cliente.
- Tipografias externas.
- Colores sueltos por componente.
- Editor libre de tema.
- Branding persistido en backend.
- Configuracion diferente por sucursal.

## Reglas de seguridad visual

- No exponer presets incompletos.
- No permitir elegir colores arbitrarios.
- No permitir combinaciones sin contraste.
- Mantener `dangerSoft` para estados bloqueantes como prenda reservada.
- Mantener `successSoft` para disponibilidad.
- Mantener `warningSoft` para preparacion o advertencias no bloqueantes.
- Mantener fallback `retailPremium`.

## Relacion con light/dark mode

El preset no reemplaza light/dark.

La resolucion es:

1. modo claro/oscuro;
2. preset visual activo;
3. tokens semanticos finales;
4. componentes/pantallas.

Por eso cada preset define variante `light` y variante `dark`.

## Validacion de un preset

Validar:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`

En cada ruta:

- texto primario visible;
- texto secundario legible;
- inputs legibles;
- disabled distinguible;
- danger no chillante;
- reserved rojo premium;
- dark mode sin textos perdidos;
- mobile/tablet sin overflow.

## Riesgos

- Persistencia local no representa branding real por cliente.
- Pantallas legacy fuera de AppShell pueden no reflejar el preset con la misma calidad.
- El cambio de preset puede revelar hardcodes de color pendientes.

## GO / NO-GO

GO para uso interno/local y demo controlada.

NO-GO para branding contractual por cliente hasta tener persistencia backend/tenant y auditoria.
