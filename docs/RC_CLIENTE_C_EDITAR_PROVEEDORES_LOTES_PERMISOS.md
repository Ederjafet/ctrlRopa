# RC-CLIENTE-C - Edicion Owner, proveedores/lotes y permisos cliente

Fecha: 2026-06-21
Rama: `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Hallazgos del smoke

- Platform Owner podia crear compania, sucursal y admin cliente, pero la UI no tenia accion visible para editar esos datos.
- Admin cliente podia operar inventario, pero el alta de lote quedaba bloqueada porque no habia proveedor activo y no existia acceso claro a Proveedores.
- `/customers-create` dependia de `CREATE_CUSTOMER`; si faltaba, el backend rechazaba con 403 y la UI no explicaba el permiso requerido ni mostraba `Ver permisos`.

## Correcciones aplicadas

- `Clientes / Companias` agrega accion `Editar` por cliente y reutiliza el formulario superior para guardar nombre y estado.
- `Sucursales` agrega accion `Editar` por sucursal para nombre, codigo y estado.
- `Usuarios` agrega accion `Editar` por usuario para nombre, telefono, rol, sucursal y estado. El cambio de password queda separado.
- `/customers-create` ahora muestra `Ver permisos`, conserva la pantalla y presenta mensaje claro si falta `CREATE_CUSTOMER`.
- El handler global de 403 devuelve `requiredPermission` cuando el backend lanza `Permiso requerido: X`.
- El helper frontend de errores muestra `Permiso requerido: X` cuando el backend lo entrega.
- Se agrega `/suppliers` como pantalla MVP de lista, alta y edicion de proveedores.
- El menu lateral agrega `Inventario -> Proveedores`.
- `Nuevo lote` muestra CTA `Crear proveedor` cuando no hay proveedores activos y bloquea guardar con explicacion.

## Permisos

- Clientes finales:
  - `VIEW_CUSTOMERS`
  - `CREATE_CUSTOMER`
  - `EDIT_CUSTOMER`
- Proveedores:
  - ver: `VIEW_INVENTORY` o `MANAGE_CATALOGS`
  - crear/editar: `MANAGE_CATALOGS`
- Lotes:
  - crear: `MANAGE_INVENTORY`
  - proveedor requerido por UX para lote instalable

Se agrega migracion `V64__rc_cliente_c_customer_supplier_lot_permissions.sql` para backfill de `ADMIN` tenant con permisos operativos faltantes de clientes e inventario/catalogos, sin otorgar permisos platform.

## Decisiones

- Proveedor queda requerido para crear lote desde UI para evitar lotes sin origen en instalacion.
- Si no hay proveedor activo, el sistema orienta a crear proveedor antes de guardar lote.
- Proveedores se implementa como MVP, no como modulo avanzado.
- La edicion de admin/usuario no cambia password; eso queda como flujo dedicado.

## Validaciones esperadas

- Platform Owner puede editar compania, sucursal y usuario/admin del cliente.
- Admin cliente puede crear clientes finales despues de relogin y migracion aplicada.
- Usuario sin `CREATE_CUSTOMER` ve mensaje claro y `Ver permisos`.
- Admin cliente puede crear proveedor y luego crear lote.
- Tenant admin no recibe permisos platform.
- `npm run lint`, `npx tsc --noEmit`, `git diff --check` y backend tests pasan.

## Backlog

- Proveedores tenant-aware completo si se requiere aislar catalogo de proveedores por company.
- Edicion avanzada de roles tenant y reseteo de password desde Panel Owner.
- Auditoria detallada de cambios de proveedores/lotes.
- Permisos granulares `VIEW_SUPPLIERS`, `CREATE_SUPPLIER`, `VIEW_LOTS`, `CREATE_LOT`.
