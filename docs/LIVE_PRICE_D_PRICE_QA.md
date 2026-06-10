# LIVE-PRICE-D / QA API de cambio de precio LIVE

Fecha: 2026-06-10
Rama: `feature/live-price-d-price-qa`

## Alcance

Se ejecuto QA API real y mutante controlado del flujo `LIVE_PRICE_CHANGE` implementado en LIVE-PRICE-C. El objetivo fue validar solicitud, bloqueo de aprobacion por vendedor, aprobacion/aplicacion por admin y trazabilidad del evento, usando solo dataset desechable.

No se implemento logica nueva.

## Historial confirmado

- `658c35f LIVE-PRICE-C implementa autorizacion precio live`
- `6e4bc2e MOBILE-LAN-A documenta diagnostico Expo Go`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`

## Ambiente

- Backend: `http://localhost:8090`
  - `/api/health`: `200`
  - `/api/me` sin token: `401`
- Frontend:
  - `http://localhost:8081`: `200`
  - `http://192.168.0.128:8081`: `200`

## Usuarios QA

Se usaron credenciales QA documentadas sin imprimir password ni tokens.

| Usuario | Resultado | Rol | Permisos relevantes |
| --- | --- | --- | --- |
| `qa.admin@local.test` | Login OK | `ADMIN` | Solicitar, aprobar, aplicar y ver autorizaciones de precio LIVE |
| `qa.supervisor.centro@local.test` | Login OK | `SUPERVISOR` | Solicitar, aprobar, aplicar y ver autorizaciones de precio LIVE |
| `qa.vendedor.centro@local.test` | Login OK | `SELLER` | Solicitar cambio de precio LIVE; sin aprobar/aplicar |

## Dataset usado

Dataset desechable documentado:

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE: `15`
- Reserva: `45`
- Item: `106`
- Item code: `QA_LIVE_DISPOSABLE_20260610104008-ITEM-B`

Estado previo de reserva `45`:

- `status`: `ACTIVE`
- `liveOperationalStatus`: `RESERVED`
- `price`: `102.00`
- Pagos asociados por API: `[]`

## Smoke API ejecutado

1. Seller creo solicitud `LIVE_PRICE_CHANGE` sobre reserva `45`.
2. Seller intento aprobar la solicitud.
   - Resultado esperado: `403`
   - Resultado obtenido: `403`
3. Admin aprobo la solicitud.
   - Resultado obtenido: `APPROVED`
4. Admin aplico la solicitud.
   - Resultado obtenido: `APPLIED`
5. Admin reintento aplicar la misma solicitud.
   - Resultado esperado: no aplicar dos veces.
   - Resultado obtenido: `400`

Autorizacion creada:

- `authorizationId`: `2`

## Valores antes/despues

| Campo | Antes | Despues | Resultado |
| --- | ---: | ---: | --- |
| `reservations.price` reserva `45` | `102.00` | `111.23` | PASS |
| `items.price` item `106` | `102.00` | `102.00` | PASS |
| ventas asociadas | `0` | `0` | PASS |
| pagos asociados | `0` | `0` | PASS |
| cierres de caja en sucursal | `1` | `1` | PASS |
| eventos `LIVE_PRICE_CHANGE_APPLIED` | - | `1` | PASS |

## Confirmaciones de alcance

- Solo cambio `reservations.price`.
- No cambio `items.price`.
- No cambio `sales.price`.
- No se creo venta.
- No se creo pago.
- No se modifico caja.
- No se tocaron devoluciones.
- No se modifico RBAC, permisos, endpoints ni migraciones.

## Resultado

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`

No se marca `QA_PASS` porque no hubo evidencia visual/screenshots en esta fase.
