# LIVE-Z9D - Correcciones de flujo de prenda preparada

## Objetivo

Corregir el flujo frontend de prenda preparada para que las acciones visibles correspondan exactamente con lo que prometen los botones.

Esta fase no modifica backend, permisos, capacidades, endpoints ni contratos de API.

## Reglas corregidas

### Cambiar por prenda preparada

Si existe una prenda preparada visible:

- `Cambiar por prenda preparada` cambia directamente la prenda al aire por esa prenda preparada.
- No abre el selector de prendas.
- La prenda preparada pasa a ser la nueva prenda al aire.
- Despues del cambio exitoso se limpia la prenda preparada.
- El precio principal queda sincronizado con la nueva prenda al aire.
- Se conserva el endpoint y el registro operativo existente de cambio de prenda al aire.

Si no existe prenda preparada:

- El boton queda bloqueado.
- Se muestra la ayuda `Primero prepara una prenda para poder cambiarla.`
- El selector se abre desde `Buscar prenda`, `Escanear QR` o `Crear prenda rapida`, no desde el boton de cambio.

### Quitar prenda preparada

La tarjeta `Prenda preparada para cambio` ahora incluye `Quitar prenda preparada`.

La accion:

- limpia solo la prenda preparada;
- no modifica la prenda al aire;
- no modifica el precio de la prenda al aire;
- no modifica cliente seleccionado;
- no modifica apartados;
- no llama backend.

### Seleccionar la misma prenda que ya esta al aire

Si el operador selecciona en el modal la misma prenda que ya esta al aire:

- no cambia la prenda al aire;
- no prepara esa prenda como cambio;
- no modifica precio;
- muestra el aviso `Prenda ya al aire`;
- el mensaje indica que debe seleccionar otra prenda para prepararla como cambio.

## Textos agregados

- `Quitar prenda preparada`
- `Quita esta prenda de preparacion. No afecta la prenda al aire.`
- `Prenda ya al aire`
- `Esta prenda ya esta al aire. Selecciona otra prenda para prepararla como cambio.`
- `Primero prepara una prenda para poder cambiarla.`
- `La prenda preparada paso al aire.`
- `La prenda preparada fue retirada.`

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/live`.
3. Tener una prenda al aire.
4. Preparar otra prenda.
5. Presionar `Cambiar por prenda preparada`.
6. Confirmar que no abre el selector.
7. Confirmar que la preparada pasa al aire.
8. Confirmar que el precio cambia al de la nueva prenda al aire.
9. Preparar otra prenda.
10. Presionar `Quitar prenda preparada`.
11. Confirmar que solo desaparece la preparada.
12. Abrir selector y elegir la misma prenda al aire.
13. Confirmar aviso `Prenda ya al aire`.
14. Validar light/dark y vistas vendedor/supervisor.

## GO/NO-GO

GO si las validaciones tecnicas pasan y el flujo manual confirma que el boton de cambio ya no abre selector cuando existe prenda preparada.

## Continuidad LIVE-Z9E

LIVE-Z9E mejora la validacion de `Crear prenda rapida` cuando abre `/items-create?returnTo=/live`, mostrando errores visibles por campo antes de volver al flujo LIVE para preparar o poner al aire la prenda creada.

## Continuidad LIVE-Z9F

LIVE-Z9F agrega un dialogo accionable para validaciones bloqueantes de alta rapida de prendas. El flujo de prenda preparada no cambia; solo mejora la orientacion cuando falta informacion antes de crear la prenda.

## Continuidad LIVE-Z9F.1

Los bloqueos operativos de LIVE se alinean con `AppActionDialog` en modo contextual. La seleccion de la misma prenda al aire y las confirmaciones de prenda preparada conservan la logica de LIVE-Z9D, pero el estilo visual queda dentro del mismo sistema de paneles/dialogos.

## Continuidad LIVE-Z9I

LIVE-Z9I agrega filtros de disponibilidad en el selector `Buscar prenda`. Al preparar una prenda para cambio, el selector abre por defecto en `Disponibles`, pero permite revisar `Apartadas`, `Vendidas / no disponibles` o `Todas` sin cambiar la regla que bloquea prendas no operables.

## Continuidad LIVE-Z9I.1

LIVE-Z9I.1 conserva el flujo de prenda preparada y solo mejora la disposicion visual de sus acciones: en tablet/desktop `Poner esta prenda al aire` y `Quitar prenda preparada` quedan en la misma linea; en mobile siguen apiladas.
