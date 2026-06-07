# PRODUCT-C2.4 - Selector propio de colores de marca

Fecha: 2026-06-07
Rama: `feature/product-c2-4-custom-brand-color-picker`

## Objetivo

PRODUCT-C2.4 reemplaza la experiencia principal del selector nativo de navegador/Windows en `/ui-kit` por un selector visual propio de la aplicacion y extiende el flujo de identidad visual para trabajar con hasta tres colores de marca:

- color principal;
- color secundario;
- color de acento.

La fase no toca backend, no crea endpoints y no agrega persistencia por tenant. La aplicacion sigue usando los overrides locales existentes del sistema visual.

## Problema detectado

El flujo de PRODUCT-C2.3 ya comunicaba mejor el `Diseno de la aplicacion`, pero al cambiar el color principal se abria el selector nativo del sistema operativo. Eso generaba una ruptura visual:

- la ventana no seguia light/dark ni presets de la app;
- la experiencia se sentia tecnica y externa;
- la seleccion de marca quedaba limitada a un solo color visible;
- el usuario no podia configurar marcas con color secundario o acento sin tocar tokens avanzados.

## Selector propio

Se agrego `components/ui/AppColorPicker.tsx` como selector visual interno.

El picker soporta:

- panel/modal propio de la aplicacion;
- muestra grande del color;
- campo HEX controlado;
- swatches sugeridos;
- variaciones claras, oscuras y desaturadas;
- aplicar color;
- cancelar cambios;
- restaurar color original;
- estilos compatibles con light/dark y presets.

El selector nativo ya no es la experiencia principal. Si en una fase futura se conserva un control nativo, debe quedar solo como fallback avanzado, no como accion principal.

## Colores de marca

La seccion visible cambia de `Color principal de marca` a `Colores de marca`.

Se soportan tres entradas:

- `Principal`: navegacion, botones principales y acciones clave.
- `Secundario`: contraste, fondos fuertes o botones secundarios.
- `Acento`: elementos destacados, estados o llamadas de atencion.

Si el usuario define solo principal, el sistema genera secundario y acento con armonias. Si define dos o tres colores, la paleta sugerida respeta esos colores y completa los tokens semanticos restantes.

## Generacion de paleta

`theme/colorUtils.ts` mantiene la generacion semantica segura y ahora acepta `BrandColorInputs`.

Reglas:

- 1 color: `primary` usa el color principal y `secondary`/`accent` se generan por armonia.
- 2 colores: `primary` y `secondary` se respetan; `accent` se genera.
- 3 colores: `primary`, `secondary` y `accent` se respetan.
- `success`, `warning` y `danger` mantienen semantica operativa segura y no se derivan ciegamente de la marca.
- `background` y `surface` siguen dependiendo de light/dark para conservar legibilidad.

## Contraste

El resumen de contraste ahora contempla:

- texto sobre principal;
- texto sobre secundario;
- texto sobre acento;
- estado reservado/danger;
- texto sobre fondo;
- texto sobre superficie.

Los ratios tecnicos siguen disponibles en opciones avanzadas. En la vista principal se muestra una lectura simple de `Correcto`, `Revisar` o `Bajo contraste`.

## Preview

La vista previa usa la paleta resultante con los tres colores de marca:

- mini sidebar;
- card;
- boton primario;
- boton secundario;
- chip/acento;
- input;
- badge activo;
- badge reservado;
- aviso operativo.

La preview se actualiza antes de aplicar cambios locales.

## /appearance

`/appearance` no duplica el generador. Conserva la tarjeta de acceso a `/ui-kit` y actualiza su copy para mencionar:

- plantilla visual;
- colores de marca;
- vista previa.

Los campos de branding existentes se mantienen intactos.

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
es: leaves=1213 missing=0 extra=0
en: leaves=1213 missing=0 extra=0
pt-BR: leaves=1213 missing=0 extra=0
fr: leaves=1213 missing=0 extra=0
ja: leaves=1213 missing=0 extra=0
zh: leaves=1213 missing=0 extra=0
ko: leaves=1213 missing=0 extra=0
```

Las traducciones nuevas son base tecnica y requieren revision humana/nativa antes de release internacional.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Ir a `Colores de marca`.
4. Cambiar color principal.
5. Confirmar que no se abre la ventana nativa de Windows como experiencia principal.
6. Cambiar color secundario.
7. Cambiar color de acento.
8. Ver paleta sugerida.
9. Revisar contraste y legibilidad.
10. Ver preview.
11. Aplicar paleta localmente.
12. Abrir `/live` o `/customers` y confirmar tema aplicado.
13. Volver a `/ui-kit`.
14. Restaurar plantilla.
15. Validar light/dark.
16. Validar mobile/tablet.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se implementa color wheel complejo.
- No se instala ninguna libreria externa.
- No se agregan fuentes externas.
- El picker nativo queda fuera de la experiencia principal.
- La validacion de contraste sigue siendo basica y no reemplaza auditoria completa de accesibilidad.

---

## Continuidad PRODUCT-C2.5 - Simplificacion final

Fecha: 2026-06-07

PRODUCT-C2.5 conserva el selector propio y los tres colores de marca, pero simplifica la primera vista de `/ui-kit`.

Cambios principales:

- `tints`, `shades` y `tones` se mueven al modal `AppColorPicker`;
- el selector de armonia queda en opciones avanzadas;
- la armonia se explica como sugerencia automatica, no como limitante;
- `Identidad visual local` se renombra a `Editor avanzado de tokens locales`;
- `Design tokens` queda como diagnostico tecnico dentro de avanzado;
- el bloque visible de contraste se reduce a `Legibilidad`.
