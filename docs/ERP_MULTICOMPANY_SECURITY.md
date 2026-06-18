# ERP - Seguridad multi-compania

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania  
Tipo: propuesta de seguridad, sin cambios de codigo

## Objetivo

Definir controles para evitar fuga de datos entre empresas en una arquitectura de una sola app y una sola base con `company_id`.

Tambien definir la frontera entre el ERP operativo de clientes y la administracion SaaS privada de HPSQ-SOFT.

## Principio de aislamiento

El backend es la unica autoridad de aislamiento tenant.

El frontend puede ocultar pantallas o filtrar opciones, pero nunca debe ser la barrera de seguridad principal.

## Riesgo principal

Hoy muchos servicios frontend construyen rutas con `session.branchId`, por ejemplo:

- `/api/customers/branch/{branchId}`
- `/api/items/branch/{branchId}`
- `/api/batches/branch/{branchId}`
- `/api/lives/branch/{branchId}`
- `/api/reports/... ?branchId=`

Si un usuario cambia manualmente el `branchId`, el backend debe rechazarlo si no pertenece a su compania autorizada.

## Reglas obligatorias backend

1. Resolver `company_id` desde token/sesion.
2. Validar que el usuario esta activo en esa compania.
3. Validar permisos con scope compania.
4. Validar que la sucursal pertenece a la compania.
5. Validar que cada entidad consultada pertenece a la compania.
6. Filtrar todas las consultas por `company_id`.
7. Auditar acciones sensibles con `company_id`.
8. Rechazar ids cruzados con 403/404 controlado.
9. Validar estado de compania antes de permitir operacion.
10. Validar limites de plan antes de crear recursos.
11. Separar permisos SaaS HPSQ-SOFT de permisos ERP cliente.
12. Auditar toda accion HPSQ-SOFT sobre una compania.

## Evolucion de `CurrentUser`

Actual:

- `CurrentUser.getUserId()` devuelve solo usuario desde token.
- No devuelve compania.

Propuesta:

```text
CurrentTenantContext
- userId
- activeCompanyId
- activeBranchId
- allowedCompanyIds
- allowedBranchIds
- supportMode
- tokenHash
```

La sesion debe almacenar o resolver compania activa. Para usuarios de una sola compania, se asigna automaticamente. Para usuarios multi-compania, debe existir seleccion explicita y auditada.

## Evolucion de `AccessService`

Actual:

- `assertCan(userId, permissionCode)`
- `assertCan(userId, permissionCode, channelCode, branchId)`

Propuesta:

- `assertCan(userId, companyId, permissionCode)`
- `assertCanBranch(userId, companyId, branchId, permissionCode)`
- `assertCanEntity(userId, companyId, entityType, entityId, permissionCode)`
- `assertSupportAccess(userId, companyId, reason)`

Los permisos globales actuales no deben aplicarse automaticamente a todas las companias.

## Roles recomendados

### Superadmin plataforma

Uso:

- Administracion HPSQ-SOFT de plataforma.
- Crear/desactivar companias.
- Ver estado tecnico global.
- Administrar planes, modulos, limites y usuarios internos HPSQ-SOFT.

Restricciones:

- No debe operar ventas/pagos de clientes salvo modo soporte auditado.
- Acceso a datos de empresa solo con justificacion.
- No debe borrar datos productivos sin proceso formal de retencion/backup.

### Auditor HPSQ-SOFT

Uso:

- Revisar bitacoras globales, soporte, accesos, cambios de plan y cambios de estado.

Restricciones:

- Solo lectura.
- No puede impersonar usuarios ni modificar configuracion.

### Billing HPSQ-SOFT

Uso:

- Gestionar planes, periodos de prueba, suspension comercial, gracia y reactivacion.

Restricciones:

- No puede ver detalle operativo sensible como ventas item por item si no es necesario.
- No puede operar pagos de clientes dentro del ERP.

### Implementacion HPSQ-SOFT

Uso:

- Alta inicial de empresa, sucursales base, branding y administrador de compania.

Restricciones:

- Acceso limitado a empresas en implementacion o asignadas.
- Debe cerrar handoff antes de produccion.

### Dueno de compania

Uso:

- Administrar compania, sucursales, usuarios, roles y parametros propios.
- Ver reportes globales de su compania.

Restricciones:

- No puede ver otras companias.

### Administrador de sucursal

Uso:

- Gestionar operacion de sus sucursales asignadas.

Restricciones:

- No puede acceder sucursales fuera de su compania o fuera de su asignacion.

### Usuario operativo

Uso:

- Ventas, reservas, pagos, inventario, live, paquetes segun permisos.

Restricciones:

- Scope minimo: compania activa y sucursal asignada.

### Soporte HPSQ-SOFT

Uso:

- Diagnostico tecnico.
- Revision de logs y configuracion.

Restricciones:

- Acceso por compania, tiempo limitado, justificacion obligatoria y auditoria.
- Preferir lectura sobre escritura.
- No debe realizar operaciones financieras salvo autorizacion formal.
- Debe usar acceso delegado con ticket/motivo y caducidad.
- Debe consultar logs filtrados por compania; no logs globales sin necesidad.

### Administrador de compania

Uso:

- Gestionar usuarios, sucursales, catalogos permitidos y configuracion propia.

Restricciones:

- No administra plan, facturacion ni estado de la compania.
- No accede a consola SaaS HPSQ-SOFT.

## Permisos por compania

Modelo recomendado:

- `roles` pueden ser plantillas globales o por compania.
- Asignaciones deben tener `company_id`.
- `user_company_roles` y `user_company_permissions` definen capacidades por tenant.

Regla:

- Un usuario puede ser administrador en compania A y solo lector en compania B.

## Roles SaaS separados

Los roles de plataforma no deben vivir en la misma matriz operativa del ERP como permisos de venta, pagos o lotes. Deben tener su propio namespace.

Ejemplos:

- `SAAS_COMPANY_CREATE`
- `SAAS_COMPANY_SUSPEND`
- `SAAS_SUBSCRIPTION_MANAGE`
- `SAAS_SUPPORT_OPEN_SESSION`
- `SAAS_SUPPORT_VIEW_LOGS`
- `SAAS_AUDIT_VIEW`
- `SAAS_BRANDING_MANAGE`

Regla: un `COMPANY_ADMIN` nunca debe recibir permisos `SAAS_*`.

## Acceso delegado / impersonation

El acceso HPSQ-SOFT a una empresa debe cumplir:

1. Usuario HPSQ-SOFT autenticado.
2. Rol SaaS autorizado.
3. Empresa seleccionada.
4. Motivo obligatorio.
5. Ticket o referencia cuando exista.
6. Alcance de acceso: lectura, configuracion, soporte limitado.
7. Tiempo de expiracion.
8. Auditoria de inicio, acciones y cierre.
9. Indicador visual interno de modo soporte.
10. Prohibicion de operar ventas/pagos salvo herramienta auditada y aprobada.

La impersonacion completa de un usuario cliente debe evitarse al inicio. Si se requiere, debe quedar como funcionalidad futura con doble aprobacion y evidencia.

## Estado de compania y suspension

Estados propuestos:

- `IMPLEMENTATION`
- `TRIAL`
- `ACTIVE`
- `GRACE`
- `SUSPENDED`
- `CANCELLED`

Reglas:

- `ACTIVE`, `TRIAL` y `GRACE` permiten login y operacion segun plan.
- `IMPLEMENTATION` permite acceso restringido para configuracion.
- `SUSPENDED` bloquea operacion de usuarios cliente y permite solo mensajes amigables de contacto/renovacion.
- `CANCELLED` bloquea acceso operativo y debe entrar en proceso de retencion/exportacion.
- HPSQ-SOFT puede acceder a estado tecnico y auditoria segun rol.

## Validacion de reportes

Cada reporte debe:

- Validar permiso `VIEW_REPORTS` en la compania activa.
- Validar `branchId` contra compania.
- Filtrar por `company_id`.
- No aceptar `branchId` de otra compania aunque exista.

Reportes criticos:

- `DailyStoreReportService`
- `DailyDepositsReportService`
- `DailyDeliveriesReportService`
- `DailyCancellationsReportService`
- `LiveControlReportService`
- `RemissionsReportService`
- `MovementHistoryController`

## Validacion de entidades

Ejemplos obligatorios:

- `saleId` pertenece a `company_id`.
- `paymentId` pertenece a `company_id`.
- `customerId` pertenece a `company_id`.
- `itemId` pertenece a `company_id`.
- `batchId` pertenece a `company_id`.
- `supplierId` pertenece a `company_id`.
- `shipmentId` pertenece a `company_id`.

No basta con que el usuario tenga permiso funcional.

## Respuestas ante acceso cruzado

Recomendacion:

- Usar `403` cuando el usuario existe pero no tiene acceso a la compania/sucursal.
- Usar `404` cuando revelar existencia de la entidad pueda filtrar informacion.
- Mensaje amigable: "No tienes acceso a esta informacion."
- No mostrar ids, SQL, tenant, stack trace ni detalles tecnicos.

## Auditoria

Auditar:

- Cambio de compania activa.
- Acceso soporte a una compania.
- Intento de acceso cruzado.
- Alta/edicion/desactivacion de compania.
- Alta/edicion de usuarios, roles y permisos por compania.
- Ventas, pagos, cancelaciones, lotes, inventario y reportes exportados.
- Cambios de plan/suscripcion.
- Suspension/reactivacion/cancelacion de empresa.
- Reset de acceso de cliente.
- Cambios de branding.
- Cambios de modulos habilitados.
- Consulta de logs por soporte.

Campos minimos:

- `company_id`
- `actor_user_id`
- `actor_type` (`CLIENT`, `HPSQ`)
- `support_session_id` si aplica
- `action`
- `entity_type`
- `entity_id`
- `reason`
- `result`
- `ip_address`
- `user_agent`
- `created_at`

## QA de seguridad requerida

Para cada modulo:

- Usuario A de empresa A no ve datos empresa B.
- Usuario con rol en empresa A no hereda rol en empresa B.
- Usuario con varias empresas cambia contexto sin mezclar datos.
- Soporte HPSQ-SOFT queda auditado.
- Reportes no mezclan ventas, pagos ni inventario entre companias.

## Riesgos criticos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Confiar en `branchId` enviado por frontend | CRITICO | Validar branch contra company en backend. |
| Permiso global sin company scope | CRITICO | Asignaciones por compania. |
| Query sin `company_id` | CRITICO | Repositorios tenant-aware y QA negativo. |
| Soporte tecnico sin auditoria | ALTO | Modo soporte limitado y auditado. |
| Reporte agregado sin tenant | CRITICO | Filtros obligatorios por company. |
| Consola SaaS visible para cliente | CRITICO | Rutas y permisos SaaS separados. |
| Suspension no aplicada en backend | ALTO | Validar estado de company en login y endpoints criticos. |
| Soporte ve datos sensibles innecesarios | ALTO | Mascaras, logs filtrados, minimo privilegio. |

## Decision de seguridad sugerida

No implementar multi-compania hasta crear una capa central de tenant context y pruebas negativas. Agregar `company_id` sin validar backend aumentaria el riesgo porque daria falsa sensacion de aislamiento.
