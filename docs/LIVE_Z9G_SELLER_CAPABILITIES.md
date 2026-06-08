# LIVE-Z9G - Capacidades reales del vendedor en LIVE

## Objetivo

Corregir la experiencia LIVE para que un vendedor pueda operar apartados cuando sus permisos reales lo permiten, sin convertirlo en administrador ni darle acciones sensibles sin permiso.

## Hallazgo

La sesion frontend ya conserva correctamente:

- roles recibidos desde login o `/api/me`;
- `effectivePermissions`;
- canales habilitados.

El problema estaba en `services/liveCapabilities.ts`: aunque `canOperateLive` se calculaba con canal `LIVE` + `DO_LIVE_RESERVATION`, `viewMode` forzaba a usuarios `SELLER` o `QA_TENANT_SELLER` a `support`. Por eso un vendedor con permiso real podia quedar visualmente como espectador/apoyo.

## Regla aplicada

La vista y acciones se derivan de capacidades reales:

- `canCreateReservation`: canal `LIVE` + `DO_LIVE_RESERVATION`.
- `canSelectCustomer`: operacion LIVE + `VIEW_CUSTOMERS`.
- `canCreateCustomer`: operacion LIVE + `CREATE_CUSTOMER`.
- `canSelectItem`: operacion LIVE + `VIEW_INVENTORY`.
- `canMarkOperationalSold`: operacion LIVE + `DO_DOOR_SALE` o admin.
- `canCancelReservation`: operacion LIVE + `CANCEL_RESERVATION`.
- `canStartLive`, `canCloseLive`, `canPrepareItem`, `canSetActiveItem`, `canClearActiveItem`: reservadas a administracion/operacion no vendedor, porque no existen permisos granulares frontend/backend para separarlas con seguridad.

## Matriz final

| Actor | Condicion | Vista LIVE | Puede hacer | No debe hacer sin permiso |
|---|---|---|---|---|
| ADMIN / operador | Admin o usuario no vendedor/supervisor con canal `LIVE` + `DO_LIVE_RESERVATION` | Operador | Iniciar/cerrar LIVE, preparar prenda, poner al aire, apartar y estados segun capacidades | Pagos/caja/reportes fuera de LIVE |
| SELLER con `DO_LIVE_RESERVATION` | Rol vendedor + permiso real LIVE | Operacion de apartados | Ver prenda al aire, precio, seleccionar cliente si tiene `VIEW_CUSTOMERS`, crear cliente si tiene `CREATE_CUSTOMER`, apartar, ver apartados recientes | Iniciar/cerrar LIVE, cambiar prenda al aire, cancelar apartado sin `CANCEL_RESERVATION`, cerrar venta LIVE sin `DO_DOOR_SALE` |
| SELLER sin `DO_LIVE_RESERVATION` | Rol vendedor sin permiso operativo LIVE | Apoyo/presentador | Ver apoyo si tiene acceso minimo LIVE | Apartar u operar reservas |
| SUPERVISOR | Rol supervisor | Supervision | Monitorear actividad, reservas, eventos y estado segun permisos | Caer en vista vendedor u operar como flujo principal |
| NO_ACCESS | Sin permisos efectivos o sin acceso LIVE | Bloqueo | Ninguna accion LIVE | Toda operacion LIVE |

## Cambios aplicados

- `viewMode` ya no fuerza `support` para `SELLER` con `canOperateLive`.
- Las acciones de iniciar/finalizar LIVE se ocultan si `canStartLive`/`canCloseLive` no existen.
- `Cerrar como venta LIVE` depende de capacidad de venta operativa (`DO_DOOR_SALE`) o admin.
- `Cancelar apartado` sigue dependiendo de `CANCEL_RESERVATION`.
- `Volver a apartado` depende de capacidad real de cambiar estados operativos.
- El texto visible del actor vendedor se ajusta para hablar de permisos reales.

## Sin cambios fuera de alcance

No se modificaron:

- backend;
- endpoints;
- contratos de API;
- AUTH/RBAC backend;
- pagos/caja/reportes/billing/IA;
- persistencia;
- reglas profundas LIVE.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Confirmar consola operador completa.
3. Entrar con `qa.vendedor.centro@local.test`.
4. Confirmar que si tiene `DO_LIVE_RESERVATION` ve flujo de apartado, no solo apoyo.
5. Confirmar que puede seleccionar cliente si tiene `VIEW_CUSTOMERS`.
6. Confirmar que puede apartar si hay prenda al aire y precio valido.
7. Confirmar que no ve iniciar/cerrar LIVE si no tiene esa capacidad.
8. Confirmar que no ve cancelar apartado sin `CANCEL_RESERVATION`.
9. Confirmar que `Cerrar como venta LIVE` solo aparece si tiene capacidad de venta operativa.
10. Entrar con `qa.supervisor.centro@local.test` y confirmar dashboard supervisor.
11. Entrar con `qa.sinpermisos@local.test` y confirmar bloqueo.
12. Validar light/dark y mobile/tablet.

## Continuidad LIVE-Z9H

LIVE-Z9H agrega refresh controlado para que el vendedor con flujo de apartados no tenga que salir y volver a entrar cuando Admin cambia el estado del live o la prenda al aire. El vendedor conserva sus capacidades reales, con boton `Actualizar`, ultima actualizacion visible, refresh al foco y polling de 15 segundos sin consultar pagos/caja.

## Continuidad LIVE-Z10A

LIVE-Z10A confirma que el cambio de precio LIVE no tiene autorizacion backend real todavia. Por seguridad, el vendedor u operador sin `canChangeLivePrice` no puede editar precio y la UI deja de mostrar solicitudes pendientes simuladas. El flujo futuro requiere backend de solicitud, aprobacion y auditoria antes de habilitar autorizaciones reales.

## GO/NO-GO

GO tecnico si pasan lint, TypeScript, export web, Maven test/package y `git diff --check`.

GO visual pendiente de corrida manual multiusuario.

## Continuidad LIVE-Z9I

LIVE-Z9I mantiene la matriz de capacidades: ver el selector de prendas sigue dependiendo de `VIEW_INVENTORY` y operar LIVE sigue dependiendo de permisos reales. Los nuevos filtros solo cambian visibilidad dentro del selector; no conceden acciones ni permiten seleccionar prendas bloqueadas.

## Continuidad LIVE-Z9J

LIVE-Z9J no cambia capacidades ni concede acciones nuevas. Solo permite que operador/admin sincronice apartados/eventos generados por vendedor u otros usuarios mediante refresh controlado. El vendedor conserva su matriz de permisos reales y `NO_ACCESS` no obtiene polling util.
