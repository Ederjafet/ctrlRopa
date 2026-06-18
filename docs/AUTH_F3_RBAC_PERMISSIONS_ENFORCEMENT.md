# AUTH-F3 - Catalogo RBAC y enforcement P0 inicial

Fecha: 2026-05-24  
Rama: `feature/auth-f3-rbac-permissions-migration`

Actualizacion obligatoria: 2026-05-25  
Hallazgo runtime: `GET /api/payments/{id}` y `GET /api/sales/{id}` validaban permiso funcional, pero no validaban que el registro por id perteneciera a la company/branch activa del token. Se corrigio en backend para bloquear fuga cross-company/cross-branch.

Fix final 2026-05-25: se corrigio robustez en `CustomerService.update`/`toResponse` para clientes legacy con `status = NULL`. El caso observado fue `PUT /api/customers/24` con usuario admin y permiso `EDIT_CUSTOMER`, que fallaba con 500 al mapear `entity.getStatus().name()`. La validacion de permiso y tenant se conserva.

## Objetivo

Implementar el catalogo RBAC minimo aprobado en AUTH-F2 y aplicar enforcement backend inicial en modulos P0 seleccionados, sin cambiar logica funcional de negocio, calculos financieros, ventas, pagos o reportes.

## Permisos creados

Migracion Flyway:

- `backend/control-ropa/src/main/resources/db/migration/V44__auth_f3_rbac_catalog_permissions.sql`

Permisos:

| Codigo | Nombre humano | Modulo |
|---|---|---|
| `CREATE_CUSTOMER` | Crear clientes | Clientes |
| `EDIT_CUSTOMER` | Editar clientes | Clientes |
| `VIEW_PAYMENTS` | Ver pagos | Pagos |
| `VIEW_SALES` | Ver ventas | Ventas |

`PermissionCode.java` fue actualizado para exponer estos codigos en backend.

## Script QA controlado

Script:

- `docs/qa/09-auth-f3-rbac-permissions-qa.sql`

Alcance:

- Inserta permisos AUTH-F3 si faltan.
- Asigna permisos solo a roles QA `QA_TENANT_ADMIN` y `QA_TENANT_SELLER`.
- Revoca sesiones activas de usuarios QA A/B para forzar login con permisos efectivos actualizados.
- No toca roles productivos reales.
- No toca usuarios productivos.

Asignacion QA:

| Rol QA | Permisos AUTH-F3 asignados |
|---|---|
| `QA_TENANT_ADMIN` | `CREATE_CUSTOMER`, `EDIT_CUSTOMER`, `VIEW_PAYMENTS`, `VIEW_SALES` |
| `QA_TENANT_SELLER` | `CREATE_CUSTOMER`, `VIEW_PAYMENTS`, `VIEW_SALES` |

## Enforcement backend P0

### Clientes

| Endpoint/flujo | Permiso requerido |
|---|---|
| `GET /api/customers/branch/{branchId}` | `VIEW_CUSTOMERS` |
| `GET /api/customers/{id}` | `VIEW_CUSTOMERS` |
| `GET /api/customers/branch/{branchId}/phone/{phone}` | `VIEW_CUSTOMERS` |
| `GET /api/customers/branch/{branchId}/generic/{genericType}` | `VIEW_CUSTOMERS` |
| `POST /api/customers/branch/{branchId}` | `CREATE_CUSTOMER` |
| `PUT /api/customers/{id}` | `EDIT_CUSTOMER` |
| `PATCH /api/customers/{id}/deactivate` | `EDIT_CUSTOMER` temporal |

Nota: `DEACTIVATE_CUSTOMER` queda como permiso futuro. AUTH-F3 usa `EDIT_CUSTOMER` para no fragmentar demasiado el primer enforcement.

Fix final 2026-05-25:

- `CustomerService.update` ya no propaga `status = null` desde request.
- Si el request no trae status, conserva el status existente.
- Si el cliente legacy ya tenia `status = null`, normaliza a `Status.ACTIVE` al guardar la edicion.
- `CustomerService.toResponse` usa fallback seguro `ACTIVE` si recibe un cliente legacy con status nulo, evitando 500.
- `EDIT_CUSTOMER` y tenant validation se mantienen sin cambios.

### Pagos

| Endpoint/flujo | Permiso requerido |
|---|---|
| `GET /api/payments/{id}` | `VIEW_PAYMENTS` + branch activa del tenant |
| `GET /api/payments/customer/{customerId}` | `VIEW_PAYMENTS` |
| `GET /api/payments/reservation/{reservationId}` | `VIEW_PAYMENTS` |
| `POST /api/payments/**` | `REGISTER_PAYMENTS` |
| `PATCH /api/payments/{paymentId}/void` | `VOID_PAYMENT` |

AUTH-F3 no cambia calculos, asignaciones, anulaciones ni estados financieros.

Fix 2026-05-25:

- `PaymentService.findById` resuelve el `CurrentTenantContext`.
- Valida que `payment.branchId` pertenece a la company activa.
- Valida que `payment.branchId` coincide con la branch activa cuando la sesion tiene `active_branch_id`.
- Si el pago pertenece a otra company/branch, responde con `AccessDeniedException` y no devuelve datos.

### Ventas

| Endpoint/flujo | Permiso requerido |
|---|---|
| `GET /api/sales/branch/{branchId}` | `VIEW_SALES` + branch activa del tenant |
| `GET /api/sales/{id}` | `VIEW_SALES` + branch activa del tenant |
| `POST /api/sales` | `DO_DOOR_SALE` |
| `PATCH /api/sales/{saleId}/cancel` | `CANCEL_SALE` |

AUTH-F3 no cambia reglas de venta, conversion de reserva, pagos ni estados.

Fix 2026-05-25:

- `SaleService.findById` resuelve el `CurrentTenantContext`.
- Valida que `sale.branch.id` pertenece a la company activa.
- Valida que `sale.branch.id` coincide con la branch activa cuando la sesion tiene `active_branch_id`.
- `SaleService.findByBranch` aplica la misma validacion para evitar listados cross-branch por URL.
- Si la venta pertenece a otra company/branch, responde con `AccessDeniedException` y no devuelve datos.

### Menu operativo

- `CUSTOMERS` ahora usa `VIEW_CUSTOMERS`.
- `PAYMENTS` ahora usa `VIEW_PAYMENTS`.

## Frontend alineado

Cambios acotados:

- `app/customers.tsx`: boton `Nuevo cliente` solo aparece con `CREATE_CUSTOMER`.
- `app/customers-create.tsx`: bloquea acceso directo sin `CREATE_CUSTOMER`.
- `app/customers/[id].tsx`: lectura requiere `VIEW_CUSTOMERS`; edicion/estado/direcciones visibles solo con `EDIT_CUSTOMER`.
- `app/payments.tsx`: bloquea acceso directo sin `VIEW_PAYMENTS`.
- `app/(tabs)/index.tsx`: menu `Pagos / Cobros` usa `VIEW_PAYMENTS`.
- `services/livePermissionGuards.ts`: alta rapida de cliente LIVE requiere `CREATE_CUSTOMER`.
- `services/permissionDependencies.ts`: `EDIT_CUSTOMER` recomienda `VIEW_CUSTOMERS`; `VIEW_PAYMENTS` deja de ser dependencia huerfana una vez aplicada V44.

## Pruebas negativas agregadas

Backend:

- `CustomerServiceTests`
  - lectura sin `VIEW_CUSTOMERS` rechaza antes de consultar.
  - alta sin `CREATE_CUSTOMER` rechaza antes de tenant validation.
  - edicion de cliente legacy con `status = null` normaliza a `ACTIVE` y no genera 500.
  - edicion sin `EDIT_CUSTOMER` sigue rechazando antes de consultar.
- `PaymentServiceAccessTests`
  - consulta pago sin `VIEW_PAYMENTS` rechaza.
  - consulta pagos por cliente sin `VIEW_PAYMENTS` rechaza.
  - consulta pago por id de otra branch/company rechaza aunque exista `VIEW_PAYMENTS`.
  - consulta pago por id de la branch activa permite respuesta.
- `SaleServiceAccessTests`
  - consulta ventas por sucursal sin `VIEW_SALES` rechaza.
  - consulta venta por id sin `VIEW_SALES` rechaza.
  - consulta venta por id de otra branch/company rechaza aunque exista `VIEW_SALES`.
  - consulta venta por id de la branch activa permite respuesta.

## Validaciones ejecutadas

- `.\mvnw.cmd test`
  - Resultado: `BUILD SUCCESS`
  - Tests: 40 ejecutados, 0 failures, 0 errors.
  - Flyway valido 44 migraciones; esquema local en version 44 sin migracion pendiente.
- `npm.cmd run lint`
  - Resultado: exitoso con warnings preexistentes de lint.
- `npx.cmd tsc --noEmit`
  - Resultado: exitoso.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
  - Resultado: export web exitoso.
- `git diff --check`
  - Resultado: sin errores; solo warnings de CRLF esperados en Windows.

## Riesgos pendientes

- `CustomerAddressService` y algunos flujos secundarios de clientes quedan para AUTH-F4/F5 si se decide extender `EDIT_CUSTOMER` a direcciones con enforcement backend explicito.
- Roles productivos reales no fueron actualizados; se requiere fase de asignacion controlada antes de QA productivo.
- `VIEW_SALES` fue creado y aplicado a consultas, pero cualquier ampliacion sobre pantallas de ventas debe pasar por pruebas negativas adicionales.
- Frontend no reemplaza enforcement backend; solo alinea experiencia y evita acciones visibles sin permiso.

## Rollback

- Revertir cambios Java/frontend/tests/docs.
- Si V44 ya fue aplicada, restaurar backup o aplicar migracion compensatoria aprobada; no borrar permisos manualmente en ambientes compartidos sin revisar `role_permissions` y `user_permissions`.
- Para QA, revertir asignaciones del script `09-auth-f3-rbac-permissions-qa.sql` eliminando solo relaciones de roles QA si fuera necesario.

## Decision

Estado: `GO tecnico condicionado`.

Condiciones antes de merge productivo:

- Ejecutar validaciones frontend.
- Aplicar script QA `09-auth-f3-rbac-permissions-qa.sql` en QA/local controlado.
- Repetir smoke con `qa.a.admin`, `qa.a.vendedor`, `qa.b.admin`, `qa.b.vendedor` y usuario sin permisos.
