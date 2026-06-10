# LIVE-QA-B - QA real asistido por rol

Fecha: 2026-06-10 09:09:13 -06:00
Rama: `feature/live-qa-b-real-role-smoke`

## Alcance

LIVE-QA-B ejecuto recuperacion, auditoria y smoke API real no destructivo sobre el flujo LIVE base por roles. No se implementaron features nuevas ni se modifico backend/frontend funcional.

La fase cubrio:

- preflight de rama, estado e historial;
- confirmacion de commits previos LIVE-QA-A, ITEM-Z8, ITEM-Z7, ITEM-Z6B, ITEM-Z5D y LIVE-PERM-A1;
- auditoria de usuarios QA, endpoints, capacidades LIVE y reglas de inventario/reservas;
- smoke API real no destructivo contra backend local;
- deteccion de frontend Expo Web levantado;
- evaluacion conservadora de dataset antes de mutaciones;
- documentacion de pendientes para QA formal.

## Ambiente usado

| Componente | URL | Resultado |
|---|---|---|
| Backend | `http://localhost:8090` | UP |
| Frontend Expo Web | `http://localhost:8081` | UP |
| Frontend Expo Web LAN | `http://192.168.0.128:8081` | UP |

Checks iniciales:

- `GET /api/me` sin token: `401`, esperado.
- `GET /api/health`: `200`.
- `GET /` en Expo Web local y LAN: `200`.

## Usuarios encontrados

Se encontraron credenciales QA documentadas localmente. La password no se imprime ni se guarda en estos artefactos.

| Usuario | Resultado login | Rol observado | Sucursal | Canal LIVE |
|---|---:|---|---|---|
| `qa.admin@local.test` | OK | `ADMIN` | `QA_CTR` | `LIVE` activo |
| `qa.supervisor.centro@local.test` | OK | `SUPERVISOR` | `QA_CTR` | `LIVE` activo |
| `qa.vendedor.centro@local.test` | OK | `SELLER` | `QA_CTR` | `LIVE` activo |
| `qa.sinpermisos@local.test` | `403` esperado | No aplica | No aplica | No aplica |

## Pruebas API realizadas

Smoke no destructivo:

- login por rol con usuarios QA documentados, sin imprimir secretos;
- `GET /api/me` con token temporal por usuario con login OK;
- logout por usuario con token temporal;
- lectura admin de `GET /api/lives/branch/4`;
- lectura admin de `GET /api/items/branch/4`;
- lectura admin de `GET /api/reservations/branch/4`.

Resultados de permisos LIVE:

| Rol | Permisos LIVE observados |
|---|---|
| Admin | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| Supervisor | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| Vendedor | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `VIEW_LIVE` |
| Sin permisos | Login bloqueado con `403`; no se obtuvo sesion |

Lecturas admin de dataset:

| Endpoint | Resultado |
|---|---|
| `/api/lives/branch/4` | `200`, 14 registros |
| `/api/items/branch/4` | `200`, 90 registros |
| `/api/reservations/branch/4` | `200`, 43 registros |

Muestras observadas:

- live activo: id `14`, active item `95`, status `ACTIVE`;
- items por estado: `AVAILABLE:44`, `RESERVED:43`, `SOLD:3`;
- reservas por estado: `ACTIVE:43`.

## Pruebas visuales

No se ejecuto smoke visual real con navegador automatizable.

Motivo:

- El plugin Browser Use esta disponible, pero en esta sesion no expuso la herramienta `node_repl/js` requerida por su workflow.
- El repo no trae Playwright, Puppeteer ni scripts e2e instalados.
- Expo Web respondio `200`, pero no hubo herramienta de navegador real para login, navegacion a `/live` ni screenshots.

Estado visual: `PENDING_QA_VISUAL`.

## Matriz por rol

| Rol | API real | Visual real | Resultado |
|---|---|---|---|
| Admin | Login OK, `/api/me` OK, 6 permisos LIVE observados | Pendiente | `GO_TECNICO_API` |
| Supervisor | Login OK, `/api/me` OK, 6 permisos LIVE observados | Pendiente | `GO_TECNICO_API` |
| Vendedor | Login OK, `/api/me` OK, sin `REMOVE_LIVE_ACTIVE_ITEM` | Pendiente | `GO_TECNICO_API` |
| Sin permisos | Login bloqueado con `403` | Pendiente | `GO_TECNICO_API` para bloqueo AUTH |

## Flujo funcional cubierto

Cubierto por API real no destructiva:

- backend vivo;
- frontend servido;
- autenticacion por roles QA;
- permisos LIVE efectivos por rol;
- bloqueo de usuario sin permisos;
- lecturas de live, inventario y reservas en branch QA.

No cubierto por mutacion:

- iniciar/abrir LIVE;
- preparar prenda;
- cambiar prenda al aire;
- confirmar selector `Actualmente al aire` en navegador;
- apartar con `X-Idempotency-Key`;
- reintentos idempotentes;
- intento de item ya tomado;
- cancelacion de reserva;
- `OPERATIONAL_SOLD`;
- evento `LIVE_OPERATIONAL_SOLD`.

## Dataset

Se detecto dataset real en `QA_CTR`, incluyendo LIVE activo, items disponibles/reservados/vendidos y reservas activas. No se encontro una marca inequívoca de dataset desechable para mutar sin riesgo.

Decision: no se ejecutaron mutaciones sobre LIVE/inventario/reservas.

Estado dataset mutante: `PENDING_MUTATION_DATASET`.

## Fixes aplicados

No se aplicaron fixes.

Motivo:

- no hubo evidencia visual real de microcopy o UI inconsistente;
- no hubo fallo API critico en el smoke no destructivo;
- cualquier cambio funcional excederia el alcance permitido.

## Criterios GO/NO-GO

| Criterio | Estado |
|---|---|
| API real no destructiva por rol | GO |
| Permisos LIVE efectivos coherentes | GO |
| Usuario sin permisos bloqueado | GO |
| Frontend responde | GO tecnico |
| Smoke visual con screenshot | Pendiente |
| Flujo mutante completo con dataset desechable | Pendiente |
| QA_PASS | No aplica |

Resultado de fase: `GO_TECNICO_API` con `PENDING_QA_API_OR_VISUAL`.

## Pendientes para QA formal

1. Ejecutar LIVE-QA-C o corrida manual asistida con navegador real y screenshots por rol.
2. Identificar o preparar dataset LIVE desechable con live, item disponible, cliente y reserva controlada.
3. Ejecutar flujo mutante completo: preparar, poner al aire, apartar, reintentar idempotencia, cancelar y marcar `OPERATIONAL_SOLD`.
4. Confirmar que `OPERATIONAL_SOLD` no crea venta, pago ni caja.
5. Confirmar visualmente que vendedor no puede retirar prenda del aire sin `REMOVE_LIVE_ACTIVE_ITEM`.
