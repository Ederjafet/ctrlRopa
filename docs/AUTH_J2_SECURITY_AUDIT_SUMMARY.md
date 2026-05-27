# AUTH-J2 - Resumen estadistico de auditoria de seguridad

Fecha: 2026-05-27  
Rama: `feature/auth-j2-security-audit-summary`  
Tipo: backend, seguridad, analitica operativa

## Objetivo

Agregar un resumen operativo de `security_audit_events` para soporte y seguridad, evitando revisar evento por evento cuando se necesita entender volumen, tipos de bloqueo, usuarios/rutas frecuentes y eventos criticos recientes.

## Endpoint creado

`GET /api/security/audit-events/summary`

Permiso requerido:

`VIEW_SECURITY_AUDIT`

No se crea permiso nuevo. Se reutiliza el permiso dedicado aprobado en AUTH-I2.

## Filtros

| Parametro | Tipo | Uso |
|---|---|---|
| `dateFrom` | datetime ISO local | Filtra `occurred_at >= dateFrom`. |
| `dateTo` | datetime ISO local | Filtra `occurred_at <= dateTo`. |
| `companyId` | number | Filtra por company registrada en el evento. |
| `branchId` | number | Filtra por branch registrada en el evento. |
| `email` | string | Busca email parcial, case-insensitive. |
| `eventType` | string | Filtra por tipo exacto de evento. |

Formato de fecha:

`YYYY-MM-DDTHH:mm:ss`

## Respuesta

Campos principales:

- `totalEvents`
- `total401`
- `total403`
- `byEventType`
- `byStatusCode`
- `byCompany`
- `byBranch`
- `topEmails`
- `topPaths`
- `recentCriticalEvents`

Las agrupaciones devuelven lineas:

```json
{
  "key": "TOKEN_REVOKED",
  "count": 12
}
```

`recentCriticalEvents` devuelve solo campos seguros:

- `id`
- `occurredAt`
- `eventType`
- `email`
- `companyId`
- `branchId`
- `httpMethod`
- `path`
- `statusCode`
- `reason`

No devuelve `metadataJson` por default.

## Eventos criticos

AUTH-J2 considera criticos:

- `TOKEN_INVALID`
- `TOKEN_REVOKED`
- `PERMISSION_DENIED`
- `BRANCH_DENIED`
- `COMPANY_DENIED`
- `CROSS_TENANT_DENIED`
- `LOGIN_BLOCKED_NO_ACCESS`
- `LOGIN_BLOCKED_NO_EFFECTIVE_PERMISSIONS`

## Limites

- `byEventType`, `byStatusCode`, `byCompany`, `byBranch`, `topEmails`, `topPaths` y `recentCriticalEvents` devuelven maximo 10 registros.
- Orden de agrupaciones: conteo descendente y clave ascendente.
- Eventos criticos recientes: `occurred_at DESC`, `id DESC`.

## Datos que NO se exponen

- Passwords.
- Tokens completos.
- Hashes completos.
- Cuerpos de request.
- `metadataJson` en el resumen.

## Pruebas backend

Pruebas agregadas/ajustadas:

`SecurityAuditEventQueryServiceTests`

Casos cubiertos:

- Usuario con `VIEW_SECURITY_AUDIT` consulta summary.
- Usuario sin `VIEW_SECURITY_AUDIT` recibe `403` desde `AccessService`.
- Filtros por fecha se aplican a las consultas.
- Resumen agrupa por `eventType`.
- Resumen agrupa por `statusCode`.
- `topPaths` respeta limite operativo.

## Smoke automatico

Script:

`docs/qa/13-auth-j2-security-audit-summary-smoke.sh`

Ejecucion:

```bash
API_BASE_URL=http://localhost:8090 bash docs/qa/13-auth-j2-security-audit-summary-smoke.sh
```

Valida:

- Login de `qa.soporte@local.test`.
- `GET /api/security/audit-events/summary` devuelve `200`.
- La respuesta contiene `totalEvents`, `byEventType`, `byStatusCode` y `topPaths`.
- Login de `qa.a.admin@local.test`.
- Admin tenant sin `VIEW_SECURITY_AUDIT` recibe `403`.

Reportes:

- `qa-reports/AUTH-J2-security-audit-summary-smoke-report-YYYYMMDD-HHMMSS.md`
- `qa-reports/AUTH-J2-security-audit-summary-smoke-report-YYYYMMDD-HHMMSS.csv`

Resultado validado:

- `PASS=9`
- `FAIL=0`
- `SKIP=0`
- Reporte Markdown: `qa-reports/AUTH-J2-security-audit-summary-smoke-report-20260527-094751.md`
- Reporte CSV: `qa-reports/AUTH-J2-security-audit-summary-smoke-report-20260527-094751.csv`

## Validaciones tecnicas

- `.\mvnw.cmd test`
  - Resultado: `BUILD SUCCESS`, 60 tests, 0 failures, 0 errors.
- `git diff --check`
  - Resultado: OK; solo warnings CRLF.
- Barrido de codificacion en archivos nuevos/modificados de auditoria AUTH-J2.
  - Resultado: sin coincidencias reales de mojibake.

## Limitaciones

- AUTH-J2 no agrego UI para el resumen; AUTH-J3 lo muestra en `/system-security-audit`.
- No se agregan graficas ni export desde frontend.
- No se cambia la retencion de AUTH-J1.
- No se agregan indices nuevos; si el volumen crece, evaluar indices compuestos por `occurred_at`, `event_type`, `status_code`, `email` y `path`.

## Siguiente fase recomendada

- AUTH-J3: UI compacta de resumen en `/system-security-audit`. Implementada en `docs/AUTH_J3_SECURITY_AUDIT_DASHBOARD.md`.
- AUTH-J4: alertas por patrones repetidos.
- AUTH-J5: archivado/export historico si soporte lo requiere.
