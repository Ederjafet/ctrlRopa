# PAY-LIVE-B - QA visual y flujo UI de pago LIVE

Fecha: 2026-06-10

## Alcance

PAY-LIVE-B valida el flujo actual para pago de apartado LIVE desde UI/API sin implementar pagos nuevos.

Incluido:

- Confirmar que PAY-LIVE-A esta integrado en develop.
- Auditar UI actual de `/live`, `/reservation-detail` y `/payments`.
- Validar API real con dataset desechable.
- Confirmar pagos y allocations ligados a `reservationId`.
- Confirmar que la cancelacion normal queda bloqueada cuando hay pago activo.
- Documentar checklist visual pendiente.

Excluido:

- Nuevos endpoints.
- Nuevas migraciones.
- Nuevos permisos o RBAC.
- Caja.
- Devoluciones.
- Venta financiera.
- Conversion de reserva a venta.
- Precio LIVE.

## Historial confirmado

- `f231775 Merge branch 'feature/pay-live-a-minimal-live-payment' into develop`
- `4b1435e PAY-LIVE-A implementa pago minimo live`
- `3676d2b LIVE-PRICE-D valida cambio precio live`
- `658c35f LIVE-PRICE-C implementa autorizacion precio live`
- `9121fe2 LIVE-AUTH-B3 valida autorizaciones operativas`
- `7f77e80 RELEASE-LIVE-BASE-RC1 documenta release candidate live base`

## Dataset usado

Dataset desechable:

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE: `15`
- Reserva usada para consulta: `45`
- Pago existente: `11`

La reserva `45` ya tenia pago activo creado por PAY-LIVE-A. Por seguridad no se registro un segundo pago sobre la misma reserva.

## Usuarios QA

| Usuario | Login | Rol | REGISTER_PAYMENTS | VIEW_PAYMENTS |
|---|---:|---|---:|---:|
| `qa.admin@local.test` | 200 | `ADMIN` | si | si |
| `qa.vendedor.centro@local.test` | 200 | `SELLER` | si | si |
| `qa.sinpermisos@local.test` | 403 | bloqueado | no validado | no validado |

No se imprimieron passwords ni tokens.

## API smoke

Ambiente:

- Backend: `http://localhost:8090`
- Frontend: `http://localhost:8081` y `http://192.168.0.128:8081`

Resultados:

| Validacion | Resultado |
|---|---|
| `/api/health` | `200` |
| `/api/me` sin token | `401` |
| `GET /api/reservations/45` | `200` |
| Reserva `45` status | `ACTIVE` |
| Reserva `45` liveId | `15` |
| Reserva `45` canal | `LIVE` |
| Reserva `45` price | `111.23` |
| `GET /api/payments/reservation/45` | `200` |
| Pagos activos encontrados | `1` |
| Payment id | `11` |
| Payment status | `ACTIVE` |
| Payment receivedAmount | `10.00` |
| Allocation reservationId | `45` |
| Allocation saleId | `null` |
| Allocation amount | `10.00` |
| `PATCH /api/reservations/45/cancel` | `400` esperado |
| Mensaje de bloqueo | requiere flujo formal de reversa |

Resultado API: `GO_TECNICO_API`.

## Visual smoke

Frontend respondio:

- `http://localhost:8081` => `200`
- `http://192.168.0.128:8081` => `200`

No se obtuvo screenshot real porque el navegador integrado no expuso el runtime `node_repl/js` requerido para automatizar Browser Use en esta sesion.

Resultado visual: `PENDING_QA_VISUAL`.

## Auditoria UI

Hallazgos en codigo:

- `/live` calcula `paidByReservationId` con `GET /api/payments/reservation/{id}` solo cuando existe `VIEW_PAYMENTS`.
- `/live` muestra pago registrado, saldo pendiente y estado de pago cuando el usuario puede ver pagos.
- `/live` navega a `/payments?reservationId=<id>&returnTo=/live` para cobrar apartado.
- `/live` bloquea acciones sensibles si detecta pago activo.
- `/reservation-detail` muestra seccion de pagos, historial y accion `Cobrar apartado` si aplica.
- `/payments` muestra detalle de reserva, total, pagado, pendiente, pagos registrados y formulario `Registrar pago`.
- `/payments` bloquea registro si no existe `REGISTER_PAYMENTS`.

No se aplicaron fixes porque no hubo evidencia clara de bug menor.

## Checklist visual pendiente

Validar con screenshots reales:

- Admin entra a `/live`, ve reserva LIVE con pago registrado y pendiente.
- Boton/ruta de cobro navega a `/payments?reservationId=45&returnTo=/live`.
- `/payments` muestra reserva `45`, total `111.23`, pagado `10.00`, pendiente `101.23` y pago `11`.
- La pantalla no muestra el apartado como venta final.
- La pantalla no promete caja, devolucion ni cierre financiero.
- Si un usuario no tiene permisos de pago, no debe ver accion de registrar pago.
- Si hay pago activo, la UI no debe sugerir cancelacion normal segura.

## GO/NO-GO

Resultado:

- `GO_TECNICO_API`
- `PENDING_QA_VISUAL`
- `PENDING_QA_API_MUTATION`

Motivo de `PENDING_QA_API_MUTATION`: no se creo otro pago porque el dataset seguro disponible ya tenia pago activo en la reserva `45`.
