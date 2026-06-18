# ERP - Validacion runtime tenant-aware 2G

Fecha: 2026-05-13  
Fase: 2G - validacion runtime tenant-aware  
Rama: `feature/fase2g-validacion-runtime-tenant-aware`  
Tipo: validacion runtime y documentacion

## Objetivo

Confirmar en runtime real que login, sesiones tenant-aware y `GET /api/tenant/current` funcionan despues de Fase 2D/2F, sin romper dashboard, sucursales ni navegacion basica.

## Alcance

Validado:

- Flyway V39.
- Company default.
- Branches con `company_id`.
- `user_companies`.
- `user_api_sessions.active_company_id`.
- `user_api_sessions.active_branch_id`.
- Reinicio limpio del backend.
- `/api/health`.
- `/api/tenant/current` sin token.
- Login QA admin.
- `/api/tenant/current` con token valido.
- Dashboard.
- Sucursales activas.
- Login de usuarios QA disponibles.

Fuera de alcance:

- Ventas.
- Pagos.
- Reportes.
- Live.
- Frontend.
- SaaS console.
- Billing.
- Migracion de tablas P0.

## Ambiente

- Backend: `http://localhost:8090`
- Base: `control_ropa`
- Motor reportado por pruebas Maven: MySQL 5.7
- Usuario principal runtime: `qa.admin@local.test`
- Password QA: `Qa12345!`

## Reinicio limpio backend

Situacion inicial:

- Existia un proceso escuchando en `8090` con PID `34092`.
- Antes del reinicio, nuevos logins generaban sesiones con `active_company_id = NULL`, lo que indicaba runtime no sincronizado con Fase 2F.

Accion:

```powershell
Stop-Process -Id 34092 -Force
Start-Process -FilePath .\mvnw.cmd -ArgumentList @('spring-boot:run') -WorkingDirectory 'e:\CtrlPan\2026\control-ropa-app\backend\control-ropa' -WindowStyle Hidden
```

Resultado:

- Backend reiniciado.
- Nuevo proceso escuchando en `8090` con PID `36616`.
- Despues del reinicio, login nuevo genero sesion con `active_company_id=1` y `active_branch_id=4`.

## Queries ejecutadas

Las consultas se ejecutaron en modo lectura mediante JDBC/JShell porque `mysql` CLI no estaba disponible en PATH.

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

### Company default

```sql
SELECT id, code, name, status
FROM companies
WHERE code = 'DEFAULT';
```

Resultado:

- `id=1`
- `code=DEFAULT`
- `name=HPSQ-SOFT Default Company`
- `status=ACTIVE`

### Branches con company

```sql
SELECT
  COUNT(*) AS branches_total,
  SUM(company_id IS NOT NULL) AS branches_with_company,
  SUM(company_id IS NULL) AS branches_without_company
FROM branches;
```

Resultado:

- `branches_total=5`
- `branches_with_company=5`
- `branches_without_company=0`

### User companies

```sql
SELECT COUNT(*) AS user_companies_total
FROM user_companies;
```

Resultado:

- `user_companies_total=14`

### Sesion tenant-aware creada por login nuevo

```sql
SELECT
  s.id,
  u.email,
  s.active_company_id,
  c.code AS company_code,
  s.active_branch_id,
  b.code AS branch_code,
  s.created_at
FROM user_api_sessions s
JOIN users u ON u.id = s.user_id
LEFT JOIN companies c ON c.id = s.active_company_id
LEFT JOIN branches b ON b.id = s.active_branch_id
WHERE u.email = 'qa.admin@local.test'
ORDER BY s.id DESC
LIMIT 3;
```

Resultado relevante:

- `id=25`
- `email=qa.admin@local.test`
- `active_company_id=1`
- `company_code=DEFAULT`
- `active_branch_id=4`
- `branch_code=QA_CTR`

Observacion:

- Sesiones previas `id=22` y `id=23` quedaron con `active_company_id=NULL` porque fueron creadas antes del reinicio correcto. El fallback mantiene compatibilidad, pero deben revocarse o expirar antes de una validacion final estricta.

### Usuarios QA revisados

```sql
SELECT
  u.email,
  u.status,
  b.code AS branch_code,
  b.company_id,
  CASE WHEN uc.user_id IS NULL THEN 'NO' ELSE 'YES' END AS has_user_company
FROM users u
JOIN branches b ON b.id = u.branch_id
LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.company_id = b.company_id
WHERE u.email IN (
  'qa.admin@local.test',
  'qa.sinpermisos@local.test',
  'qa.reportes@local.test',
  'qa.soporte@local.test',
  'qa.vendedor.centro@local.test'
)
ORDER BY u.email;
```

Resultado:

- `qa.admin@local.test`: existe, `ACTIVE`, `QA_CTR`, `has_user_company=YES`.
- `qa.vendedor.centro@local.test`: existe, `ACTIVE`, `QA_CTR`, `has_user_company=YES`.
- `qa.sinpermisos@local.test`: no aparece en resultado.
- `qa.reportes@local.test`: no aparece en resultado.
- `qa.soporte@local.test`: no aparece en resultado.

Conclusion:

- El fallo de login de `qa.sinpermisos`, `qa.reportes` y `qa.soporte` se debe a dataset QA incompleto en esta base runtime, no a tenant resolver.

## Endpoints probados

### Healthcheck

```powershell
curl.exe -i http://localhost:8090/api/health
```

Resultado:

- `HTTP/1.1 200`
- JSON con `status=OK`.

### Tenant current sin token

```powershell
curl.exe -i http://localhost:8090/api/tenant/current
```

Resultado:

- `HTTP/1.1 401`
- Respuesta: `{"message":"Sesion invalida o vencida"}`.

Nota:

- El mensaje sigue mostrando acento en runtime, pero el header reporta `charset=ISO-8859-1`. No bloquea esta fase, pero debe revisarse en hardening de encoding/API.

### Login admin QA

```powershell
POST http://localhost:8090/api/auth/login
Body: {"email":"qa.admin@local.test","password":"Qa12345!"}
```

Resultado:

- Login OK.
- `branch=QA Centro`.
- `sessionToken` recibido.

### Tenant current con token valido

```powershell
GET http://localhost:8090/api/tenant/current
Authorization: Bearer <sessionToken>
```

Resultado:

- `companyId=1`
- `companyCode=DEFAULT`
- `companyName=HPSQ-SOFT Default Company`
- `branchId=4`
- `branchCode=QA_CTR`

### Dashboard

```powershell
GET http://localhost:8090/api/dashboard/me
Authorization: Bearer <sessionToken>
```

Resultado:

- `date=2026-05-13`
- `branches=1`

### Branches activas

```powershell
GET http://localhost:8090/api/branches/active
Authorization: Bearer <sessionToken>
```

Resultado:

- `active=5`
- primer codigo devuelto: `CTR`

## Usuarios QA

| Usuario | Resultado | Observacion |
|---|---|---|
| `qa.admin@local.test` | OK | Login, tenant current, dashboard y branches OK. |
| `qa.vendedor.centro@local.test` | OK | Login OK. |
| `qa.sinpermisos@local.test` | FAIL 403 | Usuario no existe en base runtime consultada. |
| `qa.reportes@local.test` | FAIL 403 | Usuario no existe en base runtime consultada. |
| `qa.soporte@local.test` | FAIL 403 | Usuario no existe en base runtime consultada. |

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

## Hallazgos

### HG-2G-001 - Runtime previo no sincronizado

Antes del reinicio, el backend escuchando en `8090` creaba sesiones sin `active_company_id`. Despues del reinicio desde la rama actual, las sesiones nuevas si guardan tenant activo.

Severidad: ALTO  
Estado: Mitigado para esta validacion con reinicio limpio.

### HG-2G-002 - Dataset QA incompleto

Los usuarios `qa.sinpermisos@local.test`, `qa.reportes@local.test` y `qa.soporte@local.test` no existen en la base runtime actual. Esto impide validar permisos negativos, reportes y soporte en la misma corrida.

Severidad: ALTO  
Estado: Abierto.

### HG-2G-003 - Sesiones antiguas sin active tenant

Existen sesiones previas con `active_company_id=NULL` y `active_branch_id=NULL`. El fallback mantiene compatibilidad, pero una validacion SaaS estricta debe revocar/expirar sesiones viejas antes de pruebas cross-company.

Severidad: MEDIO  
Estado: Aceptado temporalmente.

## Decision

Resultado tenant-aware runtime:

- `GO tecnico condicionado` para la base de sesiones tenant-aware.

Decision para migrar primera tabla P0:

- `NO-GO` por ahora.

Motivo:

- La sesion tenant-aware funciona despues del reinicio y `/api/tenant/current` responde correctamente.
- Sin embargo, el dataset QA runtime no contiene perfiles `qa.sinpermisos`, `qa.reportes` y `qa.soporte`, por lo que no se puede completar regresion de permisos/reportes/soporte antes de migrar tablas P0.
- Tambien deben limpiarse o dejar expirar sesiones antiguas sin active tenant antes de pruebas SaaS estrictas.

## Evidencia esperada para pasar a P0

- Login OK con `qa.admin`, `qa.vendedor.centro`, `qa.sinpermisos`, `qa.reportes` y `qa.soporte`.
- Todos esos usuarios con registro en `user_companies`.
- Login nuevo de cada usuario con `active_company_id` y `active_branch_id`.
- `/api/tenant/current` OK para cada usuario permitido.
- `/api/tenant/current` 401 sin token.
- Dashboard y branches OK.
- Sin sesiones activas legacy con tenant null o con decision formal de aceptacion.

## Siguiente fase recomendada

Fase 2H:

- Restaurar/completar dataset QA de usuarios `qa.sinpermisos`, `qa.reportes`, `qa.soporte`.
- Asegurar backfill `user_companies` para usuarios QA creados despues de V39.
- Repetir smoke tenant runtime.
- Revocar sesiones legacy sin active tenant si se requiere validacion estricta.
- Solo despues evaluar migracion de primera tabla P0 de bajo riesgo.

## Seguimiento Fase 2H

Se creo `docs/qa/06-usuarios-tenant-qa.sql` para preparar los usuarios faltantes:

- `qa.sinpermisos@local.test`
- `qa.reportes@local.test`
- `qa.soporte@local.test`

El script:

- Es solo QA.
- No es migracion Flyway.
- Asegura `QA_CTR` bajo company `DEFAULT`.
- Crea/reactiva usuarios.
- Resetea password QA.
- Inserta/actualiza `user_companies`.
- Inserta/actualiza `user_branches`.
- Reasigna roles/permisos esperados.
- Revoca sesiones legacy de esos usuarios.

Estado:

- Pendiente ejecutar en QA.
- Pendiente repetir smoke 2G.
- Decision P0 se mantiene `NO-GO` hasta validar esos usuarios en runtime.
