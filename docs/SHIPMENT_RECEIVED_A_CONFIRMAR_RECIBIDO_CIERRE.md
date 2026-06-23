# SHIPMENT-RECEIVED-A Confirmar recibido y cierre operativo

## Problema detectado

Despues de marcar un envio como enviado faltaba un flujo directo para confirmar que el cliente recibio el paquete y dejar claro que sucede con el paquete relacionado.

## Estados reales usados

- Shipment: `OPEN`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED`.
- CustomerPackage: `OPEN`, `READY`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- ShipmentPackage: `PENDING`, `DELIVERED`, `NOT_DELIVERED`, `RETURNED`, `CANCELLED`.

## Regla final

Un envio solo puede confirmarse recibido si esta en `OUT_FOR_DELIVERY`, pertenece a la sucursal/tenant del usuario, tiene paquetes pendientes y el usuario cuenta con `MANAGE_SHIPMENTS`.

Al confirmar recibido:

- las lineas pendientes del envio pasan a `DELIVERED`;
- se registra `deliveredAt`;
- se guarda nota opcional en `collectionNotes`;
- el paquete relacionado pasa a `DELIVERED`;
- el shipment se refresca a `DELIVERED` cuando todas las lineas quedan entregadas;
- pagos, saldo y costo de envio no cambian.

## Endpoint

`PATCH /api/shipments/{id}/confirm-received`

Payload:

```json
{
  "receivedAt": null,
  "notes": "Cliente confirmo recibido por WhatsApp",
  "deliveryConfirmedByUserId": 77
}
```

## Cierre operativo

El cierre no es automatico. El modelo actual no tiene estado `CLOSED` en `CustomerPackageStatus`; al recibir, el paquete queda `DELIVERED`. El cierre operativo se mantiene como revision separada desde el paquete relacionado cuando el flujo existente lo permita.

## Bloqueos

- Shipment no enviado: se bloquea con mensaje claro.
- Shipment ya entregado: se bloquea para evitar duplicidad.
- Shipment cancelado o cerrado con incidencias: se bloquea.
- Paquetes COD: se bloquea el flujo global para evitar pagos implicitos; se debe resolver la entrega capturando monto.
- Falta de permiso: `MANAGE_SHIPMENTS`.

## Validaciones

Se agregaron pruebas de backend para recepcion correcta, bloqueo por estado no enviado, bloqueo COD y preservacion de pagos.

## Backlog

- evidencia/foto de recibido;
- firma del receptor;
- comprobante PDF;
- notificacion WhatsApp;
- tracking real de paqueterias.
