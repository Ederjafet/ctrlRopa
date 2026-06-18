# LIVE-Z8B / PRODUCT-B4 - Dark theme premium y estandarizacion visual

Fecha: 2026-06-04

## Objetivo

Fortalecer el modo oscuro y estandarizar el lenguaje visual de las pantallas que ya usan AppShell/UI Kit, sin tocar backend ni reglas operativas LIVE.

## Alcance

- Tema claro/oscuro centralizado en `context/AppThemeContext.tsx`.
- Tokens semanticos ampliados en `theme/designTokens.ts`.
- Componentes base alineados:
  - `AppShell`;
  - `AppButton`;
  - `AppCard`;
  - `AppInput`;
  - `AppText`;
  - `StatusBadge`;
  - `AppNoticeDropdown`;
  - `LiveCommerceCards`.
- Pantallas revisadas:
  - `/`;
  - `/live`;
  - `/reservation-detail`;
  - `/ui-kit`.

## Cambios aplicados

- El dark mode usa superficies oscuras, texto principal claro y texto secundario legible.
- `mutedText` ya no se deriva del color secundario configurable, para evitar bajo contraste en dark mode.
- Inputs usan tokens de `inputBackground`, `inputText`, `inputPlaceholder` y estados readonly/disabled.
- Botones secundarios y neutrales tienen borde sutil para conservar intencion visual en modo oscuro.
- Badges neutrales usan `surfaceMuted`, `textSecondary` y `borderStrong`.
- Overlays/drawers usan `theme.colors.overlay`.
- Alertas warning en dark mode se suavizan para no parecer bloques ambar agresivos.
- `reservation-detail` reemplaza colores hardcodeados del bloque de pagos por tokens warning.
- `/ui-kit` agrega tokens semanticos del tema activo y comparativo claro/oscuro.

## LIVE

En `/live` se corrigio el contraste del bloque de precio al depender de:

- `theme.colors.mutedText` con contraste seguro;
- `AppInput` con `inputText`/`disabledBackground`;
- helper texts y captions con tokens del tema.

La prenda reservada mantiene semantica warning, pero con superficie premium y borde/acento, no con amarillo plano dominante.

## No se cambio

- Backend.
- AUTH/RBAC.
- Pagos/caja/reportes/billing/IA.
- Capacidades LIVE.
- Reglas de reserva, doble reserva, vendido operativo, cancelacion o autorizaciones.
- Contratos de API.

## Validacion visual recomendada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/live`.
3. Cambiar entre claro y oscuro desde TopBar.
4. Confirmar que `3. PRECIO` muestra label, helper, input y valor sin seleccionar texto.
5. Confirmar que botones primary/secondary/neutral/danger/disabled mantienen jerarquia.
6. Abrir `/reservation-detail?id=<id valido>` y revisar cards/pagos/restringidos en dark mode.
7. Abrir `/ui-kit` y revisar tokens semanticos, comparativo claro/oscuro y previews.

## Riesgos pendientes

- Puede quedar algun color hardcodeado en componentes fuera del AppShell o en el selector de colores, que es intencionalmente una paleta editable.
- La validacion visual manual multiusuario sigue siendo necesaria para confirmar contraste real en dispositivos tablet/AnyDesk.

## GO / NO-GO

GO tecnico condicionado a validaciones automatizadas y QA visual manual.

NO-GO para cerrar PRODUCT-B4 si algun texto de LIVE, especialmente precio, queda invisible en dark mode.

## Siguiente fase recomendada

PRODUCT-B5:

- Auditoria visual del resto de pantallas no migradas al AppShell.
- Catalogo de accesibilidad/contraste.
- Aplicar tokens a pantallas legacy antes de migraciones funcionales grandes.

---

## LIVE-Z8C / PRODUCT-B4.1 - Premium AppShell polish

Fecha: 2026-06-04

### Objetivo

Eliminar la duplicidad visual de usuario/rol entre TopBar y Sidebar en desktop, manteniendo una experiencia clara en tablet/mobile.

### Decision de diseño

- Desktop:
  - Sidebar fijo es el lugar principal para usuario, rol y cerrar sesion.
  - TopBar queda para contexto de pantalla, subtitulo operativo, toggle claro/oscuro y acciones globales.
  - TopBar ya no muestra nombre completo, correo ni empresa/sucursal.
- Tablet/mobile:
  - TopBar puede mostrar un badge compacto de rol porque el Sidebar vive como drawer.
  - El detalle completo de usuario sigue en el drawer.

### Cambios

- `TopBar` oculta el resumen completo de usuario en desktop.
- `TopBar` conserva toggle claro/oscuro y contexto de pantalla.
- `Sidebar` footer se convirtio en tarjeta de sesion con:
  - badge de rol;
  - nombre;
  - correo;
  - boton `Cerrar sesion`.
- El boton `Cerrar sesion` usa danger premium con superficie sobria, no bloque rojo dominante.

### No se cambio

- Backend.
- AUTH/RBAC.
- Pagos/caja/reportes/billing/IA.
- Reglas LIVE.
- Logout funcional.

---

## LIVE-Z8D / PRODUCT-B4.2 - Premium visual redesign pass

Fecha: 2026-06-04

### Objetivo

Hacer una pasada visual mas evidente sobre el sistema UI existente para que AppShell, UI Kit y LIVE se perciban como panel operativo moderno, sin cambiar reglas funcionales.

### Tokens reforzados

- `backgroundElevated`
- `surfaceElevated`
- `borderSubtle`
- `accentSoft`

Estos tokens agregan profundidad y jerarquia sin hardcodear colores por pantalla.

### Shell premium

- AppShell agrega una superficie ambiental superior para dar profundidad.
- TopBar usa borde sutil, sombra mas suave y composicion contextual.
- Sidebar usa brand panel, secciones con mas aire y footer de sesion como tarjeta.
- Items activos del Sidebar dejan de ser bloque solido y usan `accentSoft` + acento.

### Componentes premium

- `AppCard` usa `surfaceElevated`, sombra mas visible y borde sutil.
- `ActionTile` tiene icono con `accentSoft`, radio mayor y elevacion.
- `MetricCard` agrega linea de acento para jerarquia.
- `EmptyState` y `StatusBadge` usan tokens semanticos.
- `AppButton` agrega variante `ghost`.
- `AppInput` conserva contraste y profundidad ligera.

### LIVE

- Las action tiles de preparar prenda usan superficie elevada, icono con acento y sombra.
- La card de prenda al aire se eleva visualmente y evita fondos verdes/ambar pesados.
- La prenda reservada conserva warning elegante con superficie integrada.
- No se tocaron capacidades, permisos, reservas ni autorizaciones.

### UI Kit

- Se agrego preview de variante `ghost`.
- Se agregaron inputs en estado editable y solo lectura.
- Se agrego panel LIVE premium con ejemplos:
  - prenda preparada;
  - prenda al aire disponible;
  - prenda reservada/bloqueada.

### No se cambio

- Backend.
- AUTH/RBAC.
- Pagos/caja/reportes/billing/IA.
- Reglas operativas LIVE-Z6/Z7/Z8.
- AuthorizationRequestPanel ni su comportamiento.

---

## PRODUCT-C1 - Ajuste global posterior

Fecha: 2026-06-05

PRODUCT-C1 cambia la semantica visual de prenda reservada:

- Antes: warning/ambar suave.
- Ahora: `reserved` basado en `dangerSoft` + borde/chip `danger`.

Motivo:

- Una prenda reservada es bloqueo operativo, no solo advertencia.
- Debe diferenciarse de prenda preparada y de disponibilidad normal.

No cambia reglas LIVE, permisos, reserva, autorizaciones ni backend.
