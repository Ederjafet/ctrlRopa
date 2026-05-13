# ERP - Bitacora de ejecuciones QA

Fecha de creacion: 2026-05-12  
Fase: 1D - datos QA y evidencia

## Registros

| Fecha | Fase | Ambiente | Responsable | Flujos ejecutados | Resultado | Defectos | Decision release |
|---|---|---|---|---|---|---|---|
| 2026-05-12 | 1D | DEV/QA | PENDIENTE | Preparacion documental de dataset, usuarios y evidencia | PENDIENTE DE EJECUCION | Ninguno registrado | No aplica |
| 2026-05-12 | 1E | QA | PENDIENTE | Preparacion de primera ejecucion QA controlada; runbook creado, no ejecutado | PENDIENTE DE EJECUCION REAL | Riesgos de scripts QA documentados | No aplica |
| 2026-05-12 | 1G | QA local/API | Codex QA | Login/logout, dashboard, clientes, inventario, lotes, live lectura, venta QA, pago QA, reportes, usuarios/permisos | RC RECHAZADO | `KI-002`, `KI-003`, `KI-004`, `KI-005` | Rechazado |
| 2026-05-12 | 1H | QA runtime | Usuario/QA Director | Validacion manual de `qa.sinpermisos`, `qa.reportes`, `qa.soporte`; revalidacion de `/api/health` | PARCIAL | `KI-004` resuelto validado, `KI-005` resuelto validado, `KI-006` nuevo: `/api/health` devuelve 404 | RC sigue rechazado |
| 2026-05-12 | 1H | QA codigo/backend | Codex Backend/QA | Prueba automatizada healthcheck `/api/health` y `/api/health/` | PARCIAL | `KI-006` en validacion; falta curl runtime despues de reiniciar/desplegar backend QA | RC sigue rechazado |
| 2026-05-12 aprox. | 1I | QA runtime `localhost:8090` | Usuario/QA Director | Smoke tecnico healthcheck con `curl -i http://localhost:8090/api/health` | OK | `KI-006` resuelto validado; evidencia: `HTTP/1.1 200 OK`, JSON `status=OK`; causa del 404 previo: puerto incorrecto `8080` | RC backend desbloqueado; RC completo sigue pendiente por `KI-003` |
| 2026-05-12 aprox. | 1J | QA frontend `localhost:8081` | Codex QA/Frontend | Validacion runtime web: `/login`, `/dashboard`, `/customers`, `/items`, `/batches`, `/reports`, `/users`, `/system-roles`; intento de arranque `npm run web` | NO-GO visual | `KI-003` en validacion; nuevos `KI-007` textos con codificacion rota y `KI-008` arranque QA por permisos de log | RC rechazado para frontend visual |
| 2026-05-12 aprox. | 1K | QA frontend `localhost:8081` | Codex QA/Frontend | `npm run web`, smoke runtime `/login`, `/`, `/reports`, `/branches`, `/system-roles`, validacion UTF-8 por respuesta HTTP | OK condicionado | `KI-007` resuelto validado; `KI-008` resuelto validado con fallback de log; `KI-003` visual tecnicamente desbloqueado | RC candidato completo posible; no aprobar release final sin checklist RC y evidencia visual formal |
| 2026-05-12 aprox. | 1L | QA documental/RC | Codex QA/Release | Revision final RC contra known issues, execution log, release checklist, smoke tests, resumen ejecutivo y bitacora | GO RC | Sin `SEV-1` ni `SEV-2` abiertos; `KI-001` `SEV-3` aceptado para RC candidato | RC candidato aprobable; release final pendiente de evidencia visual formal y checklist completo |
| 2026-05-13 | 2E | QA local/runtime tenant | Usuario + Codex QA | Validacion bootstrap tenant: Flyway V38, company default, branches con company, backend/dashboard/sucursales, revision `/api/tenant/current` | GO condicionado | Manual OK; Codex detecta runtime HTTP no sincronizado: `/api/tenant/current` no registrado en proceso `8090` y login QA devuelve 500 | No migrar tablas P0 hasta redeploy/reinicio y evidencia JSON de `/api/tenant/current` |
| 2026-05-13 | 2G | QA local/runtime tenant-aware `localhost:8090` | Codex QA/Backend | Reinicio backend, Flyway V39, healthcheck, tenant current sin/con token, login QA admin/vendedor, dashboard, branches, consulta SQL sesiones tenant-aware | GO tecnico condicionado | `HG-2G-002`: dataset QA incompleto, no existen `qa.sinpermisos`, `qa.reportes`, `qa.soporte`; sesiones legacy con tenant null aceptadas temporalmente | NO-GO para migrar primera tabla P0 hasta completar dataset QA y repetir smoke |
| 2026-05-13 | 2H | QA dataset tenant | Codex QA/Backend | Preparacion documental SQL QA para usuarios tenant-aware faltantes | PENDIENTE DE EJECUCION | Se creo `docs/qa/06-usuarios-tenant-qa.sql`; no se ejecuto SQL en runtime durante esta fase | Repetir smoke 2G despues de ejecutar script QA |

## Reglas de registro

- Cada smoke pre-release debe tener una fila.
- Cada regresion operacional relevante debe ligar evidencia.
- Si un flujo critico falla, la decision debe ser `BLOQUEADO`.
- Los defectos deben tener severidad, responsable y evidencia.
- No se debe aprobar release con errores criticos sin rollback validado.
