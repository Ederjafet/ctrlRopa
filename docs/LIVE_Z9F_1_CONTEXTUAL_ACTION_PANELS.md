# LIVE-Z9F.1 - Paneles accionables contextuales para bloqueos LIVE

## Objetivo

Unificar el patron visual de validaciones bloqueantes sin forzar el mismo modo de presentacion para todos los contextos.

La decision UX queda asi:

- LIVE y operacion en curso usan panel contextual accionable.
- Formularios generales pueden usar dialogo modal cuando hay una lista de campos faltantes.
- Errores de campo conservan helpers inline.
- Confirmaciones simples se mantienen como aviso ligero si no requieren una decision operativa.

## Cambios aplicados

`AppActionDialog` ahora soporta:

- `mode="modal"` para dialogos centrados con overlay.
- `mode="contextual"` para panel ancho dentro del flujo operativo.
- `mode="inline"` para futuros bloques dentro de formularios.
- `actionLayout="default" | "primaryRight" | "primaryLeft"`.

`actionLayout` deja preparada la ergonomia futura para invertir acciones en mobile/tablet segun mano dominante, pero no se persiste ninguna preferencia en esta fase.

## LIVE

En `/live`, el bloqueo `No se puede agregar apartado` deja de renderizarse como bottom modal y pasa a mostrarse como panel contextual dentro del bloque de captura/apartado.

Casos cubiertos:

- falta cliente/interesado;
- falta prenda al aire;
- prenda ya apartada;
- precio invalido o faltante;
- permisos/canal/live no disponible.

Cuando falta cliente, el panel ofrece:

- `Seleccionar cliente`;
- `Cerrar`.

Cuando el bloqueo solo requiere revisar el contexto, el panel ofrece `Entendido`.

## Items Create

`/items-create?returnTo=/live` conserva el dialogo modal agregado en LIVE-Z9F para campos faltantes:

- tipo de prenda;
- talla;
- precio;
- cantidad.

El formulario mantiene helpers inline y no limpia datos capturados.

## Sin cambios funcionales

No se modificaron:

- backend;
- endpoints;
- AUTH/RBAC;
- pagos/caja/reportes/billing/IA;
- reglas LIVE profundas;
- permisos/capacidades;
- persistencia backend.

## Validacion manual esperada

1. Entrar a `/live`.
2. Intentar apartar sin cliente/interesado.
3. Confirmar panel contextual dentro del flujo, no modal centrado.
4. Confirmar acciones `Seleccionar cliente` y `Cerrar`.
5. Intentar apartar sin prenda al aire.
6. Confirmar panel contextual con `Entendido`.
7. Validar prenda ya apartada.
8. Validar prenda ya al aire desde selector.
9. Entrar a `/items-create?returnTo=%2Flive`.
10. Dejar campos faltantes y confirmar dialogo modal consistente.
11. Validar helpers inline.
12. Validar light/dark, presets visuales y mobile/tablet.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual para confirmar que el panel contextual se percibe como guia operativa y no como interrupcion.
