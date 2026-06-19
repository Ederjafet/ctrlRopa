# FLOW-FAST-2 - Correccion de paquetes, pagos, saldo a favor y vinculacion

## Resumen ejecutivo

FLOW-FAST-2 corrige los hallazgos del smoke sobre la rama `feature/flow-fast-1-prenda-paquete-pagos-saldo` sin merge a `main`. La fase refuerza el flujo real:

`apartado con cliente/interesado -> cliente formal -> paquete -> abonos -> saldo a favor -> envio`.

Se corrigio la vinculacion de cliente, la bandeja de paquetes, el agregado de prendas libres a paquete, la visibilidad de abonos y saldo a favor, y la pantalla de pagos para que use `AppShell`.

## Problemas del smoke corregidos

- `Vincular cliente` ya no precarga el alias en la busqueda.
- `Convertir alias en cliente formal` queda deshabilitado con explicacion; no es boton muerto.
- `Agregar a paquete` deja de ser accion falsa y abre el flujo real de paquete.
- `/customer-packages` muestra paquetes globales por sucursal, no una lista de clientes.
- `/customer-packages?customerId=...` mantiene filtro por cliente con total, abonado, saldo, estado y siguiente accion.
- El detalle de paquete muestra acciones arriba: `Registrar abono`, saldo y balance del cliente.
- El metodo de pago en paquete es selector compacto.
- `payments` usa `AppShellPage` y muestra saldo a favor disponible.
- El detalle de apartado muestra saldo a favor del cliente.

## Vincular cliente

El modal abre con:

- interesado actual como contexto;
- input de busqueda vacio;
- resultados de clientes reales;
- boton deshabilitado hasta seleccionar cliente formal.

El alias no se crea ni se muestra como cliente fake. Al vincular, la reserva guarda `customerId` y la UI prioriza `Cliente`.

## Convertir alias

No se implemento alta automatica de cliente desde alias en esta fase. La accion queda deshabilitada con copy claro:

`Disponible en siguiente fase para crear cliente formal desde alias.`

No se crean clientes falsos ni clientes automaticos sin confirmacion.

## Crear / agregar a paquete

Desde Apartados, el modal de paquete ahora muestra:

- apartados activos del mismo cliente sin paquete;
- prendas libres `AVAILABLE`;
- paquetes activos del mismo cliente;
- opcion de crear paquete nuevo;
- opcion de agregar a paquete activo.

Reglas aplicadas:

- paquete solo con cliente formal;
- interesados/alias sin cliente no aparecen como candidatos;
- apartados ya en paquete mantienen `Ver paquete`;
- prendas libres se agregan solo si estan disponibles;
- al agregar prenda libre, backend crea una reserva formal para el cliente del paquete y bloquea la prenda como `RESERVED`.

## Bandeja global de paquetes

Se agregaron endpoints de detalle:

- `GET /api/customer-packages/branch/{branchId}/details`
- `GET /api/customer-packages/customer/{customerId}/details`

La pantalla `/customer-packages` usa la primera ruta como bandeja global y mantiene `customerId` como filtro.

Cada fila muestra paquete, cliente, telefono, prendas, total, abonado, saldo, saldo a favor, estado y siguiente accion.

## Detalle de paquete

`/customer-package-detail?id=...` ahora muestra arriba una barra/resumen compacto con:

- paquete y cliente;
- total, abonado y saldo;
- saldo a favor del cliente;
- `Registrar abono` visible;
- `Aplicar saldo a favor` deshabilitado con explicacion.

El metodo de pago queda como selector compacto desplegable. Los mensajes de abono usan aviso en pantalla y alerta visible.

## Payments / AppShell

`/payments?reservationId=...` ahora vive dentro de `AppShellPage`, con menu lateral consistente.

Muestra:

- total;
- pagado;
- pendiente;
- saldo a favor disponible;
- boton `Aplicar saldo a favor` deshabilitado hasta implementar aplicacion auditada.

## Saldo a favor

Se reutiliza el backend existente de balance:

- `GET /api/balance/{customerId}`
- `GET /api/balance/package-folio/{folio}`

El saldo a favor se muestra en:

- detalle de paquete;
- listado global y por cliente de paquetes;
- detalle de apartado;
- pantalla de pagos.

No se aplica automaticamente.

## Envio

La regla sigue vigente: un paquete con saldo pendiente no debe liberarse a envio. En paquetes y detalle se mantiene el bloqueo visual cuando `pendingAmount > 0`.

## Migraciones

No se crearon migraciones. Se reutilizaron tablas y campos existentes:

- `reservations.customer_id`
- `reservations.interested_alias`
- `customer_packages`
- `customer_package_items`
- `payment_allocations`
- balance/saldo a favor existente.

## Validaciones ejecutadas

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK con warnings existentes, 0 errores.
- `./mvnw.cmd "-Dtest=CustomerPackageServiceTests,PaymentServiceAccessTests" test`: OK, 14 tests.
- `./mvnw.cmd test`: PENDING_ENV_DB. Falla al levantar `ControlRopaApplicationTests` por entorno local sin credenciales DB: `Access denied for user 'root'@'localhost' (using password: NO)`.

## Ciclos de revision

1. Implementacion backend/frontend.
2. Validacion TypeScript.
3. Validacion backend especifica de paquetes y pagos.
4. Lint frontend.
5. Revision funcional de reglas contra smoke reportado.

## Smoke QA recomendado

1. Crear apartado con alias y abrir `Vincular cliente`; confirmar busqueda vacia.
2. Vincular a cliente existente; confirmar que se muestra como `Cliente`.
3. Crear paquete con cliente formal.
4. Agregar otro apartado del mismo cliente.
5. Agregar prenda libre y confirmar que queda asociada/bloqueada.
6. Abrir `/customer-packages` y confirmar paquetes globales.
7. Abrir `/customer-packages?customerId=...` y confirmar totales/saldos.
8. Registrar abono parcial en detalle de paquete.
9. Registrar sobrepago y confirmar saldo a favor.
10. Abrir detalle de apartado y `/payments?reservationId=...`; confirmar saldo a favor visible.
11. Confirmar que no se puede avanzar a envio con saldo pendiente.

## Riesgos

- La aplicacion de saldo a favor a paquete/apartado queda pendiente para una fase con trazabilidad explicita.
- Alta rapida directa desde paquete queda pendiente.
- La bandeja global usa detalle por paquete; si el volumen crece, conviene endpoint paginado/resumen.

## GO / NO-GO

GO_TECNICO para nueva revision visual del usuario en la rama feature.
