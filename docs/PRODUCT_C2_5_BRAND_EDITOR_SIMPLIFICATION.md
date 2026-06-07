# PRODUCT-C2.5 - Simplificacion final de editor visual de marca

Fecha: 2026-06-07
Rama: `feature/product-c2-5-brand-editor-simplification`

## Objetivo

PRODUCT-C2.5 simplifica la experiencia principal de `/ui-kit` para que se lea como configuracion de diseno de la aplicacion, no como laboratorio tecnico.

La fase mantiene el selector propio de PRODUCT-C2.4, los tres colores de marca, la paleta sugerida, contraste, preview, aplicacion local y restauracion de plantilla.

## Problema detectado

Aunque PRODUCT-C2.4 funcionaba tecnicamente, la pantalla seguia mostrando demasiado en la vista inicial:

- escalas largas de `tints`, `shades` y `tones`;
- selector de armonia como control visible de primer nivel;
- textos de identidad visual local;
- design tokens y tokens semanticos;
- copy que podia hacer pensar al cliente que debia editar variables internas.

## Vista principal final

La vista principal queda enfocada en:

1. Plantilla visual.
2. Colores de marca.
3. Paleta sugerida.
4. Legibilidad.
5. Vista previa de la aplicacion.
6. Aplicar cambios / restaurar.
7. Opciones avanzadas.

No se muestran por defecto tokens tecnicos, RGB/HSL, escalas largas, componentes, templates ni ratios completos.

## Colores de marca

Se mantienen:

- `Principal`: navegacion, botones principales y acciones clave.
- `Secundario`: contraste, fondos fuertes o botones secundarios.
- `Acento`: elementos destacados, chips, detalles o llamadas de atencion.

El acento se explica como tercer color de marca, no como token tecnico.

## Variaciones

Las variaciones se movieron al modal `AppColorPicker`.

Al cambiar principal, secundario o acento, el modal muestra:

- color actual;
- HEX;
- muestras sugeridas;
- claros;
- oscuros;
- desaturados;
- aplicar/cancelar.

La pantalla principal ya no muestra todas las escalas al mismo tiempo.

## Armonia

La armonia queda como sugerencia avanzada, no como limitante.

Reglas documentadas en UI:

- si solo hay color principal, el sistema sugiere secundario y acento;
- si hay secundario o acento definido, esos colores se respetan;
- cuando hay colores definidos, se muestra `Usando colores de marca definidos`.

El selector de armonia se conserva dentro de opciones avanzadas.

## Legibilidad

El bloque visible se renombra a `Legibilidad`.

La vista principal revisa solo:

- boton principal;
- texto sobre fondo;
- estado reservado.

Los ratios y contrastes completos quedan en opciones avanzadas.

## Identidad local y tokens

`Identidad visual local` se renombra dentro de avanzado a `Editor avanzado de tokens locales`.

La explicacion aclara que:

- son tokens internos;
- se guardan localmente en este dispositivo;
- no son necesarios para configurar la apariencia basica;
- no modifican backend ni tenant.

`Design tokens` tambien queda dentro de avanzado con una descripcion de diagnostico tecnico.

## /appearance

`/appearance` mantiene una tarjeta simple hacia `/ui-kit`:

- plantilla visual;
- colores de marca;
- vista previa de la aplicacion.

No se duplica el generador.

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
es: leaves=1238 missing=0 extra=0
en: leaves=1238 missing=0 extra=0
pt-BR: leaves=1238 missing=0 extra=0
fr: leaves=1238 missing=0 extra=0
ja: leaves=1238 missing=0 extra=0
zh: leaves=1238 missing=0 extra=0
ko: leaves=1238 missing=0 extra=0
```

Las traducciones nuevas son base tecnica y requieren revision humana/nativa antes de release internacional.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Confirmar que la vista principal no parece laboratorio tecnico.
4. Elegir plantilla visual.
5. Revisar `Colores de marca`.
6. Cambiar principal, secundario y acento con el picker propio.
7. Confirmar que claros/oscuros/desaturados aparecen dentro del modal.
8. Confirmar que armonia no aparece como limitante en la vista principal.
9. Revisar paleta sugerida.
10. Revisar `Legibilidad`.
11. Confirmar preview antes de aplicar.
12. Aplicar paleta localmente.
13. Restaurar plantilla.
14. Abrir opciones avanzadas.
15. Confirmar que editor de tokens locales, design tokens, componentes y templates siguen disponibles.
16. Validar light/dark y mobile/tablet.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se elimina la capacidad tecnica; queda en avanzado.
- No se implementa ajuste automatico de contraste en esta fase.
- No se instalan dependencias externas.
- No se agregan fuentes externas.

---

## Continuidad PRODUCT-C2.6 - Armonia y modal

Fecha: 2026-06-07

PRODUCT-C2.6 conserva la simplificacion de PRODUCT-C2.5 y pule dos puntos visuales:

- armonia se comunica como sugerencia segun los colores faltantes, no como limitante;
- `AppColorPicker` se compacta con pestañas de muestras, claros, oscuros y desaturados.

Tambien corrige keys duplicadas en listas de colores para evitar warnings de React en mobile.
