# AUTH-F2 - Aprobacion de catalogo RBAC minimo

Fecha: 2026-05-24  
Rama: `feature/auth-f2-rbac-catalog-approval`  
Base: `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`

## A. Objetivo

Definir una propuesta formal de catalogo RBAC minimo para decidir que permisos se implementaran despues. AUTH-F2 no crea permisos, no modifica roles, no agrega SQL, no crea migraciones y no cambia enforcement backend.

Objetivos especificos:

- Separar permisos confirmados, permisos propuestos, permisos pendientes y permisos que conviene postergar.
- Identificar el MVP de permisos nuevos con mejor balance entre seguridad, claridad operativa y bajo riesgo.
- Servir como base para una futura migracion controlada de catalogo.
- Evitar inventar permisos desde frontend o documentacion sin aprobacion de negocio/backend.

## B. Catalogo actual confirmado

| Modulo | Permisos confirmados | Estado |
|---|---|---|
| Clientes | `VIEW_CUSTOMERS`, `VIEW_CUSTOMER_ORDERS`, `REASSIGN_CUSTOMERS`, `APPLY_CUSTOMER_BALANCE`, `CREATE_CLOSE_CUSTOMER_PACKAGE` | Confirmados |
| Inventario | `VIEW_INVENTORY`, `MANAGE_INVENTORY` | Confirmados |
| Lotes | Usa `VIEW_INVENTORY` y `MANAGE_INVENTORY`; no hay permiso fino propio | Agrupado temporalmente |
| Pagos | `REGISTER_PAYMENTS`, `VOID_PAYMENT` | Confirmados |
| Ventas | `DO_DOOR_SALE`, `CANCEL_SALE` | Confirmados |
| Reservas | `DO_LIVE_RESERVATION`, `DO_DOOR_RESERVATION`, `CANCEL_RESERVATION` | Confirmados |
| En vivo | `DO_LIVE_RESERVATION` | Confirmado, alcance amplio |
| Reportes | `VIEW_REPORTS`; `VIEW_DEPOSIT_REPORTS` existe en migracion/dataset pero no en `PermissionCode.java` | Confirmacion parcial |
| Sistema/Usuarios | `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_SECURITY_SETTINGS`, `MANAGE_BRANCHES`, `MANAGE_BRANCH_CHANNELS`, `MANAGE_CATALOGS`, `MANAGE_BRANDING` | Confirmados |
| Transferencias | `MANAGE_TRANSFERS`, `SEND_TRANSFERS`, `RECEIVE_TRANSFERS`, `CANCEL_TRANSFERS` | Confirmados |
| Consignaciones | `MANAGE_CONSIGNMENTS`, `SETTLE_CONSIGNMENTS`, `CANCEL_CONSIGNMENTS` | Confirmados |
| Caja | `MANAGE_CASH_CLOSURES` | Confirmado |
| Devoluciones/Reembolsos | `MANAGE_RETURNS`, `MANAGE_REFUNDS`, `REQUEST_REFUND`, `APPROVE_REFUND`, `PROCESS_REFUND`, `CANCEL_REFUND` | Confirmados |
| Envios/Incidencias | `MANAGE_SHIPMENTS`, `MANAGE_INCIDENTS` | Confirmados, enforcement completo pendiente de validar |

## C. Permisos nuevos propuestos

| Codigo sugerido | Nombre humano | Modulo | Justificacion | Endpoints que cubriria | Pantallas afectadas | Prioridad | Riesgo de NO crearlo | Riesgo de crearlo ahora |
|---|---|---|---|---|---|---|---|---|
| `CREATE_CUSTOMER` | Crear clientes | Clientes | Separar lectura de alta de clientes, especialmente en LIVE y operaciones rapidas. | `POST /api/customers/branch/{branchId}` | `/customers-create`, alta rapida desde `/live` | P0 | Usuarios con solo lectura podrian crear clientes si backend no distingue alta. | Requiere migracion, asignacion a roles y enforcement; podria bloquear flujos si QA/roles no se actualizan. |
| `EDIT_CUSTOMER` | Editar clientes | Clientes | Separar consulta de cambios de datos maestros. | `PUT /api/customers/{id}`, direcciones cliente | `/customers`, formularios de edicion | P0/P1 | Usuarios de consulta podrian alterar datos si endpoint queda sin permiso fino. | Necesita revisar todos los flujos que actualizan cliente para no bloquear operacion. |
| `DEACTIVATE_CUSTOMER` | Desactivar clientes | Clientes | Accion de mayor impacto que edicion simple. | `PATCH /api/customers/{id}/deactivate`, direcciones si aplica | `/customers` | P1 | Baja accidental o no autorizada si se agrupa con edicion. | Puede ser excesivo para MVP si no hay operacion frecuente de baja. |
| `VIEW_PAYMENTS` | Ver pagos | Pagos | Resolver dependencia huerfana y separar consulta de registro/anulacion. | `GET /api/payments/{id}`, `/customer/{id}`, `/reservation/{id}` | `/payments`, detalle cobro/reserva | P0 | No hay forma limpia de consultar pagos sin permiso de registrar pagos. | Requiere ajustar roles y pantallas para no bloquear cobros existentes. |
| `VIEW_SALES` | Ver ventas | Ventas | Separar lectura historica/operativa de crear venta o cancelar. | `GET /api/sales/branch/{branchId}`, `GET /api/sales/{id}` | `/door-sale`, futuras consultas ventas | P0/P1 | Usuarios pueden necesitar ver ventas sin permiso de crear/cancelar. | Puede exigir revisar reportes/pagos relacionados para no duplicar responsabilidades. |
| `CREATE_ITEM` | Crear prendas | Inventario | Separar alta de inventario de administracion total. | `POST /api/items` | `/items-create`, alta rapida desde `/live` | P1 | `MANAGE_INVENTORY` sigue siendo demasiado amplio para alta simple. | Puede fragmentar inventario antes de tener matriz completa de estados/prenda. |
| `EDIT_ITEM` | Editar prendas | Inventario | Separar modificaciones de prenda de administracion global. | `PUT /api/items/{id}`, `PATCH /location/{id}` si aplica | `/items`, edicion inventario | P1 | Usuarios con alta podrian no necesitar modificar datos existentes. | Requiere definir diferencia con `MANAGE_INVENTORY`. |
| `CREATE_BATCH` | Crear lotes | Lotes | Separar recepcion inicial de lote de otras acciones. | `POST /api/batches/branch/{branchId}` | `/batches` | Futuro/P1 | `MANAGE_INVENTORY` mantiene lote demasiado amplio. | Prematuro si lotes aun operan bien agrupados. |
| `RECEIVE_BATCH` | Recibir lotes | Lotes | Controlar recepcion fisica de lote. | `PATCH /api/batches/{id}/receive` | `/batches` | Futuro/P1 | Cualquier manager inventario podria recibir lote. | Requiere validar proceso real de almacen. |
| `CLASSIFY_BATCH` | Clasificar lotes | Lotes | Controlar clasificacion/calidad. | `PUT /api/batches/{id}/classification` | `/batches` | Futuro/P1 | Sin separacion de calidad vs recepcion. | Permiso fino puede complicar QA si no hay roles operativos claros. |
| `RECONCILE_BATCH` | Conciliar lotes | Lotes | Accion sensible para cerrar diferencias. | `PATCH /api/batches/{id}/reconcile` | `/batches` | Futuro/P1 | Conciliacion queda bajo permiso amplio. | Requiere auditoria/criterios de conciliacion antes. |
| `CANCEL_BATCH` | Cancelar lotes | Lotes | Accion destructiva/critica sobre lote. | `PATCH /api/batches/{id}/cancel` | `/batches` | Futuro/P1 | Cancelacion queda bajo permiso amplio. | Requiere reglas de auditoria y rollback operativo. |
| `VIEW_RESERVATIONS` | Ver reservas | Reservas | Separar consulta de reservas de creacion por canal. | `GET /api/reservations/**` | `/reservations`, `/live`, cobro desde reserva | P1 | Usuarios con solo consulta necesitan permiso de crear reserva. | Debe alinearse con LIVE/puerta para no romper flujo de cobro. |
| `VIEW_LIVE` | Ver En vivo | En vivo | Permitir presentadora/supervisor solo vista sin operar reservas. | `GET /api/lives/**` | `/live` vista presentadora/supervisor | P1 | `DO_LIVE_RESERVATION` mezcla vista y operacion. | Puede requerir separar UX/roles LIVE con mas claridad. |
| `MANAGE_LIVE` | Administrar En vivo | En vivo | Separar abrir/activar/cerrar transmision de registrar reserva. | `POST /api/lives/**`, activar/cerrar | `/live` controles transmision | Futuro/P1 | Operador de reserva puede abrir/cerrar transmision sin separacion. | Puede ser prematuro si LIVE aun opera con un solo permiso. |

## D. Permisos que NO conviene crear todavia

| Permiso o familia | Decision recomendada | Motivo |
|---|---|---|
| `CREATE_ITEM`, `EDIT_ITEM` | Postergar a P1 | `MANAGE_INVENTORY` ya cubre escritura. Conviene no fragmentar inventario hasta cerrar reglas de prenda, estados y roles operativos. |
| Permisos finos de lotes (`CREATE_BATCH`, `RECEIVE_BATCH`, `CLASSIFY_BATCH`, `RECONCILE_BATCH`, `CANCEL_BATCH`) | Postergar a P1/futuro | Lotes ya estan tenant-aware y usan `MANAGE_INVENTORY`. La granularidad debe venir con auditoria y QA especifico. |
| `VIEW_RESERVATIONS` | Postergar a P1 | Es util, pero toca LIVE, puerta, cobros y listas. Conviene implementarlo despues de clientes/pagos. |
| `VIEW_LIVE`, `MANAGE_LIVE` | Postergar a P1/futuro | LIVE sigue estabilizando UX/operacion; `DO_LIVE_RESERVATION` puede mantenerse temporalmente. |
| Permisos especificos por reporte | Postergar | `VIEW_REPORTS` global reduce complejidad mientras no haya matriz de reportes por rol. |
| Permisos finos de direcciones cliente | Postergar | Pueden quedar cubiertos por `EDIT_CUSTOMER` hasta requerir separacion fiscal/logistica. |

## E. Dependencias RBAC recomendadas

### Dependencias validas porque el permiso existe

| Permiso seleccionado | Requiere/recomienda | Tipo |
|---|---|---|
| `REASSIGN_CUSTOMERS` | `VIEW_CUSTOMERS` | Recomendado fuerte |
| `APPLY_CUSTOMER_BALANCE` | `VIEW_CUSTOMERS` | Recomendado fuerte |
| `CREATE_CLOSE_CUSTOMER_PACKAGE` | `VIEW_CUSTOMERS` | Recomendado fuerte |
| `VIEW_CUSTOMER_ORDERS` | `VIEW_CUSTOMERS` | Recomendado fuerte |
| `MANAGE_INVENTORY` | `VIEW_INVENTORY` | Recomendado fuerte |
| `VIEW_REPORT_*` futuro | `VIEW_REPORTS` | Recomendado |

### Dependencias huerfanas porque el permiso no existe

| Permiso seleccionado | Dependencia huerfana | Decision |
|---|---|---|
| `REGISTER_PAYMENTS` | `VIEW_PAYMENTS` | Convertir en dependencia valida solo si se aprueba `VIEW_PAYMENTS`. |
| `VOID_PAYMENT` | `VIEW_PAYMENTS` | Convertir en dependencia valida solo si se aprueba `VIEW_PAYMENTS`. |

### Dependencias futuras si se aprueban permisos nuevos

| Permiso nuevo | Dependencia recomendada | Comentario |
|---|---|---|
| `CREATE_CUSTOMER` | Puede operar sin `VIEW_CUSTOMERS`, pero normalmente se asignara junto con `VIEW_CUSTOMERS` | Alta rapida puede requerir crear sin navegar toda la cartera; negocio debe decidir. |
| `EDIT_CUSTOMER` | `VIEW_CUSTOMERS` | No deberia editarse lo que no se puede consultar. |
| `DEACTIVATE_CUSTOMER` | `VIEW_CUSTOMERS`, posiblemente `EDIT_CUSTOMER` | Accion sensible. |
| `CREATE_ITEM` | `VIEW_INVENTORY` | Alta debe poder validar inventario/codigo existente. |
| `EDIT_ITEM` | `VIEW_INVENTORY` | Edicion requiere consultar prenda. |
| `CREATE_BATCH` | `VIEW_INVENTORY` | Lote afecta inventario. |
| `RECEIVE_BATCH` | `VIEW_INVENTORY` | Recepcion debe ver lote/inventario. |
| `CLASSIFY_BATCH` | `VIEW_INVENTORY` | Clasificacion debe ver lote/prendas. |
| `RECONCILE_BATCH` | `VIEW_INVENTORY` | Conciliacion debe ver lote/prendas. |
| `CANCEL_BATCH` | `VIEW_INVENTORY` | Cancelacion debe ver lote. |
| `VIEW_RESERVATIONS` | Ninguna adicional | Permiso base de lectura. |
| `VIEW_LIVE` | Ninguna adicional | Permiso base de vista. |
| `MANAGE_LIVE` | `VIEW_LIVE` | Administracion debe poder ver transmision. |
| `VIEW_SALES` | Ninguna adicional | Permiso base de lectura ventas. |
| `VIEW_PAYMENTS` | Ninguna adicional | Permiso base de lectura pagos. |

## F. Decision recomendada por fases

| Subfase | Alcance | Entregable | Restriccion clave |
|---|---|---|---|
| AUTH-F2A | Aprobacion documental de catalogo | Este documento aprobado por negocio/arquitectura | Sin SQL ni codigo |
| AUTH-F2B | Migracion Flyway para permisos minimos aprobados | Permisos nuevos insertados idempotentemente | Sin asignar permisos de alto riesgo automaticamente |
| AUTH-F2C | Seeds/datasets QA | QA roles actualizados para probar permisos nuevos | Solo datos QA/controlados |
| AUTH-F2D | Frontend muestra permisos nuevos | Catalogo UI y dependencias ya no quedan huerfanas | Sin inventar permisos no migrados |
| AUTH-F2E | Enforcement backend por modulos no financieros primero | Clientes/inventario/LIVE lectura operan por permiso | No tocar pagos/ventas hasta tener pruebas |
| AUTH-F2F | Pruebas negativas por API | Tests 401/403 por permiso, tenant y rol | Bloquear merge si hay bypass |

## G. Recomendacion de permisos minimos para crear primero

### MVP recomendado

| Permiso | Decision | Justificacion |
|---|---|---|
| `CREATE_CUSTOMER` | Incluir en MVP | Es el hueco mas visible en LIVE/clientes. Permite separar alta de lectura y controlar cliente nuevo. |
| `EDIT_CUSTOMER` | Incluir en MVP | Completa separacion minima de datos maestros cliente. |
| `VIEW_PAYMENTS` | Incluir en MVP | Resuelve dependencia huerfana y permite consultar pagos sin conceder registro/anulacion. |
| `VIEW_SALES` | Incluir en MVP condicionado | Util para lectura de ventas, pero debe entrar con mucho cuidado por relacion con pagos/reportes. |

### MVP alternativo mas conservador

Si se quiere evitar tocar ventas en la siguiente subfase, crear primero solo:

- `CREATE_CUSTOMER`
- `EDIT_CUSTOMER`
- `VIEW_PAYMENTS`

`VIEW_SALES` puede pasar a P1 si no hay pantalla/endpoint de consulta que requiera separacion inmediata.

### No incluir en primer MVP

- `DEACTIVATE_CUSTOMER`: sensible, mejor despues de validar `EDIT_CUSTOMER`.
- `CREATE_ITEM`/`EDIT_ITEM`: mantener temporalmente en `MANAGE_INVENTORY`.
- Permisos finos de lotes: mantener temporalmente en `MANAGE_INVENTORY`.
- `VIEW_RESERVATIONS`, `VIEW_LIVE`, `MANAGE_LIVE`: utiles pero deben alinearse con UX LIVE y roles presentadora/operador/supervisor.

## Decision recomendada AUTH-F2

Estado recomendado: `GO documental condicionado`.

Catalogo minimo candidato para aprobar:

1. `CREATE_CUSTOMER`
2. `EDIT_CUSTOMER`
3. `VIEW_PAYMENTS`
4. `VIEW_SALES` condicionado a no tocar enforcement de ventas hasta tener pruebas negativas.

No declarar RBAC fino completo hasta que existan:

- Migracion Flyway aprobada.
- Seeds QA actualizados.
- Frontend alineado con catalogo real.
- Enforcement backend por endpoint.
- Pruebas negativas automatizadas y smoke QA por rol.

## Seguimiento AUTH-F3

AUTH-F3 implementa el catalogo minimo y enforcement P0 inicial. Ver:

- `docs/AUTH_F3_RBAC_PERMISSIONS_ENFORCEMENT.md`

AUTH-F2 se conserva como documento de aprobacion; los permisos dejan de ser propuesta solo cuando la migracion V44 y el enforcement AUTH-F3 esten aplicados y validados.

