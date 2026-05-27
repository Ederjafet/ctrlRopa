# AUTH-J3 - Dashboard visual de auditoria de seguridad

Fecha: 2026-05-27  
Rama: `feature/auth-j3-security-audit-dashboard`  
Tipo: frontend protegido, seguridad, soporte operativo

## Objetivo

Mostrar en `/system-security-audit` un dashboard compacto con el resumen de `GET /api/security/audit-events/summary`, sin rediseñar la pantalla ni exponer datos sensibles.

## Extension AUTH-J4

AUTH-J4 agrego en la misma ruta una seccion compacta de `Alertas recientes` basada en:

`GET /api/security/audit-events/alerts`

La seccion conserva el permiso `VIEW_SECURITY_AUDIT`, no muestra metadata sensible y no rompe el listado si falla la consulta de alertas.

## Ruta afectada

`/system-security-audit`

Permiso requerido:

`VIEW_SECURITY_AUDIT`

La ruta conserva el bloqueo existente: usuarios sin permiso son redirigidos a `/access-denied`.

## Servicio frontend

Archivo:

`services/securityAuditService.ts`

Metodo agregado:

`getSecurityAuditSummary(...)`

Filtros enviados al summary:

- `dateFrom`
- `dateTo`
- `email`
- `eventType`

Nota:

- `statusCode` y `path` siguen aplicando al listado de eventos.
- El endpoint summary no acepta `statusCode` ni `path` en AUTH-J2/J3.

## Dashboard agregado

La pantalla muestra arriba del listado:

Tarjetas:

- Total eventos
- Total 401
- Total 403

Secciones:

- Eventos por tipo
- Eventos por status
- Top usuarios
- Top endpoints
- Eventos criticos recientes

## Seguridad

La UI no muestra:

- `metadataJson`
- tokens
- passwords
- cuerpos de request

Los eventos criticos recientes solo muestran datos operativos seguros: tipo, fecha, status, email, metodo, ruta y motivo.

## Manejo de errores

Si falla el summary:

- Se muestra un mensaje controlado dentro del dashboard.
- El listado de eventos sigue funcionando.
- No se muestra alerta global ni se bloquea toda la pantalla.

Si falla el listado:

- Se conserva el manejo previo con alerta controlada.

## UX

- No se agregan librerias.
- No se agregan graficas complejas.
- El layout usa tarjetas y listas compactas consistentes con la pantalla existente.
- Las listas del resumen se limitan a los datos entregados por backend.

## Smoke esperado

Usuario permitido:

- `qa.soporte@local.test`
- Debe ver `/system-security-audit`.
- Debe cargar dashboard y listado.

Usuario sin permiso:

- `qa.a.admin@local.test`
- No debe ver el acceso o debe llegar a `/access-denied`.

## Limitaciones

- No hay graficas.
- No hay export del dashboard.
- No hay filtros visuales por company/branch en esta pantalla.
- No se agrega endpoint nuevo; reutiliza AUTH-J2.

## Siguiente fase recomendada

- AUTH-J5: export/archivado si soporte necesita evidencia fuera del ERP.
