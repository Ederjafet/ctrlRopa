# ERP - Tenant runtime hardening

Fecha: 2026-05-13  
Fase: 2F - tenant runtime hardening  
Rama: `feature/fase2f-tenant-runtime-hardening`  
Tipo: implementacion minima backend/base de datos

## Objetivo

Preparar sesiones tenant-aware sin migrar todavia ventas, pagos, live, reportes ni tablas P0 operativas. La meta de esta fase es que el backend ya pueda saber que company y branch estan activas para una sesion, manteniendo compatibilidad con el RC actual.

## Alcance implementado

- Relacion usuario-compania mediante `user_companies`.
- Backfill de usuarios actuales hacia la company default derivada de su sucursal actual.
- Sesiones API con `active_company_id` y `active_branch_id`.
- Backfill de sesiones existentes cuando existe usuario/sucursal/company.
- Validacion backend de pertenencia usuario-company.
- Validacion backend de operacion usuario-branch.
- Resolucion tenant desde sesion activa cuando existe token.
- Fallback compatible para sesiones antiguas sin tenant activo.
- Proteccion de `/api/tenant/current` mediante token API.

## Migracion creada

Archivo:

- `backend/control-ropa/src/main/resources/db/migration/V39__tenant_user_company_sessions.sql`

Cambios:

- Crea tabla `user_companies`.
- Inserta relaciones iniciales desde `users.branch_id -> branches.company_id`.
- Agrega `user_api_sessions.active_company_id`.
- Agrega `user_api_sessions.active_branch_id`.
- Agrega FK hacia `companies` y `branches`.
- Agrega indices basicos para company/branch activa en sesiones.
- Actualiza sesiones existentes con company/branch derivada.

## Backend creado o actualizado

Archivos nuevos:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/UserCompany.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/UserCompanyId.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/UserCompanyRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/UserCompanyService.java`

Archivos actualizados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/auth/AuthService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/config/ApiTokenFilter.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/tenant/TenantResolver.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/health/HealthControllerSecurityTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/tenant/TenantResolverTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/tenant/UserCompanyServiceTests.java`

## Reglas runtime

- Login nuevo crea sesion con company y branch activas.
- `ApiTokenFilter` valida que la company activa siga `ACTIVE` cuando la sesion trae `active_company_id`.
- `ApiTokenFilter` valida que la branch activa siga `ACTIVE` y pertenezca a la company activa cuando la sesion trae `active_branch_id`.
- `TenantResolver.resolveCurrent()` usa la sesion activa si hay token disponible.
- Si una sesion antigua no tiene `active_company_id` o `active_branch_id`, el resolver usa fallback desde `users.branch_id`.
- El fallback es temporal para compatibilidad; no debe usarse como estrategia final SaaS.

## Validaciones incluidas

- Usuario pertenece a company activa (`user_companies.status = ACTIVE`).
- Usuario puede operar branch asignada mediante `user_branches`.
- Branch pertenece a company activa.
- Company activa no puede estar suspendida/inactiva.
- `/api/tenant/current` requiere token valido.

## Fuera de alcance

- No se implemento selector/cambio de tenant.
- No se implemento consola SaaS HPSQ-SOFT.
- No se migraron `customers`, `items`, `sales`, `payments`, `reports`, `lives` ni paquetes.
- No se implementaron permisos completos por company.
- No se modifico frontend.
- No se implemento billing ni planes SaaS.

## Riesgos pendientes

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Sesiones antiguas pueden depender del fallback por usuario/sucursal | ALTO | Mantener fallback solo temporalmente y validar runtime QA despues de reiniciar backend |
| Usuario multi-company todavia no tiene selector tenant | ALTO | Fase futura debe implementar cambio de tenant controlado y auditado |
| Roles/permisos siguen globales | CRITICO | No habilitar multi-compania real hasta migrar permisos por company |
| Tablas P0 operativas siguen sin `company_id` | CRITICO | No validar aislamiento cross-company hasta Fase P0 |
| Suspension de company no revoca sesiones automaticamente | ALTO | Fase futura debe revocar sesiones o validar estado en endpoints P0 |

## Rollback

Rollback de codigo:

- Revertir cambios de `AuthService`, `ApiTokenFilter`, `TenantResolver` y clases `UserCompany*`.
- Revertir pruebas agregadas si la rama se descarta.

Rollback de base:

- En QA/dev, restaurar backup previo a `V39` si se requiere quitar columnas/tablas.
- No aplicar rollback destructivo en productivo sin ventana y respaldo.

## Pruebas ejecutadas

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

## Siguiente fase recomendada

Fase 2G debe validar runtime real despues de reiniciar/desplegar backend:

- Login QA.
- `GET /api/tenant/current` autenticado.
- Validacion SQL de `user_companies`.
- Validacion SQL de `user_api_sessions.active_company_id`.
- Smoke dashboard/sucursales.
- Confirmar que no se rompio RC previo.

No conviene migrar tablas P0 ni permisos por company hasta tener evidencia runtime de esta fase.
