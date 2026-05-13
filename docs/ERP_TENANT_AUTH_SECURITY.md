# ERP - Seguridad auth tenant-aware

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Tipo: diseno de seguridad, sin implementacion

## Objetivo

Definir como debe evolucionar autenticacion, sesiones y autorizacion para soportar SaaS multi-tenant sin fuga cross-company.

## Principios

- Autenticacion identifica al usuario.
- Tenant resolver identifica la compania activa.
- Autorizacion valida permisos dentro de esa compania.
- El frontend no es autoridad.
- El token no debe permitir escalar company.
- Soporte HPSQ-SOFT requiere flujo separado y auditado.

## JWT/token tenant-aware

Opciones:

### Opcion A - Token con userId y sesion server-side

El token contiene identificador de sesion/token hash. El backend resuelve company activa y permisos desde base.

Ventajas:

- Revocacion mas controlable.
- Cambios de permisos se reflejan antes.
- Menor riesgo si cambia company/status.

Desventajas:

- Mas consultas por request.

Recomendacion inicial: preferida para este ERP.

### Opcion B - JWT con company activa y claims amplios

El token contiene `userId`, `activeCompanyId`, roles y permisos.

Ventajas:

- Menos consultas.

Desventajas:

- Riesgo de permisos stale.
- Rotacion necesaria si cambia company/plan/roles.
- Mayor superficie si token se filtra.

No recomendada como primera version multi-tenant.

## Claims minimos si se usa JWT

- `sub` / `userId`
- `sessionId` o `tokenHash`
- `activeCompanyId` opcional
- `activeBranchId` opcional
- `issuedAt`
- `expiresAt`
- `tokenVersion`

No incluir:

- Lista completa de permisos sensibles si no hay revocacion robusta.
- Datos personales innecesarios.
- Secretos.

## Company validation

Para cada request tenant:

1. Usuario existe.
2. Usuario activo.
3. Usuario pertenece a company.
4. Company existe.
5. Company esta en estado permitido.
6. Company no esta suspendida/cancelada para operacion.
7. Plan permite modulo si aplica.

## Branch validation

Reglas:

- `branch.company_id = activeCompanyId`.
- Usuario tiene branch asignada o rol company-wide.
- Branch activa.
- Branch no suspendida si existe estado futuro.

Todo endpoint con `branchId` debe pasar por validador central.

## Anti cross-company leakage

Obligatorio:

- Validar ids directos contra company.
- Lookup por codigo/QR/folio con company.
- Reportes con company en todos los joins.
- Dashboard con company en todas las fuentes.
- Cache key incluye company.
- Auditoria de intentos bloqueados.

## Sesiones

Recomendacion:

- `user_api_sessions` debe evolucionar con `company_id` activa opcional.
- Registrar `active_company_id`, `active_branch_id`, `last_seen_at`, `ip`, `user_agent`.
- Permitir revocar sesiones por usuario, company o global.
- Sesiones HPSQ soporte separadas en `support_access_sessions`.

## Refresh tokens

Si se agregan:

- Guardar hash, no token plano.
- Rotacion en cada uso.
- Revocacion por user/company.
- No permitir refresh si company suspendida.
- No permitir refresh si permisos criticos cambiaron sin renovar contexto.

## Logout global

Debe permitir:

- Usuario cierra todas sus sesiones.
- Admin company revoca sesiones de usuarios de su company.
- HPSQ revoca sesiones de una company suspendida.
- HPSQ revoca sesiones de soporte.

Toda revocacion administrativa debe auditarse.

## Impersonation / acceso delegado

Regla: no implementar impersonation completa al inicio.

Modo recomendado inicial:

- Soporte delegado limitado.
- Contexto indica `supportMode=true`.
- `supportSessionId` obligatorio.
- Motivo y ticket obligatorios.
- Expiracion corta.
- Alcance limitado: lectura/configuracion segura.
- Prohibido operar ventas/pagos/caja.

Si algun dia se requiere impersonar:

- Doble aprobacion.
- Aviso al owner o soporte contact.
- Banner visible interno.
- Auditoria de cada accion.
- Duracion corta.

## Proteccion de consola SaaS

- Rutas SaaS requieren `saasRoles`.
- Permisos `SAAS_*` no se mezclan con permisos ERP.
- Cliente no puede ver ni enumerar rutas SaaS.
- HPSQ_SUPPORT no puede cambiar plan/suspender.
- HPSQ_BILLING no debe ver detalle operativo sensible.

## Riesgos SaaS

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Token stale con permisos viejos | ALTO | Resolver permisos server-side o tokenVersion |
| Usuario cambia company por parametro | CRITICO | Validar company contra user_companies |
| BranchId manipulado | CRITICO | Validador branch-company-user |
| Soporte sin auditoria | CRITICO | support_access_sessions |
| Company suspendida opera con token previo | CRITICO | Validar estado en cada request critico |
| Cache sin company | CRITICO | Cache keys tenant-aware |

## Validaciones backend obligatorias

Antes de ejecutar accion:

- `requireAuthenticated()`
- `requireCompanyActive()`
- `requireUserInCompany()`
- `requirePermission(companyId, permission)`
- `requireBranchInCompany(branchId, companyId)`
- `requireUserCanAccessBranch(userId, branchId)`
- `requireEntityInCompany(entityType, entityId, companyId)`
- `requireModuleEnabled(companyId, moduleCode)`
- `auditIfSensitive(action)`

## Respuestas seguras

- 401: token ausente/invalido.
- 403: autenticado sin permiso o company suspendida.
- 404: entidad no encontrada o no revelable por tenant.
- Nunca responder "existe pero pertenece a otra empresa".

## Recomendacion antes de codigo

Disenar primero contratos de `CurrentTenantContext`, `TenantResolver`, `TenantAccessService` y `TenantAuditService`. Luego implementar en endpoints P0 en lotes pequenos.
