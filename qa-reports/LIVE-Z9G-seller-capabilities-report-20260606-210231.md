# LIVE-Z9G - Reporte de capacidades reales del vendedor en LIVE

## Objetivo

Corregir la resolucion frontend de capacidades LIVE para que el vendedor pueda operar apartados cuando sus permisos reales lo permiten, sin elevarlo a administrador ni mostrar acciones sensibles sin permiso.

## Alcance

- Auditar sesion, rol y permisos consumidos por frontend.
- Revisar `services/liveCapabilities.ts`, `services/liveActorResolver.ts`, `services/accessControl.ts` y `/live`.
- Ajustar capacidades visibles por permisos reales.
- Mantener backend, AUTH/RBAC, pagos, caja, reportes backend, billing e IA fuera de alcance.

## Hallazgo

`/api/me` y el servicio de autenticacion ya entregan `effectivePermissions`. El problema estaba en frontend: aunque `canOperateLive` se calculaba por canal `LIVE` + `DO_LIVE_RESERVATION`, `viewMode` forzaba a `SELLER` a `support`. Por eso `qa.vendedor.centro@local.test` podia tener permiso operativo y aun asi ver solo apoyo/espectador.

## Regla aplicada

- `SELLER` con `DO_LIVE_RESERVATION` entra a flujo operativo acotado de apartados.
- `SELLER` sin `DO_LIVE_RESERVATION` permanece en apoyo/presentador.
- Iniciar/cerrar LIVE y cambiar prenda al aire quedan reservados a admin u operador no vendedor/supervisor mientras no existan permisos granulares.
- Cerrar como venta LIVE requiere admin o permiso real de venta operativa (`DO_DOOR_SALE`).
- Cancelar apartado requiere `CANCEL_RESERVATION`.

## Matriz final

| Actor | Vista | Acciones permitidas | Acciones bloqueadas |
|---|---|---|---|
| Admin / operador | Consola operador | Iniciar/cerrar LIVE, preparar prenda, poner al aire, apartar y estados segun capacidades | Pagos/caja fuera del flujo LIVE |
| Vendedor con `DO_LIVE_RESERVATION` | Flujo de apartados | Ver prenda al aire, seleccionar cliente con `VIEW_CUSTOMERS`, crear cliente con `CREATE_CUSTOMER`, apartar, cerrar como venta LIVE con `DO_DOOR_SALE` | Iniciar/cerrar LIVE, cambiar prenda al aire, cancelar sin `CANCEL_RESERVATION` |
| Vendedor sin `DO_LIVE_RESERVATION` | Apoyo/presentador | Apoyo visual si tiene acceso minimo | Operar apartados |
| Supervisor | Supervision | Monitorear estado, actividad, eventos y apartados | Caer en vista vendedor u operar como consola principal |
| Sin permisos | Bloqueo | Ninguna | Toda operacion LIVE |

## Cambios aplicados

- `viewMode` ya no fuerza `support` para vendedores con permiso real de apartado LIVE.
- Se separaron capacidades de apartado vs administracion de sesion LIVE.
- Se ocultaron acciones de iniciar/finalizar LIVE para usuarios sin esa capacidad.
- Se oculto el bloque de preparar/cambiar prenda al aire cuando el usuario no tiene esa capacidad.
- Se evito mostrar solicitud de cancelacion al vendedor si no tiene `CANCEL_RESERVATION`.
- Se actualizo el subtitulo visible del actor vendedor.
- Se actualizo documentacion de actores, matriz Z6 y QA manual.

## Validaciones tecnicas

- `npm.cmd run lint`: OK, 0 errores, 53 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.
- `git --no-pager diff --check`: OK.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test` y confirmar consola operador completa.
2. Entrar con `qa.vendedor.centro@local.test`.
3. Confirmar que si tiene `DO_LIVE_RESERVATION` puede apartar en LIVE.
4. Confirmar que puede seleccionar cliente solo si tiene `VIEW_CUSTOMERS`.
5. Confirmar que no ve iniciar/cerrar LIVE ni cambiar prenda al aire.
6. Confirmar que no ve acciones no permitidas como cancelar sin `CANCEL_RESERVATION`.
7. Confirmar supervisor en dashboard y sin permisos bloqueado.
8. Validar light/dark y mobile/tablet.

## GO/NO-GO

- GO tecnico: SI.
- GO visual: pendiente de corrida manual con los cuatro usuarios QA.
