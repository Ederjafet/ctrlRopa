# ERP - Validacion runtime tenant-aware con usuarios QA 2I

Fecha: 2026-05-13  
Fase: 2I - runtime smoke tenant users  
Rama: `feature/fase2i-runtime-smoke-tenant-users`  
Tipo: validacion runtime real con SQL QA aplicado

## Objetivo

Ejecutar validacion runtime real tenant-aware con usuarios QA antes de permitir migracion de tablas P0.

## Alcance

Validado:

- Aplicacion de `docs/qa/06-usuarios-tenant-qa.sql`.
- Usuarios QA tenant-aware.
- Company `DEFAULT`.
- Branch `QA_CTR`.
- `user_companies`.
- `user_branches`.
- Limpieza/revocacion de sesiones legacy de usuarios QA faltantes.
- Login runtime.
- `/api/tenant/current`.
- Dashboard.
- Sucursales.
- Permiso negativo en endpoint restringido.
- Reportes para usuario de reportes.
- Soporte tecnico con acceso esperado.
- Logs backend.
- Logs frontend disponibles.
- Suite Maven.

Fuera de alcance:

- Migracion de tablas P0.
- Ventas.
- Pagos.
- Live.
- Reportes funcionales profundos.
- SaaS console.
- Billing.
- Multi-company productivo real.

## Ambiente

- Backend: `http://localhost:8090`
- Base: `control_ropa`
- Flyway: `V39`
- Script QA aplicado: `docs/qa/06-usuarios-tenant-qa.sql`
- Password QA: `Qa12345!`

## SQL QA aplicado

Comando usado:

```powershell
jshell --class-path "$env:USERPROFILE\.m2\repository\com\mysql\mysql-connector-j\9.5.0\mysql-connector-j-9.5.0.jar"
```

El script se ejecuto por JDBC en una sola conexion para conservar variables SQL y transaccion.

Resultado final del script:

| Usuario | Estado | Branch | Company | user_companies | Rol | Permisos rol |
|---|---|---|---|---|---|---:|
| `qa.reportes@local.test` | ACTIVE | QA_CTR | DEFAULT | YES | REPORTS | 4 |
| `qa.sinpermisos@local.test` | ACTIVE | QA_CTR | DEFAULT | YES | NO_ACCESS | 0 |
| `qa.soporte@local.test` | ACTIVE | QA_CTR | DEFAULT | YES | SUPPORT_TECH | 41 |

Sentencias ejecutadas: `23`.

## Queries de validacion

### Flyway

```sql
SELECT version, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 1;
```

Resultado:

- `version=39`
- `success=1`

### Company DEFAULT

```sql
SELECT id, code, name, status
FROM companies
WHERE code = 'DEFAULT';
```

Resultado:

- `id=1`
- `code=DEFAULT`
- `status=ACTIVE`

### Branch QA_CTR

```sql
SELECT id, code, name, company_id, status
FROM branches
WHERE code = 'QA_CTR';
```

Resultado:

- `id=4`
- `code=QA_CTR`
- `company_id=1`
- `status=ACTIVE`

### Usuarios con company

```sql
SELECT
  u.email,
  u.status,
  b.code AS branch_code,
  c.code AS company_code,
  CASE WHEN uc.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_company
FROM users u
JOIN branches b ON b.id = u.branch_id
JOIN companies c ON c.id = b.company_id
LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.company_id = c.id AND uc.status = 'ACTIVE'
WHERE u.email IN (
  'qa.admin@local.test',
  'qa.sinpermisos@local.test',
  'qa.reportes@local.test',
  'qa.soporte@local.test'
)
ORDER BY u.email;
```

Resultado:

- Los cuatro usuarios existen.
- Los cuatro estan `ACTIVE`.
- Los cuatro estan en `QA_CTR`.
- Los cuatro estan en company `DEFAULT`.
- Los cuatro tienen `has_user_company=YES`.

### User branches

```sql
SELECT
  u.email,
  COUNT(ub.branch_id) AS user_branches,
  SUM(ub.is_primary = 1) AS primary_branches
FROM users u
LEFT JOIN user_branches ub ON ub.user_id = u.id
WHERE u.email IN (
  'qa.admin@local.test',
  'qa.sinpermisos@local.test',
  'qa.reportes@local.test',
  'qa.soporte@local.test'
)
GROUP BY u.email
ORDER BY u.email;
```

Resultado:

- `qa.admin@local.test`: 1 branch, 1 primaria.
- `qa.reportes@local.test`: 2 branches, 1 primaria.
- `qa.sinpermisos@local.test`: 2 branches, 1 primaria.
- `qa.soporte@local.test`: 2 branches, 1 primaria.

### Sesiones legacy revocadas para usuarios del fix

```sql
SELECT
  u.email,
  COUNT(s.id) AS active_sessions_after_cleanup
FROM users u
LEFT JOIN user_api_sessions s ON s.user_id = u.id AND s.revoked_at IS NULL
WHERE u.email IN (
  'qa.sinpermisos@local.test',
  'qa.reportes@local.test',
  'qa.soporte@local.test'
)
GROUP BY u.email
ORDER BY u.email;
```

Resultado:

- `qa.reportes@local.test`: `0`
- `qa.sinpermisos@local.test`: `0`
- `qa.soporte@local.test`: `0`

## Runtime API

### Usuarios validados

| Usuario | Login | Tenant current | Dashboard | Branches | Endpoint restringido `/api/users` |
|---|---|---|---|---|---|
| `qa.admin@local.test` | OK | OK `DEFAULT/QA_CTR` | OK | OK | OK |
| `qa.sinpermisos@local.test` | OK | OK `DEFAULT/QA_CTR` | OK | OK | 403 esperado |
| `qa.reportes@local.test` | OK | OK `DEFAULT/QA_CTR` | OK | OK | 403 esperado |
| `qa.soporte@local.test` | OK | OK `DEFAULT/QA_CTR` | OK | OK | OK |

Detalle:

- `qa.admin@local.test`: `roles=ADMIN`, `perms=40`.
- `qa.sinpermisos@local.test`: `roles=NO_ACCESS`, `perms=0`.
- `qa.reportes@local.test`: `roles=REPORTS`, `perms=4`.
- `qa.soporte@local.test`: `roles=SUPPORT_TECH`, `perms=41`.

### Reportes

Endpoints:

- `GET /api/reports/daily-store?branchId=4&date=2026-05-13`
- `GET /api/reports/movement-history?branchId=4&startDate=2026-05-13&endDate=2026-05-13&movementType=ALL`

Resultados:

| Usuario | Daily store | Movement history |
|---|---|---|
| `qa.reportes@local.test` | OK | OK |
| `qa.sinpermisos@local.test` | 403 esperado | 403 esperado |
| `qa.soporte@local.test` | OK | OK |

## Sesiones tenant-aware

Consulta:

```sql
SELECT
  s.id,
  u.email,
  s.active_company_id,
  c.code AS company_code,
  s.active_branch_id,
  b.code AS branch_code,
  s.revoked_at,
  s.created_at
FROM user_api_sessions s
JOIN users u ON u.id = s.user_id
LEFT JOIN companies c ON c.id = s.active_company_id
LEFT JOIN branches b ON b.id = s.active_branch_id
WHERE u.email IN (
  'qa.admin@local.test',
  'qa.sinpermisos@local.test',
  'qa.reportes@local.test',
  'qa.soporte@local.test'
)
ORDER BY s.id DESC
LIMIT 12;
```

Resultado relevante:

- `qa.reportes`, `qa.sinpermisos`, `qa.soporte` y `qa.admin` generan sesiones nuevas con:
  - `active_company_id=1`
  - `company_code=DEFAULT`
  - `active_branch_id=4`
  - `branch_code=QA_CTR`

Observacion:

- Aun existen sesiones antiguas de `qa.admin` con `active_company_id=NULL`. No bloquearon esta fase porque el foco era usuarios QA tenant y nuevas sesiones, pero deben revocarse antes de pruebas SaaS cross-company estrictas.

## Logs

Backend:

- Archivo revisado: `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`.
- No se detectaron `500`, `ERROR`, excepciones, CORS, auth inesperado ni errores de tenant resolver en el tramo revisado.
- Se observaron respuestas `200 OK` para reportes y llamadas del smoke.

Frontend:

- Archivo disponible: `C:\HPSQ-SOFT\control-ropa\logs\frontend\frontend-web.log`.
- No se detectaron errores `error`, `CORS`, `401`, `500`, `tenant` o `auth` en el tramo revisado.
- No se ejecuto navegacion visual de navegador en esta fase; la validacion fue API/runtime.

## Pruebas automatizadas

Comando:

```powershell
.\mvnw.cmd test
```

Resultado:

- `BUILD SUCCESS`
- `Tests run: 14`
- `Failures: 0`
- `Errors: 0`
- `Skipped: 0`
- Flyway valido `39 migrations`.

## Riesgos

| Riesgo | Severidad | Estado | Mitigacion |
|---|---|---|---|
| Sesiones antiguas admin con tenant null | MEDIO | Abierto | Revocar sesiones legacy antes de QA cross-company. |
| No hay empresa B en dataset runtime | ALTO | Abierto | Crear dataset Empresa A/B antes de afirmar aislamiento SaaS real. |
| Branches activas devuelven todas las sucursales DEFAULT | MEDIO | Aceptado temporalmente | En P0 validar branch scope por permisos/company antes de SaaS real. |
| Reportes aun no son tenant P0 | CRITICO futuro | Abierto | No migrar reportes todavia; aislar despues de tablas base. |

## Decision

Resultado:

- `GO condicionado` para iniciar planeacion/implementacion de la primera tabla P0 de bajo riesgo.

Condiciones:

- No migrar ventas.
- No migrar pagos.
- No migrar live.
- No migrar reportes.
- La primera P0 debe ser de bajo riesgo y con rollback claro.
- Antes de validar aislamiento SaaS real debe existir dataset Empresa A/B.
- Antes de pruebas cross-company estrictas deben revocarse sesiones legacy con tenant null.

## Siguiente fase recomendada

Fase 2J:

- Seleccionar primera tabla P0 de bajo riesgo.
- Proponer migracion incremental con `company_id` nullable/backfill.
- Agregar validadores backend por `CurrentTenantContext`.
- Preparar QA Empresa A/B antes de declarar aislamiento multi-company real.
- Mantener pagos/ventas/reportes/live fuera de alcance.
