# SHIPMENT-BUTTONS-A Acciones de detalle de envio

Fecha: 2026-06-22

## Problema detectado

En `/shipment-detail?id=2&returnTo=%2Fshipments`, el boton `Marcar enviado` se veia disponible, pero al presionarlo no habia modal, loading, error ni cambio de estado perceptible.

## Causa raiz

La pantalla dependia de `Alert.alert` para confirmar `Marcar enviado`, `Cancelar envio` y `Reabrir envio`. En web/Expo esa confirmacion puede no presentarse de forma confiable, dejando la accion como aparente no-op.

Tambien habia una desalineacion de datos: el detalle podia mostrar una guia tomada del paquete relacionado, pero la condicion del boton revisaba solo `shipment.guideReference`. Eso podia bloquear o confundir un envio que visualmente ya tenia guia capturada en el paquete.

## Correccion frontend

- `Marcar enviado` abre un `AppBottomModal` de confirmacion.
- El modal muestra cliente, paquete, tipo de envio y guia efectiva.
- Al confirmar, ejecuta `PATCH /api/shipments/{id}/dispatch`.
- Mientras ejecuta, muestra loading.
- Al terminar, muestra aviso visible y actualiza estado/timeline.
- Si la accion esta bloqueada, la pantalla muestra razon clara.
- `Cancelar envio` y `Reabrir envio` tambien usan confirmacion propia, no alerta nativa.
- `Agregar paquete` se oculta cuando el envio ya tiene paquete asociado.
- `Ver paquete` mantiene navegacion con `returnTo` hacia el detalle de envio.

## Correccion backend

`ShipmentService` ahora valida `MANAGE_SHIPMENTS` en operaciones de envio y conserva tenant/branch isolation existente.

Para despachar un envio por paqueteria:

- usa `shipment.guideReference` si existe;
- si falta, toma la guia del paquete relacionado (`customer_packages.tracking_number`);
- si ninguna existe, bloquea con `Captura la guia o referencia antes de marcar como enviado.`

No se agregaron migraciones ni integraciones externas.

## Botones auditados

- `Marcar enviado`: confirmacion, loading, endpoint real y feedback.
- `Agregar paquete`: oculto cuando no aplica porque el envio ya contiene paquete.
- `Ver paquete`: navega a `/customer-package-detail` con regreso al shipment detail.
- `Cancelar envio`: confirmacion y feedback si aplica al estado.
- `Confirmar recibido`: conserva modal operativo de resolucion de paquete.
- `Guardar guia`: no hay boton activo en esta pantalla; la guia se define al preparar el envio o se hereda del paquete.

## Permisos

- Operar envio: `MANAGE_SHIPMENTS`.
- Ver paquete relacionado: `CREATE_CLOSE_CUSTOMER_PACKAGE`.

Backend valida `MANAGE_SHIPMENTS` y frontend muestra `Ver permisos` con `shipmentDetail`.

## Validaciones

- `ShipmentServiceTests`: dispatch con guia del paquete, bloqueo sin guia y bloqueo por permiso.
- `npx.cmd eslint app/shipment-detail.tsx services/shipmentService.ts`: OK.
- `npx.cmd tsc --noEmit --pretty false`: OK.

Las validaciones completas se registran en el cierre de la fase.

## Backlog

- Editar guia directamente desde `/shipment-detail`.
- Evidencia de entrega.
- Comprobante de entrega.
- Tracking real.
- Notificacion al cliente.
