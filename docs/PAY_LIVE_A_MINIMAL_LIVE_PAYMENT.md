# PAY-LIVE-A - Pago minimo de apartado LIVE

Fecha: 2026-06-10

## Resumen ejecutivo

PAY-LIVE-A valida y formaliza el pago minimo de apartado LIVE usando el contrato existente de pagos por reserva:

- Backend existente: `POST /api/payments` con `reservationId`.
- Consulta existente: `GET /api/payments/reservation/{reservationId}`.
- UI existente: `/payments?reservationId=<id>&returnTo=/live`.
- Modelo persistente existente: `payments` + `payment_allocations.reservation_id`.

No se crearon endpoints, permisos, migraciones ni flujo financiero nuevo. La fase agrega cobertura backend focalizada y documenta el uso seguro para reservas LIVE activas.

Resultado tecnico: `GO_TECNICO_API`.

Pendiente: `PENDING_QA_VISUAL` hasta contar con capturas reales desde `/live` y `/payments`.

## Alcance

Incluido:

- Registrar pago asociado a una reserva LIVE activa.
- Consultar pagos asociados a la reserva.
- Confirmar que el pago queda como `PaymentStatus.ACTIVE`.
- Confirmar que la asignacion queda en `payment_allocations.reservation_id`.
- Confirmar que el flujo no crea venta financiera.
- Confirmar que el flujo no toca caja, cierre de caja, devoluciones ni precio LIVE.
- Confirmar que reservas canceladas o convertidas no aceptan pago nuevo.

Excluido:

- Crear venta real.
- Convertir reserva en venta.
- Cierre de caja.
- Devoluciones.
- Reembolsos.
- Precio LIVE.
- Nuevos permisos o RBAC.
- Nuevos endpoints.
- Nuevas migraciones.

## Modelo usado

El pago minimo LIVE usa el modelo general de pagos:

- `Payment`: registra importe recibido, metodo, referencia, usuario y status.
- `PaymentAllocation`: asocia el pago a `reservationId` o `saleId`.
- Para PAY-LIVE-A se usa exclusivamente `reservationId`.

La reserva LIVE conserva su estado de reserva. El pago no convierte la reserva en venta y no crea registros en ventas.

## Contrato API reutilizado

### Crear pago

`POST /api/payments`

Payload relevante:

```json
{
  "reservationId": 45,
  "amount": 10.00,
  "paymentMethodId": 3,
  "reference": "PAY-LIVE-A smoke disposable",
  "createdByUserId": 5
}
```

Reglas observadas:

- Requiere permiso `REGISTER_PAYMENTS`.
- Requiere exactamente uno de `saleId` o `reservationId`.
- Requiere reserva `ACTIVE`.
- Respeta tenant/branch activo.
- Crea `PaymentAllocation` con `reservationId`.
- Solo sincroniza estado de venta cuando se usa `saleId`.
- Si hay sobrepago, usa el modelo existente de saldos (`BalanceService.registerOverage`); PAY-LIVE-A no crea campos ni reglas nuevas.

### Consultar pagos de reserva

`GET /api/payments/reservation/{reservationId}`

Permite mostrar pagado/saldo pendiente en frontend con los pagos `ACTIVE`.

## UI existente

La pantalla LIVE ya navega a pagos con:

- Ruta: `/payments`
- Parametros: `reservationId` y `returnTo=/live`

La pantalla de pagos ya:

- carga la reserva;
- carga pagos por reserva;
- carga metodos de pago activos;
- permite capturar un pago parcial o total;
- muestra total, pagado y pendiente;
- permite volver a LIVE cuando viene de contexto LIVE.

No se modifico frontend funcional en esta fase.

## Pruebas agregadas

Archivo:

- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/payment/PaymentServiceAccessTests.java`

Casos:

- Pago a reserva LIVE activa crea `Payment` activo y `PaymentAllocation` con `reservationId`.
- El pago por reserva no consulta ni guarda `Sale`.
- El pago por reserva no registra sobrepago cuando el importe no excede el pendiente.
- Reserva cancelada rechaza pago.
- Reserva convertida a venta rechaza pago.

## Smoke API real

Ambiente:

- Backend: `http://localhost:8090`
- Dataset desechable: `QA_LIVE_DISPOSABLE_20260610104008`
- Reserva usada: `45`
- Usuario: `qa.admin@local.test`

Resultados:

| Validacion | Resultado |
|---|---|
| `/api/health` | `200` |
| `/api/me` sin token | `401` |
| Login admin QA | OK |
| Permiso `REGISTER_PAYMENTS` | presente |
| `POST /api/payments` con `reservationId=45` | OK |
| Payment creado | `11` |
| Status payment | `ACTIVE` |
| Allocation reservationId | `45` |
| Allocation saleId | `null` |
| Allocation amount | `10.00` |

Nota: la reserva desechable ya se usa como dataset de QA y no se limpio ni borro ningun dato.

## Riesgos y pendientes

- Falta QA visual con screenshots reales en `/live` y `/payments`.
- El modelo existente permite sobrepago y registra saldo; si negocio requiere bloquear sobrepago LIVE, debe definirse en una fase especifica.
- La cancelacion/liberacion de reserva con pago activo depende del guard existente de ITEM-Z6B; PAY-LIVE-A no modifica ese comportamiento.
- Caja/cierre de caja sigue fuera de alcance.
- Venta financiera sigue fuera de alcance.

## Rollback

Esta fase no agrega migraciones ni cambios funcionales de runtime. Para rollback de codigo:

- revertir el commit de PAY-LIVE-A;
- no tocar datos de pagos ya creados en dataset desechable sin plan explicito;
- no borrar pagos productivos ni reparar saldos manualmente sin conciliacion.

## GO/NO-GO

Decision: `GO_TECNICO_API`.

Condiciones:

- Pruebas focalizadas de backend pasan.
- Smoke API real crea pago de reserva desechable con `saleId=null`.
- No se tocaron pagos/caja/devoluciones/precio LIVE/RBAC/permisos/endpoints/migraciones fuera del alcance.

Pendiente: `PENDING_QA_VISUAL`.
