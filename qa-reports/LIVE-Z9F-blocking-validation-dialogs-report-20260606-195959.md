# LIVE-Z9F - Validaciones bloqueantes con dialogo accionable

Fecha: 2026-06-06 19:59:59

## Objetivo

Mejorar la validacion bloqueante de `Crear prenda rapida` desde LIVE para que el usuario vea que informacion falta, por que no puede continuar y que puede hacer para corregir.

## Alcance

- Se reviso `app/items-create.tsx`.
- Se creo `components/ui/AppActionDialog.tsx` como dialogo accionable reusable.
- Se mantuvieron errores inline por campo.
- Se reemplazo el feedback principal de alerta/resumen por dialogo guiado.
- No se tocaron backend, endpoints, AUTH/RBAC, pagos, caja, billing, IA ni reglas LIVE profundas.

## Patron implementado

`AppActionDialog` soporta:

- titulo;
- mensaje;
- lista de detalles;
- tonos `info`, `warning`, `danger`, `success`;
- accion principal;
- accion secundaria opcional;
- overlay modal;
- light/dark y presets visuales mediante tokens.

## Caso cubierto

En `/items-create?returnTo=/live`, al presionar `Generar prendas` con datos faltantes o invalidos:

- se bloquea el submit;
- se conserva el formulario;
- se muestran helpers por campo;
- se abre el dialogo `Falta informacion para generar la prenda`;
- se listan los faltantes;
- `Entendido` cierra el dialogo;
- `Ir al primer campo` abre selector de tipo/talla o enfoca precio/cantidad.

Campos validados:

- tipo de prenda;
- talla;
- precio requerido en flujo LIVE/puerta;
- cantidad.

## Textos agregados

- `itemsCreate.selectItemType`
- `itemsCreate.goToFirstField`
- `itemsCreate.validationTitle` actualizado a frase de guia.

## Validaciones tecnicas

Resultado:

- `npm.cmd run lint`: OK, 0 errores. Se mantienen 53 warnings heredados/estructurales fuera del alcance de LIVE-Z9F.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK, export web generado.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors, 0 skipped.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK.

## Riesgos

- `Ir al primer campo` enfoca inputs de precio/cantidad si la plataforma lo permite; para selectores abre directamente el selector.
- La pantalla conserva labels heredados de catalogos y campos fuera del alcance de Z9F.

## GO/NO-GO

GO tecnico para commit. GO visual pendiente de corrida manual en navegador con `/items-create?returnTo=%2Flive`, light/dark y flujo de regreso a LIVE.
