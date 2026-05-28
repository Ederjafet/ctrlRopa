# Entrega QA del bloque AUTH

Proyecto: `control-ropa-app`  
Estado: listo para entrega QA  
Fecha: 2026-05-28

## Objetivo del release

Este release entrega el bloque AUTH con:

- login seguro;
- sesion unica;
- RBAC;
- aislamiento SaaS;
- auditoria de seguridad;
- UI de auditoria;
- smokes automatizados;
- export de evidencia.

## Alcance funcional incluido

### Autenticacion

- Login seguro.
- Bloqueo de usuario inactivo, `NO_ACCESS` o sin permisos efectivos.
- Company activa y branch activa en sesion.

### Autorizacion/RBAC

- Permisos efectivos por rol y permisos directos.
- Enforcement P0 inicial y hardening progresivo.
- Permiso dedicado `VIEW_SECURITY_AUDIT`.

### Sesion unica

- Inicio de sesion en segundo equipo revoca sesiones anteriores.
- Token viejo queda invalido.
- Frontend limpia sesion y vuelve a login con mensaje claro.

### Tenant isolation

- QA_A no debe ver QA_B.
- QA_B no debe ver QA_A.
- DEFAULT no debe filtrarse a tenants QA.
- Validaciones por branch, company, id, codigo, QR y folio.

### Auditoria

- Tabla `security_audit_events`.
- Eventos 401/403 relevantes.
- Auditoria de token invalido, token revocado, permiso faltante y cross-tenant.

### UI de auditoria

- Ruta `/system-security-audit`.
- Acceso desde `Sistema -> Auditoria de seguridad`.
- Dashboard, resumen, alertas y listado.

### Reportes/export de auditoria

- Export CSV de eventos.
- Export CSV de alertas.
- Proteccion por `VIEW_SECURITY_AUDIT`.

### Suite automatica de pruebas

- Smokes individuales AUTH-F6, AUTH-H, AUTH-I2, AUTH-J2, AUTH-J4, AUTH-J5.
- Smoke maestro AUTH-Z.

## Alcance tecnico incluido

- Migraciones Flyway relevantes:
  - `V44` permisos RBAC.
  - `V45` `security_audit_events`.
  - `V46` `VIEW_SECURITY_AUDIT`.
- Entidad/modelo `SecurityAuditEvent`.
- Guard central `TenantAccessGuard`.
- Permiso `VIEW_SECURITY_AUDIT`.
- Tabla `security_audit_events`.
- Endpoints de auditoria:
  - `GET /api/security/audit-events`
  - `GET /api/security/audit-events/summary`
  - `GET /api/security/audit-events/alerts`
  - `GET /api/security/audit-events/export.csv`
  - `GET /api/security/audit-events/alerts/export.csv`
- Scripts QA bajo `docs/qa`.

## Usuarios QA para pruebas

| Usuario | Password | Uso esperado |
|---|---|---|
| `qa.a.admin@local.test` | `Qa12345!` | Admin tenant QA_A |
| `qa.a.vendedor@local.test` | `Qa12345!` | Vendedor QA_A |
| `qa.b.admin@local.test` | `Qa12345!` | Admin tenant QA_B |
| `qa.b.vendedor@local.test` | `Qa12345!` | Vendedor QA_B |
| `qa.soporte@local.test` | `Qa12345!` | Consulta auditoria con `VIEW_SECURITY_AUDIT` |
| `qa.sinpermisos@local.test` | `Qa12345!` | Debe quedar bloqueado |

## Validaciones QA recomendadas

- `qa.sinpermisos@local.test` no inicia sesion.
- Mismo usuario en dos equipos invalida sesion anterior.
- QA_A no ve QA_B.
- QA_B no ve QA_A.
- DEFAULT no se filtra.
- `qa.soporte@local.test` ve `Auditoria de seguridad`.
- `qa.a.admin@local.test` no ve `Auditoria de seguridad`.
- Export CSV funciona para soporte.
- Export CSV no funciona para admin sin permiso.
- CSV no contiene `password` ni `sessionToken`.

## Validacion automatica principal

Comando Git Bash:

```bash
API_BASE_URL=http://192.168.0.128:8090 bash docs/qa/99-auth-z-final-security-smoke.sh
```

Resultado esperado:

`FAIL=0`

## Validaciones tecnicas finales

```powershell
cd backend/control-ropa
./mvnw.cmd test
cd ../..
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
git diff --check
```

## Evidencia a adjuntar

- Reporte AUTH-Z final Markdown.
- Reporte AUTH-Z final CSV.
- Reportes individuales:
  - AUTH-F6
  - AUTH-H
  - AUTH-I2
  - AUTH-J2
  - AUTH-J4
  - AUTH-J5
- `git log` final.
- `git show --stat` del merge final.

## Criterios de aceptacion

El release AUTH se acepta si:

- AUTH-Z falla 0.
- Backend tests OK.
- Frontend lint/tsc/export OK.
- Usuario sin permisos queda bloqueado.
- Sesion unica funciona.
- Cross-tenant queda bloqueado.
- Auditoria visible solo con `VIEW_SECURITY_AUDIT`.
- Export CSV protegido.
- No se detectan fugas QA_A/QA_B/DEFAULT.

## Riesgos conocidos

- `SKIP` de AUTH-F6 por falta de datos QA opcionales.
- Se recomienda completar datos QA para paquetes, envios, refunds y reservaciones especificas.
- Alertas son calculadas, no persistidas.
- Export es CSV, no PDF.
- Notificaciones automaticas quedan fuera.

## Rollback plan

- Rollback por Git si falla release.
- No revertir manualmente datos sin revisar migraciones.
- Confirmar impacto de Flyway antes de rollback.
- Mantener backup de BD antes de subir a QA/produccion.
- Si falla solo frontend, revertir commit frontend.
- Si falla migracion, revisar estrategia de rollback DB controlada.

## Siguiente bloque recomendado

- `RELEASE-AUTH`: validacion QA formal.
- Despues continuar con el siguiente bloque funcional del producto.
- No seguir agregando features AUTH salvo hallazgos de QA.

## Conclusion

AUTH queda listo para entrega QA controlada.
