# AUTH-H - Consola protegida de auditoria de seguridad

Fecha: 2026-05-26  
Rama: `feature/auth-h-security-audit-console`  
Tipo: seguridad backend, consulta protegida, smoke automatizado

## Objetivo

Crear una consulta administrativa protegida para `security_audit_events` y un smoke automatico que demuestre que los eventos criticos se registran y pueden consultarse sin exponer tokens completos, passwords ni datos sensibles.

## Endpoint creado

`GET /api/security/audit-events`

Permiso requerido:

- AUTH-H original: `MANAGE_SECURITY_SETTINGS`.
- AUTH-I2 vigente: `VIEW_SECURITY_AUDIT`.

Motivo:

- Ya existe en el catalogo RBAC.
- Es el permiso administrativo mas cercano a configuracion/operacion de seguridad.
- No se creo `VIEW_SECURITY_AUDIT` en AUTH-H; AUTH-I2 lo crea y lo adopta para separar lectura de auditoria de configuracion de seguridad.

## Filtros disponibles

| Parametro | Tipo | Uso |
|---|---|---|
| `eventType` | string | Filtra por tipo exacto, por ejemplo `TOKEN_REVOKED`. |
| `email` | string | Busca por email parcial, case-insensitive. |
| `companyId` | number | Filtra por company registrada en el evento. |
| `branchId` | number | Filtra por branch registrada en el evento. |
| `statusCode` | number | Filtra por status HTTP, por ejemplo `401` o `403`. |
| `dateFrom` | datetime ISO local | Filtra `occurred_at >= dateFrom`. |
| `dateTo` | datetime ISO local | Filtra `occurred_at <= dateTo`. |
| `path` | string | Busca por path parcial. |
| `page` | number | Pagina base 0. |
| `size` | number | Tamano de pagina, maximo 200. |

Orden:

- `occurred_at DESC`
- `id DESC`

## Respuesta

La respuesta incluye:

- `events`
- `page`
- `size`
- `total`

Cada evento devuelve:

- `id`
- `occurredAt`
- `userId`
- `email`
- `companyId`
- `branchId`
- `eventType`
- `httpMethod`
- `path`
- `statusCode`
- `reason`
- `remoteIp`
- `userAgent`
- `targetResourceType`
- `targetResourceId`
- `metadataJson`

No se devuelven passwords ni tokens completos porque no se guardan en la tabla.

## Smoke automatico

Script:

`docs/qa/11-auth-h-security-audit-smoke.sh`

Ejecucion Git Bash:

```bash
API_BASE_URL=http://localhost:8090 bash docs/qa/11-auth-h-security-audit-smoke.sh
```

Variables:

| Variable | Default | Uso |
|---|---|---|
| `API_BASE_URL` | `http://localhost:8090` | API objetivo. |
| `ADMIN_EMAIL` | `qa.soporte@local.test` | Usuario con permiso de consulta de auditoria. En AUTH-I2 debe tener `VIEW_SECURITY_AUDIT`. |
| `AUDITED_EMAIL` | `qa.a.admin@local.test` | Usuario usado para provocar token revocado. |
| `NO_ACCESS_EMAIL` | `qa.sinpermisos@local.test` | Usuario usado para provocar `LOGIN_BLOCKED_NO_ACCESS`. |
| `QA_PASSWORD` | `Qa12345!` | Password QA conocida. |
| `REPORT_DIR` | `qa-reports` | Carpeta de reportes. |

Flujo:

1. Login con usuario administrativo de seguridad.
2. Login bloqueado con `NO_ACCESS`.
3. Login de usuario auditado.
4. Segundo login del mismo usuario auditado para revocar token anterior.
5. Request con token anterior para generar `TOKEN_REVOKED`.
6. Consulta `GET /api/security/audit-events`.
7. Validacion de presencia de eventos obligatorios.

Reportes:

- Markdown: `qa-reports/AUTH-H-security-audit-smoke-report-YYYYMMDD-HHMMSS.md`
- CSV: `qa-reports/AUTH-H-security-audit-smoke-report-YYYYMMDD-HHMMSS.csv`

Resultado validado:

- `PASS=9`
- `FAIL=0`
- `SKIP=0`
- Reporte generado: `qa-reports/AUTH-H-security-audit-smoke-report-20260526-233955.md`
- CSV generado: `qa-reports/AUTH-H-security-audit-smoke-report-20260526-233955.csv`

## Eventos probados

| Evento | Como se provoca | Esperado |
|---|---|---|
| `LOGIN_BLOCKED_NO_ACCESS` | Login con `qa.sinpermisos@local.test` | 403 y evento consultable. |
| `TOKEN_REVOKED` | Login doble de `qa.a.admin@local.test` y uso del token viejo | 401 y evento consultable. |

## Limitaciones

- AUTH-H no agrega una pantalla frontend completa; deja backend protegido y smoke automatico listo.
- `qa.a.admin@local.test` no debe tener `VIEW_SECURITY_AUDIT`; es admin tenant operativo, no admin de seguridad. Para consulta de auditoria se usa `qa.soporte@local.test`.
- El smoke AUTH-H queda como evidencia historica. Para validar el permiso dedicado se debe usar `docs/qa/12-auth-i2-view-security-audit-smoke.sh`.
- AUTH-J1 agrega retencion automatica configurable; no agrega archivado historico ni endpoint manual de purge.

## Proximos pasos

- AUTH-I: UI minima en Sistema/Seguridad para filtros frecuentes. Implementada en `docs/AUTH_I_SECURITY_AUDIT_UI.md`.
- AUTH-I2: permiso dedicado `VIEW_SECURITY_AUDIT`.
- AUTH-J1: retencion automatica segura de eventos. Implementada en `docs/AUTH_J1_SECURITY_AUDIT_RETENTION.md`.
- AUTH-G/H futuro: archivado y alertas por patrones repetidos.
