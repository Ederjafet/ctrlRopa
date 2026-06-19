# HOLD-SHIP-FAST-2 - UI compacta responsive para apartados

Fecha: 2026-06-18

## 1. Resumen ejecutivo

HOLD-SHIP-FAST-2 compacta la pantalla existente `/reservations` sin crear modulo paralelo. La fase corrige el problema visual detectado despues de HOLD-SHIP-FAST-1: cada apartado ocupaba demasiado alto y exponia demasiadas acciones al mismo tiempo.

La pantalla conserva el tablero operativo HOLD-SHIP, pero ahora cada registro muestra una lectura rapida, una sola accion primaria visible y un acceso a `Mas acciones` para el resto del flujo.

Resultado: GO_TECNICO_FRONTEND para continuar con la siguiente fase HOLD-SHIP, sujeto a smoke visual manual.

## 2. Problema visual corregido

FAST-1 dejo avance funcional visible, pero las cards eran largas y repetitivas. En listas con varios apartados, la operacion diaria obligaba a hacer mucho scroll y mezclaba acciones listas con acciones futuras deshabilitadas.

FAST-2 reduce densidad visual y separa decisiones:

- lectura rapida del apartado;
- siguiente accion visible;
- accion primaria inmediata;
- acciones secundarias dentro de modal.

## 3. Cambios en desktop

En desktop la card pasa a un formato tipo fila operativa:

- folio y cliente arriba;
- badges compactos de estado;
- prenda, canal, caja, monto y siguiente accion en una linea compacta;
- una accion primaria visible;
- boton `Mas acciones` para el resto.

La fila evita botones repetidos por todo el ancho y deja cada registro en maximo dos lineas principales.

## 4. Cambios en mobile

En mobile la card queda colapsada por defecto:

- folio;
- cliente;
- estado;
- caja;
- monto;
- siguiente accion;
- accion primaria;
- `Mas acciones`;
- boton `Detalle` para expandir informacion adicional.

Al expandir se muestran datos secundarios:

- responsable;
- fecha;
- Live / canal;
- nota de pagos en detalle para evitar llamadas N+1.

## 5. Acciones visibles

La accion primaria se calcula con datos existentes:

- sin caja: `Asignar caja`;
- con caja: `Crear paquete`.

Estas acciones ya estaban disponibles desde FAST-1 y mantienen:

- loading;
- disabled cuando no aplica;
- validacion previa;
- mensajes claros;
- prevencion de doble accion mediante `workingReservationId`.

## 6. Acciones movidas a Mas acciones

El modal `Mas acciones` conserva el acceso a:

- Ver detalle;
- Asignar caja / Cambiar caja;
- Crear paquete;
- Agregar a paquete;
- Ver pagos;
- Registrar abono;
- Liberar envio;
- Marcar enviado;
- Cancelar apartado.

Las acciones que aun no tienen contrato completo siguen deshabilitadas con motivo claro. No se agregaron botones falsos ni llamadas silenciosas.

## 7. Backend tocado

No se toco backend.

No se crearon endpoints, migraciones, permisos ni cambios de base de datos. La pantalla sigue usando los servicios existentes:

- `getReservationsByBranch`;
- `getActiveBoxesByBranch`;
- `assignReservationToBox`;
- `prepareCustomerPackageFromReservation`.

## 8. Sin polling y sin N+1

No se agrego `setInterval`, `setTimeout`, polling ni refetch periodico.

La pantalla sigue recargando solo:

- al entrar o volver a foco;
- al usar `Actualizar`;
- despues de ejecutar una accion;
- al cambiar filtros o busqueda local.

Los pagos no se consultan por cada card del listado. Abonos y saldos quedan en detalle hasta tener un read-model agregado seguro.

## 9. Validaciones ejecutadas

Validaciones obligatorias:

- `npm run lint`;
- `npx tsc --noEmit`;
- `git --no-pager diff --check`.

No se ejecuto test backend porque no se modifico backend.

## 10. Smoke QA recomendado

Con backend y frontend levantados:

1. Abrir `/reservations`.
2. Confirmar que la pantalla ya no se ve igual que FAST-1.
3. Confirmar encabezado operativo compacto.
4. Confirmar KPIs como chips.
5. Confirmar tabs compactos.
6. Confirmar que cada card muestra una accion primaria y `Mas acciones`.
7. En desktop, confirmar formato de fila compacta.
8. En mobile, confirmar card colapsada y expansion con `Detalle`.
9. Confirmar que `Actualizar` no borra busqueda ni tab.
10. Confirmar que no existe polling automatico.
11. Confirmar que acciones no soportadas estan deshabilitadas con mensaje.
12. Confirmar que `Crear paquete` mantiene confirmacion y loading.
13. Confirmar que login/logout no se rompe.

## 11. Riesgos

- El listado aun no tiene saldo abonado agregado; mostrarlo en cards podria reintroducir N+1 si se consulta por reserva.
- Tabs futuros como `En paquete`, `Listas para envio` y `Enviadas` siguen preparados/deshabilitados hasta tener read-model o endpoints seguros.
- `Cambiar caja` sigue enviando a detalle cuando el apartado ya tiene caja; una fase posterior debe definir cambio directo con confirmacion y auditoria.
- Smoke visual manual sigue siendo necesario para revisar densidad real en celular/tablet.

## 12. Fase siguiente recomendada

HOLD-SHIP-FAST-3 deberia enfocarse en read-model agregado para `/reservations`:

- saldo abonado;
- saldo pendiente;
- paquete activo asociado;
- estado de envio;
- siguiente accion derivada de paquete/pago;
- conteos reales para tabs futuros;
- sin polling y sin N+1.

## 13. GO / NO-GO

GO_TECNICO_FRONTEND.

La pantalla de apartados ya muestra avance compacto y operativo sin tocar backend, LIVE, Android/EAS, login, auth, pagos financieros, migraciones ni permisos.
