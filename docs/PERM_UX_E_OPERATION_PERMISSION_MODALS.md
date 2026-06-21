# PERM-UX-E - Modal reusable de permisos en Operacion

## Problema

El patron final de permisos ya estaba correcto en `/payments`, pero las pantallas del menu Operacion no tenian un acceso consistente para que el usuario entendiera que puede hacer y que permisos le faltan.

La regla de producto queda:

- Boton compacto `Ver permisos` en la cabecera principal.
- Modal reusable con acciones y permisos.
- Sin tarjetas grandes de permisos en el cuerpo.
- Codigos tecnicos solo con `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS=true` y perfil autorizado.

## Componente reusable

Se agrego:

- `components/ui/ScreenPermissionHeaderAction.tsx`

Este componente:

- Renderiza el boton `Ver permisos`.
- Abre `ScreenPermissionModal`.
- Carga la sesion si la pantalla no la pasa explicitamente.
- Evalua `getScreenPermissionSummary(screenKey, session, language)`.
- Usa `canViewScreenPermissionDiagnostics(session)` para decidir si muestra codigos tecnicos.

## Pantallas cubiertas

- `/live`
- `/door-sale`
- `/door-reservation`
- `/reservations`
- `/reservation-detail`
- `/customer-packages`
- `/customer-package-detail`
- `/shipments`
- `/shipment-detail`
- `/operational-authorizations`
- `/items-create`
- `/payments` queda migrada al nuevo boton reusable.

## Screen keys agregados

En `services/screenPermissions.ts`:

- `live`
- `doorSale`
- `doorReservation`
- `reservations`
- `reservationDetail`
- `customerPackages`
- `customerPackageDetail`
- `shipments`
- `shipmentDetail`
- `liveAuthorizations`
- `itemsCreate`

`payments` se mantiene.

## Permisos evaluados por pantalla

### LIVE

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- `DO_LIVE_RESERVATION`
- `CREATE_CUSTOMER`

### Venta puerta

- `DO_DOOR_SALE`
- `VIEW_CUSTOMERS`
- `VIEW_INVENTORY`
- `REGISTER_PAYMENTS`
- `APPLY_CUSTOMER_BALANCE`

### Nuevo apartado

- `DO_DOOR_RESERVATION`
- `VIEW_CUSTOMERS`
- `CREATE_CUSTOMER`
- `VIEW_INVENTORY`
- `MANAGE_INVENTORY`
- `REGISTER_PAYMENTS`

### Apartados y detalle

- `DO_DOOR_RESERVATION`
- `CREATE_CUSTOMER`
- `CREATE_CLOSE_CUSTOMER_PACKAGE`
- `VIEW_PAYMENTS`
- `REGISTER_PAYMENTS`
- `CANCEL_RESERVATION`

### Paquetes y detalle

- `CREATE_CLOSE_CUSTOMER_PACKAGE`
- `VIEW_PAYMENTS`
- `REGISTER_PAYMENTS`
- `APPLY_CUSTOMER_BALANCE`
- `MANAGE_INVENTORY`
- `MANAGE_SHIPMENTS`

### Envios y detalle

- `MANAGE_SHIPMENTS`
- `CREATE_CLOSE_CUSTOMER_PACKAGE`

### Autorizaciones LIVE

- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`

### Alta de prendas

- `VIEW_INVENTORY`
- `MANAGE_INVENTORY`

## Diagnostico apagado

Con:

`EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS=false`

La modal muestra solo lenguaje de negocio:

- Permitido / Bloqueado.
- Accion de negocio.
- Mensaje de que puede o no puede hacer.

No muestra codigos como `REGISTER_PAYMENTS`.

## Diagnostico activo

Con:

`EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS=true`

Admin, QA, Tenant Admin o Platform Owner pueden ver el permiso tecnico integrado en cada accion.

Vendedor/caja no ven codigos tecnicos aunque la bandera este activa.

## Actualizar

`Actualizar` se mantiene solo en LIVE.

En LIVE convive con `Ver permisos` dentro de la cabecera.

No se agrego `Actualizar` en:

- Venta puerta.
- Nuevo apartado.
- Apartados.
- Paquetes.
- Envios.
- Alta de prendas.
- Autorizaciones LIVE.

## Backend

No se toco backend.

No se crearon migraciones.

No se cambiaron permisos reales ni endpoints.

## Riesgos pendientes

- Algunas pantallas heredadas usan permisos historicos amplios como `CREATE_CLOSE_CUSTOMER_PACKAGE` para consultar y operar paquetes. El modal documenta esa realidad, pero no sustituye hardening backend granular.
- `reservations` puede ser visible por flujos LIVE o mostrador; la matriz usa los permisos reales principales disponibles.
- Los hints de acciones bloqueadas deben seguir ampliandose por boton critico en fases futuras.

## Backlog

- PERM-UX-F: aplicar el mismo patron a Administracion, Sistema, Usuarios, Roles y Apariencia.
- PERM-HARDEN-A: separar permisos finos de ver/crear/actualizar paquetes si negocio lo requiere.
- PERM-HINTS-A: normalizar `PermissionBlockedHint` en todos los botones criticos de dinero, paquetes y envios.
