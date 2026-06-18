# HOLD-SHIP-FAST-1 / UI operativa de apartados

Fecha: 2026-06-18

## 1. Resumen ejecutivo

HOLD-SHIP-FAST-1 evoluciona la pantalla existente `/reservations` para que ya se vea y opere como tablero inicial de HOLD-SHIP:

```text
Apartado -> caja -> paquete -> cobro/abono -> liberar envio -> marcar enviado
```

No se creo una pantalla paralela. La base sigue siendo `app/reservations.tsx`.

Resultado tecnico: `GO_TECNICO_UI_OPERATIVA` con backend minimo transaccional para crear paquete desde apartado sin migracion.

## 2. Que cambio visualmente

La pantalla ahora muestra:

- Encabezado operativo con `PANEL OPERATIVO`.
- Titulo `Apartados y reservas`.
- Subtitulo `Control de apartados, caja, paquete, cobro y envio`.
- Compania/sucursal desde la sesion activa.
- Boton manual `Actualizar`.
- KPIs superiores:
  - Apartados activos.
  - Sin caja.
  - Con caja.
  - Siguiente accion.
- Tabs operativos:
  - `Activas`.
  - `Sin caja`.
  - `Con caja`.
  - `En paquete` preparado y bloqueado.
  - `Listas para envio` preparado y bloqueado.
  - `Enviadas` preparado y bloqueado.
- Cards de apartado con estado visible, cliente, prenda, LIVE/canal, caja/ubicacion, monto, fecha y siguiente accion.

## 3. Acciones funcionales

Acciones funcionales desde `/reservations`:

- `Actualizar`: recarga manual, conserva busqueda y tab seleccionado, no usa polling.
- `Ver detalle`: abre `/reservation-detail`.
- `Asignar caja`: abre modal de cajas activas si el apartado no tiene caja.
- `Cambiar caja`: lleva al detalle del apartado, donde ya existe el flujo seguro de caja.
- `Crear paquete`: crea un paquete abierto desde un apartado activo con caja, cliente y prenda.
- `Ver pagos`: abre el detalle, donde se consultan pagos solo para ese apartado.
- `Registrar abono`: navega a `/payments` con `reservationId`.
- `Cancelar apartado`: lleva al detalle para validar pagos antes de cancelar.

## 4. Acciones preparadas o deshabilitadas

Quedaron visibles pero bloqueadas con motivo claro:

- `Agregar a paquete`: requiere selector de paquete abierto existente sin mezclar clientes/sucursales.
- `Liberar envio`: requiere resumen de paquete pagado y validacion backend de saldo completo.
- `Marcar enviado`: requiere paquete liberado y datos de envio.
- Tabs `En paquete`, `Listas para envio` y `Enviadas`: requieren read-model o resumen agregado por apartado/paquete.

## 5. Endpoints reutilizados

Frontend existente reutilizado:

- `GET /api/reservations/branch/{branchId}`
- `GET /api/boxes/branch/{branchId}/active`
- `PATCH /api/reservations/{reservationId}/box/{boxId}`

Nuevo endpoint minimo:

- `POST /api/customer-packages/from-reservation/{reservationId}`

Este endpoint reutiliza `CustomerPackageService`, `ReservationRepository`, `CustomerPackageRepository` y `CustomerPackageItemRepository`.

## 6. Backend tocado

Se agrego backend minimo porque crear paquete con dos llamadas frontend podia dejar un paquete vacio si fallaba agregar la prenda.

Cambios:

- DTO `PrepareCustomerPackageFromReservationRequest`.
- Metodo transaccional `CustomerPackageService.prepareFromReservation`.
- Ruta `POST /api/customer-packages/from-reservation/{reservationId}`.
- Tests unitarios `CustomerPackageServiceTests`.

No se crearon migraciones, tablas ni permisos nuevos.

## 7. Reglas y validaciones aplicadas

Crear paquete desde apartado valida:

- El apartado existe.
- El apartado pertenece al tenant/sucursal activa.
- El apartado esta `ACTIVE`.
- El apartado tiene caja o ubicacion fisica.
- La reserva no esta ya en otro paquete.
- La prenda coincide con la reserva.
- El paquete queda `OPEN`.

La operacion corre dentro de transaccion backend, por lo que si falla agregar la prenda no queda paquete vacio confirmado.

## 8. Sin polling y sin N+1

`/reservations` no agrega `setInterval`, `setTimeout` ni polling.

La pantalla carga una lista base por sucursal y filtra localmente para tabs `Activas`, `Sin caja` y `Con caja`.

No llama `GET /api/payments/reservation/{id}` por cada card. Pagos, abonado y saldo se consultan en detalle o en `/payments` para evitar N+1.

## 9. Que no se implemento todavia

Pendiente para fases siguientes:

- Read-model agregado de apartado + paquete + saldo + envio.
- Selector de paquete abierto para `Agregar a paquete`.
- Validacion backend de pago completo antes de liberar envio.
- Accion real `Liberar envio`.
- Accion real `Marcar enviado`.
- Estados `En paquete`, `Listas para envio` y `Enviadas` desde datos agregados.
- Permisos HOLD-SHIP finos.
- Auditoria HOLD-SHIP dedicada.
- Idempotencia formal por accion critica.

## 10. Riesgos

- El listado aun no sabe si una reserva ya esta en paquete; el backend bloquea duplicados, pero la UI necesita un resumen agregado para deshabilitar antes.
- `Registrar abono` trabaja sobre reserva; el abono de paquete queda para HOLD-SHIP-G.
- Liberacion/envio no debe habilitarse hasta tener validacion backend de saldo completo.

## 11. Validaciones ejecutadas

Validaciones ejecutadas:

- `npm run lint`: PASS con advertencias heredadas del proyecto.
- `npx tsc --noEmit`: PASS.
- `git --no-pager diff --check`: PASS.
- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: PASS, 3 tests.
- `./mvnw.cmd test`: PASS cargando `.env` en variables de proceso sin imprimir secretos.

Nota: el primer intento de `./mvnw.cmd test` sin cargar `.env` fallo por conexion local sin credenciales. El segundo intento cargo `.env`, limpio comillas de la URL JDBC y paso. Durante el contexto Spring aparecio una advertencia local de acceso al archivo de log `C:/HPSQ-SOFT/...`, sin fallar el build.

## 12. Smoke QA recomendado

Con backend y frontend levantados:

1. Abrir `/reservations`.
2. Confirmar encabezado operativo.
3. Confirmar KPIs.
4. Cambiar entre `Activas`, `Sin caja` y `Con caja`.
5. Escribir busqueda y presionar `Actualizar`; confirmar que no se pierde busqueda ni tab.
6. Confirmar que no hay polling automatico.
7. En apartado sin caja, asignar caja.
8. En apartado con caja, crear paquete.
9. Confirmar que se abre opcion de ver paquete creado.
10. Confirmar que tabs/acciones no soportadas quedan bloqueadas con mensaje claro.
11. Confirmar que login/logout no se rompe.

## 13. Fase siguiente recomendada

HOLD-SHIP-FAST-2 deberia construir el read-model agregado de `/reservations` para mostrar:

- Reserva ya en paquete.
- Folio de paquete.
- Total, abonado y saldo.
- Estado de paquete.
- Estado de envio.
- Siguiente accion real basada en paquete/saldo/envio.

GO para avanzar a HOLD-SHIP-FAST-2.
