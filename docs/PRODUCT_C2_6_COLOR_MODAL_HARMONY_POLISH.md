# PRODUCT-C2.6 - Pulido de armonia y modal de seleccion de color

Fecha: 2026-06-07
Rama: `feature/product-c2-6-color-modal-harmony-polish`

## Objetivo

PRODUCT-C2.6 pule el flujo de colores de marca en `/ui-kit`: la armonia deja de percibirse como una restriccion y el modal `Elegir color` queda mas compacto, guiado y seguro en mobile/tablet.

La fase conserva:

- selector propio `AppColorPicker`;
- tres colores de marca;
- generacion de paleta;
- contraste/legibilidad;
- preview;
- aplicar paleta localmente;
- restaurar plantilla;
- opciones avanzadas.

## Problemas detectados

QA visual detecto:

- `Armonia de color` podia seguir sintiendose como una regla que reemplazaba colores de marca;
- si principal, secundario y acento ya estaban definidos, armonia no debia parecer activa en el flujo principal;
- el modal `Elegir color` mostraba demasiadas listas al mismo tiempo;
- en mobile aparecio el warning de React por keys duplicadas, por ejemplo `#0F172A`;
- el color de acento necesitaba explicarse como tercer color de marca.

## Regla de armonia

La armonia ahora se comunica como sugerencia:

- solo principal: ayuda a sugerir secundario y acento;
- principal + secundario: respeta secundario y sugiere acento;
- principal + acento: respeta acento y sugiere secundario;
- principal + secundario + acento: muestra `Usando colores de marca definidos`.

Los controles completos de armonia quedan en opciones avanzadas.

## Color de acento

El color de acento se explica como tercer color de marca:

- resalta detalles;
- chips;
- llamadas de atencion;
- elementos destacados.

No se mezcla con colores semanticos del sistema como `success`, `warning` o `danger`.

## Modal de color

`AppColorPicker` ahora muestra:

- titulo especifico por color: principal, secundario o acento;
- nombre del color editado;
- muestra grande;
- campo HEX;
- pestañas compactas:
  - muestras;
  - claros;
  - oscuros;
  - desaturados;
- acciones de restaurar, cancelar y aplicar siempre fuera del scroll.

Esto evita listas largas y hace el modal mas util en mobile/tablet.

## Variaciones por color

Las variaciones dependen del color que se edita:

- principal genera claros/oscuros/desaturados del principal;
- secundario genera claros/oscuros/desaturados del secundario;
- acento genera claros/oscuros/desaturados del acento.

No se muestran variaciones en la pantalla principal.

## Keys duplicadas

Se corrigio el warning de React:

```text
Encountered two children with the same key, "#0F172A".
```

Las listas de colores ya no usan solo el HEX como key. Ahora usan keys compuestas por seccion, HEX normalizado e indice.

Ademas, cada seccion del picker deduplica colores internamente.

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
es: leaves=1245 missing=0 extra=0
en: leaves=1245 missing=0 extra=0
pt-BR: leaves=1245 missing=0 extra=0
fr: leaves=1245 missing=0 extra=0
ja: leaves=1245 missing=0 extra=0
zh: leaves=1245 missing=0 extra=0
ko: leaves=1245 missing=0 extra=0
```

Las traducciones nuevas son base tecnica y requieren revision humana/nativa antes de release internacional.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Definir solo color principal y confirmar que armonia se presenta como ayuda.
4. Definir principal + secundario y confirmar que armonia solo sugiere acento.
5. Definir principal + secundario + acento y confirmar `Usando colores de marca definidos`.
6. Abrir `Cambiar color` en principal.
7. Revisar tabs `Muestras`, `Claros`, `Oscuros`, `Desaturados`.
8. Repetir para secundario y acento.
9. Confirmar que no aparece warning de key duplicada.
10. Aplicar color.
11. Revisar paleta sugerida, legibilidad y preview.
12. Aplicar paleta localmente.
13. Restaurar plantilla.
14. Validar light/dark y mobile/tablet.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se implementa color wheel complejo.
- No se instala ninguna dependencia externa.
- No se agregan fuentes externas.
