# SEC-RBAC-AUDIT-A - Smoke por rol

Fecha: 2026-06-21

## Objetivo

Validar que UI, modal de permisos y backend coincidan por rol. Esta checklist complementa las pruebas automatizadas agregadas en `ItemServiceTests`.

## Platform Owner

| Caso | Esperado |
| --- | --- |
| Entrar a `/platform` | Permitido con `VIEW_PLATFORM`. |
| Ver Dashboard/Clientes/Suscripciones/Auditoria | Permitido por permisos platform. |
| Entrar a operacion tenant sin contexto claro | No debe confundirse con impersonacion. |
| Llamar endpoints `/api/platform/**` | Permitido solo con permisos platform. |

## Admin cliente

| Caso | Esperado |
| --- | --- |
| Entrar a `/customers-create` | Permitido con `CREATE_CUSTOMER`. |
| Crear cliente final | Permitido y tenant-scoped. |
| Entrar a `/items-create` | Permitido con `MANAGE_INVENTORY`. |
| Crear prenda | Permitido. |
| Crear proveedor/lote | Permitido si conserva `MANAGE_CATALOGS`/`MANAGE_INVENTORY`. |
| Entrar a `/platform` | Bloqueado. |

## Vendedor

| Caso | Esperado |
| --- | --- |
| Entrar a `/door-reservation?customerId=4` | Permitido con `DO_DOOR_RESERVATION`. |
| Abrir `Ver permisos` | `Crear prenda rapida` aparece bloqueado si falta `MANAGE_INVENTORY`. |
| Boton `Alta rapida de prenda` | Deshabilitado con mensaje de permiso requerido. |
| Abrir `/items-create?returnTo=/door-reservation` directo | Muestra aviso de accion bloqueada y no permite guardar. |
| Llamar directo `POST /api/items` | 403 `Permiso requerido: MANAGE_INVENTORY`. |
| Agregar prenda existente al apartado | Permitido con `VIEW_INVENTORY`. |
| Crear cliente final | Bloqueado si no tiene `CREATE_CUSTOMER`. |
| Ver Panel Owner | Bloqueado. |

## Cajero

| Caso | Esperado |
| --- | --- |
| Ver/registrar pagos | Segun `VIEW_PAYMENTS`/`REGISTER_PAYMENTS`. |
| Crear prendas | Bloqueado sin `MANAGE_INVENTORY`. |
| Ver Platform Owner | Bloqueado. |

## Supervisor

| Caso | Esperado |
| --- | --- |
| Operacion amplia | Permitida segun permisos operativos. |
| Crear prenda rapida | Solo si tiene `MANAGE_INVENTORY`; si no, bloqueado. |
| Autorizar operaciones LIVE | Segun permisos LIVE de autorizacion. |
| Ver Platform Owner | Bloqueado salvo permiso platform explicito. |

## Usuario sin permisos

| Caso | Esperado |
| --- | --- |
| Login | Bloqueado o acceso restringido por falta de permisos efectivos. |
| URL directa a pantallas operativas | Acceso restringido claro. |
| Llamada directa a endpoints sensibles | 403 controlado, no 500. |

## Checklist manual recomendado

1. Login como vendedor.
2. Abrir `/door-reservation?customerId=4`.
3. Abrir `Ver permisos`.
4. Confirmar `Crear prenda rapida` bloqueado.
5. Confirmar que `Alta rapida de prenda` esta deshabilitado.
6. Pulsar el boton deshabilitado y confirmar mensaje con `MANAGE_INVENTORY`.
7. Abrir `/items-create?returnTo=%2Fdoor-reservation%3FcustomerId%3D4` directo.
8. Confirmar aviso de accion bloqueada y boton de guardar deshabilitado.
9. Intentar `POST /api/items` con vendedor y confirmar 403.
10. Login como admin cliente.
11. Crear prenda desde `/items-create` y confirmar exito.
12. Confirmar que admin cliente no accede a `/platform`.
