# LIVE-Z9H - Refresh vendedor/supervisor

## Objetivo

Evitar que Vendedor o Supervisor tengan que salir y volver a entrar a `/live` para ver cambios hechos por Admin/Operador, sin implementar WebSocket ni SSE todavia.

## Problema detectado

Durante QA visual, si Admin iniciaba o cambiaba el LIVE mientras Supervisor o Vendedor ya estaban en la pantalla, esas vistas podian conservar informacion anterior:

- estado anterior del live;
- prenda al aire anterior;
- precio anterior;
- apartados/eventos recientes sin actualizar.

## Alcance aplicado

- Se agrega boton `Actualizar` / `Refresh` en `/live`.
- Se muestra indicador `Ultima actualizacion: HH:mm:ss` / `Last updated: HH:mm:ss`.
- Se muestra `Sin actualizacion reciente` / `No recent update` antes de una carga exitosa.
- Se agrega refresh al volver a foco mediante `AppState`.
- Se agrega polling controlado cada 15 segundos para actores `SELLER` y `SUPERVISOR`.
- Se pausa el polling cuando `AppState` no esta activo.
- Se evita duplicar requests si ya hay un refresh en curso.

## Datos refrescados

El refresh liviano actualiza:

- lives de la sucursal;
- seleccion del live activo/abierto cuando aplica;
- estado del live;
- prenda al aire;
- precio de la prenda al aire;
- apartados recientes del live seleccionado;
- eventos del live seleccionado o ultimo cerrado visible.

No recarga catalogos completos de clientes ni prendas. No consulta pagos en polling.

## Reglas por actor

| Actor | Refresh manual | Polling | Notas |
|---|---|---|---|
| Admin / Operador | Si | No automatico nuevo | Evita sobrescribir flujo operativo con polling agresivo. |
| Vendedor | Si | Cada 15s | Refresca estado, prenda al aire, precio y apartados recientes. |
| Supervisor | Si | Cada 15s | Refresca estado, dashboard, apartados y eventos. |
| NO_ACCESS | No util | No | Mantiene bloqueo. |

## Por que no WebSocket/SSE

LIVE-Z9H es una fase de refresh controlado. WebSocket/SSE queda fuera porque requiere contrato backend, estrategia de reconexion, seguridad por tenant/sucursal y pruebas adicionales. Esta fase mantiene endpoints existentes.

## Limitaciones

- No hay tiempo real instantaneo; el polling es de 15 segundos.
- Si la ventana esta oculta, el polling se pausa y se refresca al volver a foco.
- El refresh liviano no consulta pagos ni caja.
- Mobile nativo depende de `AppState`; web tambien usa el mismo mecanismo disponible en Expo/React Native.

## Validacion manual esperada

1. Entrar con Admin y abrir `/live`.
2. Entrar con Vendedor en otra ventana o equipo y dejarlo en `/live`.
3. Admin inicia LIVE o cambia la prenda al aire.
4. Confirmar que Vendedor puede presionar `Actualizar`.
5. Confirmar que Vendedor ve `Ultima actualizacion`.
6. Confirmar que Vendedor recibe el cambio por polling sin salir/entrar.
7. Repetir con Supervisor.
8. Ocultar/mostrar la ventana y confirmar refresh al volver a foco.
9. Confirmar que NO_ACCESS no hace polling util.
10. Validar light/dark y mobile/tablet.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual multiusuario.

## Continuidad LIVE-Z9I

LIVE-Z9I no cambia el refresh controlado. Si el inventario o apartados se refrescan por la carga existente, el selector recalcula contadores y filtros de disponibilidad con los datos actuales en memoria. No se agrega polling de inventario ni pagos.
