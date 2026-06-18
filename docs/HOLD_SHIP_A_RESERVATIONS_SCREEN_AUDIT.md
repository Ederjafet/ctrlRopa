# HOLD-SHIP-A / Auditoria de `/reservations`

Fecha: 2026-06-18

## 1. Resumen ejecutivo

HOLD-SHIP-A audita la pantalla existente `/reservations` como base del flujo operativo:

```text
Apartado -> caja -> paquete -> cobro/abono -> liberar envio -> marcar enviado
```

La fase es documental. No implementa funcionalidad, no crea migraciones, no modifica backend, no modifica frontend funcional, no toca pagos, LIVE, Android/EAS ni permisos reales.

Conclusion principal: `/reservations` debe evolucionar como centro operativo de HOLD-SHIP. Ya existen piezas reutilizables para reservas, cajas, pagos, paquetes de cliente y envios; no conviene crear un modulo paralelo. La implementacion futura debe cerrar brechas de permisos finos, estados, auditoria, idempotencia, costo de envio y control visual de siguiente accion.

Resultado: `GO_DOCUMENTAL` para iniciar HOLD-SHIP-B con diseno formal de modelo/reglas antes de tocar codigo.

## 2. Pantalla base confirmada

Pantalla base:

```text
/reservations
Apartados y reservas
```

Archivo principal:

```text
app/reservations.tsx
```

Detalle asociado:

```text
app/reservation-detail.tsx
```

La pantalla observada en QA muestra:

- Titulo operativo: `Apartados y reservas`.
- Contexto de compania/sucursal por `getSessionScopeLabel`.
- Tabs actuales: `Activas` y `Sin caja`.
- Busqueda: cliente, prenda, caja o canal.
- Cards con `Apartado #`, cliente, prenda, Live, caja y monto.
- Accion actual desde card: `Asignar caja` cuando no hay caja.
- Pull-to-refresh manual por `FlatList.onRefresh`.

## 3. Que muestra actualmente

`app/reservations.tsx` carga:

- Sesion actual.
- Reservas por sucursal:
  - `GET /api/reservations/branch/{branchId}`
  - `GET /api/reservations/branch/{branchId}/without-box`
- Cajas activas:
  - `GET /api/boxes/branch/{branchId}/active`
  - fallback a `GET /api/boxes/branch/{branchId}`
- Reservas filtradas en frontend por busqueda.

Campos actuales visibles en card:

- Folio tecnico de apartado: `id`.
- Canal/origen.
- Estado.
- Cliente.
- Prenda.
- Live si existe.
- Caja o `Sin caja`.
- Precio.
- Link al detalle.

Acciones actuales:

- Abrir detalle.
- Asignar caja.
- Reintentar si falla carga.
- Pull-to-refresh manual.

## 4. Flujo objetivo HOLD-SHIP

Flujo objetivo documentado:

1. Apartar prenda.
2. Etiquetar prenda.
3. Colocar prenda en caja o ubicacion fisica.
4. Controlar apartados activos y apartados sin caja desde `/reservations`.
5. Identificar cliente, prenda, caja, canal/origen y monto.
6. Crear paquete o bolsa para envio desde apartados existentes.
7. Seleccionar prendas apartadas de la caja.
8. Cobrar o abonar el paquete.
9. Considerar costo de envio.
10. Mantener paquete pendiente si no esta pagado completo.
11. Liberar para envio cuando este pagado completo.
12. Marcar como enviado.
13. Registrar fecha/hora de envio, usuario, paqueteria, guia y ETA si aplica.
14. Permitir modificar paquete antes de enviar: quitar prendas, agregar prendas y juntar paquetes.
15. Controlar tiempo maximo de apartado.

Fuera de alcance para esta fase:

- Confirmacion de recibido.
- Cierre final del paquete.
- Devoluciones.
- Reembolsos.
- Reclamaciones.
- Reportes avanzados.

## 5. Lineamientos LIVE aplicables

Se leyo `docs/HOLD_SHIP_LIVE_INHERITED_GUIDELINES.md`.

Criterios aplicables:

- No crear flujo paralelo si `/reservations` puede evolucionar.
- Mantener estilo operativo similar a LIVE.
- Botones con loading, disabled, exito/error, confirmacion y prevencion de doble clic.
- Validaciones por permiso y estado antes de mutar.
- Estados visibles en cards.
- Auditoria operativa para cambios de estado.
- Idempotencia para acciones criticas.
- No usar polling automatico en `/reservations`.
- No disparar llamadas N+1 de pagos desde listado.
- Mantener busqueda, filtro y posicion al ejecutar acciones.
- QA visual por roles.
- Textos en espanol.

## 6. Lo que ya existe y se puede reutilizar

Frontend reutilizable:

- `app/reservations.tsx`: lista operativa de apartados.
- `app/reservation-detail.tsx`: detalle de apartado, pagos y caja.
- `services/reservationService.ts`: contrato frontend de reservas.
- `services/boxService.ts`: cajas por sucursal.
- `services/paymentService.ts`: pagos por reserva.
- `services/customerPackageService.ts`: paquetes de cliente.
- `services/shipmentService.ts`: envios y asignacion de paquetes a envio.
- Componentes UI: `AppShell`, `AppCard`, `StatusBadge`, `AppBottomModal`, `AppButton`, `EmptyState`, `DetailTemplate`, `EntitySummaryCard`, `SectionHeader`.

Backend reutilizable:

- `ReservationController` y `ReservationService`.
- `BoxController` y `BoxService`.
- `PaymentController` y `PaymentService`.
- `CustomerPackageController` y `CustomerPackageService`.
- `ShipmentController` y `ShipmentService`.
- `TenantAccessGuard`.
- `AccessService`.
- `reservation_idempotency_keys` para reserva.
- `reservation_rejection_events` para rechazos de reserva.
- `live_events` para eventos LIVE.
- `system_movement_audit_log` como auditoria general.

Modelo existente reutilizable:

- `reservations`
- `boxes`
- `payment_allocations`
- `payments`
- `customer_packages`
- `customer_package_items`
- `shipments`
- `shipment_packages`

## 7. Lo que falta construir

Brechas principales:

- Modelo formal de apartado HOLD-SHIP con expiracion/tiempo maximo.
- Estados HOLD-SHIP propios o mapeo formal sobre estados existentes.
- Permisos finos por accion HOLD-SHIP.
- Auditoria operativa dedicada para eventos HOLD/PACKAGE/SHIPMENT.
- Idempotencia para crear paquete, agregar/quitar prenda, registrar abono, liberar envio y marcar enviado.
- UI de siguiente accion por apartado.
- Tabs operativos adicionales.
- Acciones de paquete directamente desde `/reservations`.
- Control de costo de envio y saldo de paquete.
- Validacion explicita de pago completo antes de liberar envio.
- Flujo para juntar paquetes conservando auditoria.
- Estado visual de por vencer/vencido.
- Agregado financiero de listado para evitar N+1.
- QA visual por roles.

## 8. Relacion con LIVE

Las reservas LIVE ya llegan a `reservations` con:

- `liveId`
- `liveStatus`
- `liveNotes`
- `liveOperationalStatus`
- `liveOperationalStatusUpdatedAt`
- `liveOperationalStatusUpdatedByUserId`
- `liveOperationalStatusReason`

`ReservationService` registra eventos LIVE para cambios operativos:

- `LIVE_RESERVATION_STATUS_CHANGED`
- `LIVE_OPERATIONAL_SOLD`
- `LIVE_RESERVATION_CANCELLED`

HOLD-SHIP debe reutilizar la trazabilidad de origen LIVE pero no debe depender de LIVE para operar paquetes/envios. Las reservas de puerta y LIVE deben converger en `/reservations`.

## 9. Relacion con reservas/apartados

Entidad actual:

```text
Reservation
```

Campos utiles:

- `item`
- `customer`
- `branch`
- `live`
- `salesChannel`
- `sellerUserId`
- `box`
- `price`
- `notes`
- `status`
- `createdAt`
- `cancelledAt`
- `cancelReason`
- `cancelledByUserId`

Estados backend actuales:

- `ACTIVE`
- `CANCELLED`
- `CONVERTED_TO_SALE`

El frontend tambien contempla `COMPLETED`, pero el enum backend actual no lo expone como estado de reserva.

Reglas actuales relevantes:

- Una reserva requiere item, cliente, sucursal, canal y precio.
- Crear reserva usa idempotencia con `X-Idempotency-Key`.
- Solo item `AVAILABLE` puede reservarse.
- Existe constraint para una reserva activa por item.
- Cancelar reserva bloquea si tiene pago activo.
- Cancelar reserva libera item reservado a disponible.
- Assign/remove box valida sucursal/tenant y permiso de administracion por canal.

## 10. Relacion con caja/ubicacion fisica

Modelo actual:

- `Box`
- `Reservation.box`
- Endpoints:
  - `GET /api/boxes/branch/{branchId}`
  - `GET /api/boxes/branch/{branchId}/active`
  - `GET /api/boxes/{id}`
  - `GET /api/boxes/{id}/detail`
  - `GET /api/boxes/{id}/content`

Pantalla actual:

- Lista cajas activas.
- Asigna reserva a caja con `PATCH /api/reservations/{reservationId}/box/{boxId}`.
- Quita caja desde detalle con `PATCH /api/reservations/{reservationId}/remove-box`.

Brecha:

- No hay permiso fino `ASSIGN_HOLD_BOX`.
- No hay evento operativo `HOLD_BOX_ASSIGNED`/`HOLD_BOX_CHANGED`.
- No hay vista de caja como cola de preparacion de paquete desde `/reservations`.

## 11. Relacion con pagos/abonos

Modelo actual:

- `payments`
- `payment_allocations`
- `PaymentService`
- `PaymentController`

Endpoints actuales:

- `POST /api/payments`
- `GET /api/payments/reservation/{reservationId}`
- `GET /api/payments/customer/{customerId}`
- `PATCH /api/payments/{paymentId}/void`
- `POST /api/payments/package-folio/{folio}`

Detalle de reserva:

- Carga pagos por reserva solo al abrir `app/reservation-detail.tsx`.
- Calcula pagado, restante y excedente.
- Lleva a `/payments?reservationId={id}` para cobrar apartado.

Paquetes:

- `CustomerPackageService` calcula `totalAmount`, `paidAmount`, `pendingAmount` y `paymentStatus` desde `payment_allocations`.
- `PaymentService` ya tiene create by package folio.

Brechas:

- No hay flujo unico de abono de paquete desde `/reservations`.
- No esta claro como incluir costo de envio en total de paquete.
- No hay permiso fino `REGISTER_PACKAGE_PAYMENT`.
- No hay idempotencia de pago/abono de paquete documentada para HOLD-SHIP.

## 12. Relacion futura con paquetes/envios

Ya existen:

- `customer_packages`
- `customer_package_items`
- `shipments`
- `shipment_packages`

Estados existentes de paquete:

- `OPEN`
- `READY`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

Estados existentes de envio:

- `OPEN`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `CLOSED_WITH_INCIDENTS`
- `CANCELLED`

Estados existentes de paquete dentro de envio:

- `PENDING`
- `DELIVERED`
- `NOT_DELIVERED`
- `RETURNED`
- `CANCELLED`

Reglas existentes utiles:

- Un paquete se crea por cliente y sucursal.
- Un paquete solo acepta items en `OPEN`.
- Una reserva no puede estar en dos paquetes porque `CustomerPackageService` valida `existsByReservationId`.
- Un paquete solo pasa a `READY` si tiene items.
- Un paquete `READY` puede agregarse a shipment.
- Un shipment `OPEN` puede despacharse.
- Al despachar, el paquete cambia a `SHIPPED`.

Brechas respecto a HOLD-SHIP:

- `READY` actual equivale parcialmente a listo para envio, pero falta separar pago completo, liberacion operativa y envio.
- `markReady` no valida pago completo en backend; la funcion frontend `canMarkCustomerPackageReady` si lo evalua por `pendingAmount <= 0`, pero el servicio backend solo valida que tenga items.
- No existe accion explicita `Liberar para envio` desde `/reservations`.
- No existe modelo/documento para costo de envio.
- No existe merge de paquetes con auditoria.
- No existe quitar item de paquete desde contrato actual visible.

## 13. Riesgos actuales

- Perdida de control operativo de prendas apartadas sin caja.
- Falta de alerta de apartados vencidos o por vencer.
- Permisos actuales demasiado amplios para la evolucion HOLD-SHIP.
- Backend de paquetes/envios no esta integrado visualmente desde `/reservations`.
- Cierre `READY` de paquete no valida pago completo en backend.
- No hay auditoria HOLD-SHIP dedicada.
- No hay idempotencia para acciones de paquete/envio.
- No hay endpoint agregado para saldo de listado.
- Posible confusion entre paquete, shipment y entrega final.

## 14. Riesgo de polling o refresco automatico

Hallazgo:

- `app/reservations.tsx` no usa `setInterval` ni `setTimeout`.
- Usa `useFocusEffect` para cargar al entrar o volver a enfocar.
- Usa `FlatList.onRefresh` para refresco manual.
- Cambiar tab ejecuta carga del filtro seleccionado.

Riesgo:

- Futuras fases no deben agregar polling automatico.
- El pull-to-refresh debe mantenerse como actualizacion manual.
- Los filtros/busqueda no deben borrarse tras una accion.

## 15. Riesgo de N+1 en pagos por reserva

Hallazgo:

- `app/reservations.tsx` no llama pagos por cada reserva de la lista.
- `app/reservation-detail.tsx` llama `GET /api/payments/reservation/{id}` solo para detalle.
- `app/payments.tsx` tiene un patron N+1 cuando una orden tiene varias reservas activas y se llama `getPaymentsByReservation` por cada linea.

Recomendacion:

- Mantener listado de `/reservations` sin llamadas por reserva.
- Si se necesita saldo en listado HOLD-SHIP, crear un endpoint agregado de resumen por branch/filtros.
- Tratar el N+1 de `app/payments.tsx` como fase tecnica separada si impacta HOLD-SHIP-G.

## 16. Reglas de negocio recomendadas

Reglas minimas:

1. Una prenda apartada debe tener cliente.
2. Una prenda apartada debe tener fecha/hora de apartado.
3. Una prenda apartada debe tener responsable.
4. Una prenda apartada debe tener ubicacion fisica o caja.
5. Una prenda vencida debe aparecer en alerta.
6. Una prenda sin caja debe aparecer en el tab `Sin caja`.
7. Una prenda no puede estar en dos paquetes activos.
8. Un paquete no puede enviarse si no esta pagado completo.
9. Un paquete enviado ya no puede modificarse.
10. Quitar una prenda del paquete debe regresar la prenda a apartado o disponible, segun decision operativa.
11. Juntar paquetes debe conservar auditoria de ambos paquetes originales.
12. Todo abono debe quedar registrado.
13. Todo cambio de estado debe dejar bitacora.
14. Liberar para envio debe validar pago completo.
15. Marcar como enviado debe registrar usuario, fecha/hora y datos de envio.
16. Los apartados deben buscarse por cliente, prenda, caja o canal.
17. La pantalla debe mostrar claramente que accion sigue.
18. La pantalla no debe actualizarse por polling.
19. Acciones criticas deben prevenir doble clic.
20. Acciones criticas deben pedir confirmacion cuando corresponda.

## 17. Estados sugeridos para prenda/apartado

Estados HOLD-SHIP sugeridos:

- `AVAILABLE`
- `HELD`
- `HELD_EXPIRED`
- `IN_PACKAGE`
- `READY_TO_SHIP`
- `SHIPPED`
- `SOLD`
- `CANCELLED`

Mapeo inicial recomendado:

- `Reservation.status=ACTIVE` + sin paquete -> `HELD`
- `Reservation.status=ACTIVE` + vencida -> `HELD_EXPIRED`
- `CustomerPackageItem.reservationId` activo -> `IN_PACKAGE`
- `CustomerPackage.status=READY` -> `READY_TO_SHIP`
- `CustomerPackage.status=SHIPPED` -> `SHIPPED`
- `Reservation.status=CANCELLED` -> `CANCELLED`
- `Reservation.status=CONVERTED_TO_SALE` -> `SOLD`

## 18. Estados sugeridos para paquete/envio

Estados HOLD-SHIP sugeridos:

- `DRAFT`
- `PENDING_PAYMENT`
- `PARTIALLY_PAID`
- `PAID`
- `READY_TO_SHIP`
- `SHIPPED`
- `CANCELLED`

Mapeo inicial recomendado:

- `CustomerPackage.status=OPEN` + sin items -> `DRAFT`
- `CustomerPackage.status=OPEN` + saldo total -> `PENDING_PAYMENT`
- `CustomerPackage.status=OPEN` + abono parcial -> `PARTIALLY_PAID`
- `CustomerPackage.status=OPEN` + pagado -> `PAID`
- `CustomerPackage.status=READY` -> `READY_TO_SHIP`
- `CustomerPackage.status=SHIPPED` -> `SHIPPED`
- `CustomerPackage.status=CANCELLED` -> `CANCELLED`

## 19. Propuesta visual para `/reservations`

Evolucion propuesta de tabs:

- `Activas`
- `Sin caja`
- `Por vencer`
- `Vencidas`
- `En paquete`
- `Listas para envio`
- `Enviadas`

Campos sugeridos por card:

- Folio de apartado.
- Cliente.
- Prenda.
- Canal/origen.
- Caja/ubicacion.
- Fecha de apartado.
- Tiempo restante.
- Responsable.
- Monto de prenda.
- Abonado.
- Saldo.
- Estado.
- Siguiente accion.

Comportamiento:

- Mantener estilo de panel operativo.
- Mantener card compacta pero accionable.
- Mostrar un badge claro por estado.
- Mantener busqueda/filtros al refrescar o ejecutar accion.
- No usar polling.

## 20. Propuesta de nuevas acciones

Acciones sugeridas:

- `Actualizar`
- `Asignar caja`
- `Cambiar caja`
- `Ver detalle`
- `Crear paquete`
- `Agregar a paquete`
- `Quitar de paquete`
- `Registrar abono`
- `Ver pagos`
- `Liberar para envio`
- `Marcar como enviado`
- `Cancelar apartado`

Cada accion debe tener:

- Permiso.
- Validacion de estado.
- Confirmacion si es critica.
- Loading.
- Prevencion de doble clic.
- Exito/error claro.
- Auditoria.
- Idempotencia cuando aplique.

## 21. Propuesta de entidades futuras

No crear entidades en HOLD-SHIP-A. Para fases futuras evaluar:

- `hold_operational_events` o tabla equivalente para bitacora HOLD-SHIP.
- `hold_state_snapshots` o campos derivados si se requiere historial por estado.
- `hold_expiration_policy` por sucursal/tenant si el tiempo de apartado es configurable.
- `package_merge_events` si se permite juntar paquetes.
- `package_shipping_costs` o campo formal de costo de envio si no encaja en pagos existentes.
- `package_idempotency_keys` o idempotencia general operacional.

Tambien puede evaluarse extender entidades existentes si evita duplicacion:

- `reservations`
- `customer_packages`
- `customer_package_items`
- `shipments`
- `shipment_packages`

## 22. Propuesta de endpoints futuros

Preferir endpoints agregados/read-model para `/reservations`:

- `GET /api/hold-ship/branch/{branchId}/summary`
- `GET /api/hold-ship/branch/{branchId}/reservations?tab=...&q=...`
- `POST /api/customer-packages/from-reservations`
- `POST /api/customer-packages/{id}/items/reservations`
- `DELETE /api/customer-packages/{id}/items/{itemId}`
- `POST /api/customer-packages/{id}/merge`
- `POST /api/customer-packages/{id}/payments`
- `PATCH /api/customer-packages/{id}/release-for-shipment`
- `PATCH /api/shipments/{id}/dispatch`

Si se reutilizan endpoints actuales, documentar claramente:

- `POST /api/customer-packages`
- `POST /api/customer-packages/{id}/items`
- `PATCH /api/customer-packages/{id}/ready`
- `POST /api/payments/package-folio/{folio}`
- `POST /api/shipments`
- `POST /api/shipments/{id}/packages`
- `PATCH /api/shipments/{id}/dispatch`

## 23. Propuesta de permisos futuros

Permisos sugeridos:

- `VIEW_RESERVATIONS`
- `MANAGE_HOLDS`
- `ASSIGN_HOLD_BOX`
- `CREATE_SHIPMENT_PACKAGE`
- `MODIFY_SHIPMENT_PACKAGE`
- `REGISTER_PACKAGE_PAYMENT`
- `RELEASE_PACKAGE_FOR_SHIPMENT`
- `MARK_PACKAGE_SHIPPED`
- `CANCEL_HOLD`
- `VIEW_HOLD_AUDIT`

Permisos existentes a reutilizar con cautela:

- `DO_DOOR_RESERVATION`
- `DO_LIVE_RESERVATION`
- `CANCEL_RESERVATION`
- `VIEW_PAYMENTS`
- `REGISTER_PAYMENTS`
- `CREATE_CLOSE_CUSTOMER_PACKAGE`
- `MANAGE_SHIPMENTS`

Recomendacion: no ampliar permisos existentes sin matriz. HOLD-SHIP-B/C deben definir matriz por rol antes de implementar.

## 24. Propuesta de auditoria operativa

Eventos sugeridos:

- `HOLD_CREATED`
- `HOLD_BOX_ASSIGNED`
- `HOLD_BOX_CHANGED`
- `HOLD_EXPIRED`
- `PACKAGE_CREATED`
- `PACKAGE_ITEM_ADDED`
- `PACKAGE_ITEM_REMOVED`
- `PACKAGES_MERGED`
- `PACKAGE_PAYMENT_REGISTERED`
- `PACKAGE_RELEASED_FOR_SHIPMENT`
- `PACKAGE_MARKED_SHIPPED`
- `PACKAGE_CANCELLED`

Datos minimos:

- Usuario.
- Compania.
- Sucursal.
- Cliente.
- Apartado.
- Paquete si aplica.
- Estado anterior.
- Estado nuevo.
- Fecha/hora.
- Motivo u observacion.
- Idempotency key si aplica.

## 25. Propuesta de idempotencia

Aplicar idempotencia a:

- Crear paquete.
- Agregar prenda a paquete.
- Quitar prenda de paquete.
- Registrar abono.
- Liberar para envio.
- Marcar enviado.
- Juntar paquetes.
- Cancelar paquete.

Reutilizar el criterio de `reservation_idempotency_keys`, pero no mezclar scopes. Usar scopes por operacion y tenant/branch/user.

## 26. Plan de fases HOLD-SHIP-B en adelante

Fases propuestas:

- HOLD-SHIP-B: Modelo formal de apartado.
- HOLD-SHIP-C: Control de tiempo de apartado.
- HOLD-SHIP-D: Evolucion UI de `/reservations`.
- HOLD-SHIP-E: Crear paquete desde apartados.
- HOLD-SHIP-F: Modificar paquete.
- HOLD-SHIP-G: Cobro / abono / costo de envio.
- HOLD-SHIP-H: Liberar para envio.
- HOLD-SHIP-I: Marcar como enviado.
- HOLD-SHIP-J: QA visual por roles.
- HOLD-SHIP-K: Reportes operativos minimos.

Detalle completo en `docs/HOLD_SHIP_BACKLOG.md`.

## 27. Validaciones QA sugeridas

QA tecnico:

- Confirmar que `/reservations` no usa polling.
- Confirmar que busqueda/filtro no se pierden.
- Confirmar que listados no hacen N+1 de pagos.
- Confirmar permisos por rol.
- Confirmar bloqueo backend por permiso.
- Confirmar idempotencia en acciones criticas.
- Confirmar auditoria por cambio de estado.

QA visual por roles:

- `qa.admin`
- `qa.supervisor`
- `qa.vendedor.centro`
- `qa.sinpermisos`
- `qa.logistica.centro` si aplica.

Casos visuales:

- Card con caja.
- Card sin caja.
- Apartado por vencer.
- Apartado vencido.
- En paquete.
- Listo para envio.
- Enviado.
- Sin permisos.
- Error controlado.

## 28. GO / NO-GO para iniciar implementacion

GO para HOLD-SHIP-B:

- Mantener `/reservations` como pantalla base.
- No crear modulo paralelo.
- Reutilizar `customer_packages` y `shipments` si encajan con reglas HOLD-SHIP.
- Definir primero modelo formal de estados, permisos y auditoria.
- Mantener regla sin polling.
- Evitar N+1 de pagos en listado.

NO-GO para implementar directamente acciones finales de envio si antes no se define:

- Estado formal de apartado/paquete.
- Permisos finos.
- Auditoria.
- Idempotencia.
- Costo de envio.
- Validacion backend de pago completo antes de liberar.
