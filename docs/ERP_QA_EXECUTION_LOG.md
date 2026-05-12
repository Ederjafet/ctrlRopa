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

## Reglas de registro

- Cada smoke pre-release debe tener una fila.
- Cada regresion operacional relevante debe ligar evidencia.
- Si un flujo critico falla, la decision debe ser `BLOQUEADO`.
- Los defectos deben tener severidad, responsable y evidencia.
- No se debe aprobar release con errores criticos sin rollback validado.
