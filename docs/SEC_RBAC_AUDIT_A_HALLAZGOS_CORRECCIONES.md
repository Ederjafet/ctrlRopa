# SEC-RBAC-AUDIT-A - Hallazgos y correcciones

Fecha: 2026-06-21

## Hallazgo P0

En `/door-reservation?customerId=4`, el modal `Ver permisos` indicaba que `Crear prenda rapida` estaba bloqueado para vendedor. Aun asi, el boton `Alta rapida de prenda` permitia navegar a `/items-create` y crear una prenda.

Impacto:

- la UI y el backend no coincidian;
- una accion sensible de inventario podia ejecutarse por llamada directa;
- el vendedor podia crear inventario aunque no tuviera `MANAGE_INVENTORY`;
- la proteccion dependia del frontend y no del backend.

## Causa raiz

`services/screenPermissions.ts` ya declaraba `Crear prenda rapida` con `MANAGE_INVENTORY`, y el rol `SELLER` no tiene ese permiso. Sin embargo:

- `app/door-reservation.tsx` mostraba el boton sin revisar `MANAGE_INVENTORY`;
- `app/items-create.tsx` podia guardar sin bloquear por permiso antes del submit;
- `ItemService.create()` no llamaba a `AccessService.assertCan(...)`;
- `POST /api/items` validaba tenant/sucursal, pero no permiso funcional de escritura.

## Correcciones aplicadas

### Backend

Archivo: `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`

- Se inyecto `AccessService`.
- Lectura de prendas exige `VIEW_INVENTORY`:
  - `findByBranch`
  - `findById`
  - `findByCode`
  - `lookupByCode`
  - `lookupByQrCode`
- Escritura de prendas exige `MANAGE_INVENTORY`:
  - `create`
  - `update`
  - `changeLocation`
- Se conserva tenant isolation con `TenantResolver` y validacion de sucursal/compania.
- Si falta permiso, `AccessService` responde con `AccessDeniedException("Permiso requerido: MANAGE_INVENTORY")`, que el handler traduce a 403.

### Frontend

Archivos:

- `app/door-reservation.tsx`
- `app/items-create.tsx`

Cambios:

- `Alta rapida de prenda` ahora se deshabilita si falta `MANAGE_INVENTORY`.
- El boton muestra razon: `No tienes permiso para crear prenda rapida. Permiso requerido: MANAGE_INVENTORY.`
- `/items-create` muestra aviso de accion bloqueada si el usuario llega directo sin permiso.
- El submit de `/items-create` vuelve a verificar `MANAGE_INVENTORY` antes de llamar a `createItem`.
- El backend mantiene el bloqueo final aunque el frontend sea manipulado.

### Tests

Archivo: `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/item/ItemServiceTests.java`

Se agrego/ajusto cobertura para:

- lectura de inventario exige `VIEW_INVENTORY`;
- creacion de prenda exige `MANAGE_INVENTORY`;
- si falta `MANAGE_INVENTORY`, `create()` lanza `AccessDeniedException`;
- tenant/sucursal se sigue validando antes de devolver datos.

## Permisos revisados

| Permiso | Resultado |
| --- | --- |
| `VIEW_INVENTORY` | Permite consultar prendas y catalogos operativos. |
| `MANAGE_INVENTORY` | Autoridad real para crear/editar prendas y administrar lotes. |
| `DO_DOOR_RESERVATION` | Permite crear apartados, no crear inventario. |
| `VIEW_CUSTOMERS` | Permite seleccionar cliente. |
| `CREATE_CUSTOMER` | Bloqueado para vendedor salvo asignacion explicita. |
| `REGISTER_PAYMENTS` | Permite anticipo/pago donde aplica. |

## Endpoints criticos auditados en esta correccion

| Endpoint | Antes | Ahora |
| --- | --- | --- |
| `GET /api/items/branch/{branchId}` | Tenant scoped, sin guard funcional explicito | `VIEW_INVENTORY` + tenant scope |
| `GET /api/items/{id}` | Tenant scoped, sin guard funcional explicito | `VIEW_INVENTORY` + tenant scope |
| `GET /api/items/code/{code}` | Tenant scoped, sin guard funcional explicito | `VIEW_INVENTORY` + tenant scope |
| `GET /api/items/lookup/code/{code}` | Tenant scoped, sin guard funcional explicito | `VIEW_INVENTORY` + tenant scope |
| `GET /api/items/lookup/qr/{qrCode}` | Tenant scoped, sin guard funcional explicito | `VIEW_INVENTORY` + tenant scope |
| `POST /api/items` | Tenant scoped, sin permiso de escritura | `MANAGE_INVENTORY` + tenant scope |
| `PUT /api/items/{id}` | Tenant scoped, sin permiso de escritura | `MANAGE_INVENTORY` + tenant scope |
| `PATCH /api/items/{id}/location/{storageLocationId}` | Tenant scoped, sin permiso de escritura | `MANAGE_INVENTORY` + tenant scope |

## Roles auditados

- `PLATFORM_OWNER`
- `ADMIN`
- `SUPERVISOR`
- `SELLER`
- `CASHIER`
- `INVENTORY`
- `PACKING`
- `LOGISTICS`
- `COURIER`
- `NO_ACCESS`

## Riesgos pendientes

- `CREATE_ITEM` y `EDIT_ITEM` existen como etiquetas/dependencias preparatorias frontend, pero no como permisos backend confirmados. Si se aprueba RBAC mas granular, crear migracion formal y mover `ItemService` de `MANAGE_INVENTORY` a permisos finos.
- Aun conviene una suite e2e por rol para validar todos los botones de operacion en navegador.
- Revisar en fase posterior otros catalogos historicos para asegurar que todos los `POST/PUT/PATCH/DELETE` tengan `assertCan` explicito.

## Decision

GO tecnico para el P0 detectado: vendedor ya no debe crear prendas rapidas si el modal indica bloqueo, y una llamada directa a `POST /api/items` queda protegida por backend.
