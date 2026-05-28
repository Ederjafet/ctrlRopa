# AUTH-J5 - Export operativo de auditoria y alertas

Fecha: 2026-05-27  
Rama: `feature/auth-j5-security-audit-exports`  
Tipo: backend protegido, frontend minimo, evidencia operativa

## Objetivo

Permitir que soporte descargue evidencia operativa de auditoria de seguridad y alertas en CSV, respetando el permiso `VIEW_SECURITY_AUDIT`.

AUTH-J5 no crea migraciones, no cambia la logica de auditoria existente y no modifica pagos, ventas ni reportes funcionales.

## Endpoints creados

### Export de eventos

`GET /api/security/audit-events/export.csv`

Permiso requerido:

`VIEW_SECURITY_AUDIT`

Filtros soportados:

- `eventType`
- `email`
- `statusCode`
- `path`
- `dateFrom`
- `dateTo`
- `companyId`
- `branchId`

Columnas exportadas:

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

No se exporta `metadata_json` por default.

### Export de alertas

`GET /api/security/audit-events/alerts/export.csv`

Permiso requerido:

`VIEW_SECURITY_AUDIT`

Filtros soportados:

- `windowMinutes`
- `threshold`
- `companyId`
- `branchId`
- `email`

Columnas exportadas:

- `severity`
- `alert_type`
- `description`
- `count`
- `email`
- `path`
- `company_id`
- `branch_id`
- `first_seen`
- `last_seen`

## UI

Ruta:

`/system-security-audit`

Botones agregados:

- `Exportar eventos CSV`
- `Exportar alertas CSV`

Los exports usan filtros actuales cuando aplican. La descarga se realiza desde navegador web. En entornos sin `document`, la UI muestra un aviso controlado.

## Seguridad

Los endpoints exigen `VIEW_SECURITY_AUDIT`.

No se exporta:

- tokens completos;
- passwords;
- cuerpos de request;
- `metadataJson`/`metadata_json` por default.

Los CSV se limitan a campos operativos seguros para soporte.

## Smoke automatico

Script:

`docs/qa/15-auth-j5-security-audit-export-smoke.sh`

Ejemplo Git Bash:

```bash
API_BASE_URL=http://localhost:8090 docs/qa/15-auth-j5-security-audit-export-smoke.sh
```

El smoke valida:

- `qa.soporte@local.test` descarga eventos CSV con 200;
- `qa.soporte@local.test` descarga alertas CSV con 200;
- `qa.a.admin@local.test` recibe 403 en ambos exports;
- los CSV contienen encabezados esperados;
- los CSV no contienen `sessionToken`;
- los CSV no contienen `password`;
- genera Markdown y CSV en `qa-reports/`.

Evidencia ejecutada:

- `PASS=13`
- `FAIL=0`
- `SKIP=0`
- Markdown: `qa-reports/AUTH-J5-security-audit-export-smoke-report-20260527-171731.md`
- CSV: `qa-reports/AUTH-J5-security-audit-export-smoke-report-20260527-171731.csv`

## Pruebas backend

Se ampliaron pruebas en:

`SecurityAuditEventQueryServiceTests`

Casos cubiertos:

- export de eventos exige `VIEW_SECURITY_AUDIT`;
- export de eventos omite metadata sensible;
- export de alertas exige `VIEW_SECURITY_AUDIT`;
- export de alertas contiene encabezados y datos esperados.

Validacion ejecutada:

- `.\mvnw.cmd test`: `BUILD SUCCESS`, 67 tests, 0 failures, 0 errors.

## Limitaciones

- No hay export Markdown desde backend en AUTH-J5.
- No hay job de envio automatico.
- No se exporta metadata expandida por seguridad.
- El export de eventos se limita a 5000 filas por solicitud para evitar descargas excesivas.

## Siguiente fase recomendada

- AUTH-J6: filtros avanzados o export firmado si soporte necesita evidencia formal.
- AUTH-J7: workflow de atencion de alertas si se decide persistir alertas.
