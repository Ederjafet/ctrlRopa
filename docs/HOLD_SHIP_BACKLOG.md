# HOLD-SHIP / Backlog de fases

Fecha: 2026-06-18

## Criterios transversales

Todas las fases HOLD-SHIP deben respetar:

- `/reservations` como pantalla base.
- Sin polling automatico en `/reservations`.
- Sin N+1 de pagos en listados.
- Botones con loading, disabled, exito/error y prevencion de doble clic.
- Confirmacion en acciones criticas.
- Validacion backend de permisos y estados.
- Auditoria operativa.
- Idempotencia en mutaciones criticas.
- Textos en espanol.
- QA por roles.
- No mezclar apartado, caja, paquete, pago y envio en un unico concepto.

## HOLD-SHIP-B: Modelo formal de apartado

Objetivo:

- Definir el modelo tecnico y operativo de apartado que soportara HOLD-SHIP.

Alcance:

- Auditar si basta con `reservations` o si se requieren campos/tabla complementaria.
- Definir estados derivados de apartado.
- Definir reglas de transicion.
- Definir matriz de permisos inicial.

Si incluye:

- Diseno de estados `HELD`, `HELD_EXPIRED`, `IN_PACKAGE`, `READY_TO_SHIP`, `SHIPPED`.
- Mapeo con `Reservation.status`, `Item.status`, `CustomerPackage.status` y `Shipment.status`.
- Definicion de `Siguiente accion`.

No incluye:

- UI final.
- Creacion de paquete.
- Cobro.
- Envio.
- Migraciones sin aprobacion de diseno.

Pantalla o modulo involucrado:

- `/reservations`
- `ReservationService`
- `ReservationResponse`

Lineamientos LIVE aplicables:

- Estados visibles.
- Validacion por estado.
- Bloqueo por permisos.
- Auditoria antes de mutaciones.

Riesgos:

- Crear estados duplicados que compitan con reservas/items/paquetes.
- Romper LIVE si se cambia `Reservation.status` sin mapeo.

Criterios de aceptacion:

- Matriz de estados aprobada.
- Reglas de transicion documentadas.
- Decision clara entre extender `reservations` o usar read-model.
- Permisos futuros definidos sin crearlos aun si no corresponde.

Validaciones sugeridas:

- Revision documental.
- `npm run lint`
- `npx tsc --noEmit`
- `./mvnw.cmd test` solo si se toca backend.

Resultado esperado:

- `GO_MODELO_HOLD`

## HOLD-SHIP-C: Control de tiempo de apartado

Objetivo:

- Controlar tiempo maximo de apartado y alertas por vencer/vencido.

Alcance:

- Definir politica de expiracion por sucursal/tenant.
- Identificar fecha/hora de apartado.
- Proponer calculo de tiempo restante.
- Definir que ocurre al vencer.

Si incluye:

- Estado visual `Por vencer`.
- Estado visual `Vencidas`.
- Reglas para alerta sin polling.
- Recomendacion de job o calculo bajo demanda.

No incluye:

- Liberacion automatica destructiva.
- Cancelacion masiva.
- Borrado de apartados.
- Devoluciones o reembolsos.

Pantalla o modulo involucrado:

- `/reservations`
- `Reservation.createdAt`
- Configuracion operativa futura.

Lineamientos LIVE aplicables:

- Mensajes claros.
- Estados visibles.
- Sin refresco automatico que borre contexto.

Riesgos:

- Liberar prendas vencidas sin autorizacion operativa.
- Alertas inconsistentes si se calcula solo en frontend.

Criterios de aceptacion:

- Politica de vencimiento definida.
- Tab `Por vencer` y `Vencidas` especificados.
- Reglas de bloqueo para paquete/envio de vencidas documentadas.

Validaciones sugeridas:

- QA con fechas limite.
- Prueba de zona horaria.
- Prueba sin polling.

Resultado esperado:

- `GO_TIEMPO_APARTADO`

## HOLD-SHIP-D: Evolucion UI de `/reservations`

Objetivo:

- Evolucionar visualmente `/reservations` sin cambiar todavia reglas de dominio sensibles.

Alcance:

- Agregar tabs operativos.
- Mostrar `Siguiente accion`.
- Agregar boton manual `Actualizar`.
- Mantener busqueda/filtros.
- Mejorar cards con jerarquia LIVE.

Si incluye:

- Tabs: `Activas`, `Sin caja`, `Por vencer`, `Vencidas`, `En paquete`, `Listas para envio`, `Enviadas`.
- Campos: cliente, prenda, caja, fecha, responsable, monto, abonado, saldo, estado.
- Empty states y mensajes claros.

No incluye:

- Crear paquete real.
- Cobrar.
- Liberar envio.
- Marcar enviado.
- Nuevos endpoints mutantes.

Pantalla o modulo involucrado:

- `app/reservations.tsx`
- `app/reservation-detail.tsx`

Lineamientos LIVE aplicables:

- Cards legibles.
- Estados visibles.
- Acciones primarias/secundarias.
- Sin polling.

Riesgos:

- Sobrecargar la card.
- Romper busqueda/filtros actuales.
- Introducir N+1 de pagos.

Criterios de aceptacion:

- No hay `setInterval` ni polling.
- Los filtros no se pierden.
- Se mantiene base visual de panel operativo.
- Acciones no implementadas no prometen funcionalidad falsa.

Validaciones sugeridas:

- `npm run lint`
- `npx tsc --noEmit`
- Expo export si aplica.
- QA visual por admin/supervisor/vendedor/sin permisos.

Resultado esperado:

- `GO_UI_HOLD_SHIP_BASE`

## HOLD-SHIP-E: Crear paquete desde apartados

Objetivo:

- Crear paquete desde uno o varios apartados existentes, reutilizando `customer_packages`.

Alcance:

- Crear paquete para un cliente.
- Agregar reservas activas del mismo cliente/sucursal.
- Bloquear reserva ya incluida en otro paquete activo.
- Registrar auditoria.
- Usar idempotencia.

Si incluye:

- Accion `Crear paquete`.
- Accion `Agregar a paquete`.
- Validacion de cliente, caja, sucursal y estado.
- Reutilizacion de `POST /api/customer-packages` y `POST /api/customer-packages/{id}/items` si el contrato queda seguro.

No incluye:

- Cobro completo.
- Liberar envio.
- Marcar enviado.
- Juntar paquetes.

Pantalla o modulo involucrado:

- `/reservations`
- `CustomerPackageService`
- `CustomerPackageItem`

Lineamientos LIVE aplicables:

- Idempotencia.
- Confirmacion si agrega multiples prendas.
- Loading y bloqueo de doble clic.
- Auditoria `PACKAGE_CREATED` y `PACKAGE_ITEM_ADDED`.

Riesgos:

- Paquetes con prendas de distintos clientes.
- Doble inclusion de reserva.
- Paquetes creados sin caja fisica.

Criterios de aceptacion:

- No se puede crear paquete sin cliente.
- No se puede agregar reserva de otro cliente/sucursal.
- No se puede agregar reserva ya empaquetada.
- Paquete creado aparece en detalle/listado.

Validaciones sugeridas:

- Tests backend de reglas.
- QA API con dataset desechable.
- QA visual de creacion desde `/reservations`.

Resultado esperado:

- `GO_PACKAGE_CREATE`

## HOLD-SHIP-F: Modificar paquete

Objetivo:

- Permitir modificar paquete antes de liberarlo/enviarlo.

Alcance:

- Quitar prenda.
- Agregar prenda.
- Juntar paquetes.
- Recalcular saldo.
- Registrar auditoria.

Si incluye:

- Acciones `Quitar de paquete`, `Agregar a paquete`, `Juntar paquetes`.
- Confirmaciones criticas.
- Reglas de estado para paquete no enviado.
- Idempotencia.

No incluye:

- Modificar paquete enviado.
- Devoluciones.
- Reembolsos.
- Reclamaciones.

Pantalla o modulo involucrado:

- `/reservations`
- Detalle de paquete si se justifica.
- `CustomerPackageService`

Lineamientos LIVE aplicables:

- Confirmacion critica.
- Auditoria.
- Bloqueo por estado invalido.
- Mantener contexto visual.

Riesgos:

- Que quitar prenda deje saldo/pago inconsistente.
- Que juntar paquetes pierda trazabilidad.
- Que se permita editar paquete `SHIPPED`.

Criterios de aceptacion:

- Paquete enviado no se modifica.
- Quitar prenda tiene decision operativa clara: vuelve a apartado o disponible.
- Juntar paquetes conserva auditoria de ambos.
- Saldos se recalculan sin tocar caja.

Validaciones sugeridas:

- Tests backend.
- QA API mutante con dataset desechable.
- QA visual por roles.

Resultado esperado:

- `GO_PACKAGE_MODIFY`

## HOLD-SHIP-G: Cobro / abono / costo de envio

Objetivo:

- Registrar pagos/abonos de paquete y contemplar costo de envio sin crear flujo financiero nuevo.

Alcance:

- Reutilizar pagos existentes.
- Definir si costo de envio es item financiero, cargo de paquete o campo adicional.
- Registrar abonos.
- Mostrar total, abonado y saldo.

Si incluye:

- Accion `Registrar abono`.
- Accion `Ver pagos`.
- Validacion de pago contra paquete activo.
- Auditoria `PACKAGE_PAYMENT_REGISTERED`.
- Idempotencia de pago.

No incluye:

- Caja nueva.
- Reembolsos.
- Devoluciones.
- Cierre financiero avanzado.

Pantalla o modulo involucrado:

- `/reservations`
- `/payments`
- `PaymentService`
- `CustomerPackageService`

Lineamientos LIVE aplicables:

- No inventar pago si no hay contrato.
- Botones con loading.
- Error claro.
- Evitar N+1.

Riesgos:

- Duplicar pagos por doble clic.
- Mezclar costo de envio con precio de prenda.
- Cambiar ventas historicas.

Criterios de aceptacion:

- Todo abono queda registrado.
- No se crea caja nueva.
- Saldo de paquete es consistente.
- Costo de envio queda trazable.

Validaciones sugeridas:

- Tests backend de pago/idempotencia.
- QA API de abono parcial y total.
- Verificacion de no tocar ventas/caja.

Resultado esperado:

- `GO_PACKAGE_PAYMENT`

## HOLD-SHIP-H: Liberar para envio

Objetivo:

- Liberar paquete para envio solo cuando cumple reglas operativas y de pago.

Alcance:

- Validar pago completo.
- Validar paquete con items.
- Validar datos minimos de envio si aplican.
- Cambiar estado a listo para envio.
- Registrar auditoria.

Si incluye:

- Accion `Liberar para envio`.
- Estado `READY_TO_SHIP`.
- Validacion backend de saldo cero.
- Confirmacion.

No incluye:

- Marcar enviado.
- Entrega final.
- Reembolso/devolucion.

Pantalla o modulo involucrado:

- `/reservations`
- `CustomerPackageService`
- `ShipmentService` si el contrato requiere crear shipment.

Lineamientos LIVE aplicables:

- Bloqueo por estado invalido.
- Confirmacion critica.
- Auditoria.
- Idempotencia.

Riesgos:

- Marcar listo sin pago completo.
- Duplicar liberacion.
- Confundir `READY` actual con pagado si backend no valida.

Criterios de aceptacion:

- Paquete con saldo no se libera.
- Paquete vacio no se libera.
- Paquete liberado muestra siguiente accion `Marcar como enviado`.
- Evento de auditoria registrado.

Validaciones sugeridas:

- Tests backend con saldo pendiente y saldo cero.
- QA API.
- QA visual por roles.

Resultado esperado:

- `GO_RELEASE_FOR_SHIPMENT`

## HOLD-SHIP-I: Marcar como enviado

Objetivo:

- Registrar envio/despacho de paquete liberado.

Alcance:

- Marcar paquete/envio como enviado.
- Registrar usuario, fecha/hora, paqueteria, guia y ETA si aplica.
- Bloquear modificaciones posteriores.
- Registrar auditoria.

Si incluye:

- Accion `Marcar como enviado`.
- Datos de envio minimos.
- Confirmacion critica.
- Integracion con `shipments` si aplica.

No incluye:

- Confirmacion de recibido.
- Cierre final.
- Devoluciones.
- Reclamaciones.

Pantalla o modulo involucrado:

- `/reservations`
- `ShipmentService`
- `CustomerPackageService`

Lineamientos LIVE aplicables:

- Confirmacion con consecuencia.
- Bloqueo por estado.
- Auditoria.
- Idempotencia.

Riesgos:

- Enviar sin guia cuando es paqueteria.
- Enviar paquete no liberado.
- Permitir edicion posterior.

Criterios de aceptacion:

- Solo paquete listo puede enviarse.
- Se registra fecha/hora y usuario.
- Paqueteria/guia son obligatorias cuando apliquen.
- Paquete enviado ya no se modifica.

Validaciones sugeridas:

- Tests backend.
- QA API mutante.
- QA visual en Android/web.

Resultado esperado:

- `GO_MARK_SHIPPED`

## HOLD-SHIP-J: QA visual por roles

Objetivo:

- Validar visualmente y por permisos el flujo HOLD-SHIP en `/reservations`.

Alcance:

- Admin.
- Supervisor.
- Vendedor.
- Sin permisos.
- Logistica si aplica.

Si incluye:

- Evidencia visual.
- Ver acciones visibles/bloqueadas.
- Validar filtros persistentes.
- Validar sin polling.
- Validar confirmaciones.

No incluye:

- Implementar fixes grandes.
- Cambiar RBAC.
- Crear datos productivos.

Pantalla o modulo involucrado:

- `/reservations`
- Detalle de apartado.
- Detalle de paquete/envio si se justifica.

Lineamientos LIVE aplicables:

- QA visual por roles.
- Mensajes claros.
- Sin mezcla de idiomas.
- Layout estable.

Riesgos:

- Roles con acciones de mas.
- Usuario sin permisos ve acciones.
- Layout mobile/tablet roto.

Criterios de aceptacion:

- Cada rol ve solo lo permitido.
- Sin permisos queda bloqueado.
- No hay polling automatico.
- Screenshots/evidencia registrada.

Validaciones sugeridas:

- Smoke web.
- Smoke APK si aplica.
- Network 60 segundos en `/reservations`.
- API de permisos por rol.

Resultado esperado:

- `QA_VISUAL_HOLD_SHIP_OK` o pendientes documentados.

## HOLD-SHIP-K: Reportes operativos minimos

Objetivo:

- Crear reportes minimos de control operativo HOLD-SHIP.

Alcance:

- Apartados por vencer.
- Apartados vencidos.
- Sin caja.
- En paquete pendiente de pago.
- Listos para envio.
- Enviados por fecha.

Si incluye:

- Reporte operativo basico.
- Filtros por fecha/sucursal/estado.
- Export si el patron existe.

No incluye:

- Analitica avanzada.
- Rentabilidad.
- Reclamaciones.
- Devoluciones.
- Reembolsos.

Pantalla o modulo involucrado:

- `/reports` o reporte dedicado si se justifica.
- `/reservations` como fuente operacional.

Lineamientos LIVE aplicables:

- Datos reales.
- Estados claros.
- No saturar pantalla operativa.

Riesgos:

- Reporte lento si consulta pagos por reserva.
- Inconsistencia si no hay estado formal.
- Duplicar reportes existentes.

Criterios de aceptacion:

- Reporte sin N+1.
- Filtros claros.
- Datos coinciden con `/reservations`.
- Roles sin permiso no acceden.

Validaciones sugeridas:

- Tests de consultas agregadas.
- QA con dataset desechable.
- Comparacion contra registros de detalle.

Resultado esperado:

- `GO_MINIMAL_HOLD_REPORTS`
