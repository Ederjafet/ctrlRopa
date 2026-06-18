# HOLD-SHIP / Lineamientos heredados de LIVE

Fecha: 2026-06-18

## Proposito

La evolucion de `/reservations` para HOLD-SHIP debe sentirse como una extension natural del flujo LIVE. Este documento fija criterios de UX, seguridad, permisos, auditoria y QA antes de implementar apartados, paquetes, pagos de paquete, liberacion para envio o envio.

Estado: lineamiento documental. No implementa funcionalidad.

## Alcance

Estos lineamientos aplican a la futura evolucion de la pantalla:

- `/reservations`
- Apartados y reservas
- Caja o ubicacion fisica
- Paquetes
- Abonos o pagos asociados al paquete
- Liberacion para envio
- Marcado como enviado

No se debe crear un flujo paralelo mientras `/reservations` pueda evolucionar como centro operativo.

## Principios heredados de LIVE

La pantalla debe mantener el estilo operativo trabajado en LIVE:

- Encabezado tipo panel operativo.
- Cards limpias y legibles.
- Estados visibles.
- Botones con jerarquia clara.
- Acciones principales destacadas.
- Acciones secundarias menos prominentes.
- Uso consistente de bordes, espacios, tipografia y colores.
- Lenguaje visual coherente para estados, alertas y acciones.
- Diseno pensado para operacion rapida, no solo consulta.

Debe conservarse el concepto visual:

```text
PANEL OPERATIVO
Apartados y reservas
Compania / Sucursal
```

## Botones y acciones

Cada boton debe seguir los criterios seguros ya usados en LIVE:

- Estado normal.
- Estado deshabilitado.
- Estado loading o procesando.
- Mensaje de exito.
- Mensaje de error accionable.
- Validacion previa antes de ejecutar.
- Bloqueo por permisos.
- Bloqueo por estado invalido.
- Prevencion de doble clic.
- Confirmacion para acciones criticas.

Acciones esperadas en fases futuras:

- Asignar caja.
- Crear paquete.
- Agregar a paquete.
- Quitar de paquete.
- Registrar abono.
- Liberar para envio.
- Marcar como enviado.
- Cancelar apartado.

Cada accion debe validar permiso, estado operativo, loading, idempotencia cuando aplique, resultado claro y auditoria operativa.

## Validaciones por estado

Las acciones de HOLD-SHIP deben validar estado antes de avanzar:

- No crear paquete si el apartado no tiene cliente.
- No crear paquete si la prenda no tiene caja o ubicacion.
- No agregar una prenda si ya esta en otro paquete activo.
- No registrar abono sobre paquete cancelado.
- No liberar para envio si el paquete no esta pagado completo.
- No marcar como enviado si no esta liberado.
- No modificar paquete enviado.
- No quitar prendas de un paquete ya enviado.
- No enviar sin fecha/hora de envio.
- No enviar sin usuario responsable.
- No enviar sin datos minimos de envio cuando apliquen.

## Sin polling automatico en `/reservations`

`/reservations` no debe actualizarse automaticamente cada cierto tiempo.

No debe haber:

- `setInterval` global.
- Refresco periodico de apartados.
- Llamadas repetidas a pagos por cada apartado.
- Llamadas automaticas constantes mientras el usuario lee.
- Re-render visual que borre busqueda, filtros o posicion.

La pantalla solo debe actualizarse cuando:

- El usuario entra a la pantalla.
- El usuario presiona un boton manual `Actualizar`.
- El usuario ejecuta una accion.
- El usuario cambia filtros o busqueda.
- El usuario vuelve a la pantalla desde otra ruta y se justifica recargar.

El boton `Actualizar` debe mostrar loading y conservar filtros activos.

## Evitar N+1 de pagos

Debe evitarse un patron de listado que haga una llamada por apartado:

```text
GET /api/payments/reservation/{id}
```

Criterios:

- Para listado, usar datos resumidos del endpoint principal cuando existan.
- Consultar detalle de pagos solo al abrir detalle de apartado o paquete.
- Si se requiere saldo en listado, proponer endpoint agregado para resumen financiero en una sola llamada.
- Si el N+1 ya existe, documentarlo como riesgo tecnico y corregirlo en una fase focalizada.

## Separacion de conceptos

No mezclar en una sola entidad o estado:

- Apartado.
- Caja o ubicacion fisica.
- Paquete.
- Pago o abono.
- Liberacion para envio.
- Envio.

La UI puede mostrar el flujo como una operacion continua, pero backend, permisos, estados y auditoria deben conservar reglas independientes.

## Siguiente accion

Cada card de apartado debe exponer claramente la siguiente accion operativa:

```text
Siguiente accion
```

Valores esperados:

- Asignar caja.
- Crear paquete.
- Registrar abono.
- Esperar pago completo.
- Liberar para envio.
- Marcar como enviado.
- Sin accion pendiente.

## Estados visibles

Los estados deben tener etiqueta visible, descripcion funcional, acciones permitidas, acciones bloqueadas y mensaje claro.

Estados sugeridos para apartado/prenda:

- `AVAILABLE`
- `HELD`
- `HELD_EXPIRED`
- `IN_PACKAGE`
- `READY_TO_SHIP`
- `SHIPPED`
- `SOLD`
- `CANCELLED`

Estados sugeridos para paquete/envio:

- `DRAFT`
- `PENDING_PAYMENT`
- `PARTIALLY_PAID`
- `PAID`
- `READY_TO_SHIP`
- `SHIPPED`
- `CANCELLED`

## Permisos por accion

Cada accion debe tener permiso propio. Ver `/reservations` no debe implicar operar todo el flujo.

Permisos futuros sugeridos:

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

Reglas:

- Si el usuario no tiene permiso, ocultar o deshabilitar la accion.
- Backend debe validar el permiso.
- Frontend debe mostrar mensaje claro.
- Acceso denegado debe poder auditarse si aplica.

## Auditoria operativa

Reutilizar el criterio de bitacora operativa de LIVE.

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

Cada evento debe registrar usuario, compania, sucursal, cliente, apartado, paquete si aplica, estado anterior, estado nuevo, fecha/hora y motivo u observacion.

## Idempotencia

Aplicar idempotencia a acciones criticas:

- Crear paquete.
- Agregar prenda a paquete.
- Registrar abono.
- Liberar para envio.
- Marcar como enviado.
- Juntar paquetes.
- Cancelar paquete.

Objetivo: evitar duplicados por doble clic, mala conexion o reintento.

## Confirmaciones criticas

Las acciones criticas deben pedir confirmacion y explicar consecuencia.

Ejemplos:

- Quitar prenda del paquete.
- Juntar paquetes.
- Cancelar apartado.
- Cancelar paquete.
- Liberar para envio.
- Marcar como enviado.

Ejemplo de copy:

```text
Marcar este paquete como enviado?
Se registrara la fecha/hora de envio y ya no se podra modificar el paquete.
```

## Mantener contexto del usuario

La pantalla no debe borrar contexto luego de una accion:

- Busqueda actual.
- Tab seleccionado.
- Filtro aplicado.
- Scroll aproximado.
- Estado visual de carga.

## Idioma

Mantener textos en espanol y evitar mezcla innecesaria con ingles.

Terminos recomendados:

- Apartado.
- Caja.
- Cliente.
- Prenda.
- Monto.
- Abonado.
- Saldo.
- Siguiente accion.
- Liberar para envio.
- Marcar como enviado.

## QA visual por roles

Validar por roles QA:

- `qa.admin`
- `qa.supervisor`
- `qa.vendedor.centro`
- `qa.sinpermisos`

Validar:

- Que ve cada rol.
- Que acciones aparecen.
- Que acciones quedan bloqueadas.
- Mensaje sin permiso.
- Layout estable.
- Sin polling automatico.
- Filtros persistentes.
- Confirmaciones en acciones criticas.

## Criterio de implementacion futura

HOLD-SHIP debe evolucionar `/reservations`. Solo proponer pantallas nuevas si estan justificadas, por ejemplo:

- Detalle de paquete.
- Historial de pagos.
- Vista de envios listos.

El punto de partida debe seguir siendo `/reservations`.

## GO / NO-GO

GO_DOCUMENTAL para usar estos lineamientos como base de diseno tecnico de HOLD-SHIP.

NO_GO para implementar HOLD-SHIP si no hay definicion previa de estados, permisos, auditoria e idempotencia para la accion objetivo.
