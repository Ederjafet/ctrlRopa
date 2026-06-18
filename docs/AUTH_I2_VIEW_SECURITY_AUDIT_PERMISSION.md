# AUTH-I2 - Permiso dedicado VIEW_SECURITY_AUDIT

Fecha: 2026-05-27  
Rama de trabajo: `feature/auth-i-security-audit-ui`  
Tipo: RBAC, auditoria de seguridad, frontend/backend protegido

## Objetivo

Separar la consulta de auditoria de seguridad de la administracion de configuracion de seguridad.

AUTH-H e AUTH-I usaban `MANAGE_SECURITY_SETTINGS` para consultar `security_audit_events`. AUTH-I2 crea `VIEW_SECURITY_AUDIT` para que soporte pueda revisar eventos sin heredar privilegios de configuracion.

## Permiso creado

| Codigo | Nombre humano | Modulo | Uso |
|---|---|---|---|
| `VIEW_SECURITY_AUDIT` | Ver auditoria de seguridad | Sistema/Seguridad | Consultar eventos de `security_audit_events`. |

Migracion:

`backend/control-ropa/src/main/resources/db/migration/V46__auth_i2_view_security_audit_permission.sql`

La migracion inserta el permiso de forma idempotente y no asigna permisos a roles productivos.

## Backend

Endpoint afectado:

`GET /api/security/audit-events`

Permiso vigente:

`VIEW_SECURITY_AUDIT`

No se modifican filtros, paginacion, orden ni estructura de respuesta. La consulta sigue sin exponer passwords ni tokens completos.

## Frontend

Ruta:

`/system-security-audit`

Acceso:

`Sistema -> Auditoria de seguridad`

Regla:

- Mostrar tile solo con `VIEW_SECURITY_AUDIT`.
- Bloquear ruta directa sin `VIEW_SECURITY_AUDIT`.
- No usar `MANAGE_SECURITY_SETTINGS` para esta pantalla.

## QA controlado

Script:

`docs/qa/12-auth-i2-view-security-audit-qa.sql`

Alcance:

- Crea `VIEW_SECURITY_AUDIT` si falta en QA/local.
- Lo asigna al rol `SUPPORT_TECH`.
- Lo asigna directamente a `qa.soporte@local.test` como compatibilidad QA.
- Lo retira de `QA_TENANT_ADMIN` si existiera por carga manual.

No modifica roles productivos reales ni datos historicos.

## Smoke automatico

Script:

`docs/qa/12-auth-i2-view-security-audit-smoke.sh`

Ejecucion:

```bash
API_BASE_URL=http://localhost:8090 bash docs/qa/12-auth-i2-view-security-audit-smoke.sh
```

Valida:

- `qa.soporte@local.test` consulta auditoria con `VIEW_SECURITY_AUDIT`.
- `qa.a.admin@local.test` recibe `403`.
- `qa.sinpermisos@local.test` genera `LOGIN_BLOCKED_NO_ACCESS`.
- Token revocado genera `TOKEN_REVOKED`.
- Filtro `TOKEN_REVOKED` devuelve evidencia consultable.

Reportes:

- `qa-reports/AUTH-I2-view-security-audit-smoke-report-YYYYMMDD-HHMMSS.md`
- `qa-reports/AUTH-I2-view-security-audit-smoke-report-YYYYMMDD-HHMMSS.csv`

## Riesgos mitigados

- `MANAGE_SECURITY_SETTINGS` ya no es necesario para leer auditoria.
- Soporte puede consultar eventos sin capacidad de cambiar parametros de seguridad.
- Admin tenant operativo no ve auditoria de seguridad salvo que se le asigne explicitamente el permiso dedicado.

## Limitaciones

- No se crea UI avanzada de exportacion.
- No se implementa retencion ni archivado automatico.
- `qa.soporte@local.test` depende de ejecutar el script QA si el ambiente no trae el permiso cargado.
- La separacion productiva de roles debe revisarse antes de asignar este permiso fuera de QA.
