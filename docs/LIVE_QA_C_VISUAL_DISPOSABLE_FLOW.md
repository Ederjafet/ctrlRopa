# LIVE-QA-C - QA live con dataset desechable

Fecha: 2026-06-10 10:40:30 -06:00
Rama: `feature/live-qa-c-visual-disposable-flow`
Resultado: `NO_GO`

## Ambiente

| Componente | URL | Resultado |
|---|---|---|
| Backend | `http://localhost:8090` | UP |
| Frontend Expo Web | `http://localhost:8081` | UP |
| Frontend Expo Web LAN | `http://192.168.0.128:8081` | UP |

Checks:

- `GET /api/health`: `200`.
- `GET /api/me` sin token: `401`, esperado.
- Frontend local y LAN: `200`.

## Usuarios

La password QA se obtuvo desde documentacion local y no se imprimio.

| Usuario | Resultado | Rol | Permisos LIVE observados |
|---|---|---|---|
| `qa.admin@local.test` | Login OK, `/api/me` OK | `ADMIN` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.supervisor.centro@local.test` | Login OK, `/api/me` OK | `SUPERVISOR` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`, `VIEW_LIVE` |
| `qa.vendedor.centro@local.test` | Login OK, `/api/me` OK | `SELLER` | `CHANGE_LIVE_ACTIVE_ITEM`, `DO_LIVE_RESERVATION`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM`, `VIEW_LIVE` |
| `qa.sinpermisos@local.test` | `403` esperado | No aplica | ninguno |

## Dataset

No existia dataset `QA_LIVE_DISPOSABLE` previo. Se creo dataset desechable por API con prefijo:

`QA_LIVE_DISPOSABLE_20260610104008`

IDs creados:

| Entidad | ID | Identificador |
|---|---:|---|
| Cliente | 32 | `QA_LIVE_DISPOSABLE_20260610104008 Cliente` |
| Item A | 105 | `QA_LIVE_DISPOSABLE_20260610104008-ITEM-A` |
| Item B | 106 | `QA_LIVE_DISPOSABLE_20260610104008-ITEM-B` |
| LIVE | 15 | `QA_LIVE_DISPOSABLE_20260610104008 live disposable` |
| Reserva A | 44 | reserva cancelada |
| Reserva B | 45 | reserva `OPERATIONAL_SOLD` |

Catalogos usados:

- branch `QA_CTR`, id `4`;
- usuario admin id `5`;
- canal LIVE id `1`;
- product type id `4`;
- brand id `4`;
- size id `1`;
- storage location id `5`.

## Pasos API

Ejecutados con `qa.admin@local.test`, salvo pruebas de rol.

| Paso | Resultado |
|---|---|
| Crear cliente desechable | OK, id `32` |
| Crear item A `AVAILABLE` | OK, id `105` |
| Crear item B `AVAILABLE` | OK, id `106` |
| Crear LIVE desechable | OK, id `15`, status `OPEN` |
| Activar LIVE | OK, status `ACTIVE` |
| Poner item A al aire | OK, active item `105` |
| Verificar status item A despues de poner al aire | OK, sigue `AVAILABLE` |
| Vendedor intenta retirar prenda al aire | `200`, inesperado |
| Reservar item A con `X-Idempotency-Key` | OK, reserva `44`, status `ACTIVE`, `RESERVED` |
| Reintentar misma key y mismo payload | OK, devuelve misma reserva `44` |
| Reintentar misma key y payload distinto | `409`, esperado |
| Intentar reservar item ya tomado | `400`, esperado |
| Cancelar reserva A activa sin pago | OK, reserva `44` queda `CANCELLED`, item A vuelve a `AVAILABLE` |
| Poner item B al aire | OK, active item `106` |
| Reservar item B | OK, reserva `45` |
| Marcar `OPERATIONAL_SOLD` en reserva B | OK |
| Verificar item B tras `OPERATIONAL_SOLD` | OK, queda `RESERVED` |
| Verificar evento `LIVE_OPERATIONAL_SOLD` | OK, 1 evento |
| Verificar pagos de reserva B | OK, 0 pagos |
| Verificar ventas de items desechables | OK, 0 ventas |
| Supervisor lee LIVE | OK |
| Usuario sin permisos | `403`, esperado |

## Pasos visuales

No se ejecuto QA visual real.

Motivo:

- El plugin Browser Use estaba disponible, pero no expuso `node_repl/js` en esta sesion.
- El repo no tiene Playwright/Puppeteer ni scripts e2e instalados.
- No se generaron screenshots.

Estado visual: `PENDING_QA_VISUAL`.

## Evidencia

Evidencia API principal:

- dataset prefijado `QA_LIVE_DISPOSABLE_20260610104008`;
- `LIVE 15`;
- `item 105` permanece `AVAILABLE` al ponerse al aire;
- reserva `44` prueba idempotencia y cancelacion;
- reserva `45` prueba `OPERATIONAL_SOLD`;
- evento `LIVE_OPERATIONAL_SOLD` encontrado para reserva `45`;
- pagos para reserva `45`: `0`;
- ventas para items `105` y `106`: `0`.

Evidencia de bloqueo fallido:

- `qa.vendedor.centro@local.test` no tiene `REMOVE_LIVE_ACTIVE_ITEM`;
- `PATCH /api/lives/15/active-item` con `itemId: null` respondio `200`, inesperado.

## Resultados por rol

| Rol | Resultado |
|---|---|
| Admin | Puede operar flujo desechable. |
| Supervisor | Puede autenticarse y leer LIVE creado. |
| Vendedor | `NO_GO`: pudo retirar prenda al aire por API sin `REMOVE_LIVE_ACTIVE_ITEM`. |
| Sin permisos | Login bloqueado con `403`. |

## Mutaciones ejecutadas

Se crearon datos desechables y se ejecutaron mutaciones solo sobre ese dataset:

- crear cliente;
- crear dos items;
- crear y activar LIVE;
- cambiar active item;
- crear reservas LIVE;
- reintentos idempotentes;
- cancelar una reserva;
- marcar una reserva como `OPERATIONAL_SOLD`.

No se ejecutaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC, permisos, endpoints, migraciones ni venta financiera.

## Rollback o cleanup manual

No se borro nada y no se ejecuto cleanup automatico.

Opciones manuales recomendadas para data owner/QA:

1. Cerrar el LIVE desechable `15` si no debe quedar activo.
2. Mantener el dataset como evidencia de QA con prefijo `QA_LIVE_DISPOSABLE_20260610104008`.
3. Si se requiere limpieza completa, hacerla solo con respaldo y aprobacion explicita, filtrando por el prefijo `QA_LIVE_DISPOSABLE_20260610104008` y por los IDs documentados.

## Fixes aplicados

No se aplicaron fixes.

El hallazgo de vendedor requiere revisar backend/permisos/capabilities y queda fuera del alcance permitido de LIVE-QA-C, porque la fase prohibe modificar RBAC, permisos y backend funcional complejo.

## Criterios QA_PASS / GO / NO-GO

| Criterio | Resultado |
|---|---|
| Dataset desechable seguro | GO |
| Flujo API admin base | GO parcial |
| Idempotencia | GO |
| Cancelacion sin pago | GO |
| `OPERATIONAL_SOLD` sin venta/pago/caja | GO |
| Usuario sin permisos bloqueado | GO |
| Vendedor no retira prenda al aire | NO-GO |
| Visual con screenshots | Pendiente |

Resultado final: `NO_GO`.

No se marca `QA_PASS`.
