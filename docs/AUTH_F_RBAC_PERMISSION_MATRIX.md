# AUTH-F - Matriz RBAC permiso-endpoint

Fecha: 2026-05-24  
Rama: `feature/auth-f-rbac-permission-matrix`

Nota AUTH-F2: la propuesta formal de catalogo minimo recomendado queda documentada en `docs/AUTH_F2_RBAC_CATALOG_APPROVAL.md`. Esta matriz AUTH-F1 se conserva como diagnostico base y no implica permisos nuevos creados.

## Objetivo

Iniciar AUTH-F como fase de diagnostico y matriz RBAC. Esta fase no cambia permisos productivos, no agrega migraciones, no toca SQL y no modifica enforcement funcional. El resultado es una base formal para decidir subfases posteriores de RBAC avanzado.

## Alcance

- Inventariar permisos existentes desde backend, migraciones, datasets QA, frontend y documentacion AUTH-A.
- Mapear pantallas frontend, servicios API y permisos usados por UI.
- Mapear endpoints backend, validacion de token, validacion tenant y permiso funcional observado.
- Detectar huecos entre guard frontend y enforcement backend.
- Documentar permisos faltantes o ambiguos, sin inventarlos.

Fuera de alcance:

- Crear permisos nuevos.
- Crear migraciones Flyway.
- Cambiar roles.
- Cambiar logica de pagos, ventas o reportes.
- Implementar enforcement backend masivo.
- Declarar RBAC fino completo.

## Fuentes revisadas

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- Controladores y servicios bajo `backend/control-ropa/src/main/java`
- Migraciones Flyway bajo `backend/control-ropa/src/main/resources/db/migration`
- Scripts QA bajo `docs/qa`
- Pantallas bajo `app/`
- Servicios frontend bajo `services/`
- Documentacion AUTH-A: `AUTH_FRONTEND_PERMISSION_GUARDS.md` y `AUTH_RBAC_LOGIN_GUARDS.md`

## Matriz de permisos existentes

| Modulo | Permisos confirmados |
|---|---|
| Clientes | `VIEW_CUSTOMERS`, `VIEW_CUSTOMER_ORDERS`, `REASSIGN_CUSTOMERS`, `APPLY_CUSTOMER_BALANCE`, `CREATE_CLOSE_CUSTOMER_PACKAGE` |
| Inventario | `VIEW_INVENTORY`, `MANAGE_INVENTORY` |
| Lotes | Sin permiso fino propio; usa `VIEW_INVENTORY` y `MANAGE_INVENTORY` |
| Pagos | `REGISTER_PAYMENTS`, `VOID_PAYMENT` |
| Ventas | `DO_DOOR_SALE`, `CANCEL_SALE` |
| Reservas | `DO_LIVE_RESERVATION`, `DO_DOOR_RESERVATION`, `CANCEL_RESERVATION` |
| Reportes | `VIEW_REPORTS`, `VIEW_DEPOSIT_REPORTS` en migracion/dataset, no presente en `PermissionCode.java` |
| En vivo | `DO_LIVE_RESERVATION` |
| Sistema/Usuarios | `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_SECURITY_SETTINGS`, `MANAGE_BRANCHES`, `MANAGE_BRANCH_CHANNELS`, `MANAGE_CATALOGS`, `MANAGE_BRANDING` |
| Transferencias | `MANAGE_TRANSFERS`, `SEND_TRANSFERS`, `RECEIVE_TRANSFERS`, `CANCEL_TRANSFERS` |
| Consignaciones | `MANAGE_CONSIGNMENTS`, `SETTLE_CONSIGNMENTS`, `CANCEL_CONSIGNMENTS` |
| Caja | `MANAGE_CASH_CLOSURES` |
| Devoluciones/Reembolsos | `MANAGE_RETURNS`, `MANAGE_REFUNDS`, `REQUEST_REFUND`, `APPROVE_REFUND`, `PROCESS_REFUND`, `CANCEL_REFUND` |
| Envios/Incidencias | `MANAGE_SHIPMENTS`, `MANAGE_INCIDENTS` |

## Permisos faltantes o ambiguos

| Necesidad | Estado |
|---|---|
| Crear cliente | No se encontro `CREATE_CUSTOMER`, `CREATE_CUSTOMERS`, `ADD_CUSTOMER`, `CREATE_CLIENT`, `ADD_CLIENT` ni `MANAGE_CUSTOMERS` |
| Editar cliente | No se encontro `EDIT_CUSTOMER` ni equivalente fino |
| Ver pagos | No se encontro `VIEW_PAYMENTS` ni `VIEW_PAYMENT`; `VIEW_DEPOSIT_REPORTS` no equivale a consulta general de pagos |
| Crear prenda | No se confirmo `CREATE_ITEM` persistido; aparece solo como dependencia sugerida frontend |
| Editar prenda | No se confirmo `EDIT_ITEM` persistido; aparece solo como dependencia sugerida frontend |
| Crear lote | No existe permiso fino; actualmente se agrupa en `MANAGE_INVENTORY` |
| Recibir/clasificar/reconciliar lote | No existe permiso fino; actualmente se agrupa en `MANAGE_INVENTORY` |
| Ver ventas | No se confirmo permiso base separado; operaciones usan permisos de venta/cancelacion |

## Roles existentes observados

| Rol | Origen observado | Comentario |
|---|---|---|
| `NO_ACCESS` | datasets QA | Debe quedar sin permisos efectivos; AUTH-A bloquea login |
| `QA_TENANT_ADMIN` | `docs/qa/07-empresa-ab-tenant-qa.sql` | Rol QA para empresa A/B |
| `QA_TENANT_SELLER` | `docs/qa/07-empresa-ab-tenant-qa.sql` | Rol QA vendedor empresa A/B |
| Roles base de seed | migraciones V2/V5/V12/V28/V31 | Requieren normalizacion documental final por ambiente |

## Matriz endpoint backend -> permiso actual/esperado

Notas:

- Todos los endpoints bajo `/api/**` deben considerarse protegidos por token salvo excepciones explicitamente publicas.
- La columna `Permiso actual` documenta enforcement observado en servicios/controladores.
- La columna `Permiso esperado` propone el permiso funcional futuro; no se implementa en AUTH-F.

| Modulo | Metodo/ruta | Controlador | Token | Tenant | Permiso actual observado | Permiso esperado | Riesgo |
|---|---|---|---|---|---|---|---|
| Auth | `POST /api/auth/login` | `AuthController` | No | Valida company/branch al crear sesion | Credenciales + AUTH-A | Publico controlado | Bajo |
| Auth | `POST /api/auth/logout`, `change-password` | `AuthController` | Si | Sesion activa | Token/sesion | Token/sesion | Medio |
| Health | `GET /api/health` | `HealthController` | No | No aplica | Publico tecnico | Publico tecnico minimo | Bajo |
| Me | `GET /api/me`, `/permissions`, `/channels` | `MeController` | Si | Sesion activa | Token/sesion | Token/sesion | Medio |
| Access | `GET /api/access/can` | `AccessCheckController` | Si | Opcional por canal/branch | Permiso dinamico solicitado | Mantener dinamico | Medio |
| Usuarios | `/api/users/**` | `UserAdminController` | Si | Sesion activa | `MANAGE_USERS` | `MANAGE_USERS` | Medio |
| Roles | `/api/roles/**` | `RoleAdminController` | Si | Sesion activa | `MANAGE_ROLES` | `MANAGE_ROLES` | Medio |
| Permisos | `GET /api/permissions` | `PermissionAdminController` | Si | Sesion activa | Admin usuarios/roles segun servicio | `MANAGE_ROLES` o `MANAGE_SECURITY_SETTINGS` | Medio |
| Seguridad | `/api/security/settings/**` | `SecuritySettingsController` | Parcial | No aplica/publico en `/public` | `MANAGE_SECURITY_SETTINGS` para privado | Mantener | Medio |
| Sesiones | `/api/security/sessions/**` | `SecuritySessionsController` | Si | Sesion activa | Administracion seguridad | `MANAGE_SECURITY_SETTINGS` | Alto si se expone sin permiso |
| Apariencia | `/api/appearance` | `AppearanceSettingsController` | Si | Sesion activa | `MANAGE_BRANDING` | `MANAGE_BRANDING` | Medio |
| Sucursales | `/api/branches/**` | `BranchController` | Si | Parcial por branch | No confirmado permiso funcional | `MANAGE_BRANCHES` para escritura, lectura por tenant | Alto |
| Canales sucursal | `/api/branch-sales-channels/**` | `BranchSalesChannelController` | Si | Branch | `MANAGE_BRANCH_CHANNELS` | `MANAGE_BRANCH_CHANNELS` | Medio |
| Catalogos | `/api/brands`, `/sizes`, `/product-types`, `/payment-methods`, `/sales-channels` | Controladores catalogo | Si | Segun catalogo | `MANAGE_CATALOGS` o `MANAGE_ROLES` en canales | Mantener por catalogo | Medio |
| Suppliers | `/api/suppliers/**` | `SupplierController` | Si | Tenant indirecto | Lectura permite `VIEW_INVENTORY`/`MANAGE_CATALOGS`; escritura `MANAGE_CATALOGS` | Definir lectura/escritura por proveedor tenant-aware | Medio |
| Clientes | `GET /api/customers/branch/{branchId}`, `/{id}`, telefono, generico | `CustomerController` | Si | Customers tenant-aware | No confirmado permiso funcional | `VIEW_CUSTOMERS` | Alto |
| Clientes | `POST /api/customers/branch/{branchId}` | `CustomerController` | Si | Customers tenant-aware | No confirmado permiso funcional | Permiso faltante `CREATE_CUSTOMER` o equivalente | Critico |
| Clientes | `PUT /api/customers/{id}`, `PATCH /deactivate` | `CustomerController` | Si | Customers tenant-aware | No confirmado permiso funcional | Permiso faltante `EDIT_CUSTOMER`/`DEACTIVATE_CUSTOMER` | Alto |
| Direcciones cliente | `/api/customer-addresses/**` | `CustomerAddressController` | Si | Via customer | No confirmado permiso funcional | `VIEW_CUSTOMERS`/permiso cliente escritura | Alto |
| Historial propietario | `/api/customer-owner-history/**` | `CustomerOwnerHistoryController` | Si | Via customer | `REASSIGN_CUSTOMERS` esperado por flujo | `REASSIGN_CUSTOMERS` | Medio |
| Ordenes cliente | `/api/customer-orders/**` | `CustomerOrderController` | Si | Branch/customer | No confirmado permiso funcional | `VIEW_CUSTOMER_ORDERS` | Alto |
| Inventario | `GET /api/items/**` | `ItemController` | Si | Items tenant-aware | `VIEW_INVENTORY`/`MANAGE_INVENTORY` segun servicio | Mantener lectura `VIEW_INVENTORY` | Medio |
| Inventario | `POST/PUT/PATCH /api/items/**` | `ItemController` | Si | Items tenant-aware | `MANAGE_INVENTORY` | `MANAGE_INVENTORY` hasta definir `CREATE_ITEM`/`EDIT_ITEM` | Medio |
| Lotes | `GET /api/batches/**` | `BatchController` | Si | Batches tenant-aware | `VIEW_INVENTORY` | Mantener o crear permiso lote lectura | Medio |
| Lotes | `POST/PATCH/PUT /api/batches/**` | `BatchController` | Si | Batches tenant-aware | `MANAGE_INVENTORY` | Mantener o crear permisos lote finos | Medio |
| Ubicaciones/Cajas | `/api/storage-locations/**`, `/api/boxes/**` | Inventario | Si | Branch | No confirmado permiso funcional completo | `VIEW_INVENTORY`/`MANAGE_INVENTORY` | Alto |
| En vivo | `/api/lives/branch/{branchId}`, `/{id}` | `LiveController` | Si | Branch/company | `DO_LIVE_RESERVATION` observado | Separar `VIEW_LIVE` futuro si se requiere presentadora solo vista | Medio |
| En vivo | `POST /api/lives/branch/{branchId}`, activar/cerrar | `LiveController` | Si | Branch/company | `DO_LIVE_RESERVATION` | `MANAGE_LIVE` futuro si se separa operacion | Medio |
| Reservas | `GET /api/reservations/**` | `ReservationController` | Si | Branch/reservation | No confirmado permiso lectura fino | `DO_LIVE_RESERVATION`/`DO_DOOR_RESERVATION` o `VIEW_RESERVATIONS` futuro | Alto |
| Reservas | `POST /api/reservations` | `ReservationController` | Si | Branch/canal | `DO_LIVE_RESERVATION` o `DO_DOOR_RESERVATION` por canal | Mantener | Medio |
| Reservas | `PATCH /api/reservations/{id}/cancel` | `ReservationController` | Si | Reservation | `CANCEL_RESERVATION` | Mantener | Medio |
| Ventas | `GET /api/sales/**` | `SaleController` | Si | Branch/sale | No confirmado permiso lectura fino | `VIEW_SALES` futuro | Alto |
| Ventas | `POST /api/sales` | `SaleController` | Si | Canal/branch | `DO_DOOR_SALE` | Mantener | Medio |
| Ventas | `PATCH /api/sales/{saleId}/cancel` | `SaleController` | Si | Sale | `CANCEL_SALE` | Mantener | Medio |
| Pagos | `POST /api/payments/**` | `PaymentController` | Si | Payment target | `REGISTER_PAYMENTS` | Mantener | Medio |
| Pagos | `GET /api/payments/{id}`, `/customer/{id}`, `/reservation/{id}` | `PaymentController` | Si | Customer/reservation | No existe `VIEW_PAYMENTS`; lectura queda ambigua | Definir `VIEW_PAYMENTS` o permiso equivalente | Alto |
| Pagos | `PATCH /api/payments/{paymentId}/void` | `PaymentController` | Si | Payment | `VOID_PAYMENT` | Mantener | Medio |
| Saldo | `/api/balance/**` | `BalanceController` | Si | Customer/branch | `APPLY_CUSTOMER_BALANCE` para aplicar/revertir; lectura ambigua | Separar lectura saldo si aplica | Alto |
| Caja | `/api/cash-closures/**` | `CashClosureController` | Si | Branch | `MANAGE_CASH_CLOSURES` | Mantener | Medio |
| Reportes | `/api/reports/**` | Report controllers | Si | Branch/date | `VIEW_REPORTS` | Mantener, definir permisos especificos despues | Medio |
| Transferencias | `/api/transfers/**` | `BranchTransferController` | Si | Branches/items | `MANAGE_TRANSFERS`, `SEND_TRANSFERS`, `RECEIVE_TRANSFERS`, `CANCEL_TRANSFERS` | Mantener | Medio |
| Consignaciones | `/api/consignees/**`, `/api/consignments/**` | Consignment controllers | Si | Branch | `MANAGE_CONSIGNMENTS`, `SETTLE_CONSIGNMENTS`, `CANCEL_CONSIGNMENTS` | Mantener | Medio |
| Envios | `/api/shipments/**` | `ShipmentController` | Si | Branch/packages | No confirmado completo; permiso existente `MANAGE_SHIPMENTS` | `MANAGE_SHIPMENTS` | Alto |
| Devoluciones | `/api/returns/**` | `ReturnController` | Si | Sale/items | `MANAGE_RETURNS` esperado | `MANAGE_RETURNS` | Medio |
| Reembolsos | `/api/refunds/**` | `RefundController` | Si | Return/customer | `REQUEST_REFUND`, `APPROVE_REFUND`, `PROCESS_REFUND`, `CANCEL_REFUND`, `MANAGE_REFUNDS` | Mantener | Medio |
| Incidencias | `/api/incidents/**` | `IncidentController` | Si | Branch/shipment | Permiso existente `MANAGE_INCIDENTS`; enforcement completo pendiente de confirmar | `MANAGE_INCIDENTS` | Alto |
| Operacion | `GET /api/operation/menu` | `OperationMenuController` | Si | Sesion activa | Filtra por permisos | Mantener, corregir mapeo clientes si aplica | Medio |

## Matriz pantalla frontend -> permiso

| Pantalla/ruta | Permiso UI observado | Servicio/API principal | Guard directo | Riesgo |
|---|---|---|---|---|
| `/login` | Publica | `/api/auth/login` | No aplica | Bajo |
| `/` panel principal | Filtra menu por permisos/canales | `/api/me`, `/api/operation/menu` | Si, por item | Medio |
| `/dashboard` | Sesion valida | `/api/dashboard/me` | Parcial | Medio |
| `/customers` | `VIEW_CUSTOMERS` | `/api/customers/**` | Si | Backend cliente no confirma permiso funcional en todas las acciones |
| `/customers-create` | Hereda flujo de clientes | `/api/customers/branch/{branchId}` | Pendiente de confirmar directo | No existe permiso `CREATE_CUSTOMER` |
| `/items` | `VIEW_INVENTORY` o `MANAGE_INVENTORY` | `/api/items/**` | Si | Bajo/medio |
| `/items-create` | Operacion inventario | `/api/items` | Pendiente de confirmar directo | No hay `CREATE_ITEM` persistido |
| `/batches` | `VIEW_INVENTORY` o `MANAGE_INVENTORY` | `/api/batches/**` | Si | Permiso fino lote pendiente |
| `/live` | `DO_LIVE_RESERVATION` y helpers LIVE | `/api/lives`, customers/items/reservations | Si | Separacion presentadora/operador aun no existe en backend |
| `/payments` | `REGISTER_PAYMENTS` en menu | `/api/payments/**` | Parcial | Falta `VIEW_PAYMENTS` para consulta |
| `/door-sale` | `DO_DOOR_SALE` | ventas/pagos/items | Por menu/canal | Backend create cubierto; lectura venta pendiente |
| `/door-reservation`, `/reservations` | `DO_DOOR_RESERVATION` | `/api/reservations/**` | Por menu/canal | Lectura reserva fina pendiente |
| `/customer-orders` | `VIEW_CUSTOMER_ORDERS` | `/api/customer-orders/**` | Por menu | Backend pendiente de confirmar |
| `/customer-packages` | `CREATE_CLOSE_CUSTOMER_PACKAGE` | `/api/customer-packages/**` | Por menu | Dependencia `VIEW_CUSTOMERS` no bloqueante |
| `/transfers` | `MANAGE_TRANSFERS` | `/api/transfers/**` | Por menu | Acciones finas send/receive/cancel backend |
| `/consignments` | `MANAGE_CONSIGNMENTS` | `/api/consignments/**` | Por menu/canal | Acciones finas backend |
| `/returns` | `MANAGE_RETURNS` | `/api/returns/**` | Por menu | Medio |
| `/refunds` | `MANAGE_REFUNDS` | `/api/refunds/**` | Por menu | Acciones finas backend |
| `/cash-closures` | `MANAGE_CASH_CLOSURES` | `/api/cash-closures/**` | Por menu | Medio |
| `/shipments` | `MANAGE_SHIPMENTS` | `/api/shipments/**` | Por menu | Backend enforcement completo pendiente |
| `/incidents` | `MANAGE_INCIDENTS` | `/api/incidents/**` | Por menu | Backend enforcement completo pendiente |
| `/reports`, `/movement-history`, `/report-live` | `VIEW_REPORTS` | `/api/reports/**` | Por menu | Permisos especificos por reporte pendientes |
| `/system` | `MANAGE_ROLES`/admin | seguridad/configuracion | Si | Medio |
| `/users`, `/users-form` | `MANAGE_USERS` | `/api/users/**` | Si | Medio |
| `/system-roles` | `MANAGE_ROLES` | `/api/roles`, `/api/permissions` | Si | Medio |
| `/branches` | `MANAGE_BRANCHES`/admin | `/api/branches/**` | Por menu/admin | Backend branch permiso pendiente |
| `/catalogs` | `MANAGE_CATALOGS` | catalogos | Por menu | Medio |
| `/channels` | `MANAGE_BRANCH_CHANNELS` | branch-sales-channels | Por menu | Medio |
| `/appearance` | Admin only UI | `/api/appearance` | Admin UI | Backend usa `MANAGE_BRANDING`; UI debe alinearse |

## Huecos detectados

### Backend sin permiso funcional confirmado

- Clientes: alta, edicion, baja, direccion e historial dependen de tenant, pero no se confirmo enforcement funcional uniforme en todos los endpoints.
- Pagos: consultas `GET` no pueden usar `VIEW_PAYMENTS` porque no existe en catalogo.
- Ventas: lectura de ventas no tiene permiso base confirmado.
- Sucursales, cajas/ubicaciones, envios e incidencias requieren confirmacion endpoint por endpoint.
- Reportes usan `VIEW_REPORTS` global; permisos especificos por reporte quedan para fase posterior.

### Frontend con guard mayor que backend

- `/customers` bloquea con `VIEW_CUSTOMERS`, pero backend de clientes debe ser fuente final.
- `/payments` se expone por `REGISTER_PAYMENTS`, pero las consultas de pagos no tienen permiso de lectura dedicado.
- LIVE usa helpers frontend por rol/capacidad; backend todavia opera principalmente con `DO_LIVE_RESERVATION`.

### Permisos sugeridos que no existen

- `VIEW_PAYMENTS` aparece como dependencia sugerida para `REGISTER_PAYMENTS` y `VOID_PAYMENT`, pero no existe en catalogo revisado.
- `CREATE_CUSTOMER`/`EDIT_CUSTOMER` no existen.
- `CREATE_ITEM`/`EDIT_ITEM` aparecen como dependencias preparatorias frontend, no como permisos persistidos confirmados.

### Dependencias huerfanas

| Dependencia | Estado | Decision AUTH-F |
|---|---|---|
| `VIEW_PAYMENTS` | No existe | Documentar deuda, no usar como enforcement |
| `CREATE_ITEM` | No confirmado persistido | No inventar |
| `EDIT_ITEM` | No confirmado persistido | No inventar |

## Casos prioritarios

### Clientes

Estado:

- `VIEW_CUSTOMERS` existe y se usa en menu/frontend.
- No existe permiso especifico de alta de clientes.
- Backend customers ya es tenant-aware, pero AUTH-F no confirma RBAC fino completo.

Permiso esperado futuro:

- `VIEW_CUSTOMERS` para lectura.
- `CREATE_CUSTOMER` o nombre aprobado para alta.
- `EDIT_CUSTOMER`/`DEACTIVATE_CUSTOMER` si negocio requiere separacion fina.

### Pagos

Estado:

- `REGISTER_PAYMENTS` y `VOID_PAYMENT` existen.
- `VIEW_PAYMENTS` no existe.
- `VIEW_DEPOSIT_REPORTS` existe en migracion/dataset, pero solo cubre reporte de depositos.

Permiso esperado futuro:

- Definir `VIEW_PAYMENTS` o permiso equivalente antes de separar consulta de registro/anulacion.

### Inventario

Estado:

- `VIEW_INVENTORY` y `MANAGE_INVENTORY` existen.
- Items y batches ya usan tenant-aware.
- No hay permisos finos confirmados para crear/editar prenda ni recibir/clasificar lote.

Permiso esperado futuro:

- Mantener `MANAGE_INVENTORY` como permiso amplio hasta aprobar granularidad.
- Evaluar `CREATE_ITEM`, `EDIT_ITEM`, `MANAGE_BATCHES`, `RECEIVE_BATCHES` solo con catalogo formal.

### Usuarios/Roles

Estado:

- `MANAGE_USERS`, `MANAGE_ROLES` y `MANAGE_SECURITY_SETTINGS` existen.
- AUTH-A protege login y sesion unica.
- UI de roles/permisos muestra dependencias no bloqueantes.

Permiso esperado futuro:

- Mantener separacion usuarios/roles/configuracion.
- Agregar pruebas backend por endpoint administrativo.

## Recomendaciones de subfases

| Subfase | Objetivo | Criterio de salida |
|---|---|---|
| AUTH-F1 | Cerrar catalogo RBAC aprobado | Lista final de permisos nuevos/renombrados sin ambiguedades |
| AUTH-F2 | Crear migracion de catalogo si se aprueba | Flyway agrega solo permisos aprobados, sin asignaciones peligrosas |
| AUTH-F3 | Enforcement backend P0 | Clientes, pagos consulta, inventario y LIVE bloquean por permiso funcional |
| AUTH-F4 | Tests de seguridad backend | Pruebas 401/403 por permiso, tenant y sesion revocada |
| AUTH-F5 | Alinear frontend | UI usa permisos reales backend y no permisos inventados |
| AUTH-F6 | QA matriz rol-usuario | QA_A/QA_B/admin/vendedor/sin permisos validados por endpoint y pantalla |

## Decision AUTH-F inicial

Estado: `GO diagnostico`.

No se recomienda implementar enforcement fuerte hasta que negocio apruebe:

- Nombre y alcance de permisos faltantes.
- Matriz permiso -> endpoint.
- Dependencias obligatorias vs advertencias.
- Estrategia de asignacion inicial para roles existentes.

