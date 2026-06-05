# PRODUCT-C - Premium Visual System

Fecha: 2026-06-04

## Objetivo

Definir y aplicar una direccion visual premium global para `control-ropa-app`, sin tocar backend ni reglas de negocio.

## Direccion visual elegida

La identidad visual elegida es:

**Enterprise retail premium**

Principios:

- Panel operativo moderno, no formulario administrativo.
- Retail profesional: claro, confiable, rapido de leer y apto para tablet.
- Jerarquia fuerte: shell, secciones, cards, estados y acciones deben tener pesos visuales claros.
- Dark mode disenado: superficies con profundidad, texto legible y estados sobrios.
- Light mode limpio: fondo suave, superficies elevadas, bordes sutiles y sombras discretas.
- Sin colores arbitrarios por pantalla si existe token semantico.

## Tokens consolidados

Tokens base reforzados:

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
- `accent`
- `accentSoft`
- `success`
- `warning`
- `danger`
- `info`
- `inputBackground`
- `inputBorder`
- `inputText`
- `inputPlaceholder`
- `disabledBackground`
- `disabledText`
- `shadow`
- `focusRing`

## Componentes base

### AppCard

Se formalizaron variantes:

- `default`
- `elevated`
- `subtle`
- `warning`
- `success`
- `danger`
- `selected`

Las variantes controlan superficie, borde, acento lateral, sombra y elevacion.

### AppButton

Variantes disponibles:

- `primary`
- `secondary`
- `neutral`
- `ghost`
- `danger`
- disabled visual con motivo.

### StatusBadge

Mantiene tonos:

- `neutral`
- `success`
- `warning`
- `danger`
- `info`

Los badges usan tokens semanticos para mantener contraste en claro/oscuro.

### SectionHeader

Se convirtio en encabezado visual de seccion con:

- acento lateral;
- eyebrow contextual;
- titulo/subtitulo con mejor ritmo.

## Shell premium

### AppShell

- Agrega superficie ambiental superior.
- Mantiene sidebar fijo en desktop.
- Mantiene drawer en tablet/mobile.
- Usa ancho de contenido controlado.

### Sidebar

- Brand panel mas solido.
- Marca visual con icono de tienda y acento semantico.
- Separacion clara de secciones.
- Estado activo con `accentSoft`, no bloque solido pesado.
- Footer de sesion como tarjeta:
  - rol;
  - usuario;
  - correo;
  - cerrar sesion.

### TopBar

- Header contextual premium.
- No duplica usuario completo en desktop.
- Mantiene toggle claro/oscuro y acciones globales.

## Pantallas impactadas

### Inicio

Hereda:

- AppShell premium;
- cards elevadas;
- metricas con linea de acento;
- action tiles con mejor profundidad y acento lateral;
- empty states mas consistentes.

### LIVE

Sin cambiar reglas operativas:

- action tiles de preparacion mas premium;
- prenda al aire con superficie elevada;
- estados reservada/disponible con acentos, no fondos saturados;
- input de precio y helper texts legibles en claro/oscuro.

### Reservation detail

- `RestrictedSection` ahora usa `AppCard variant="warning"`.
- Cards y warnings heredan el sistema visual.
- No se cambio logica de pagos, permisos, 403 ni 404.

### UI Kit

`/ui-kit` ahora muestra:

- tokens;
- comparativo claro/oscuro;
- botones;
- inputs;
- cards por variante;
- badges;
- notices;
- templates;
- panel LIVE premium.

## No se cambio

- Backend.
- AUTH/RBAC.
- Pagos reales.
- Caja.
- Reportes financieros.
- Billing.
- IA.
- Reglas LIVE.
- Permisos LIVE.
- Contratos de API.

## Validacion visual recomendada

Rutas:

- `/`
- `/live`
- `/ui-kit`
- `/reservation-detail?id=<id valido>`

Usuarios:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

Validar:

- no hay duplicidad de usuario en desktop;
- dark mode se ve disenado;
- light mode se ve limpio;
- botones tienen jerarquia;
- cards tienen consistencia;
- textos son legibles;
- no hay datos fake;
- responsive sin overflow.

## Riesgos

- Pantallas legacy que no usan AppShell o componentes base pueden seguir viendose menos premium.
- QA visual manual sigue siendo necesario en tablet/AnyDesk.

## GO / NO-GO

GO tecnico si validaciones automatizadas pasan.

GO visual condicionado a QA manual en rutas principales.

## Siguiente fase recomendada

PRODUCT-C2:

- Auditoria de pantallas legacy fuera del shell.
- Accesibilidad/contraste automatizable.
- Migracion gradual de listados y formularios antiguos a componentes base.

---

## Continuidad PRODUCT-C1 - Presets de identidad visual

Fecha: 2026-06-05

Se agrego base controlada de identidad visual por cliente mediante presets locales:

- `retailPremium`
- `darkConsole`
- `blueCorporate`
- `boutique`
- `classicErp`

Implementacion:

- `theme/designPresets.ts`
- `context/AppThemeContext.tsx`
- selector en `/ui-kit`

La seleccion se guarda localmente y afecta la app real mediante tokens semanticos. No se persiste en backend ni tenant todavia.

Ver `docs/PRODUCT_C_CLIENT_VISUAL_IDENTITY_PRESETS.md`.
