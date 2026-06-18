# ERP - Tenant core foundation

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Rama: `feature/fase2c-tenant-core-foundation`  
Tipo: diseno tecnico, sin codigo ni migraciones

## Objetivo

Definir el nucleo tecnico tenant-aware que debe existir antes de implementar multi-compania real.

La meta es que sea practicamente imposible que una empresa vea, modifique, reporte o infiera datos de otra empresa.

## Estrategia oficial

Modelo aprobado:

- Una sola aplicacion.
- Una sola base de datos.
- Shared DB / shared schema.
- `company_id` obligatorio en datos tenant-scoped.
- `branch_id` subordinado a `company_id`.
- Roles/permisos por compania.
- Consola SaaS HPSQ-SOFT separada por rutas y roles.
- Soporte delegado con motivo, expiracion y auditoria.

## Principio central

El backend es la autoridad tenant.

El frontend puede mostrar u ocultar opciones, pero nunca decide aislamiento. Todo dato recibido desde cliente como `companyId`, `branchId`, `customerId`, `itemId`, `saleId`, `folio`, `code` o `qrCode` debe validarse en backend contra el `CurrentTenantContext`.

## Capas tenant-aware

| Capa | Responsabilidad tenant |
|---|---|
| Token/sesion | Identificar usuario, companias permitidas, compania activa y modo soporte |
| Tenant resolver | Construir `CurrentTenantContext` por request |
| Access service | Validar permisos por company y branch |
| Servicios dominio | Validar entidades, reglas de negocio y relaciones cross-company |
| Repositorios/queries | Filtrar siempre por `company_id` en datos sensibles |
| Auditoria | Registrar company, branch, actor, accion, resultado y motivo |
| Logs | Incluir correlationId/requestId y companyId seguro |
| Reportes | Filtrar todos los joins por company |
| SaaS admin | Usar roles `SAAS_*`, no roles ERP cliente |

## CurrentTenantContext

Debe existir un objeto unico por request con:

- `userId`
- `activeCompanyId`
- `activeBranchId`
- `allowedCompanyIds`
- `allowedBranchIds`
- `roles`
- `permissions`
- `saasRoles`
- `supportMode`
- `supportSessionId`
- `timezone`
- `planCode`
- `enabledModules`
- `requestId`
- `correlationId`

El detalle se documenta en `ERP_CURRENT_TENANT_CONTEXT_DESIGN.md`.

## Tenant resolver

Responsabilidad:

1. Leer token/sesion.
2. Identificar usuario.
3. Validar usuario activo.
4. Resolver companias permitidas.
5. Resolver company activa.
6. Validar estado de compania.
7. Resolver branch activa si aplica.
8. Cargar roles/permisos por company.
9. Cargar plan/modulos/limites.
10. Resolver soporte HPSQ-SOFT si aplica.
11. Crear `CurrentTenantContext`.

Reglas:

- Si el usuario tiene una sola company, puede resolverse automaticamente.
- Si tiene varias companies, debe existir seleccion activa explicita.
- Si la company esta `SUSPENDED`, bloquear operacion cliente.
- Si el usuario es HPSQ-SOFT, no debe entrar a datos cliente sin modo soporte o permiso SaaS.

## Tenant propagation

El contexto debe propagarse:

- Controller -> service -> repository/query.
- Auditoria.
- Logs.
- Manejo de errores.
- Reportes.
- Jobs futuros.

No se debe pasar `companyId` manualmente desde frontend como fuente confiable. Puede pasarse como seleccion UX, pero se valida contra sesion.

## Tenant lifecycle por request

1. Request entra por API.
2. Filtro de token valida autenticidad.
3. Tenant resolver construye contexto.
4. Controller recibe request.
5. Access service valida permiso.
6. Service valida entidades y reglas.
7. Repository ejecuta query tenant-scoped.
8. Auditoria registra accion.
9. Response no expone datos de otro tenant.
10. Contexto se limpia al cerrar request.

## Enforcement obligatorio

- Ninguna query sensible sin `company_id`.
- Ningun `branchId` sin validar `branches.company_id`.
- Ningun id directo sin validar entidad contra `activeCompanyId`.
- Ningun lookup por folio/codigo/QR global accidental.
- Ningun reporte sin filtro tenant en todos sus joins.
- Ninguna accion HPSQ-SOFT sin auditoria.
- Ningun permiso ERP cliente puede abrir consola SaaS.

## Validaciones minimas backend

Para cada endpoint P0:

- Usuario autenticado.
- Company activa valida.
- Estado company permite accion.
- Usuario pertenece a company.
- Permiso existe para company.
- Branch pertenece a company.
- Branch pertenece al usuario cuando aplique.
- Entidades relacionadas pertenecen a company.
- Plan permite modulo/accion cuando aplique.
- Auditoria se genera si la accion es sensible.

## Riesgos criticos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Query sin `company_id` | Fuga de datos | Enforcement en servicios, pruebas negativas, revision P0 |
| Lookup global por QR/codigo | Exposicion o movimiento de prenda ajena | Lookup tenant-scoped |
| Reporte con join sin tenant | Totales mezclados | Revisar todos los joins y pruebas A/B |
| Permiso global heredado | Escalamiento cross-company | `user_company_roles` y `user_company_permissions` |
| Soporte HPSQ sin contexto | Acceso excesivo | `support_access_sessions`, motivo y expiracion |
| Cache contaminado | Datos de otra company | Cache key incluye companyId |

## Orden recomendado antes de implementacion real

1. Diseno tecnico de `CurrentTenantContext`.
2. Diseno de migracion `companies` + company default.
3. Definir tablas P0 y backfill.
4. Definir validadores centrales: company, branch, entity.
5. Definir auditoria tenant.
6. Definir estrategia de QA A/B.
7. Solo despues empezar implementacion pequena.

## No hacer en esta fase

- No crear columnas.
- No modificar token real.
- No modificar `AccessService`.
- No tocar endpoints.
- No crear consola SaaS.
- No cambiar frontend.
