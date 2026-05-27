# AUTH-G - Auditoria de eventos de seguridad

Fecha: 2026-05-26  
Rama: `feature/auth-g-security-audit-events`  
Tipo: seguridad backend, auditoria, trazabilidad operativa

## Objetivo

Registrar eventos relevantes cuando el backend bloquea accesos por token invalido/revocado, falta de permisos, login bloqueado o intento cross-tenant/cross-branch. AUTH-G agrega trazabilidad sin cambiar la logica funcional de pagos, ventas, reportes ni reglas de negocio.

## Tabla creada

Migracion: `V45__auth_g_security_audit_events.sql`

Tabla: `security_audit_events`

Campos principales:

- `id`
- `occurred_at`
- `user_id`
- `email`
- `company_id`
- `branch_id`
- `event_type`
- `http_method`
- `path`
- `status_code`
- `reason`
- `remote_ip`
- `user_agent`
- `target_resource_type`
- `target_resource_id`
- `metadata_json`

Indices:

- `occurred_at`
- `user_id`
- `company_id`
- `event_type`

Notas tecnicas:

- Las referencias `user_id`, `company_id` y `branch_id` usan `BIGINT UNSIGNED` para alinearse con las tablas reales.
- `metadata_json` se mantiene como `TEXT` para compatibilidad con MySQL 5.7 y para evitar dependencia de validacion JSON estricta.
- La auditoria es tolerante a fallos: si falla el registro del evento, no relaja permisos ni cambia la respuesta del bloqueo.

## Eventos registrados

| Evento | Punto de integracion | Status esperado | Uso |
|---|---|---:|---|
| `LOGIN_BLOCKED_NO_ACCESS` | `AuthService` | 403 | Usuario con rol `NO_ACCESS` intenta iniciar sesion. |
| `LOGIN_BLOCKED_NO_EFFECTIVE_PERMISSIONS` | `AuthService` | 403 | Usuario activo sin permisos efectivos intenta iniciar sesion. |
| `SESSION_REVOKED` | `AuthService` / `ApiTokenFilter` | 200/401 | Se revocan sesiones anteriores por nuevo login o token viejo queda desplazado. |
| `TOKEN_INVALID` | `ApiTokenFilter` | 401 | Token ausente, inexistente, vencido o invalido. |
| `TOKEN_REVOKED` | `ApiTokenFilter` | 401 | Token existente con `revoked_at` informado. |
| `PERMISSION_DENIED` | `AccessService` | 403 | Falta permiso funcional o usuario no esta activo. |
| `BRANCH_DENIED` | `TenantAccessGuard` | 403 | Branch solicitada no coincide con branch activa. |
| `COMPANY_DENIED` | `TenantAccessGuard` / `AuthService` | 403 | Branch no pertenece a company activa o no se puede resolver company activa. |
| `CROSS_TENANT_DENIED` | Reservado | 403 | Alias futuro para casos cross-tenant mas explicitos. |

## Datos que NO se guardan

- Passwords.
- Token completo.
- Hash completo del token.
- Cuerpo completo de request.
- Datos financieros sensibles.

Cuando se necesita referencia a token, solo se registra una vista parcial segura (`tokenHashPreview`) en `metadata_json`.

## Puntos de integracion

- `ApiTokenFilter`: registra token ausente, invalido, revocado o desplazado antes de devolver `401`.
- `AuthService`: registra login bloqueado por `NO_ACCESS`, usuario sin permisos efectivos, company activa no resoluble y revocacion de sesiones anteriores.
- `AccessService`: registra `PERMISSION_DENIED` antes de lanzar `AccessDeniedException`.
- `TenantAccessGuard`: registra `BRANCH_DENIED` o `COMPANY_DENIED` antes de bloquear branch ajena o branch fuera de company activa.

## Pruebas agregadas

- `AccessServiceAuditTests`
  - Valida que un permiso faltante registra `PERMISSION_DENIED` antes del `403`.
- `ApiTokenFilterAuditTests`
  - Valida que un token revocado registra `TOKEN_REVOKED` y devuelve `401`.
- `TenantAccessGuardTests`
  - Valida que branch ajena registra `BRANCH_DENIED`.
  - Valida que branch fuera de company registra `COMPANY_DENIED`.

Validacion tecnica:

- `.\mvnw.cmd test`
- Resultado: `BUILD SUCCESS`, 49 tests, 0 failures, 0 errors.
- Flyway valido 45 migraciones y aplico `V45` correctamente en QA/local.

## Limitaciones

- AUTH-G no expone todavia una pantalla administrativa para consultar `security_audit_events`.
- No registra cada `404` normal para evitar ruido operativo.
- Algunos bloqueos que lancen `AccessDeniedException` fuera de `AccessService` o `TenantAccessGuard` pueden requerir integracion especifica futura.
- `CROSS_TENANT_DENIED` queda reservado para una fase donde los servicios reporten tipo de recurso y tenant destino con mayor precision.

## Proximos pasos recomendados

- AUTH-H: endpoint protegido solo admin/soporte para consultar eventos de auditoria. Implementado en `docs/AUTH_H_SECURITY_AUDIT_CONSOLE.md`.
- AUTH-G3: filtros por usuario, company, evento, rango de fechas y recurso.
- AUTH-G4: retencion/archivado de eventos y politicas de privacidad.
- AUTH-G5: alertas para patrones repetidos de `TOKEN_REVOKED`, `PERMISSION_DENIED` o `BRANCH_DENIED`.
