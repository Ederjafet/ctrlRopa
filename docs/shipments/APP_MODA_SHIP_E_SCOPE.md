# APP_MODA SHIP-E - Alcance funcional de cierre operativo de envios

Fecha: 2026-06-30
Rama auditada: `feature/ship-e-desde-ship-d-go-cliente`
HEAD auditado: `f1675ac Sanea baseline buildable para SHIP-E`
Worktree: `E:\CtrlPan\2026\control-ropa-app-ship-e`

## Resumen ejecutivo

SHIP-E debe enfocarse en el cierre operativo del envio: validar que un envio pueda marcarse como enviado, confirmar entrega/recibido, cerrar con trazabilidad, bloquear modificaciones riesgosas despues de avanzar estado y mantener separados saldo de mercancia y saldo de envio.

No debe implementar reportes nuevos ni Centro del negocio en esta fase. Hay una colision de naming con documentacion anterior de SHIP-D, donde "que queda para SHIP-E" menciona reportes de saldos/pagos de envio. La recomendacion de esta auditoria es:

- SHIP-E: cierre operativo y hardening de estados de envio.
- SHIP-F o REPORT-B-SHIPPING: Centro del negocio/reportes con saldos y pagos de envio.

El alcance esta claro para implementar si negocio acepta una regla estricta: no marcar enviado ni confirmar recibido cuando exista saldo de envio asignado pendiente, salvo que la tienda absorba explicitamente el costo mediante el reparto existente.

Decision recomendada: `GO_IMPLEMENTAR` con el alcance minimo descrito en este documento.

## Contexto confirmado

Fases cerradas:

- SHIP-C: reparto/asignacion de costo de envio mediante `ShipmentCostShare`.
- SHIP-D: pagos reales de envio separados de pagos de mercancia mediante `ShipmentPayment`.
- SHIP-D-UX: Paquetes queda enfocado en mercancia; Envios concentra logistica, costo, reparto, pagos y saldo de envio.
- SHIP-D: `GO_CLIENTE`.

Baseline limpio:

- `a7f799e`: cierre SHIP-D.
- `f1675ac`: baseline buildable para SHIP-E con `AppButton variant="cta"` y `CREATE_CUSTOMER_PACKAGE` minimo.

Advertencias de entorno:

- No usar la BD local principal si contiene Flyway V67-V70 aplicadas y ausentes en esta rama limpia.
- Para backend, usar schema limpio dedicado/alineado con esta rama.
- Hay textos mojibake preexistentes en algunas pantallas/servicios. No se corrigen en esta fase para no mezclar alcance.
- En esta rama solo esta versionado `APP_MODA_SHIP_D_SHIPPING_PAYMENTS.md`; documentos SHIP-B/SHIP-C no existen como archivos versionados en `docs/shipments`.

## Auditoria backend actual

### Entidades y estructuras

`Shipment` ya contiene la verdad logistica principal:

- `id`, `folio`, `branch`.
- `deliveryType` (`LOCAL`, `CARRIER`).
- `status`.
- `guideReference`.
- `recipientName`, `recipientPhone`.
- `destinationSummary`, `destinationCity`, `destinationState`, `destinationPostalCode`.
- `shippingCarrier`.
- `realShippingCost`.
- `shippingNotes`.
- `quotedAt`, `readyAt`, `receivedAt`.
- `createdAt`, `createdByUserId`.
- `dispatchedAt`, `dispatchedByUserId`.
- `cancelledAt`, `cancelledByUserId`.

`ShipmentPackage` representa paquetes dentro de un envio:

- `shipmentId`, `customerPackageId`, `customerId`.
- `deliveryAddressId` legacy/operativo.
- `paymentMode` (`PREPAID`, `COD`).
- `expectedCollectionAmount` para COD.
- `status` (`PENDING`, `DELIVERED`, `NOT_DELIVERED`, `RETURNED`, `CANCELLED`).
- `collectedAmount`, `collectionDifference`, `collectionStatus`, `collectionNotes`.
- `deliveryConfirmedByUserId`, `deliveredAt`, `returnedAt`.

`ShipmentCostShare` ya resuelve cuanto corresponde pagar por envio.

`ShipmentPayment` ya resuelve pagos reales de envio, cancelacion logica y saldos.

### Estados actuales de envio

`ShipmentStatus` actual:

| Estado | Lectura operativa |
| --- | --- |
| `OPEN` | En preparacion / aun editable. |
| `OUT_FOR_DELIVERY` | Enviado / en ruta. |
| `DELIVERED` | Entregado completamente. |
| `CLOSED_WITH_INCIDENTS` | Cerrado con paquetes no entregados/devueltos/cancelados. |
| `CANCELLED` | Cancelado antes de despacho. |

### Transiciones actuales

| Transicion | Endpoint | Estado origen | Estado destino | Ya existe | Observacion |
| --- | --- | --- | --- | --- | --- |
| Crear envio | `POST /api/shipments` | n/a | `OPEN` | Si | Requiere paquete inicial. |
| Editar logistica | `PATCH /api/shipments/{id}/logistics` | `OPEN` y actualmente tambien `OUT_FOR_DELIVERY` | mismo estado | Si | Bloquea cancelado/finalizado, pero permite editar enviado. |
| Agregar paquete | `POST /api/shipments/{id}/packages` | `OPEN` | `OPEN` | Si | Solo paquetes `READY`; bloquea paquete ya asignado activo. |
| Repartir costo | `PUT /api/shipments/{id}/cost-shares` | `OPEN` y actualmente tambien `OUT_FOR_DELIVERY` si no hay pagos | mismo estado | Si | Bloquea cancelado/finalizado y cualquier historial de pagos. |
| Registrar pago envio | `POST /api/shipments/{id}/shipping-payments` | todos menos `CANCELLED` | mismo estado | Si | Actualmente permitiria registrar aun en entregado/cerrado. |
| Cancelar pago envio | `PATCH /api/shipments/{id}/shipping-payments/{paymentId}/cancel` | sin bloqueo por estado salvo shipment existente | mismo estado | Si | Actualmente permitiria cancelar aun en entregado/cerrado. |
| Marcar enviado | `PATCH /api/shipments/{id}/dispatch` | `OPEN` | `OUT_FOR_DELIVERY` | Si | Bloquea sin paquetes, sin destino, legacy mixto, carrier sin guia, paquetes no READY. No valida saldo envio. |
| Resolver paquete | `PATCH /api/shipments/{shipmentId}/packages/{shipmentPackageId}/resolve` | `OUT_FOR_DELIVERY` | `OUT_FOR_DELIVERY`, `DELIVERED` o `CLOSED_WITH_INCIDENTS` | Si | Permite resultado por paquete. COD debe resolverse con monto. |
| Confirmar recibido | `PATCH /api/shipments/{id}/confirm-received` | `OUT_FOR_DELIVERY` | `DELIVERED` | Si | Confirma todos los paquetes pendientes no COD. No valida saldo envio. |
| Cancelar envio | `PATCH /api/shipments/{id}/cancel` | `OPEN` | `CANCELLED` | Si | Bloquea enviado y finalizado. |
| Reabrir envio | `PATCH /api/shipments/{id}/reopen` | `CANCELLED` o `CLOSED_WITH_INCIDENTS` | `OPEN` | Si | No reabre enviado ni entregado completo. |

### Tenant/branch safety actual

El servicio usa `tenantAccessGuard.requireBranch(...)` en:

- creacion contra branch y paquete inicial;
- listado por branch;
- busqueda de envio por id/folio mediante `findShipment`/`findShipmentByFolio`;
- paquete y direccion al agregar paquete;
- ventas usadas para incidentes COD.

Los endpoints de cost shares y shipping payments pasan primero por `findShipment`, y despues consultan shares/pagos por `shipmentId`, por lo que el contexto tenant/branch esta razonablemente protegido.

### Permisos actuales

Backend usa `PermissionCode.MANAGE_SHIPMENTS` para leer, crear, editar, repartir, pagar, despachar, confirmar, cancelar y reabrir envios.

Frontend tambien usa `MANAGE_SHIPMENTS` como requisito para ver y operar `shipments` y `shipmentDetail`.

Recomendacion SHIP-E: no cambiar permisos en esta fase. Mantener `MANAGE_SHIPMENTS` para no mezclar RBAC. Separar `VIEW_SHIPMENTS` contra `MANAGE_SHIPMENTS` queda fuera de alcance.

## Auditoria UI actual

### `app/shipments.tsx`

Ya funciona como bandeja operativa de envios:

- Muestra paquetes listos sin envio creado.
- Muestra envios reales.
- Filtros: todos/listos/preparacion/enviados/entregados/historial/atencion.
- Acciones llevan a detalle.
- Modal para preparar envio desde paquete READY.
- Textos indican logistica, guia, paqueteria, costo envio, destino y siguiente paso.

Huecos para SHIP-E:

- La bandeja no muestra claramente si el envio esta bloqueado por saldo de envio pendiente.
- Algunos textos siguen diciendo `Preparar envio`/`Despachar` sin explicar checklist de cierre.
- No existe checklist visual compacto de listo para enviar.

### `app/shipment-detail.tsx`

Ya concentra:

- Datos del envio.
- Paquetes incluidos.
- Reparto del costo de envio.
- Pagos de envio.
- Acciones: `Despachar`, `Confirmar recibido`, `Reabrir`, `Cancelar envio`.
- Modales: editar logistica, repartir costo, registrar/cancelar pago de envio.

Huecos para SHIP-E:

- `Despachar` solo se deshabilita por estado/permiso, no por razones detalladas de saldo/reparto.
- `Confirmar recibido` solo se deshabilita por estado/permiso, no por saldo de envio pendiente.
- La UI no muestra una lista de bloqueos operativos antes de enviar/cerrar.
- Registro/cancelacion de pagos podria seguir visible en estados finales si backend lo permite.

### `app/customer-packages.tsx` y `app/customer-package-detail.tsx`

Despues de SHIP-D-UX, Paquetes queda enfocado en mercancia:

- Cliente, prendas, total mercancia, abonado mercancia, saldo mercancia, estado paquete.
- Resumen minimo de envio.
- Accion `Ver envio` si existe envio asociado.
- Accion `Crear envio` solo si no hay envio y corresponde.

Para SHIP-E solo se recomienda reflejar resumen de estado logistico sin traer pagos/saldos de envio como dato principal.

## Respuestas de reglas de negocio para SHIP-E

| Pregunta | Respuesta recomendada | Estado actual |
| --- | --- | --- |
| Se puede marcar como enviado sin direccion/destino? | No. Debe bloquear. | Ya bloquea destino faltante y legacy mixto. |
| Se puede marcar como enviado sin paquetes? | No. Debe bloquear. | Ya bloquea shipment vacio. |
| Se puede marcar como enviado sin guia en carrier? | No. Debe bloquear. | Ya bloquea si `CARRIER` no tiene guia propia ni legacy segura. |
| Se puede marcar como enviado sin reparto de costo? | No si hay costo real mayor a cero o si el envio requiere cobro/asignacion. Para costo cero o tienda absorbe, debe quedar explicito con reparto/absorcion. | Actualmente no bloquea por reparto. |
| Se puede marcar como enviado con saldo de envio pendiente? | No, salvo absorcion explicita por tienda. | Actualmente no valida `shippingBalance`. |
| Se puede entregar con saldo de envio pendiente? | No. Si un pago se cancela despues del despacho y reabre saldo, debe bloquear confirmacion hasta cubrirlo o absorberlo. | Actualmente no valida `shippingBalance`. |
| Se puede entregar con saldo de mercancia pendiente? | No. Envio solo debe contener paquetes `READY`, y `READY` ya se marca desde paquete cuando saldo pendiente es cero. | Parcialmente cubierto por estado `READY`. |
| Que pasa si hay pagos cancelados? | No cuentan como pagado. Si al cancelar queda saldo, bloquea despacho/cierre. | SHIP-D ya no cuenta cancelados, pero despacho/cierre no consulta saldo. |
| Se puede modificar logistica despues de enviado? | No para campos principales. Solo notas operativas podria ser una mejora futura. | Actualmente `updateLogistics` permite `OUT_FOR_DELIVERY`. |
| Se puede modificar reparto despues de pagos? | No. Ya esta bloqueado si hay pagos registrados o cancelados. SHIP-E debe tambien bloquear reparto despues de despacho. | Parcialmente cubierto. |
| Se puede registrar/cancelar pago de envio despues de entregado/cerrado? | No. Despues de cierre operativo, los pagos de envio deben quedar bloqueados salvo flujo formal de ajuste futuro. | Actualmente podria permitirse si no esta `CANCELLED`. |
| Se puede cancelar un envio entregado? | No. | Ya bloquea entregado/cerrado/enviado. |
| Permiso requerido | `MANAGE_SHIPMENTS`. | Ya aplica. |

## Alcance minimo propuesto para SHIP-E

Nombre funcional recomendado:

`SHIP-E - Cierre operativo de envios`

Objetivo:

Asegurar que el envio solo avance a enviado/recibido cuando cumple checklist logistico y financiero de envio, sin mezclar pagos de mercancia ni crear reportes nuevos.

### Backend minimo

1. Crear helpers internos sin migracion:

- `validateReadyToDispatch(shipment)`.
- `validateReadyToConfirmReceived(shipment)`.
- `resolveShippingPaymentSummary(shipmentId)` o reutilizar calculos de `toShippingPaymentsResponse`.

2. Endurecer `dispatch`:

Debe seguir requiriendo:

- permiso `MANAGE_SHIPMENTS`;
- shipment `OPEN`;
- al menos un paquete;
- destino/direccion definido;
- sin `MIXED_LEGACY`;
- guia si `CARRIER`;
- todos los paquetes en `READY`.

Debe agregar:

- costo real definido para envio: `realShippingCost != null` (`0.00` permitido);
- si `realShippingCost > 0`, reparto existente para todos los paquetes incluidos;
- `shippingBalance <= 0` para la parte asignada a clientes;
- si el costo es absorbido por tienda, que quede representado por `STORE_ABSORBED` o asignacion total menor con absorbed calculado;
- mensaje claro si falta reparto o pago de envio.

3. Endurecer `confirmReceived` y `resolvePackage`:

- Confirmacion general no debe cerrar si `shippingBalance > 0`.
- Resolucion por paquete como `DELIVERED` no debe cerrar si hay saldo de envio pendiente.
- COD de mercancia mantiene la regla actual: debe resolverse por paquete con monto cobrado.
- No registrar pagos de mercancia implicitos para pagos de envio.

4. Bloquear ediciones despues de avance operativo:

- `updateLogistics`: permitir solo en `OPEN`. Fuera de SHIP-E se podria definir un endpoint de notas, pero no ahora.
- `updateCostShares`: permitir solo en `OPEN`, y seguir bloqueando si hay cualquier pago registrado o cancelado.
- `registerShippingPayment`: permitir en `OPEN` y `OUT_FOR_DELIVERY`; bloquear `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED`.
- `cancelShippingPayment`: permitir en `OPEN` y `OUT_FOR_DELIVERY`; bloquear `DELIVERED`, `CLOSED_WITH_INCIDENTS`, `CANCELLED`.

5. Mejorar `canDispatch`, `canConfirmReceived`, `blockedReason` y `nextStep`:

- Incluir razones de saldo/reparto/costo en `ShipmentResponse`.
- Si no se quiere cambiar DTO, mantener campos existentes y ampliar calculo interno.
- Ejemplos de mensajes:
  - `Define el costo real del envio antes de marcarlo enviado.`
  - `Reparte el costo de envio antes de marcarlo enviado.`
  - `Hay saldo de envio pendiente. Registra el pago o marca absorcion por tienda antes de continuar.`

6. No crear migraciones.

### Frontend minimo

1. `app/shipment-detail.tsx`:

- Cambiar o complementar `Despachar` con lenguaje mas claro: `Marcar enviado`.
- Mostrar checklist `Listo para enviar`:
  - paquetes incluidos;
  - destino;
  - guia si aplica;
  - costo real;
  - reparto;
  - saldo envio;
  - paquetes READY.
- Deshabilitar `Marcar enviado` con razon visible si falta algun punto.
- Deshabilitar `Confirmar recibido` con razon visible si hay saldo de envio pendiente.
- Ocultar/deshabilitar registro/cancelacion de pagos en estados finales con mensaje controlado.

2. `app/shipments.tsx`:

- Mostrar bloqueo operativo compacto en tarjetas: `Falta reparto`, `Saldo envio pendiente`, `Falta costo`, `Falta guia`.
- Mantener las acciones reales en detalle; la bandeja puede llevar al detalle.

3. `app/customer-packages.tsx` y `app/customer-package-detail.tsx`:

- Mantener foco en mercancia.
- Mostrar solo resumen de estado de envio: sin envio, en preparacion, enviado, entregado, incidencia/cancelado.
- No mostrar costo/pagos/saldo de envio como dato principal.

### Pruebas backend minimas

Agregar/ajustar en `ShipmentServiceTests`:

1. `dispatchBlocksWithoutRealShippingCost`.
2. `dispatchBlocksWithoutCostSharesWhenShippingCostIsPositive`.
3. `dispatchBlocksWhenShippingBalanceIsPending`.
4. `dispatchAllowsWhenShippingCostIsZeroAndNoBalance`.
5. `dispatchAllowsWhenStoreAbsorbsCost`.
6. `dispatchAllowsWhenAssignedShippingIsFullyPaid`.
7. `confirmReceivedBlocksWhenShippingBalanceIsPending`.
8. `confirmReceivedAllowsWhenShippingBalanceIsZero`.
9. `resolvePackageDeliveredBlocksWhenShippingBalanceIsPending`.
10. `updateLogisticsBlocksOutForDelivery`.
11. `updateCostSharesBlocksOutForDelivery`.
12. `registerShippingPaymentBlocksDeliveredClosedCancelled`.
13. `cancelShippingPaymentBlocksDeliveredClosedCancelled`.
14. `cancelledPaymentReopensShippingBalanceAndBlocksConfirmReceived`.
15. `doesNotChangeMerchandisePaymentsOrPackagePendingAmount`.
16. `tenantBranchSafetyStillApplies`.

### Smoke visual minimo

Con `qa.admin@local.test`:

1. Crear/reusar envio `OPEN` con paquete READY.
2. Confirmar que sin costo/reparto/pago no permite marcar enviado.
3. Capturar costo real.
4. Crear reparto.
5. Registrar pago parcial: sigue bloqueado.
6. Completar pago: permite marcar enviado.
7. Marcar enviado.
8. Confirmar que bloquea edicion de logistica/reparto.
9. Cancelar un pago estando enviado: saldo reabre y bloquea confirmar recibido.
10. Registrar pago faltante.
11. Confirmar recibido.
12. Confirmar que paquete queda entregado y saldo mercancia no cambia.

Con `qa.vendedor.centro@local.test`:

- Verificar que sin `MANAGE_SHIPMENTS` no opera cierre ni pagos de envio.
- No debe aparecer 403 feo ni spinner infinito.

Con `qa.sinpermisos@local.test`:

- No debe entrar a operacion de envios/paquetes.

Responsive:

- Escritorio y tablet.
- Checklist y modales deben ser legibles.

## Fuera de alcance SHIP-E

No incluir:

- Centro del negocio/reportes de saldo envio.
- REPORT-B.
- Nuevos permisos RBAC.
- Nuevas migraciones.
- Nuevos estados de BD.
- Reembolsos/devoluciones de pagos de envio.
- Evidencia fotografica o archivos adjuntos.
- Auditoria avanzada de cambios.
- Integracion con paqueterias.
- Guias automaticas.
- Corte de caja.
- Utilidad/margen/rentabilidad.
- Separacion `VIEW_SHIPMENTS` vs `MANAGE_SHIPMENTS`.

## Evidencia minima de entrega

Ya existen campos suficientes para MVP:

- `receivedAt` en `Shipment`.
- `deliveryConfirmedByUserId` y `deliveredAt` en `ShipmentPackage`.
- `collectionNotes` en `ShipmentPackage`.
- `notes` en `ConfirmShipmentReceivedRequest`.

SHIP-E puede usar notas existentes como evidencia minima textual. Adjuntos, fotos, firma digital o guia escaneada quedan fuera de alcance.

## Riesgos detectados

1. El codigo actual permite registrar/cancelar pagos de envio despues de entrega/cierre; SHIP-E debe bloquearlo.
2. El codigo actual permite editar logistica en `OUT_FOR_DELIVERY`; SHIP-E debe bloquear campos principales despues de enviado.
3. El codigo actual permite despachar sin validar reparto/pago de envio; SHIP-E debe validar saldo de envio.
4. `confirmReceived` puede cerrar todos los paquetes pendientes no COD sin validar saldo de envio; SHIP-E debe bloquear si hay saldo.
5. La documentacion versionada no incluye SHIP-B/SHIP-C; solo SHIP-D. Conviene versionar documentos base o aceptar que SHIP-E parte del codigo + SHIP-D.
6. Algunos textos visibles usan lenguaje sin acentos o pueden aparecer con mojibake. No se corrige aqui para no mezclar alcance, pero conviene una fase hygiene posterior.
7. El permiso unico `MANAGE_SHIPMENTS` simplifica seguridad pero mezcla ver y operar. Se mantiene para SHIP-E por restriccion de alcance.
8. El estado `READY` del paquete es la garantia operativa de mercancia pagada; SHIP-E no debe recalcular pagos de mercancia desde Envio.

## Recomendacion de implementacion

`GO_IMPLEMENTAR` para SHIP-E si se acepta esta definicion:

- SHIP-E es cierre operativo/hardening de envios.
- SHIP-E no toca reportes.
- SHIP-E no crea migraciones.
- SHIP-E bloquea despacho/cierre con saldo de envio pendiente.
- SHIP-E bloquea ediciones principales despues de despacho.
- SHIP-E mantiene pagos de envio separados de mercancia.

Si negocio quiere permitir entrega con saldo de envio pendiente por autorizacion manual, falta un campo/regla de autorizacion. En ese caso la decision debe ser `GO_AJUSTAR_ALCANCE` antes de implementar.

## Decision

Decision actual: `GO_IMPLEMENTAR` con regla estricta de saldo de envio cubierto o absorbido antes de enviar/cerrar.

No es `NO_GO`: el modelo actual ya tiene estados, endpoints y datos suficientes para endurecer el cierre operativo.

No es `GO_CLIENTE`: esta fase solo define alcance; todavia no se implemento ni se hizo smoke SHIP-E.
