# PRODUCT-C2.3 - Guided app design flow

Fecha: 2026-06-07

## Objetivo

PRODUCT-C2.3 cambia el enfoque principal de `/ui-kit`: deja de presentarse como catalogo tecnico y pasa a comunicar claramente que es la pantalla de `Diseno de la aplicacion`.

La ruta sigue siendo `/ui-kit`, pero la experiencia visible para usuario admin queda orientada a configurar colores y apariencia del sistema.

## Problema detectado

PRODUCT-C2.2 redujo carga visual, pero la pantalla todavia se percibia como laboratorio tecnico:

- el encabezado principal seguia diciendo `UI Kit`;
- el contexto hablaba de catalogo interno;
- el usuario no veia con claridad que estaba cambiando colores de la aplicacion;
- algunos labels visibles seguian cerca de tokens tecnicos;
- aplicar/restaurar no cerraba la secuencia como paso final.

## Flujo guiado aplicado

La experiencia principal ahora sigue una secuencia accionable:

1. Elige una plantilla visual.
2. Elige el color principal.
3. Revisa la paleta sugerida.
4. Revisa contraste y legibilidad.
5. Mira la vista previa.
6. Aplica o restaura cambios.

El stepper se mantiene simple, numerado y compatible con textos largos.

## Visible por defecto

Queda visible en la vista principal:

- titulo `Diseno de la aplicacion`;
- subtitulo de configuracion visual;
- pasos guiados;
- plantilla visual activa;
- selector compacto de plantillas;
- color principal de marca;
- armonia;
- paleta sugerida para la aplicacion;
- contraste y legibilidad;
- vista previa de la aplicacion;
- aplicar paleta localmente;
- restaurar plantilla;
- ver opciones avanzadas.

## Modo avanzado

Queda cerrado por defecto y conserva:

- tokens tecnicos;
- editor controlado HEX;
- RGB/HSL;
- swatches rapidos;
- tints/shades/tones;
- contraste detallado;
- componentes UI;
- panel LIVE de referencia;
- templates;
- variantes visuales.

El texto aclara que estas opciones son utiles para desarrollo o ajustes finos y no son necesarias para configurar la apariencia basica.

## /appearance vs /ui-kit

`/appearance` se mantiene como pantalla de branding y configuracion visual simple.

La tarjeta de acceso ahora comunica:

- `Diseno de la aplicacion`;
- configuracion de colores, plantilla visual y preview;
- boton `Abrir editor visual`.

No se duplica el generador en `/appearance`.

## I18N

Se agregaron y ajustaron claves `paletteGenerator.*` en:

- `es`;
- `en`;
- `pt-BR`;
- `fr`;
- `ja`;
- `zh`;
- `ko`.

Auditoria local de estructura:

```text
es: leaves=1194 missing=0 extra=0
en: leaves=1194 missing=0 extra=0
pt-BR: leaves=1194 missing=0 extra=0
fr: leaves=1194 missing=0 extra=0
ja: leaves=1194 missing=0 extra=0
zh: leaves=1194 missing=0 extra=0
ko: leaves=1194 missing=0 extra=0
```

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Confirmar que el titulo comunica `Diseno de la aplicacion`.
4. Confirmar que el stepper explica la secuencia.
5. Elegir plantilla.
6. Elegir color principal.
7. Revisar paleta sugerida.
8. Revisar contraste y legibilidad.
9. Ver preview.
10. Aplicar paleta localmente.
11. Abrir `/live` o `/customers` y confirmar aplicacion visual.
12. Volver a `/ui-kit`.
13. Restaurar plantilla.
14. Abrir opciones avanzadas.
15. Confirmar que tokens/componentes/templates siguen disponibles sin saturar por defecto.
16. Abrir `/appearance` y confirmar tarjeta `Diseno de la aplicacion`.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se elimina el UI Kit tecnico; queda como modo avanzado.
- No se instalan librerias externas.
- No se agregan fuentes externas.
- La validacion de contraste sigue siendo basica.
- Las traducciones nuevas requieren revision nativa.

---

## Continuidad PRODUCT-C2.4 - Colores de marca

Fecha: 2026-06-07

PRODUCT-C2.4 mantiene el flujo guiado de `Diseno de la aplicacion`, pero cambia el paso de color principal por `Colores de marca`.

La experiencia visible ahora permite configurar:

1. color principal;
2. color secundario;
3. color de acento.

El cambio evita que el selector nativo de Windows/navegador sea la experiencia principal. La seleccion se realiza con `AppColorPicker`, un panel propio con HEX, swatches, variaciones, aplicar, cancelar y restaurar color original.

La paleta sugerida respeta los colores definidos por el usuario y completa los tokens restantes con reglas semanticas seguras.
