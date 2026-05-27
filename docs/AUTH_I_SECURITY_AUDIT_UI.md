# AUTH-I - UI minima de auditoria de seguridad

Fecha: 2026-05-27  
Rama: `feature/auth-i-security-audit-ui`  
Tipo: frontend protegido, seguridad, soporte operativo

## Objetivo

Agregar una pantalla minima para consultar `security_audit_events` desde el ERP sin usar Workbench ni curl.

Nota AUTH-I2: la pantalla ahora usa el permiso dedicado `VIEW_SECURITY_AUDIT`. `MANAGE_SECURITY_SETTINGS` queda reservado para administrar configuracion de seguridad.

## Ruta creada

Ruta frontend:

`/system-security-audit`

Ubicacion de acceso:

`Sistema -> Auditoria de seguridad`

El acceso solo se muestra si el usuario tiene `VIEW_SECURITY_AUDIT`. Si un usuario intenta entrar directo sin permiso, la pantalla redirige a `/access-denied`.

## Endpoint consumido

`GET /api/security/audit-events`

Endpoint backend adicional disponible desde AUTH-J2:

`GET /api/security/audit-events/summary`

AUTH-J3 consume este endpoint para mostrar un dashboard compacto arriba del listado.

Permiso backend requerido:

`VIEW_SECURITY_AUDIT`

AUTH-I no creo permisos nuevos. AUTH-I2 crea `VIEW_SECURITY_AUDIT` y cambia backend/frontend para separar consulta de auditoria de configuracion de seguridad.

## Filtros disponibles

La pantalla incluye:

- Tipo de evento (`eventType`)
- Email
- Status HTTP (`statusCode`)
- Ruta (`path`)
- Fecha desde (`dateFrom`)
- Fecha hasta (`dateTo`)
- Boton `Buscar`
- Boton `Limpiar`

Formato de fechas esperado:

- `YYYY-MM-DDTHH:mm:ss`
- Ejemplo: `2026-05-27T00:00:00`

## Listado

Cada evento muestra:

- Fecha/hora (`occurredAt`)
- Tipo de evento (`eventType`)
- Email
- Company
- Branch
- Metodo HTTP
- Ruta
- Status
- Motivo

No se muestra `metadataJson` por default para evitar ruido visual y reducir riesgo de exponer informacion tecnica innecesaria.

## Dashboard de resumen

Desde AUTH-J3 la pantalla muestra:

- Total eventos
- Total 401
- Total 403
- Eventos por tipo
- Eventos por status
- Top usuarios
- Top endpoints
- Eventos criticos recientes

El resumen reutiliza filtros compatibles: fecha desde/hasta, email y tipo de evento. `statusCode` y `path` siguen aplicando al listado.

## Paginacion

- Tamano default: 20
- Botones: `Anterior` / `Siguiente`
- Orden backend: `occurred_at DESC`, `id DESC`

## Servicio frontend

Servicio creado:

`services/securityAuditService.ts`

Responsabilidades:

- Construir query string con filtros.
- Usar `apiClient` existente.
- Mantener manejo centralizado de `401/403`.
- No duplicar logica de autenticacion.

## Usuarios QA esperados

| Usuario | Resultado esperado |
|---|---|
| `qa.soporte@local.test` | Ve el acceso y consulta auditoria porque tiene `VIEW_SECURITY_AUDIT`. |
| `qa.a.admin@local.test` | No ve el acceso y si entra directo recibe acceso denegado. |

## Validaciones ejecutadas

- `npm.cmd run lint`
  - Resultado: sin errores; quedan warnings preexistentes en archivos no tocados.
- `npx.cmd tsc --noEmit`
  - Resultado: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
  - Resultado: OK; ruta `/system-security-audit` exportada.

## Limitaciones

- No hay UI avanzada con descarga/exportacion.
- No se expande `metadataJson`.
- La retencion se configura en backend desde AUTH-J1; la UI solo consulta eventos disponibles.
- La revision visual real con `qa.soporte@local.test` debe hacerse en navegador QA si se requiere evidencia de pantalla.

## Siguiente fase recomendada

- AUTH-I2: permiso dedicado `VIEW_SECURITY_AUDIT`, backend/frontend alineados y smoke automatizado.
- AUTH-I3: descarga CSV desde UI si soporte lo necesita.
- AUTH-J1: retencion automatica segura de eventos.
- AUTH-J2: resumen estadistico backend.
- AUTH-J3: dashboard compacto de resumen en esta pantalla.
- AUTH-J4/J5: archivado y alertas si se aprueban para operacion.
