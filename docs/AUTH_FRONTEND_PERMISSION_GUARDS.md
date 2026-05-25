# AUTH-A - Guards frontend por permisos

Fecha: 2026-05-22  
Rama: `feature/auth-a-rbac-single-session`

## Objetivo

Alinear la navegacion frontend con permisos reales devueltos por login y `/api/me`, sin reemplazar la seguridad backend.

## Helpers

Archivo principal:

- `services/accessControl.ts`
- `services/permissionDependencies.ts` para agrupacion visual y advertencias no bloqueantes.

Helpers disponibles:

- `can(user, permission)`
- `hasPermission(user, permission)`
- `hasAnyPermission(user, permissions)`
- `hasRole(user, role)`
- `isNoAccess(user)`
- `canAccess(user, channel, permission)`
- `canAccessByPermission(user, permission)`

## Pantallas cubiertas

| Pantalla | Regla |
|---|---|
| Menu principal | Filtra accesos por permiso/canal |
| En vivo | Usa permisos LIVE para ver/operar/crear |
| Sistema | Bloquea navegacion directa sin permiso |
| Usuarios | Bloquea navegacion directa sin `MANAGE_USERS` |
| Clientes | Bloquea navegacion directa sin `VIEW_CUSTOMERS` |
| Inventario | Bloquea navegacion directa sin `VIEW_INVENTORY` o `MANAGE_INVENTORY` |
| Lotes | Bloquea navegacion directa sin `VIEW_INVENTORY` o `MANAGE_INVENTORY` |

## Reglas de UX

- Ocultar acciones no permitidas.
- Bloquear rutas directas sensibles con `/access-denied`.
- No convertir errores 403 en exito silencioso.
- No usar guards frontend como unica defensa.
- Si un request protegido devuelve `401` por token revocado, limpiar sesion local, volver a `/login` y mostrar aviso claro de sesion cerrada en otro equipo.
- En selectores de permisos, mostrar primero la descripcion humana y dejar el codigo tecnico como referencia secundaria.
- En selectores/listados de seguridad, usar la estructura: nombre humano, codigo tecnico, estado/accion.
- Los permisos se agrupan visualmente por modulo inferido y se ordenan alfabeticamente por descripcion humana dentro de cada grupo.
- El filtro de permisos busca por descripcion, codigo tecnico y grupo.

## Dependencias sugeridas de permisos

Estas dependencias son advertencias frontend/documentales. No bloquean guardado, no agregan permisos automaticamente y no reemplazan validacion backend.

Archivo de referencia:

- `services/permissionDependencies.ts`

| Permiso seleccionado | Puede requerir |
|---|---|
| `REASSIGN_CUSTOMERS` | `VIEW_CUSTOMERS` |
| `APPLY_CUSTOMER_BALANCE` | `VIEW_CUSTOMERS` |
| `CREATE_CLOSE_CUSTOMER_PACKAGE` | `VIEW_CUSTOMERS` |
| `VIEW_CUSTOMER_ORDERS` | `VIEW_CUSTOMERS` |
| `MANAGE_INVENTORY` | `VIEW_INVENTORY` |
| `CREATE_ITEM` | `VIEW_INVENTORY` |
| `EDIT_ITEM` | `VIEW_INVENTORY` |
| `REGISTER_PAYMENTS` | `VIEW_PAYMENTS` |
| `VOID_PAYMENT` | `VIEW_PAYMENTS` |
| `VIEW_REPORT_*` | `VIEW_REPORTS` |

Validacion de catalogo:

- Dependencias validas en catalogo revisado: `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `VIEW_REPORTS`.
- Dependencias huerfanas detectadas: `VIEW_PAYMENTS`.
- `VIEW_DEPOSIT_REPORTS` existe, pero no se considera equivalente a `VIEW_PAYMENTS` porque solo cubre reporte de depositos.

Nota sobre clientes:

- En la revision AUTH-A no se encontro un permiso persistido `CREATE_CUSTOMER`, `CREATE_CUSTOMERS`, `ADD_CUSTOMER` ni `MANAGE_CUSTOMERS` en migraciones/datasets revisados.
- El permiso visible actual para el modulo clientes es `VIEW_CUSTOMERS`; existen tambien permisos relacionados como `REASSIGN_CUSTOMERS`, `APPLY_CUSTOMER_BALANCE` y `CREATE_CLOSE_CUSTOMER_PACKAGE`, pero no equivalen a alta simple de cliente.
- La matriz frontend no agrega dependencias para permisos de cliente inexistentes. Si despues se crea `CREATE_CUSTOMER` o `EDIT_CUSTOMER`, debera agregarse formalmente a la matriz y validarse en backend.

## Hallazgos del catalogo RBAC

Permisos existentes relevantes detectados:

- Clientes: `VIEW_CUSTOMERS`, `VIEW_CUSTOMER_ORDERS`, `REASSIGN_CUSTOMERS`, `APPLY_CUSTOMER_BALANCE`, `CREATE_CLOSE_CUSTOMER_PACKAGE`.
- Inventario: `VIEW_INVENTORY`, `MANAGE_INVENTORY`.
- En vivo: `DO_LIVE_RESERVATION`.
- Pagos: `REGISTER_PAYMENTS`, `VOID_PAYMENT`.
- Reportes: `VIEW_REPORTS`.
- Sistema/usuarios: `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_SECURITY_SETTINGS`.

Permisos faltantes o ambiguos probables:

- Alta de cliente: no existe permiso especifico confirmado.
- Edicion de cliente: no existe permiso especifico confirmado.
- Ver pagos: las dependencias esperan `VIEW_PAYMENTS`, pero debe confirmarse si existe en todos los ambientes.
- Ver ventas: no se confirmo permiso base separado.
- Crear/editar prenda: la matriz contempla `CREATE_ITEM` y `EDIT_ITEM` si existen, pero no deben inventarse desde frontend.
- Crear/recibir lote: pendiente de definir permisos funcionales finos para lotes.

Pendientes backend:

- Definir permisos funcionales faltantes con negocio.
- Crear migracion Flyway solo cuando se apruebe el catalogo RBAC definitivo.
- Aplicar enforcement backend en endpoints de alta/edicion, no solo guards frontend.

Regla actual:

- Si un permiso seleccionado tiene una dependencia sugerida no seleccionada y esa dependencia existe en catalogo, el frontend muestra: `Este permiso puede requerir: Ver clientes (view_customers)`.
- Si la dependencia sugerida no existe en catalogo, el frontend muestra: `Dependencia pendiente de definir en catalogo: view_payments`.
- La advertencia es no bloqueante hasta confirmar la matriz RBAC definitiva.
- La validacion fuerte debe implementarse despues en backend para evitar permisos incoherentes por API o cargas administrativas.

## Pendiente

- Completar guards en todos los modulos no P0: pagos, ventas, reportes, consignaciones, devoluciones, envios e incidencias.
- Normalizar nombres de permisos para cubrir lectura/alta/edicion por modulo.
- Confirmar matriz completa de dependencias RBAC y mover enforcement a backend si el negocio la aprueba.
- Definir permiso funcional de alta/edicion de clientes si el negocio requiere separar lectura de creacion.
- Agregar tests automatizados frontend cuando exista infraestructura estable.
