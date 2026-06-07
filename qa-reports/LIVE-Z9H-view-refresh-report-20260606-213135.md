# LIVE-Z9H - Reporte refresh vendedor/supervisor

## Objetivo

Agregar actualizacion controlada en `/live` para que Vendedor y Supervisor vean cambios hechos por Admin/Operador sin salir y volver a entrar, sin implementar WebSocket/SSE ni tocar backend.

## Datos refrescados

El refresh liviano actualiza:

- live activo/abierto de la sucursal;
- estado del live;
- prenda al aire;
- precio de prenda al aire;
- apartados recientes;
- eventos/actividad del live visible;
- resumen supervisor derivado de apartados/eventos.

No recarga clientes/prendas completas y no consulta pagos/caja durante polling.

## Reglas por actor

| Actor | Refresh manual | Refresh al foco | Polling |
|---|---|---|---|
| Admin / Operador | Si | Por foco de ruta existente | No automatico nuevo |
| Vendedor | Si | Si | Cada 15 segundos |
| Supervisor | Si | Si | Cada 15 segundos |
| NO_ACCESS | No util | No | No |

## Cambios aplicados

- Boton `Actualizar` / `Refresh` en `/live`.
- Indicador `Ultima actualizacion: HH:mm:ss` / `Last updated: HH:mm:ss`.
- Mensaje `Sin actualizacion reciente` / `No recent update`.
- Refresh liviano con proteccion contra requests duplicados.
- Polling cada 15 segundos para `SELLER` y `SUPERVISOR`.
- Refresh al volver a `AppState` activo.
- Polling pausado cuando `AppState` no esta activo.
- i18n ES/EN para los textos nuevos.

## Validaciones tecnicas

- `npm.cmd run lint`: OK, 0 errores, 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK.

## Limitaciones

- No es tiempo real instantaneo; la frecuencia es de 15 segundos.
- WebSocket/SSE queda pendiente para fase futura porque requiere contrato backend.
- El refresh automatico no consulta pagos/caja.
- La validacion visual multiusuario sigue pendiente.

## Validacion manual esperada

1. Admin inicia o cambia LIVE.
2. Vendedor ya esta en `/live`.
3. Confirmar boton `Actualizar`.
4. Confirmar indicador de ultima actualizacion.
5. Confirmar refresh por polling sin salir/entrar.
6. Repetir con Supervisor.
7. Ocultar y volver a enfocar la ventana.
8. Confirmar que NO_ACCESS no hace polling util.
9. Validar light/dark y mobile/tablet.

## GO/NO-GO

- GO tecnico: SI.
- GO visual: pendiente de corrida manual multiusuario.
