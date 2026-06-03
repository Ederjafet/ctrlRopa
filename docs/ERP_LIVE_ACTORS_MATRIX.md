# LIVE actors matrix

## Objetivo

Documentar la separacion de vistas LIVE usando AUTH real como fuente de verdad.
El actor LIVE es una decision visual derivada de `/api/me`: rol real, permisos reales,
empresa, sucursal y estado de acceso. No reemplaza AUTH, no crea permisos y no
modifica RBAC.

## Fuente de verdad

- Endpoint revisado: `POST /api/auth/login` y `GET /api/me`.
- API usada para auditoria: `http://192.168.0.128:8090`.
- Fecha de auditoria: 2026-06-03.
- Rama: `feature/live-z5-operator-actor-ux`.

## Reglas de derivacion

| Prioridad | Condicion real | Vista LIVE | Decision |
|---|---|---|---|
| 1 | Sin sesion, rol `NO_ACCESS`, sin permisos efectivos o sin acceso LIVE minimo | `NO_ACCESS_VIEW` | Bloquea `/live`; no renderiza consola, dashboard ni apoyo visual. |
| 2 | Rol `SUPERVISOR` o permiso de monitoreo/reportes sin rol operativo de apoyo | `SUPERVISOR_VIEW` | Dashboard de monitoreo/control. |
| 3 | Rol `ADMIN` o `QA_TENANT_ADMIN` con acceso LIVE | `OPERATOR_VIEW` | Consola operativa. |
| 4 | Rol `SELLER` o `QA_TENANT_SELLER` con acceso LIVE | `SELLER_PRESENTER_VIEW` | Vista de apoyo centrada en prenda al aire. |
| 5 | Cualquier caso no cubierto de forma segura | `NO_ACCESS_VIEW` | Bloqueo conservador. |

## Vistas

| Vista | Puede ver | Puede ejecutar | Bloqueos |
|---|---|---|---|
| `OPERATOR_VIEW` | Estado LIVE, preparar prenda, prenda al aire, precio, cliente, reserva, reservas recientes, eventos/historial. | Iniciar/cerrar LIVE, poner/sacar prenda al aire, reservar, cambiar estado operativo si sus permisos reales lo permiten. | Pagos/caja/reportes/billing/IA. |
| `SELLER_PRESENTER_VIEW` | Estado LIVE, prenda al aire, precio, codigo, talla, color, stock, notas basicas. | Actualizacion ligera por polling; no opera reserva desde esta vista Z5. | Dashboard supervisor, consola operador, pagos/caja/reportes. |
| `SUPERVISOR_VIEW` | Indicadores reales disponibles, prenda al aire, reservas recientes, eventos recientes, resumen de cerrados. | Consulta y `Ver detalle`; no opera reservas desde esta vista Z5 salvo definicion futura explicita. | No muestra metricas demo ni acciones de operador. |
| `NO_ACCESS_VIEW` | Mensaje de acceso restringido. | Ninguna accion LIVE. | Todo flujo LIVE. |

## Auditoria `/api/me`

| Usuario QA | Rol real | Empresa/sucursal | Permisos reales relevantes | Vista LIVE actual esperada | Acciones permitidas | Acciones bloqueadas | Diferencias encontradas | Correccion aplicada |
|---|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | `ADMIN` | `DEFAULT / QA_CTR` (`companyId=1`, `branchId=4`) | `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `VIEW_REPORTS`, permisos amplios de operacion. `VIEW_PAYMENTS` no viene listado, pero `ADMIN` conserva bypass frontend por `hasPermission`. | `OPERATOR_VIEW` | Consola operativa completa si canal LIVE esta habilitado: preparar prenda, poner al aire, precio, cliente, reserva, estado operativo, cerrar LIVE. | Pagos/caja/reportes como flujo principal de LIVE-Z5. | Sin diferencia funcional esperada. | Mantener `ADMIN` como operador. |
| `qa.vendedor.centro@local.test` | `SELLER` | `DEFAULT / QA_CTR` (`companyId=1`, `branchId=4`) | `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `REGISTER_PAYMENTS`, `DO_DOOR_SALE`, `DO_DOOR_RESERVATION`. | `SELLER_PRESENTER_VIEW` | Ver estado LIVE, prenda al aire y precio para apoyo visual. | Dashboard supervisor, consola operador, pagos/caja/reportes. | Antes podia caer en vista operativa por `DO_LIVE_RESERVATION`. | Resolver mantiene rol `SELLER` como vista de apoyo visual en Z5. |
| `qa.supervisor.centro@local.test` | `SUPERVISOR` | `DEFAULT / QA_CTR` (`companyId=1`, `branchId=4`) | `DO_LIVE_RESERVATION`, `VIEW_REPORTS`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `MANAGE_CASH_CLOSURES`, `REGISTER_PAYMENTS`, permisos de supervision/operacion amplia. | `SUPERVISOR_VIEW` | Ver dashboard de monitoreo/control, indicadores reales disponibles, prenda al aire, reservas recientes y eventos recientes. | Vista vendedor/presentadora, consola operador y acciones operativas como flujo principal, salvo autorizacion futura documentada. | Entraba con experiencia parecida a vendedor/presentadora por fallback visual. | Resolver prioriza rol `SUPERVISOR` y `/live` renderiza dashboard propio. |
| `qa.sinpermisos@local.test` | No se obtuvo `/api/me`; login respondio `403 Forbidden`. | No disponible por bloqueo AUTH. | No disponible por bloqueo AUTH. | `NO_ACCESS_VIEW` / bloqueo AUTH | Ninguna. | Operar LIVE, ver dashboard supervisor, ver apoyo vendedor. | Bloqueo real desde AUTH; no se debe inferir permisos. | Documentado como bloqueo; no se modifico AUTH. |

## Archivos relacionados

- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `services/accessControl.ts`
- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/ERP_LIVE_Z5_OPERATOR_ACTOR_UX.md`

## Pendientes

- Validar visualmente con los cuatro usuarios QA en navegador.
- Definir en una fase futura si un `SUPERVISOR` con permisos operativos debe tener acciones administrativas acotadas o solo consulta.
- Formalizar realtime LIVE (`LIVE-RT`) con SSE o WebSocket para reemplazar polling ligero.
