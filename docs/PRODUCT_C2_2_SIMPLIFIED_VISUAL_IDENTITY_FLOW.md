# PRODUCT-C2.2 - Simplified visual identity flow

Fecha: 2026-06-06

## Objetivo

PRODUCT-C2.2 simplifica `/ui-kit` despues de PRODUCT-C2.1. El generador de paletas, contraste y preview se conserva, pero la pantalla deja de mostrar por defecto todos los tokens, escalas, componentes y detalles tecnicos al mismo tiempo.

La meta es que un usuario pueda seguir un flujo claro:

1. Plantilla visual.
2. Color base.
3. Paleta sugerida.
4. Contraste.
5. Vista previa.
6. Aplicar o restaurar.

## Problema detectado

PRODUCT-C2.1 dejo una herramienta tecnicamente completa, pero muy larga para QA visual y clientes:

- presets visuales;
- generador de color;
- swatches;
- armonias;
- contraste tecnico;
- editor HEX;
- tokens completos;
- componentes;
- templates;
- variantes;
- previews.

La pantalla mezclaba decision visual, auditoria tecnica y catalogo de componentes en un solo primer plano.

## Nuevo flujo guiado

Se agrego una tarjeta de flujo de identidad visual al inicio de `/ui-kit`.

Visible por defecto:

- plantilla activa;
- selector compacto de presets;
- color base y armonia;
- paleta sugerida;
- contraste principal;
- preview real de UI;
- aplicar paleta localmente;
- restaurar plantilla;
- boton para abrir detalles tecnicos.

## Modo avanzado

El contenido tecnico queda disponible al activar detalles avanzados:

- valores RGB/HSL;
- swatches rapidos;
- armonias completas;
- escalas largas de tints, shades y tones;
- editor manual de tokens HEX;
- radius y density;
- detalles tecnicos de contraste;
- design tokens;
- semantic tokens;
- componentes UI;
- panel LIVE;
- templates;
- variantes visuales.

No se elimino capacidad tecnica; se redujo la carga visual inicial.

## Presets

Las plantillas siguen visibles como tarjetas compactas con:

- nombre;
- descripcion;
- mini preview real;
- estado activo;
- accion para usar plantilla.

La accion activa ahora usa copy especifica para la plantilla activa y no compite con el flujo de paleta.

## Contraste

El resumen visible se reduce a los contrastes que QA necesita primero:

- boton principal;
- texto sobre fondo;
- estado reservado.

Los ratios completos quedan en modo avanzado.

## Preview

La preview real se mantiene como pieza principal del flujo:

- mini sidebar;
- card;
- boton primario;
- boton secundario;
- input;
- badge activo;
- estado reservado;
- aviso.

La preview se actualiza con la paleta propuesta antes de aplicar cambios locales.

## /appearance

`/appearance` se mantiene como pantalla de branding y acceso al editor avanzado. No se duplica el generador para evitar una segunda superficie de configuracion visual.

## I18N

Se agregaron claves `paletteGenerator.*` para el flujo simplificado en:

- `es`;
- `en`;
- `pt-BR`;
- `fr`;
- `ja`;
- `zh`;
- `ko`.

Auditoria local de estructura:

```text
es: leaves=1168 missing=0 extra=0
en: leaves=1168 missing=0 extra=0
pt-BR: leaves=1168 missing=0 extra=0
fr: leaves=1168 missing=0 extra=0
ja: leaves=1168 missing=0 extra=0
zh: leaves=1168 missing=0 extra=0
ko: leaves=1168 missing=0 extra=0
```

Las traducciones nuevas son base tecnica y requieren revision humana/nativa antes de release internacional.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Confirmar que el flujo inicia con identidad visual guiada.
4. Elegir plantilla.
5. Elegir color base.
6. Cambiar armonia.
7. Ver paleta sugerida.
8. Revisar contraste principal.
9. Ver preview real.
10. Aplicar paleta localmente.
11. Abrir `/live` o `/customers` y confirmar que la identidad local se refleja.
12. Volver a `/ui-kit`.
13. Restaurar plantilla.
14. Abrir detalles avanzados.
15. Confirmar que tokens, componentes, templates y variantes siguen disponibles.

## Limitaciones

- No hay persistencia backend ni por tenant.
- No se agrega configuracion libre por componente.
- No se instalan librerias externas.
- No se agregan fuentes externas.
- La validacion de contraste sigue siendo basica.
- Las traducciones nuevas requieren revision nativa.

---

## Continuidad PRODUCT-C2.3 - Diseno de la aplicacion

Fecha: 2026-06-07

PRODUCT-C2.3 conserva la simplificacion de PRODUCT-C2.2, pero cambia el enfoque visible: `/ui-kit` ya no se presenta primero como laboratorio o catalogo tecnico, sino como `Diseno de la aplicacion`.

La vista principal queda organizada como secuencia accionable para usuario admin:

1. elegir plantilla visual;
2. elegir color principal;
3. revisar paleta sugerida;
4. revisar contraste y legibilidad;
5. mirar la vista previa;
6. aplicar o restaurar cambios.

El UI Kit tecnico, tokens, componentes, templates, variantes y detalles de contraste siguen disponibles en opciones avanzadas.
