# PRODUCT-C2.1 - Generador visual de paletas y contraste

Fecha: 2026-06-06 23:36:19 America/Mexico_City
Rama: feature/product-c2-1-palette-contrast-generator

## Alcance

- Agregar utilidades internas de color en `theme/colorUtils.ts`.
- Agregar generador visual de paletas en `/ui-kit`.
- Mantener editor HEX y overrides locales existentes.
- Agregar armonias, variaciones, contraste basico y preview real de UI.
- Mejorar previews de plantillas visuales.
- Agregar acceso desde `/appearance` sin duplicar el laboratorio visual.
- Agregar claves i18n en 7 idiomas.

## Implementacion

### Utilidades de color

`theme/colorUtils.ts` incluye:

- validacion y normalizacion HEX;
- conversion HEX/RGB/HSL;
- conversion HSL/RGB/HEX;
- ajuste HSL;
- tints, shades y tones;
- armonias monocromatica, complementaria, analoga, triadica y tetradica;
- luminancia relativa;
- contraste WCAG aproximado;
- recomendacion de texto claro/oscuro;
- generacion de paleta semantica.

### Generador en UI Kit

El generador permite:

- elegir color base;
- editar HEX;
- usar input nativo de color en web;
- usar swatches rapidos;
- ver HEX/RGB/HSL;
- cambiar armonia;
- ver tints, shades y tones;
- cargar tokens individuales al editor;
- aplicar paleta localmente;
- revisar contraste;
- ver preview real de UI.

### Aplicacion local

La accion `Aplicar paleta localmente` actualiza los tokens:

- primary;
- secondary;
- accent;
- success;
- warning;
- danger;
- background;
- surface.

La persistencia usa `setCustomVisualIdentity` y `AsyncStorage`. No se toca backend.

## I18N

Se agrego `paletteGenerator.*` en:

- es;
- en;
- pt-BR;
- fr;
- ja;
- zh;
- ko.

Auditoria:

- es: leaves=1147 missing=0 extra=0
- en: leaves=1147 missing=0 extra=0
- pt-BR: leaves=1147 missing=0 extra=0
- fr: leaves=1147 missing=0 extra=0
- ja: leaves=1147 missing=0 extra=0
- zh: leaves=1147 missing=0 extra=0
- ko: leaves=1147 missing=0 extra=0
- static i18n keys=992
- missing=0

## Validaciones ejecutadas

- `npm.cmd run lint`: PASS, 0 errores, 53 advertencias preexistentes.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `backend/control-ropa/.\\mvnw.cmd test`: PASS, 73 tests, 0 fallas, 0 errores.
- `backend/control-ropa/.\\mvnw.cmd -q -DskipTests package`: PASS.
- `git --no-pager diff --check`: PASS.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Elegir color base en el generador.
4. Ver tints, shades y tones.
5. Cambiar armonia.
6. Revisar paleta sugerida.
7. Confirmar que el panel de contraste muestra estados y ratios.
8. Aplicar paleta localmente.
9. Confirmar que preview y editor HEX cambian.
10. Abrir `/live` o `/customers` y confirmar que el tema local se refleja.
11. Cambiar light/dark.
12. Restaurar plantilla.
13. Abrir `/appearance` y confirmar acceso al generador avanzado.

## Resultado

GO tecnico para QA visual/manual. No se implemento persistencia backend ni tenant; queda pendiente para una fase de branding por tenant.
