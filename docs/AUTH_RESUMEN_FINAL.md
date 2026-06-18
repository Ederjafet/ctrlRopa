# Resumen final del bloque AUTH

Proyecto: `control-ropa-app`  
Estado: AUTH funcionalmente completo y validado  
Fecha: 2026-05-28  

Nota: confirmar que AUTH-Z este mergeado a `develop` antes de declarar cierre total en repositorio.

## Ambiente

- Sistema operativo: Windows
- Shell QA: Git Bash MINGW64
- Node: `v20.20.2`
- npm: `10.8.2`
- Backend Spring Boot: puerto `8090`
- Frontend Expo Web: puerto `8081`
- IP DEV: `192.168.0.128`
- QA remoto observado: `192.168.0.149`
- AnyDesk QA: `1119457696`

## Estado cronologico por fase

### AUTH-A

- Login seguro.
- Bloqueo de usuarios con rol `NO_ACCESS`.
- Bloqueo de usuarios sin permisos efectivos.
- Calculo de permisos efectivos.
- Company activa y branch activa en sesion.
- Sesion unica por usuario.
- Revocacion de sesiones anteriores.
- Token revocado rechazado por backend.
- Frontend redirige a `/login`.
- Mensaje claro: `Tu sesion se cerro porque iniciaste sesion en otro equipo.`

### AUTH-F1

- Matriz permiso-endpoint.
- Inventario de permisos, pantallas frontend y endpoints backend.
- Huecos detectados entre guards frontend, enforcement backend y catalogo RBAC.

### AUTH-F2

- Catalogo RBAC minimo aprobado documentalmente.
- Permisos propuestos como base:
  - `CREATE_CUSTOMER`
  - `EDIT_CUSTOMER`
  - `VIEW_PAYMENTS`
  - `VIEW_SALES`

### AUTH-F3

- Migracion de permisos RBAC aprobados.
- Actualizacion de `PermissionCode`.
- Enforcement P0 inicial.
- Cobertura en clientes, pagos y ventas.
- Fix de cliente legacy con `status null` para evitar 500 en `CustomerService`.

### AUTH-F4

- Cross-tenant runtime hardening P0.
- Modulos endurecidos:
  - customers
  - items
  - batches
  - payments
  - sales
- Bloqueo por id, branch, codigo, QR y folio ajeno.

### AUTH-F5

- Hardening de consumidores secundarios y financieros derivados.
- Modulos revisados/endurecidos:
  - reportes
  - reservaciones
  - paquetes
  - envios
  - refunds
  - saldos
  - addresses
  - owner history
- Introduccion y uso de `TenantAccessGuard`.

### AUTH-F6

- Suite negativa SaaS reproducible.
- Script:
  - `docs/qa/10-auth-f6-saas-negative-regression-smoke.sh`
- Resultado:
  - `PASS=20`
  - `FAIL=0`
  - `SKIP=5`
- Los `SKIP` corresponden a datos QA opcionales no cargados y no representan falla de seguridad.

### AUTH-G

- Creacion de `security_audit_events`.
- Auditoria de eventos de seguridad.
- Eventos auditados:
  - `LOGIN_BLOCKED_NO_ACCESS`
  - `LOGIN_BLOCKED_NO_EFFECTIVE_PERMISSIONS`
  - `TOKEN_INVALID`
  - `TOKEN_REVOKED`
  - `SESSION_REVOKED`
  - `PERMISSION_DENIED`
  - `BRANCH_DENIED`
  - `COMPANY_DENIED`
  - `CROSS_TENANT_DENIED`

### AUTH-H

- Endpoint:
  - `GET /api/security/audit-events`
- Consulta protegida de auditoria de seguridad.

### AUTH-I

- UI:
  - `/system-security-audit`
- Acceso:
  - `Sistema -> Auditoria de seguridad`

### AUTH-I2

- Permiso dedicado:
  - `VIEW_SECURITY_AUDIT`
- La consulta de auditoria deja de depender de `MANAGE_SECURITY_SETTINGS`.
- `qa.soporte@local.test` puede consultar auditoria.
- `qa.a.admin@local.test` no puede consultar auditoria.

### AUTH-J1

- Retencion y limpieza automatica de auditoria.
- Propiedades:
  - `security.audit.retention-days=180`
  - `security.audit.cleanup.enabled=true`
  - `security.audit.cleanup-cron=0 0 3 * * *`

### AUTH-J2

- Endpoint:
  - `GET /api/security/audit-events/summary`
- Campos:
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

### AUTH-J3

- Dashboard visual de auditoria.
- Totales, agrupaciones, top usuarios, top paths y eventos criticos.

### AUTH-J4

- Endpoint:
  - `GET /api/security/audit-events/alerts`
- Alertas por patrones criticos.

### AUTH-J5

- Export CSV:
  - `GET /api/security/audit-events/export.csv`
  - `GET /api/security/audit-events/alerts/export.csv`
- Validacion de que los exports no contengan `password` ni `sessionToken`.

### AUTH-Z

- Smoke maestro final:
  - `docs/qa/99-auth-z-final-security-smoke.sh`
- Resultado:
  - `PASS=6`
  - `FAIL=0`
  - `SKIP=0`
- Encadena:
  - AUTH-F6
  - AUTH-H
  - AUTH-I2
  - AUTH-J2
  - AUTH-J4
  - AUTH-J5

## Tabla de resultados de smoke

| Fase | PASS | FAIL | SKIP |
|---|---:|---:|---:|
| AUTH-F6 | 20 | 0 | 5 |
| AUTH-H | 9 | 0 | 0 |
| AUTH-I2 | 10 | 0 | 0 |
| AUTH-J2 | 9 | 0 | 0 |
| AUTH-J4 | 13 | 0 | 0 |
| AUTH-J5 | 13 | 0 | 0 |
| AUTH-Z | 6 | 0 | 0 |

## Permisos clave creados

- `CREATE_CUSTOMER`
- `EDIT_CUSTOMER`
- `VIEW_PAYMENTS`
- `VIEW_SALES`
- `VIEW_SECURITY_AUDIT`

## Endpoints clave

- `GET /api/security/audit-events`
- `GET /api/security/audit-events/summary`
- `GET /api/security/audit-events/alerts`
- `GET /api/security/audit-events/export.csv`
- `GET /api/security/audit-events/alerts/export.csv`

## Scripts QA importantes

- `docs/qa/10-auth-f6-saas-negative-regression-smoke.sh`
- `docs/qa/11-auth-h-security-audit-smoke.sh`
- `docs/qa/12-auth-i2-view-security-audit-smoke.sh`
- `docs/qa/13-auth-j2-security-audit-summary-smoke.sh`
- `docs/qa/14-auth-j4-security-alerts-smoke.sh`
- `docs/qa/15-auth-j5-security-audit-export-smoke.sh`
- `docs/qa/99-auth-z-final-security-smoke.sh`

## Evidencias generadas

Los reportes se generan en:

`qa-reports/`

Ejemplos:

- `AUTH-Z-final-security-report-YYYYMMDD-HHMMSS.md`
- `AUTH-F6-smoke-report-YYYYMMDD-HHMMSS.md`
- `AUTH-H-security-audit-smoke-report-YYYYMMDD-HHMMSS.md`
- `AUTH-I2-view-security-audit-smoke-report-YYYYMMDD-HHMMSS.md`
- `AUTH-J2-security-audit-summary-smoke-report-YYYYMMDD-HHMMSS.md`
- `AUTH-J4-security-alerts-smoke-report-YYYYMMDD-HHMMSS.md`
- `AUTH-J5-security-audit-export-smoke-report-YYYYMMDD-HHMMSS.md`

## Riesgos o pendientes conocidos

- `SKIP` de AUTH-F6 por falta de datos QA opcionales:
  - `QA_DUP_BATCH_FOLIO`
  - `QA_B_RESERVATION_ID`
  - `QA_B_CUSTOMER_PACKAGE_ID`
  - `QA_B_SHIPMENT_ID`
  - `QA_B_REFUND_ID`
- Estos `SKIP` no son fallas de seguridad.
- Pendiente futuro: release QA formal.
- Pendiente futuro opcional:
  - alertas persistidas;
  - notificaciones;
  - dashboard ejecutivo;
  - politica avanzada de retencion.

## Comandos para confirmar cierre en repo

```bash
cd /e/CtrlPan/2026/control-ropa-app
git checkout develop
git status
git log --oneline -15
```

Debe aparecer un commit equivalente a:

`AUTH-Z cierra validacion integral de seguridad`

## Conclusion

AUTH queda completo a nivel tecnico, funcional, de auditoria, de UI operativa y de pruebas automatizadas, sujeto a confirmar que AUTH-Z este mergeado en `develop`.
