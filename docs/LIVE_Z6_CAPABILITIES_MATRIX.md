# LIVE-Z6B - Matriz de capacidades LIVE

## Objetivo

Documentar y aplicar la regla central de LIVE-Z6B:

`AUTH real -> capacidades LIVE -> vista/acciones permitidas`.

Los nombres Operador, Vendedor/Presentadora, Supervisor y NO_ACCESS son experiencias visuales de negocio. No reemplazan AUTH, no crean permisos paralelos y no modifican RBAC backend.

## Fuente de verdad

- API auditada: `http://192.168.0.128:8090`.
- Endpoints usados: `POST /api/auth/login` y `GET /api/me`.
- Fecha de auditoria: 2026-06-04.
- Rama: `feature/live-z6-operational-rules-and-shell`.
- Archivo de resolucion: `services/liveCapabilities.ts`.

## Capacidades implementadas

| Capacidad | Fuente actual | Uso en `/live` | Gap documentado |
|---|---|---|---|
| `canViewLive` | canal `LIVE` + rol/permiso real (`DO_LIVE_RESERVATION`, `VIEW_REPORTS`, ADMIN/SUPERVISOR/SELLER) | Renderizar acceso minimo LIVE | Permiso granular `VIEW_LIVE` pendiente. |
| `canStartLive` | operacion LIVE reservada a ADMIN o usuario operativo no SELLER/SUPERVISOR | Mostrar/ejecutar iniciar live | Permiso granular `START_LIVE` pendiente. |
| `canCloseLive` | operacion LIVE reservada a ADMIN o usuario operativo no SELLER/SUPERVISOR | Mostrar/ejecutar finalizar live | Permiso granular `CLOSE_LIVE` pendiente. |
| `canPrepareItem` | gestion de sesion LIVE + `VIEW_INVENTORY` | Preparar siguiente prenda | Permiso granular de preparacion pendiente. |
| `canSetActiveItem` | gestion de sesion LIVE + `VIEW_INVENTORY` | Poner prenda al aire | Permiso granular `SET_LIVE_ACTIVE_ITEM` pendiente. |
| `canClearActiveItem` | gestion de sesion LIVE + `VIEW_INVENTORY` | Sacar prenda del aire | Permiso granular `CLEAR_LIVE_ACTIVE_ITEM` pendiente. |
| `canCreateReservation` | `DO_LIVE_RESERVATION` | Crear reserva LIVE | Sin gap critico actual. |
| `canCancelReservation` | `DO_LIVE_RESERVATION` + `CANCEL_RESERVATION` | Cancelar apartado con motivo | Persistencia de nota libre queda para Z7 si se requiere. |
| `canMarkPending` | `DO_LIVE_RESERVATION` | Marcar pendiente | Permiso granular pendiente. |
| `canMarkOperationalSold` | ADMIN o permiso real de venta operativa (`DO_DOOR_SALE`) dentro de operacion LIVE | Vendido operativo con confirmacion | Permiso granular LIVE especifico pendiente. |
| `canReleaseReservedItem` | `CANCEL_RESERVATION` + `MANAGE_INVENTORY` + `VIEW_PAYMENTS` | No se habilita accion si no puede validarse pago | Endpoint/regla formal de liberacion segura pendiente. |
| `canChangeLivePrice` | `DO_LIVE_RESERVATION` | Editar precio LIVE, sin tocar precio base | Permiso granular `CHANGE_LIVE_PRICE` pendiente. |
| `canViewLiveDashboard` | `SUPERVISOR`, `VIEW_REPORTS` o ADMIN | Vista supervisor | Permiso granular `VIEW_LIVE_DASHBOARD` pendiente. |
| `canViewLiveEvents` | `canViewLive` | Eventos recientes/bitacora | Permiso granular opcional pendiente. |
| `canViewLiveHistory` | `canViewLive` | Historial LIVE | Permiso granular opcional pendiente. |
| `canViewPayments` | permiso efectivo `VIEW_PAYMENTS` | Cargar/ver pagos | No se asume por rol. |
| `canAccessCashbox` | `MANAGE_CASH_CLOSURES` o `REGISTER_PAYMENTS` | Mostrar cobrar/caja solo si tambien puede ver pagos | No se toca caja en Z6B. |

## Matriz QA

| Usuario QA | Rol real | Permisos reales detectados | Capacidades LIVE resultantes | Vista LIVE resultante | Acciones permitidas | Acciones bloqueadas | Observaciones / huecos |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | `ADMIN` | `DO_LIVE_RESERVATION`, `CANCEL_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `VIEW_REPORTS`, permisos amplios de operacion. No trae `VIEW_PAYMENTS` listado. | Opera LIVE, inicia/cierra, prepara prenda, pone/saca al aire, reserva, cambia estado operativo, ve dashboard/historial/eventos. No carga pagos sin `VIEW_PAYMENTS`. | Operador | Consola operativa, precio LIVE, reservas, cancelar apartado con motivo, vendido operativo con confirmacion. | Pagos/cobro si no existe `VIEW_PAYMENTS`; liberacion automatica si no se puede validar pago. | Faltan permisos granulares `START_LIVE`, `CLOSE_LIVE`, `SET/CLEAR_ACTIVE_ITEM`, `CHANGE_LIVE_PRICE`. |
| `qa.vendedor.centro@local.test` | `SELLER` | `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `REGISTER_PAYMENTS`, `DO_DOOR_SALE`, `DO_DOOR_RESERVATION`. | Puede ver LIVE y operar apartados por permiso real, sin convertirse en administrador. | Vendedor con flujo de apartados | Ver prenda al aire, precio, seleccionar cliente, crear apartado LIVE y cerrar como venta LIVE si conserva `DO_DOOR_SALE`. | Iniciar/cerrar LIVE, preparar/cambiar prenda al aire, cancelar sin `CANCEL_RESERVATION`, dashboard supervisor, pagos sin `VIEW_PAYMENTS`. | Ajustado en LIVE-Z9G: `SELLER` con `DO_LIVE_RESERVATION` ya no queda forzado a apoyo visual. |
| `qa.supervisor.centro@local.test` | `SUPERVISOR` | `DO_LIVE_RESERVATION`, `VIEW_REPORTS`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `MANAGE_CASH_CLOSURES`, `REGISTER_PAYMENTS`, permisos de supervision/operacion amplia. | Dashboard LIVE, indicadores, eventos, reservas recientes, prenda al aire. No cae en vendedor por fallback. | Supervisor | Monitoreo/control con datos reales, ver detalle, eventos/historial. | Acciones operativas si no se exponen explicitamente por capacidades/vista; pagos sin `VIEW_PAYMENTS`. | Supervisor tiene permisos amplios pero Z6B mantiene dashboard como experiencia principal. |
| `qa.sinpermisos@local.test` | No disponible | Login respondio `403 Forbidden`; no se obtuvo `/api/me`. | Sin capacidades. | NO_ACCESS / bloqueo AUTH | Ninguna. | Todo LIVE. | No se infiere nada sin evidencia. |

## Reglas operativas Z6B

### Cancelar apartado

- El boton visible sigue diciendo `Cancelar apartado`.
- Ahora abre un modal de motivo.
- Motivos: Cliente desistio, Error de captura, Duplicado, Sin inventario, Otro.
- El motivo se envia a `updateLiveReservationOperationalStatus(..., 'CANCELLED', reason)`.
- No procesa pagos, caja ni devoluciones.
- Nota libre para `Otro` queda pendiente para LIVE-Z7 si se requiere auditoria mas detallada.

### Vendido operativo

- El texto visible cambia a `Marcar vendido operativo`.
- La accion pide confirmacion.
- La UI aclara: vendido operativo no confirma pago; la venta final requiere cobro/caja.
- No se marca como pagado ni se consulta pagos sin `canViewPayments`.

### Liberacion segura de prenda

- No se libera automaticamente si hay duda.
- `canReleaseReservedItem` requiere cancelacion + inventario + confirmacion de pagos (`VIEW_PAYMENTS`).
- Si no se puede validar pago, la prenda no se libera automaticamente.
- Queda pendiente para LIVE-Z7 un flujo formal de liberacion segura con endpoint/regla explicita si el backend lo requiere.

### Precio LIVE vs precio base

- El precio mostrado en `/live` es el precio confirmado para la reserva LIVE.
- Si se edita, aplica solo al en vivo/reserva actual.
- No modifica el precio base de la prenda/catalogo.
- Si el usuario no tiene `canChangeLivePrice`, se muestra solo lectura.
- Permiso granular `CHANGE_LIVE_PRICE` queda pendiente.

### Iniciar / finalizar LIVE

- Iniciar usa `canStartLive`.
- Finalizar usa `canCloseLive`.
- En LIVE-Z9G ambas capacidades quedan reservadas a ADMIN o usuarios operativos no `SELLER`/`SUPERVISOR` mientras no existan permisos granulares.
- Un `SELLER` con `DO_LIVE_RESERVATION` puede apartar, pero no inicia ni finaliza la sesion completa.
- Permisos granulares quedan documentados como pendiente.

## Archivos relacionados

- `services/liveCapabilities.ts`
- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## GO/NO-GO

GO tecnico para usar capacidades LIVE derivadas de AUTH real.

GO condicionado para QA manual multiusuario:

- validar que no hay botones muertos;
- validar que no hay rafagas de pagos sin `VIEW_PAYMENTS`;
- validar que Supervisor no cae en Vendedor;
- validar cancelacion con motivo;
- validar vendido operativo como no-pago.

## Nota LIVE-Z9G

LIVE-Z9G corrige la resolucion de vendedor: las acciones de apartado se habilitan por permisos reales y no por rol visual. `SELLER` con `DO_LIVE_RESERVATION` puede entrar al flujo de apartado acotado; `SELLER` sin permiso operativo sigue en apoyo/presentador.
