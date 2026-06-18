# AUTH-J4 - Alertas por patrones criticos de auditoria

Fecha: 2026-05-27  
Rama: `feature/auth-j4-security-audit-alerts`  
Tipo: backend protegido, frontend minimo, seguridad operativa

## Objetivo

Detectar patrones repetidos en `security_audit_events` para que soporte y seguridad puedan ver alertas recientes sin revisar evento por evento.

AUTH-J4 no envia correos, no crea jobs de notificacion y no persiste alertas en una tabla nueva. Las alertas se calculan bajo demanda desde los eventos auditados.

## Endpoint

`GET /api/security/audit-events/alerts`

Permiso requerido:

`VIEW_SECURITY_AUDIT`

Parametros:

- `windowMinutes`: ventana reciente en minutos. Default: `60`.
- `threshold`: minimo de eventos para levantar alerta. Default: `5`.
- `companyId`: filtro opcional.
- `branchId`: filtro opcional.
- `email`: filtro opcional.

## Respuesta

Campos principales:

- `totalAlerts`
- `alerts`

Cada alerta incluye:

- `severity`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `alertType`
- `description`
- `count`
- `email`
- `path`
- `companyId`
- `branchId`
- `firstSeen`
- `lastSeen`

## Alertas implementadas

- `MANY_401`: muchos eventos 401 en la ventana.
- `MANY_403`: muchos eventos 403 en la ventana.
- `MANY_PERMISSION_DENIED_BY_EMAIL`: muchos bloqueos de permiso del mismo email.
- `MANY_TOKEN_REVOKED_BY_EMAIL`: muchos tokens revocados del mismo email.
- `MANY_TENANT_DENIED`: muchos bloqueos de branch, company o tenant.
- `MANY_EVENTS_SAME_PATH`: muchos bloqueos hacia el mismo endpoint.
- `MANY_LOGIN_BLOCKED_NO_ACCESS`: multiples bloqueos de usuarios con rol sin acceso.

## Severidad

La severidad se calcula en relacion con `threshold`:

- `MEDIUM`: `count >= threshold`
- `HIGH`: `count >= threshold * 2`
- `CRITICAL`: `count >= threshold * 4`

## UI

Ruta:

`/system-security-audit`

Se agrego una seccion compacta:

`Alertas recientes`

La seccion muestra:

- severidad;
- tipo;
- descripcion;
- conteo;
- email o path cuando aplica;
- primera y ultima deteccion.

Si no hay alertas, muestra:

`Sin alertas criticas.`

Si falla el endpoint de alertas, el error queda aislado y no rompe el dashboard ni el listado de eventos.

## Seguridad

La consulta exige `VIEW_SECURITY_AUDIT`.

No se expone:

- tokens completos;
- passwords;
- cuerpos de request;
- `metadataJson`.

No se modifican eventos existentes, permisos, pagos, ventas ni reportes funcionales.

## Smoke automatico

Script:

`docs/qa/14-auth-j4-security-alerts-smoke.sh`

Ejemplo Git Bash:

```bash
API_BASE_URL=http://localhost:8090 docs/qa/14-auth-j4-security-alerts-smoke.sh
```

El smoke:

- hace login con `qa.soporte@local.test`;
- provoca un login bloqueado con `qa.sinpermisos@local.test`;
- provoca eventos 403 con `qa.a.admin@local.test`;
- consulta `/api/security/audit-events/alerts`;
- valida `totalAlerts` y `alerts`;
- valida que `qa.a.admin@local.test` reciba 403;
- genera Markdown y CSV en `qa-reports/`.

Evidencia ejecutada:

- `PASS=13`
- `FAIL=0`
- `SKIP=0`
- Markdown: `qa-reports/AUTH-J4-security-alerts-smoke-report-20260527-143655.md`
- CSV: `qa-reports/AUTH-J4-security-alerts-smoke-report-20260527-143655.csv`

## Pruebas backend

Se ampliaron pruebas en:

`SecurityAuditEventQueryServiceTests`

Casos cubiertos:

- usuario con `VIEW_SECURITY_AUDIT` consulta alertas;
- usuario sin permiso recibe 403;
- eventos repetidos generan alerta;
- sin eventos suficientes devuelve `totalAlerts=0`;
- cambiar `threshold` cambia el resultado.

Validacion ejecutada:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, 65 tests, 0 failures, 0 errors.

## Limitaciones

- No hay persistencia historica de alertas.
- No hay envio de correo.
- No hay job de notificaciones.
- No hay reglas por severidad configurables desde UI.
- La seccion visual es deliberadamente compacta y sin graficas.

## Siguiente fase recomendada

- AUTH-J5: export operativo de auditoria y alertas, implementado con CSV protegido por `VIEW_SECURITY_AUDIT`.
- AUTH-J6: persistencia de alertas y workflow de atencion, solo si la operacion lo requiere.
