# LIVE-Z9E - Validacion UX de crear prenda rapida desde LIVE

## Objetivo

Mejorar la validacion visual de `Alta masiva de prendas` cuando se usa desde LIVE mediante `Crear prenda rapida`.

El problema detectado fue que, al presionar `Generar prendas` con campos obligatorios incompletos, el usuario podia percibir que no pasaba nada porque solo existian alertas aisladas y no habia marcas persistentes por campo.

## Campos validados

La pantalla conserva la regla actual y valida visualmente:

- Tipo de prenda.
- Talla.
- Precio, cuando el flujo lo requiere, por ejemplo `returnTo=/live`.
- Cantidad.

Tambien se mantiene la validacion previa:

- Precio numerico valido.
- Precio mayor a cero cuando el flujo requiere precio.
- Cantidad numerica, entera y mayor a cero.

## Cambios de UX

Si faltan campos o hay valores invalidos:

- Se muestra un resumen visible con titulo `No se pudo generar la prenda`.
- El mensaje indica `Completa los campos obligatorios para continuar`.
- Cada campo con error marca su borde en peligro y muestra helper debajo.
- No se limpian los valores ya capturados.
- La validacion existente queda como respaldo, pero la primera experiencia muestra todos los errores juntos.

## Flujo desde LIVE

Cuando la pantalla se abre con `returnTo=/live`:

- Se mantiene el regreso a LIVE.
- Se muestra una ayuda breve: `Al generar la prenda, podras volver al LIVE para prepararla o ponerla al aire.`
- La creacion correcta conserva el flujo actual de `pendingQuickItems` y `router.replace(returnRoute)`.

## Sin cambios fuera de alcance

No se modifico:

- backend;
- endpoints;
- contratos de API;
- AUTH/RBAC;
- pagos/caja/reportes/billing/IA;
- reglas operativas LIVE;
- persistencia backend.

## Validacion manual esperada

1. Entrar a `/live`.
2. Presionar `Crear prenda rapida`.
3. Llegar a `/items-create?returnTo=%2Flive`.
4. Dejar `Talla` vacia.
5. Presionar `Generar prendas`.
6. Confirmar que aparece el resumen `No se pudo generar la prenda`.
7. Confirmar que `Talla` muestra error debajo.
8. Completar `Talla`.
9. Confirmar que se puede generar la prenda si los demas campos requeridos son validos.
10. Confirmar que el regreso a LIVE se mantiene.

## GO/NO-GO

GO si pasan validaciones tecnicas y la corrida manual confirma que los errores son visibles, persistentes y especificos por campo.

## Continuidad LIVE-Z9F

LIVE-Z9F reemplaza el feedback principal de campos faltantes por un dialogo accionable:

- `Falta informacion para generar la prenda`;
- lista de campos pendientes;
- boton `Entendido`;
- boton `Ir al primer campo`.

Los helpers inline por campo se mantienen. El resumen rojo superior deja de ser el feedback principal para evitar ruido visual duplicado.

## Continuidad LIVE-Z9F.1

El dialogo de `items-create` queda alineado al mismo componente reusable usado por LIVE. La pantalla mantiene modo modal porque el usuario esta corrigiendo un formulario con varios campos obligatorios; los bloqueos dentro de LIVE usan panel contextual para no interrumpir la operacion.
