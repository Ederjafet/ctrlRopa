# ERP - Arquitectura multi-compania

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania  
Rama esperada por solicitud: `feature/fase2a-diseno-multicompania`  
Rama revisada: `feature/fase2a-multicompany-architecture`  
Tipo: analisis y propuesta, sin cambios de codigo ni base de datos

## Objetivo multi-compania

Permitir que varias empresas/clientes usen una sola instalacion del ERP en un solo servidor, compartiendo aplicacion y base de datos, sin que una empresa pueda ver, modificar, consultar, reportar o inferir datos de otra.

Adicionalmente, HPSQ-SOFT debe operar como dueno de la plataforma SaaS mediante un area privada de administracion global. Esa consola no forma parte del ERP operativo de los clientes y debe tener rutas, roles, permisos, auditoria y limites propios.

El objetivo no es solo agregar un campo. La arquitectura debe garantizar aislamiento por tenant en:

- Autenticacion y sesion.
- Usuarios, roles y permisos.
- Sucursales.
- Clientes.
- Inventario y prendas.
- Lotes y proveedores.
- Ventas, pagos, caja, reservas/live, paquetes y envios.
- Reportes.
- Auditoria y soporte tecnico.
- Administracion SaaS HPSQ-SOFT.
- Planes, suscripciones, limites y estado comercial de cada empresa.
- Branding y configuracion global por empresa.

## Estado actual observado

El sistema actual esta disenado como mono-compania con multiples sucursales:

- `branches` es la raiz operativa principal en `V1__schema_consolidado_v2.sql`.
- `users.branch_id` define la sucursal principal del usuario.
- `user_branches` en `V27__user_branch_assignments.sql` permite varias sucursales por usuario, pero no varias companias.
- `AuthService.java` devuelve `branch`, `roles`, `effectivePermissions` y canales por sucursal en `LoginResponse`.
- `CurrentUser.java` obtiene solo `userId` desde el token; no expone `companyId`.
- `AccessService.java` valida usuario activo, permisos y canal por `branchId`, pero no valida tenant.
- El frontend guarda `branchId` en sesion y lo envia a servicios como `getCustomersByBranch`, `getItemsByBranch`, `getBatchesByBranch`, `getPaymentMethods`, reportes y dashboard.
- Endpoints frecuentes usan rutas como `/api/customers/branch/{branchId}`, `/api/items/branch/{branchId}`, `/api/batches/branch/{branchId}`, `/api/lives/branch/{branchId}`, `/api/reports/... ?branchId=`.
- No se encontro `company_id` ni `tenant_id` en migraciones o codigo principal.
- No se encontro un modulo SaaS admin separado para HPSQ-SOFT.
- Los roles actuales son roles del ERP operativo, no roles de plataforma SaaS.
- No existe separacion documental/tecnica entre soporte tecnico HPSQ-SOFT y operacion de cliente.

Riesgo actual si se agregan varias empresas sin arquitectura: un usuario podria consultar otro `branchId` por URL/API si el backend no valida que esa sucursal pertenece a su tenant permitido.

## Opciones evaluadas

### Opcion 1 - Base de datos por compania

Cada compania tiene su propia base de datos.

Ventajas:

- Aislamiento fuerte por infraestructura.
- Backups y restauraciones por cliente mas directos.
- Menor riesgo de fuga por consulta SQL mal filtrada.

Desventajas:

- Mayor complejidad operacional en un solo servidor.
- Multiplica conexiones, migraciones, backups y monitoreo.
- Complica soporte, reportes globales y despliegues.
- Mas dificil para una app Expo/backend actual sin tenant resolver dinamico.

Uso recomendado:

- Clientes grandes, regulados o con requerimientos contractuales de aislamiento fisico.
- No recomendado como primera evolucion para este ERP por costo operacional.

### Opcion 2 - Esquema por compania

Una base de datos, un schema por compania.

Ventajas:

- Aislamiento mejor que una sola tabla compartida.
- Migraciones algo separables por cliente.

Desventajas:

- En MySQL el manejo de schemas por tenant aumenta complejidad.
- Flyway, JPA/JdbcTemplate y reportes se vuelven mas dificiles.
- No elimina por completo errores si el resolver de schema falla.
- Complica consultas de soporte y auditoria central.

Uso recomendado:

- Escenarios intermedios con pocos tenants y fuerte necesidad de separar objetos.
- No recomendado para esta etapa.

### Opcion 3 - Una sola base con `company_id`

Una sola base, una sola app, tablas compartidas y `company_id` obligatorio en datos tenant-scoped.

Ventajas:

- Menor complejidad operacional en un solo servidor.
- Encaja con la arquitectura actual basada en `branch_id`.
- Permite migracion gradual desde mono-compania.
- Facilita despliegue unico, backups globales y soporte controlado.
- Permite evolucionar hacia SaaS con costos moderados.

Desventajas:

- Requiere disciplina estricta: cada consulta debe filtrar por `company_id`.
- Un endpoint sin filtro tenant puede filtrar datos entre empresas.
- Debe reforzarse con tests de aislamiento y validaciones backend.
- Los indices deben revisarse para evitar degradacion de performance.

Uso recomendado:

- Recomendado para este ERP en la siguiente fase de arquitectura.

## Estrategia para una sola aplicacion y un solo servidor

El objetivo operativo es evitar multiples despliegues. La arquitectura recomendada mantiene:

- Un backend Spring Boot.
- Un frontend Expo React Native/Web.
- Una base de datos.
- Un pipeline de release.
- Un set de logs/observabilidad con filtros por compania.
- Una consola SaaS privada dentro del mismo producto, protegida por roles HPSQ-SOFT y rutas separadas.

Separacion logica propuesta:

| Area | Usuarios | Ruta conceptual | Scope |
|---|---|---|---|
| ERP cliente | Usuarios de compania | `/dashboard`, ventas, lotes, reportes | Una compania activa y sus sucursales permitidas |
| Consola SaaS HPSQ-SOFT | Personal HPSQ-SOFT | `/saas-admin/*` futuro | Todas las companias segun rol SaaS |
| Soporte delegado | HPSQ-SOFT con justificacion | `/saas-admin/support-session` futuro | Una compania seleccionada, con caducidad y auditoria |

La consola SaaS no debe depender de permisos ERP como `MANAGE_USERS` o `VIEW_REPORTS`. Debe usar permisos de plataforma separados para evitar que un administrador de cliente vea herramientas internas.

## Recomendacion final

Modelo recomendado: una sola aplicacion, una sola base de datos, `company_id` obligatorio.

La compania debe ser el limite de seguridad principal. La sucursal queda subordinada a la compania:

`company -> branches -> operaciones`

Regla central:

- Ningun endpoint debe aceptar un `branchId`, `customerId`, `saleId`, `itemId`, `batchId`, `paymentId`, `reportId` o similar sin validar que pertenece al `company_id` del usuario actual.
- Ninguna accion HPSQ-SOFT debe modificar datos operativos de cliente sin flujo formal, justificacion y auditoria.
- La consola SaaS puede administrar configuracion, estado, planes, limites, branding, usuarios administradores y soporte; no debe operar ventas/pagos directamente.

## Principios arquitectonicos

1. El tenant se resuelve en backend desde el token/sesion, no desde el frontend.
2. El frontend puede enviar `companyId` solo como seleccion UX, nunca como autoridad de seguridad.
3. `company_id` debe existir en las tablas raiz y de movimiento.
4. `branch_id` debe validarse contra `company_id`.
5. Roles y permisos deben ser asignables por compania.
6. Soporte HPSQ-SOFT debe operar con acceso limitado, auditado y preferentemente con seleccion explicita de compania.
7. Reportes deben filtrar siempre por `company_id` y opcionalmente por `branch_id`.
8. Auditoria debe registrar `company_id`, `branch_id`, `user_id`, accion y entidad.
9. Los roles SaaS de HPSQ-SOFT deben estar separados de los roles ERP del cliente.
10. El estado de la compania debe condicionar acceso: activa, suspendida, en implementacion, cancelada.
11. Los limites de plan deben validarse en backend, no solo ocultarse en frontend.
12. El acceso de soporte debe ser temporal, justificado y auditable.

## Impacto por capa

### Backend

Crear un contexto tenant similar a `CurrentUser`, por ejemplo `CurrentTenant` o extender `CurrentUser` para exponer:

- `userId`
- `activeCompanyId`
- `allowedCompanyIds`
- `branchId`
- `allowedBranchIds`
- `roles/permisos por compania`

Servicios como `CustomerService`, `ItemService`, `BatchService`, `SaleService`, `PaymentService`, `ReportService`, `DashboardService`, `LiveService`, `ShipmentService`, `UserAdminService` deben validar tenant antes de consultar o modificar.

### Frontend

La sesion debe incluir compania activa y companias permitidas. Pantallas actuales usan `session.branchId`; deberan evolucionar a:

- `session.companyId`
- `session.branchId`
- selector de compania solo para usuarios multi-compania autorizados
- selector de sucursal filtrado por compania

Servicios como `customerService.ts`, `itemService.ts`, `batchService.ts`, `reportService.ts`, `dashboardService.ts`, `userAdminService.ts` no deben asumir que `branchId` basta para aislar datos.

Para la consola HPSQ-SOFT se recomienda una separacion visual y de navegacion clara:

- Sin mezclar tarjetas operativas de clientes con administracion SaaS.
- Header/tema de plataforma interno.
- Busqueda de empresas por nombre, RFC, estado, plan o contacto.
- Acciones peligrosas con confirmacion, motivo y registro.
- No mostrar datos sensibles de ventas/pagos salvo vista agregada o con permiso de auditoria.

### Base de datos

Agregar `companies` y `company_id` en tablas tenant-scoped. Primero permitir compatibilidad con datos existentes migrandolos a una compania default.

### Seguridad

`AccessService` debe evolucionar de permiso global a permiso por compania:

- `assertCan(userId, companyId, permissionCode)`
- `assertCanBranch(userId, companyId, branchId, permissionCode)`
- `assertEntityBelongsToCompany(entityId, companyId)`

Para HPSQ-SOFT se recomienda una capa separada:

- `assertSaasPermission(userId, saasPermissionCode)`
- `assertCanAccessCompanyForSupport(userId, companyId, reason)`
- `assertSupportSessionActive(userId, companyId)`
- `auditSaasAction(userId, companyId, action, reason, result)`

## Consola SaaS HPSQ-SOFT

La consola SaaS privada se documenta a detalle en `ERP_SAAS_ADMIN_CONSOLE.md`. A nivel arquitectura debe incluir:

- Dashboard global HPSQ-SOFT.
- Alta/edicion/suspension/reactivacion de empresas.
- Planes y suscripciones.
- Limites por plan.
- Modulos habilitados por compania.
- Usuarios administradores de compania.
- Reset controlado de acceso.
- Monitoreo de salud por compania.
- Metricas de uso.
- Auditoria global y auditoria de soporte.
- Incidencias por cliente.
- Estado de pagos/suscripcion.
- Branding por empresa.
- Herramientas de soporte con limites estrictos.

Esta consola debe estar oculta para clientes y protegida por roles SaaS como `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT`, `HPSQ_BILLING`, `HPSQ_IMPLEMENTATION` y `HPSQ_AUDITOR`.

## Riesgos criticos

| Riesgo | Severidad | Motivo | Mitigacion |
|---|---|---|---|
| Fuga de datos entre companias | CRITICO | Consultas actuales se filtran por `branch_id` o id directo, no por `company_id`. | Tenant context backend, filtros obligatorios, tests negativos. |
| Permisos globales aplicados a todas las empresas | CRITICO | `roles`, `user_roles`, `user_permissions` no tienen scope compania. | Introducir roles/permisos por compania. |
| Reportes cruzados | CRITICO | Reportes reciben `branchId` y agregan movimientos. | Validar branch pertenece a company y filtrar por company. |
| Soporte tecnico con acceso excesivo | ALTO | Perfil tecnico/admin puede ver datos sensibles si no se limita. | Soporte por compania, justificacion, auditoria y caducidad. |
| Consola SaaS visible a clientes | CRITICO | Mezclar roles ERP y SaaS expondria administracion global. | Rutas privadas, permisos SaaS separados, pruebas negativas. |
| Suspension mal aplicada | ALTO | Una empresa suspendida podria seguir operando o una activa quedar bloqueada. | Estado company validado en login y endpoints criticos. |
| Limites de plan solo en frontend | ALTO | Cliente podria exceder usuarios/sucursales/modulos por API. | Validacion backend de limites y auditoria. |
| Migracion rompe RC | ALTO | Muchas tablas operativas dependen de `branch_id`. | Fases pequenas, migracion default company, compatibilidad temporal. |
| Performance por filtros nuevos | MEDIO | Agregar `company_id` sin indices puede degradar consultas. | Indices compuestos `company_id, branch_id, fecha/estado`. |

## Decision arquitectonica sugerida

Adoptar multi-compania por `company_id` en una sola base. No implementar todavia. Antes de codificar se debe cerrar:

- Modelo de datos multi-compania.
- Politica de seguridad tenant.
- Diseno de consola SaaS HPSQ-SOFT.
- Roles SaaS separados de roles ERP cliente.
- Plan de migracion.
- QA de aislamiento.
- Matriz endpoint -> company scope.

## No hacer en esta fase

- No crear migraciones.
- No modificar entidades.
- No cambiar endpoints.
- No agregar selector de compania.
- No mezclar esta arquitectura con refactors de UX o permisos existentes.
