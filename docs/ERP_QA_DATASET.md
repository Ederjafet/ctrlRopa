# ERP - Dataset QA

Fecha: 2026-05-12  
Fase: 1D - datos QA y evidencia

## Objetivo

Definir un dataset QA repetible para ejecutar smoke tests, regresion operacional y validacion por rol sin usar datos reales ni tocar datos productivos.

## Principios

- Todos los datos QA deben usar prefijos claros: `QA_`, `QA-` o correos `qa.*@local.test`.
- El dataset debe poder crearse varias veces sin duplicar datos.
- La limpieza debe ejecutarse solo en ambiente QA y con respaldo previo.
- Ventas, pagos, reservas, paquetes y envios deben generarse preferentemente desde la app/API para validar flujos reales.
- Los scripts SQL bajo `docs/qa/` no sustituyen migraciones Flyway.

## Datos necesarios

| Dato | Objetivo | Dependencia | Como crearlo | Como limpiarlo | Riesgo si falta |
|---|---|---|---|---|---|
| Usuarios QA por rol | Validar permisos, menus y bloqueo de acciones. | Sucursales, roles, permisos. | `docs/qa/04-usuarios-roles-qa.sql` y administracion de usuarios si aplica. | `docs/qa/02-limpieza-datos-qa.sql`, solo QA. | No se puede probar seguridad ni visibilidad por rol. |
| Sucursales QA | Aislar datos por operacion. | Tabla `branches`. | `docs/qa/01-preparacion-datos-qa.sql`. | Limpieza QA con prefijos `QA_CTR`, `QA_VER`. | Mezcla datos entre sucursales. |
| Clientes QA | Probar ventas, apartados, live, paquetes y envios. | Sucursales, usuarios. | `docs/qa/01-preparacion-datos-qa.sql` o alta en app. | Limpieza por nombre/correo QA. | Flujos comerciales quedan incompletos. |
| Proveedores QA | Probar origen de lote y calidad por proveedor. | Tabla `suppliers`, migracion `V37__suppliers_and_batch_quality.sql`. | `docs/qa/03-datos-base-qa.sql`. | Desactivar o limpiar solo proveedores `QA_%` si no tienen dependencias. | Lotes no validan trazabilidad de origen. |
| Catalogos de prendas | Probar alta, busqueda y clasificacion. | Tipos, marcas, tallas, ubicaciones. | `docs/qa/01-preparacion-datos-qa.sql`. | Limpieza por prefijos `QA_`. | No hay inventario consistente para pruebas. |
| Prendas QA | Probar inventario, venta, reserva, paquete y envio. | Catalogos, lote, sucursal. | `docs/qa/01-preparacion-datos-qa.sql` o alta controlada. | Limpieza por codigo `QA-*`. | Smoke de inventario/ventas no es repetible. |
| Lotes QA | Probar recepcion, clasificacion y conciliacion. | Sucursal, usuario, proveedor. | `01-preparacion` crea base; `03-datos-base` vincula proveedor/calidad. | Limpieza por folio `QA-*`. | No se valida trazabilidad de recepcion. |
| Ventas QA | Probar venta puerta, caja e inventario. | Cliente, prenda disponible, metodo de pago. | Crear desde app/API durante regresion. | Limpiar con script QA solo despues de evidencia. | No se valida dinero/inventario. |
| Pagos QA | Probar caja, abonos y reportes. | Venta/reserva/paquete y metodo de pago. | Crear desde app/API durante regresion. | Limpiar con script QA solo despues de evidencia. | No se validan saldos ni reportes financieros. |
| Reservas/live QA | Probar captura en vivo y apartados. | Cliente, prenda, live abierto. | Crear desde app/API durante regresion. | Limpiar por prefijos QA y relaciones. | No se valida flujo live ni apartados. |
| Paquetes/envios QA | Probar preparacion y entrega. | Cliente, prenda pagada/reservada. | Crear desde app/API durante regresion. | Limpiar por folios `QA-*`. | No se valida operacion logistica. |
| Reportes QA | Validar consistencia diaria. | Operaciones QA ejecutadas. | Ejecutar reportes despues de la jornada QA. | No aplica, se conserva como evidencia. | Reportes no se pueden comparar contra datos esperados. |

## Escenarios minimos

| Escenario | Datos requeridos | Flujo que habilita |
|---|---|---|
| Login por rol | Usuarios QA activos y permisos asignados. | Login, menu, acceso denegado. |
| Venta puerta pagada | Cliente QA, prenda disponible, metodo QA. | Venta, pago, dashboard, reportes. |
| Apartado/reserva | Cliente QA, prenda disponible, anticipo opcional. | Reservas, pagos, cancelacion futura. |
| Live | Live abierto, cliente, prenda, precio. | Reservas live, cierre live, reportes live. |
| Lote con proveedor | Proveedor QA, lote QA pendiente/recibido. | Recepcion, calidad, filtros. |
| Paquete/envio | Cliente con prenda pagada o reservada. | Preparacion, envio, seguimiento. |
| Usuario sin permisos | Usuario activo sin permisos efectivos. | Acceso denegado amigable. |

## Scripts relacionados

- `docs/qa/01-preparacion-datos-qa.sql`: base historica de sucursales, usuarios, catalogos, clientes e inventario.
- `docs/qa/02-limpieza-datos-qa.sql`: limpieza opcional, requiere respaldo y ambiente QA.
- `docs/qa/03-datos-base-qa.sql`: extension Fase 1D para proveedores y calidad de lotes.
- `docs/qa/04-usuarios-roles-qa.sql`: extension Fase 1D para perfiles QA minimos.

## Pendiente de validar

- Confirmar en base QA que `01-preparacion-datos-qa.sql` sigue alineado con todas las migraciones actuales.
- Confirmar que los usuarios QA con `{noop}Qa12345!` siguen permitidos en la configuracion de autenticacion vigente.
- Confirmar limpieza segura de operaciones financieras antes de usar en STAGING.
