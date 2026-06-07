# LIVE-Z9F - Validaciones bloqueantes con dialogo accionable

## Objetivo

Estandarizar las validaciones bloqueantes de alta rapida de prendas desde LIVE para que el usuario entienda que informacion falta, por que no puede continuar y cual es el siguiente paso.

## Problema detectado

LIVE-Z9E ya marcaba campos y mostraba errores inline en `/items-create?returnTo=/live`, pero el feedback principal seguia siendo una alerta nativa y un resumen visual. En pruebas manuales eso podia sentirse como un error tecnico o como si el sistema simplemente rechazara la accion.

## Patron aplicado

Se agrega `AppActionDialog` como dialogo reusable para validaciones bloqueantes:

- titulo claro;
- mensaje de ayuda;
- lista de detalles;
- accion principal para cerrar;
- accion secundaria opcional;
- tono visual `info`, `warning`, `danger` o `success`;
- soporte light/dark y presets mediante tokens del tema.

## Caso cubierto

En `app/items-create.tsx`, al presionar `Generar prendas` con campos obligatorios faltantes o invalidos:

- no se envia request invalido;
- no se limpia el formulario;
- se muestran helpers por campo;
- aparece el dialogo `Falta informacion para generar la prenda`;
- se listan los campos faltantes;
- `Entendido` cierra el dialogo;
- `Ir al primer campo` abre el selector de tipo/talla o enfoca precio/cantidad.

Campos validados:

- tipo de prenda;
- talla;
- precio cuando el flujo lo requiere, por ejemplo `returnTo=/live`;
- cantidad.

## Relacion con LIVE

El patron sigue la misma filosofia usada en LIVE para acciones bloqueadas: explicar que falta y dar una accion concreta, en lugar de dejar al usuario sin orientacion.

No se reescriben otros casos de LIVE en esta fase porque ya tienen mensajes especificos o implican flujos operativos distintos.

## Sin cambios fuera de alcance

No se modifica:

- backend;
- endpoints;
- contratos de API;
- AUTH/RBAC;
- pagos/caja/reportes/billing/IA;
- reglas LIVE profundas;
- persistencia backend;
- permisos o capacidades.

## Validacion manual esperada

1. Entrar a `/live`.
2. Presionar `Crear prenda rapida`.
3. Llegar a `/items-create?returnTo=%2Flive`.
4. Dejar `Talla` vacia.
5. Dejar `Precio` vacio o invalido.
6. Presionar `Generar prendas`.
7. Confirmar que aparece el dialogo accionable.
8. Confirmar que el dialogo lista lo que falta.
9. Confirmar que `Entendido` cierra el dialogo.
10. Confirmar que `Ir al primer campo` abre el selector o enfoca el campo correspondiente.
11. Confirmar que los helpers inline siguen visibles.
12. Completar datos validos y generar la prenda.
13. Confirmar que el regreso/flujo con LIVE se mantiene.
14. Validar light/dark, presets visuales y mobile/drawer.

## GO/NO-GO

GO si las validaciones tecnicas pasan y la corrida manual confirma que el bloqueo se entiende como guia operativa, no como error tecnico.
