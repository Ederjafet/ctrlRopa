# SHIPMENT-TIMELINE-A Timeline contextual de envios

Fecha: 2026-06-22

## Problema detectado

La linea de tiempo de `/shipment-detail` mostraba `Cancelado` como un paso pendiente aun cuando el envio no estaba cancelado. Eso hacia parecer que cancelar era parte del flujo normal, cuando en realidad es una salida alternativa.

Tambien se mostraba la etiqueta `Recibido / resuelto`, que era ambigua para el cierre operativo normal.

## Causa raiz

`app/shipment-detail.tsx` construia la timeline con una lista fija de todos los eventos posibles:

- Envio creado
- Guia registrada
- Marcado enviado
- Recibido / resuelto
- Cancelado

Esa lista se renderizaba completa para cualquier estado, por eso `Cancelado` aparecia como pendiente en envios abiertos, enviados o entregados.

## Regla corregida

La timeline ahora se construye con `buildShipmentTimeline(detail, effectiveGuide)`.

Flujo normal:

- Envio creado
- Guia registrada, si existe guia o el tipo requiere guia
- Marcado enviado
- Recibido

Flujo cancelado:

- Envio creado
- Guia registrada, si existia
- Cancelado

`Cancelado` solo aparece cuando `shipment.status === 'CANCELLED'`.

## Estados considerados

- `OPEN`: creado, guia si aplica, marcado enviado pendiente y recibido pendiente.
- `OUT_FOR_DELIVERY`: creado, guia si aplica, marcado enviado completado y recibido pendiente.
- `DELIVERED`: creado, guia si aplica, marcado enviado completado y recibido completado.
- `CLOSED_WITH_INCIDENTS`: creado, guia si aplica, marcado enviado completado y cierre con incidencias.
- `CANCELLED`: creado, guia si existia y cancelado como evento final.

## Cambios de etiquetas

- `Recibido / resuelto` se reemplazo por `Recibido`.
- `Linea de tiempo` se muestra como `Linea de tiempo` en la estructura operativa, con textos de eventos claros.
- `Guia registrada` queda como evento de guia, no como requisito inventado si no aplica.

## Alcance

Solo frontend.

No se tocaron backend, estados, reglas de negocio, pagos, paquetes ni endpoints. El DTO ya tenia los datos necesarios: estado real, guia efectiva, fecha de despacho, fecha de entrega por linea y fecha de cancelacion.

## Validaciones esperadas

- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

No aplica `./mvnw.cmd test` porque no se modifico backend.

## Fuera de alcance

- Cancelar envios.
- Cambiar estados backend.
- Tracking automatico.
- Evidencia de entrega.
- Integracion con paqueterias.
