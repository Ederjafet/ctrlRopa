# ERP - Diseno CurrentTenantContext

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Tipo: diseno tecnico, sin codigo

## Objetivo

Definir la estructura conceptual del contexto tenant que debe existir durante cada request para que backend, permisos, reportes, auditoria y logs operen con aislamiento multi-compania.

## Estructura propuesta

```text
CurrentTenantContext
- userId
- userEmail
- userName
- activeCompanyId
- activeCompanyCode
- activeCompanyStatus
- activeBranchId
- activeBranchCode
- allowedCompanyIds
- allowedBranchIds
- roles
- permissions
- saasRoles
- timezone
- locale
- planCode
- subscriptionStatus
- enabledModules
- supportMode
- supportSessionId
- supportReason
- requestId
- correlationId
- ipAddress
- userAgent
- tokenHash
```

## Campos principales

| Campo | Obligatorio | Uso |
|---|---:|---|
| `userId` | Si | Identidad autenticada |
| `activeCompanyId` | Si para endpoints tenant | Limite primario de seguridad |
| `activeBranchId` | Si para flujos por sucursal | Scope operativo subordinado a company |
| `allowedCompanyIds` | Si | Validar cambio de contexto |
| `allowedBranchIds` | Si | Validar branch seleccionada |
| `roles` | Si | Roles ERP por company |
| `permissions` | Si | Permisos efectivos por company |
| `saasRoles` | Si para HPSQ | Roles de plataforma, separados de ERP |
| `timezone` | Si | Fechas operativas y reportes |
| `planCode` | Si | Validar modulos/limites |
| `enabledModules` | Si | Bloquear modulos no contratados |
| `supportMode` | No | Indica acceso HPSQ delegado |
| `supportSessionId` | No | Auditoria de soporte |
| `requestId` | Si | Trazabilidad por request |
| `correlationId` | Si | Trazabilidad entre capas/logs |

## Fuente de datos

| Dato | Fuente futura |
|---|---|
| Usuario | `users` |
| Companies permitidas | `user_companies` |
| Branches permitidas | `user_company_branches` o `user_branches` validado |
| Roles ERP | `user_company_roles` |
| Permisos ERP | `user_company_permissions` + role permissions |
| Roles SaaS | `saas_user_roles` |
| Plan | `company_subscriptions` |
| Modulos | `company_subscriptions.enabled_modules_json` o `tenant_settings` |
| Branding/timezone | `tenant_settings` / `companies` |
| Soporte | `support_access_sessions` |

## Ciclo de vida request

1. API recibe request.
2. Token filter valida token.
3. Tenant resolver carga usuario y token.
4. Se determina company activa.
5. Se valida estado de company.
6. Se determina branch activa si aplica.
7. Se cargan permisos ERP y SaaS.
8. Se cargan plan/modulos.
9. Se crea `CurrentTenantContext`.
10. Se registra `requestId`/`correlationId`.
11. Controllers/services/repositories consultan el contexto.
12. Auditoria/logs usan el contexto.
13. Al finalizar request, el contexto se limpia.

## Propagacion entre capas

### Controller

- No decide tenant.
- Puede leer contexto para pasar a service.
- Debe evitar aceptar `companyId` como autoridad.

### Service

- Valida permisos.
- Valida branch y entidades.
- Aplica reglas de negocio.
- Decide auditoria.

### Repository/query

- Recibe `companyId` desde contexto o servicio.
- Filtra por `company_id`.
- Nunca ejecuta query sensible sin scope tenant.

### Auditoria

Debe registrar:

- `companyId`
- `branchId`
- `userId`
- `supportSessionId`
- `action`
- `entity`
- `result`
- `requestId`
- `correlationId`

### Logs

Los logs tecnicos deben incluir:

- `requestId`
- `correlationId`
- `companyId` si aplica
- `userId` si aplica
- endpoint
- status

No deben incluir datos sensibles como contrasenas, tokens completos, tarjetas, notas privadas o informacion personal innecesaria.

## Company activa

Reglas:

- Usuario con una sola company: se puede asignar automaticamente.
- Usuario con varias companies: debe seleccionar company activa.
- Usuario HPSQ: no tiene company cliente activa por default; debe abrir contexto SaaS o soporte.
- Company suspendida: bloquea endpoints operativos cliente.
- Company en implementacion: permite solo configuracion inicial segun rol.

## Branch activa

Reglas:

- Branch siempre debe pertenecer a `activeCompanyId`.
- Branch debe estar en `allowedBranchIds` salvo rol company-wide autorizado.
- Si endpoint recibe `branchId`, se valida contra contexto.
- Si endpoint recibe entidad con branch, se valida la branch derivada.

## Roles y permisos

Separacion obligatoria:

- Roles ERP cliente: operan dentro de `activeCompanyId`.
- Roles SaaS HPSQ: operan en consola SaaS.
- Un `COMPANY_ADMIN` no puede tener permisos `SAAS_*`.
- Un `HPSQ_SUPPORT` no opera ventas/pagos salvo herramienta futura auditada.

## Plan y modulos

El contexto debe permitir validar:

- Modulo habilitado.
- Limite de usuarios.
- Limite de sucursales.
- Estado de suscripcion.
- Gracia/suspension.

La UI puede ocultar, pero backend debe bloquear.

## Errores esperados

| Caso | Respuesta recomendada |
|---|---|
| Usuario sin company activa | 403 amigable |
| Company suspendida | 403 con mensaje operativo controlado |
| Branch no pertenece a company | 404 o 403 segun riesgo de enumeracion |
| Entidad de otra company | 404 preferente |
| Permiso faltante | 403 amigable |
| Soporte sin sesion valida | 403 |

## Pendientes antes de implementar

- Decidir si token guarda company activa o si se resuelve server-side.
- Decidir selector de company para usuarios multi-company.
- Definir donde guardar `requestId`/`correlationId`.
- Definir caducidad de soporte delegado.
- Definir cache key estandar con `companyId`.
