# PRODUCT-C2.1 - Generador visual de paletas y contraste

Fecha: 2026-06-06
Rama: `feature/product-c2-1-palette-contrast-generator`

## Objetivo

PRODUCT-C2.1 convierte el editor controlado de identidad visual en una experiencia mas visual para QA y administracion tecnica: el usuario elige un color base, revisa armonias, variaciones, contraste y una mini preview real antes de aplicar la paleta localmente.

No se toca backend, no se crean endpoints y no se agrega persistencia por tenant. La aplicacion sigue usando la persistencia local de `CustomVisualIdentity` creada en PRODUCT-C2.

## Color base

El generador vive en `/ui-kit`, dentro de la seccion de identidad visual.

Permite:

- seleccionar color base con muestra grande;
- editar HEX;
- usar input nativo de color en web cuando esta disponible;
- usar swatches rapidos;
- ver valores HEX, RGB y HSL;
- actualizar la preview inmediatamente.

Los valores invalidos no rompen la pantalla: el generador usa fallback seguro para calcular preview y muestra helper de HEX valido.

## Armonias implementadas

Se implementaron armonias internas sin librerias externas:

- monocromatica;
- complementaria;
- analoga;
- triadica;
- tetradica.

Las armonias sugieren acentos visuales, pero no sustituyen automaticamente la semantica de `success`, `warning` y `danger`. Esos tokens mantienen verdes, ambares y rojos controlados para estados operativos.

## Variaciones

Desde el color base se generan:

- tints / claros;
- shades / oscuros;
- tones / desaturados;
- escala compacta de 7 tonos por grupo.

Cada swatch puede seleccionarse para convertirlo en nuevo color base.

## Contraste

Se agrego un panel de contraste basico con luminancia relativa y ratio aproximado WCAG.

Se revisa:

- texto claro sobre `primary`;
- texto oscuro sobre `primary`;
- texto sobre `accent`;
- texto sobre `danger`;
- texto principal sobre `background`;
- texto principal sobre `surface`;
- boton primario con texto recomendado.

Estados visibles:

- contraste correcto;
- revisar;
- contraste bajo.

Si hay bajo contraste, se muestra advertencia antes de aplicar. No se bloquea completamente la aplicacion local, pero la advertencia queda visible para que QA no aplique una paleta claramente ilegible sin verla.

## Preview real de UI

El generador incluye una mini interfaz con:

- sidebar;
- card;
- boton primario;
- boton secundario;
- input;
- badge activo;
- badge reservado/danger;
- aviso operativo.

La preview usa la paleta sugerida, no solo puntos de color, para que el usuario vea el efecto real antes de aplicar.

## Aplicacion local

La accion `Aplicar paleta localmente` actualiza:

- `primary`;
- `secondary`;
- `accent`;
- `success`;
- `warning`;
- `danger`;
- `background`;
- `surface`.

Tambien actualiza el editor HEX existente y persiste en `AsyncStorage` mediante `setCustomVisualIdentity`.

No se guarda en backend ni por tenant en esta fase.

## Previews de plantillas

Las tarjetas de plantillas en `/ui-kit` se cambiaron de puntos de color a mini previews con:

- fondo;
- sidebar;
- card;
- boton primario;
- badge success;
- badge danger.

Esto permite distinguir visualmente `retailPremium`, `darkConsole`, `blueCorporate`, `boutique` y `classicErp` antes de aplicar.

## /appearance

`/appearance` conserva sus campos actuales de branding y HEX.

Se agrega una tarjeta informativa que abre el generador avanzado en `/ui-kit`. No se duplica el laboratorio visual para evitar complejidad y no mezclarlo con branding, logos o configuracion de impresion.

## I18N

Se agrego la seccion `paletteGenerator.*` a:

- `es`;
- `en`;
- `pt-BR`;
- `fr`;
- `ja`;
- `zh`;
- `ko`.

Auditoria local:

```text
es: leaves=1147 missing=0 extra=0
en: leaves=1147 missing=0 extra=0
pt-BR: leaves=1147 missing=0 extra=0
fr: leaves=1147 missing=0 extra=0
ja: leaves=1147 missing=0 extra=0
zh: leaves=1147 missing=0 extra=0
ko: leaves=1147 missing=0 extra=0
static i18n keys=992
missing=0
```

Las traducciones nuevas son base tecnica y requieren revision humana/nativa antes de release internacional.

## Utilidades internas

Se agrego `theme/colorUtils.ts` con utilidades propias para:

- validar y normalizar HEX;
- convertir HEX/RGB/HSL;
- ajustar HSL;
- generar tints, shades y tones;
- generar armonias;
- calcular luminancia relativa;
- calcular contraste;
- sugerir texto claro u oscuro;
- generar paleta semantica segura.

No se instalaron dependencias externas.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Abrir el generador de paleta.
4. Elegir color base.
5. Ver variaciones.
6. Cambiar armonia.
7. Ver paleta sugerida.
8. Revisar contraste.
9. Aplicar paleta localmente.
10. Confirmar que la preview y el editor HEX cambian.
11. Abrir `/live` o `/customers` y confirmar que el tema local se aplica.
12. Cambiar light/dark.
13. Restaurar plantilla.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se implementa color wheel complejo.
- No se instalan librerias externas.
- No se incluyen fuentes externas.
- La revision de contraste es basica, no reemplaza auditoria completa de accesibilidad.
- Las traducciones nuevas requieren revision nativa.

---

## Continuidad PRODUCT-C2.2 - Flujo simplificado

Fecha: 2026-06-06

PRODUCT-C2.2 conserva el generador de paletas, armonias, contraste y preview de PRODUCT-C2.1, pero reorganiza `/ui-kit` como un flujo guiado:

1. Plantilla visual.
2. Color base.
3. Paleta sugerida.
4. Contraste principal.
5. Vista previa.
6. Aplicar o restaurar.

Las secciones largas de tokens, escalas completas, componentes, templates, variantes y ratios tecnicos quedan disponibles en detalles avanzados. El cambio no elimina capacidades; reduce la carga visual inicial para QA y clientes.
