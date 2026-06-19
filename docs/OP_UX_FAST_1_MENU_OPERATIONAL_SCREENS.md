# OP-UX-FAST-1 - Pantallas operativas homologadas

## Resumen ejecutivo

Se diagnostico y homologo la experiencia visual de los accesos operativos `Paquetes`, `Venta puerta`, `Apartado puerta` y `Envios` con el patron compacto trabajado en LIVE y Apartados. La fase no repite HOLD-SHIP-UX-FAST-9 y no modifica `/reservations`.

No se tocaron backend, migraciones, Android/EAS, permisos ni reglas de negocio.

## Estado actual de Paquetes

- Ruta frontend: `/customer-packages`.
- Pantalla existente: `app/customer-packages.tsx`.
- Servicio frontend: `services/customerPackageService.ts`.
- Backend existente: `CustomerPackageController` bajo `/api/customer-packages`.
- Estado funcional: existe pantalla funcional, pero el read-model disponible lista paquetes por cliente, no una bandeja global por sucursal.
- Mejora aplicada:
  - header compacto con `PANEL OPERATIVO`;
  - accion `Actualizar` en header;
  - `Nuevo paquete` en header cuando hay cliente seleccionado;
  - ruta activa corregida a `customer-packages`;
  - filas compactas por paquete con `Detalle` y `Mas`;
  - modal `Mas` con acciones secundarias reales o deshabilitadas con explicacion.

Pendiente: endpoint/listado agregado por sucursal para una bandeja global de paquetes con totales, saldo y pago sin depender de seleccionar cliente.

## Estado actual de Venta puerta

- Ruta frontend: `/door-sale`.
- Pantalla existente: `app/door-sale.tsx`.
- Backend/servicios existentes: venta, pagos, inventario, clientes y canal `DOOR_SALE`.
- Estado funcional: formulario real de venta directa.
- Mejora aplicada:
  - header compacto;
  - accion manual `Actualizar` en header;
  - se mantuvo la logica actual de venta, pago y validaciones.

## Estado actual de Apartado puerta

- Ruta frontend: `/door-reservation`.
- Pantalla existente: `app/door-reservation.tsx`.
- Backend/servicios existentes: reservas, pagos, inventario, clientes y canal `DOOR_RESERVATION`.
- Estado funcional: formulario real para apartado fuera de LIVE con cliente formal.
- Mejora aplicada:
  - header compacto;
  - accion manual `Actualizar` en header;
  - se mantuvo la logica actual de apartado, anticipo y validaciones.

## Estado actual de Envios

- Ruta frontend: `/shipments`.
- Pantalla existente: `app/shipments.tsx`.
- Servicio frontend: `services/shipmentService.ts`.
- Backend existente: `ShipmentController` bajo `/api/shipments`.
- Estado funcional: listado, creacion de envio y detalle de envio existentes.
- Mejora aplicada:
  - migracion visual de `AppScreen` a `AppShellPage`;
  - header compacto con `Actualizar` y `Nuevo envio`;
  - KPIs compactos (`Envios`, `En ruta`);
  - filas compactas con identidad, paquetes, guia, fecha y acciones;
  - acciones `Detalle` y `Mas`;
  - modal `Mas` con navegacion real al detalle y acciones pendientes explicadas.

## Menu lateral

La seccion `Operacion` ya contenia accesos protegidos por permisos:

- En vivo: `/live`.
- Venta puerta: `/door-sale`.
- Apartado puerta: `/door-reservation`.
- Apartados: `/reservations`.
- Paquetes: `/customer-packages`.
- Envios: `/shipments`.
- Autorizaciones LIVE: `/operational-authorizations`.
- Clientes: `/customers`.

No se agregaron rutas nuevas ni accesos rotos. Se corrigio el estado visual activo de `Paquetes` usando `activeRoute="customer-packages"` en la pantalla.

## Pantallas mejoradas

- `Paquetes`: header, selector de cliente, filas compactas, acciones `Detalle`/`Mas`.
- `Envios`: shell operativo, header, KPIs, filas compactas, acciones `Detalle`/`Mas`.
- `Venta puerta`: header compacto y actualizacion manual.
- `Apartado puerta`: header compacto y actualizacion manual.

## Pantallas minimo viable

No se crearon pantallas nuevas. `Paquetes` y `Envios` ya tenian pantalla y backend suficiente para mejorar su UX sin crear modulos paralelos.

## No se pudo mejorar

- `Paquetes` todavia no puede mostrar una bandeja global por sucursal porque el servicio disponible lista por cliente.
- El resumen de pago/saldo de paquete no aparece en el listado global por falta de read-model agregado.
- Algunas acciones de paquete/envio siguen centralizadas en sus detalles; en `Mas` se muestran como pendientes o se enrutan al detalle.

## Riesgos

- Los labels sin acento (`Envios`, `Mas`) se conservan para mantener consistencia con el codigo actual y evitar ruido de codificacion en archivos existentes.
- La validacion visual final requiere revisar desktop/mobile con datos reales de paquetes y envios.

## Permisos pendientes

Se reutilizan permisos existentes:

- `CREATE_CLOSE_CUSTOMER_PACKAGE` para Paquetes.
- `MANAGE_SHIPMENTS` para Envios.
- `DO_DOOR_SALE` para Venta puerta.
- `DO_DOOR_RESERVATION` para Apartado puerta.

Permisos finos futuros recomendados:

- `VIEW_CUSTOMER_PACKAGES`.
- `VIEW_SHIPMENTS`.
- `REGISTER_PACKAGE_PAYMENT`.
- `RELEASE_PACKAGE_FOR_SHIPMENT`.
- `DISPATCH_SHIPMENT`.

## Validaciones

Comandos obligatorios:

```bash
npm run lint
npx tsc --noEmit
git --no-pager diff --check
```

Backend test no aplica porque no se modifico backend.

Resultado de esta corrida:

- `npm run lint`: PASS sin errores, con 53 warnings preexistentes del proyecto.
- `npx tsc --noEmit`: PASS.
- `git --no-pager diff --check`: PASS.

## Smoke QA recomendado

1. Abrir la app y revisar la seccion `Operacion` del menu.
2. Confirmar que `Paquetes`, `Venta puerta`, `Apartado puerta` y `Envios` apuntan a rutas funcionales.
3. Entrar a `Paquetes` y validar header compacto, busqueda de cliente y filas compactas por paquete.
4. Entrar a `Envios` y validar header compacto, KPIs, filas compactas y acciones `Detalle`/`Mas`.
5. Entrar a `Venta puerta` y confirmar que el flujo actual sigue operando.
6. Entrar a `Apartado puerta` y confirmar que el flujo actual sigue operando.
7. Revisar desktop y mobile sin scroll horizontal.
8. Confirmar que no se agrego polling automatico.

## Siguiente fase recomendada

OP-UX-FAST-2: crear un read-model de paquetes por sucursal para mostrar una bandeja global de paquetes con cliente, prendas, subtotal, envio, total, pagado, saldo y siguiente accion sin depender de seleccionar cliente.
