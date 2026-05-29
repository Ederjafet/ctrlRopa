# LIVE-Z4 - Reporte QA de bitacora operacional LIVE

Fecha: 2026-05-29
Rama: `feature/live-z4-event-log`
Commit base: `3220a40 Merge branch 'feature/live-z3-operational-reservation-status' into develop`

## Alcance

Crear bitacora operacional LIVE separada de auditoria AUTH. Se agrego `live_events`, registro desde servicios LIVE/reservas y endpoint de lectura por live.

## Archivos modificados/creados

- `app/live.tsx`
- `services/liveService.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `backend/control-ropa/src/main/resources/db/migration/V49__live_operational_events.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEvent.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `docs/ERP_LIVE_Z4_EVENT_LOG.md`
- `qa-reports/LIVE-Z4-event-log-report-20260529-135444.md`
- `qa-reports/LIVE-Z4-event-log-smoke-20260529-135444.csv`

## Archivos revisados pero no modificados

- `docs/ERP_LIVE_Z0_AUDIT.md`
- `docs/ERP_LIVE_Z1_MINIMAL_OPERATIONAL_FLOW.md`
- `docs/ERP_LIVE_Z2_ACTIVE_PRODUCT_STATE.md`
- `docs/ERP_LIVE_Z3_OPERATIONAL_RESERVATION_STATUS.md`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationResponse.java`
- `services/reservationService.ts`
- `backend/security/auth`: revisado solo conceptualmente por contexto; no modificado.

## Modulos no tocados por restriccion

- AUTH/RBAC/sesion unica.
- `security_audit_events`.
- Tenant isolation existente.
- NO_ACCESS.
- Pagos reales.
- Caja/cobros.
- Ventas reales.
- Reportes.
- Billing.
- IA.
- Realtime/WebSocket/SSE.

## Comandos ejecutados

```powershell
git status
git branch --show-current
git log --oneline -5
npx.cmd tsc --noEmit
.\mvnw.cmd test
npm.cmd run lint
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
.\mvnw.cmd -q -DskipTests package
```

AUTH regresivo:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' -lc "API_BASE_URL=http://192.168.0.128:8090 bash docs/qa/99-auth-z-final-security-smoke.sh"
```

Smoke manual AUTH:

```powershell
$API='http://192.168.0.128:8090'
POST /api/auth/login qa.admin@local.test
GET /api/security/audit-events/summary
```

## Validaciones

| Validacion | Resultado | Observacion |
|---|---:|---|
| `npx.cmd tsc --noEmit` | OK | Sin errores |
| `.\mvnw.cmd test` | OK | 73 tests, 0 failures, 0 errors |
| `npm.cmd run lint` | OK | 0 errores, 60 warnings preexistentes |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | OK | Export web generado |
| `.\mvnw.cmd -q -DskipTests package` | OK | Package backend sin errores |
| AUTH-Z regresivo | OK | `PASS=6 FAIL=0 SKIP=0` |
| Smoke manual login admin DEFAULT | OK | Session token obtenido |
| Smoke manual audit summary | OK | 403 esperado por falta de `VIEW_SECURITY_AUDIT` |
| Separacion AUTH/LIVE | OK | No se usa `security_audit_events` para eventos LIVE |
| `git diff --check` | OK | Solo warnings CRLF del entorno |

## Git final

`git status --short --untracked-files=all`:

```text
 M app/live.tsx
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java
 M backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java
 M backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java
 M locales/en/common.json
 M locales/es/common.json
 M services/liveService.ts
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEvent.java
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventRepository.java
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventResponse.java
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventService.java
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java
?? backend/control-ropa/src/main/resources/db/migration/V49__live_operational_events.sql
?? docs/ERP_LIVE_Z4_EVENT_LOG.md
```

`git diff --stat`:

```text
 app/live.tsx                                       | 130 +++++++++++++++------
 .../com/hpsqsoft/ctrlropa/live/LiveController.java |   5 +
 .../com/hpsqsoft/ctrlropa/live/LiveService.java    |  58 ++++++++-
 .../ctrlropa/reservation/ReservationService.java   |  84 ++++++++++++-
 .../hpsqsoft/ctrlropa/live/LiveServiceTests.java   |  20 +++-
 ...servationServiceLiveOperationalStatusTests.java |  22 +++-
 locales/en/common.json                             |  10 ++
 locales/es/common.json                             |  10 ++
 services/liveService.ts                            |  17 +++
 9 files changed, 311 insertions(+), 45 deletions(-)
```

`git diff --name-only`:

```text
app/live.tsx
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java
backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java
backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java
locales/en/common.json
locales/es/common.json
services/liveService.ts
```

`git diff --check`: OK; sin errores de whitespace. Git reporta warnings CRLF del entorno. Los archivos nuevos no aparecen en `git diff --stat/name-only` hasta agregarse al indice; quedaron listados en `git status` y en `git-diffs/20260529-LIVE-Z4-event-log-stat.txt`.

## Evidencia generada

- `qa-reports/LIVE-Z4-event-log-report-20260529-135444.md`
- `qa-reports/LIVE-Z4-event-log-smoke-20260529-135444.csv`
- `git-diffs/20260529-LIVE-Z4-event-log.diff`
- `git-diffs/20260529-LIVE-Z4-event-log-stat.txt`

## Matriz visual por usuarios/roles

| Usuario | Rol | Tenant/empresa | Ruta | Debe poder hacer | No debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Iniciar/cerrar live, cambiar producto activo, crear reserva, cambiar estado y generar eventos. | Registrar eventos en auditoria AUTH. | Eventos visibles por API/actividad real al recargar. | No validado visualmente en navegador. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Generar eventos operativos si tiene `DO_LIVE_RESERVATION`. | Ver funciones administrativas indebidas. | Eventos segun permisos reales. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Consultar eventos si tiene acceso a En vivo. | Modificar operacion si no tiene permiso operativo. | Lectura/escritura segun RBAC real. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Quedar bloqueado. | Ver eventos LIVE. | Login/acceso bloqueado. | Validado indirectamente por AUTH-Z. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Acceder solo si tiene permisos LIVE reales. | Saltarse permisos o tenant. | Capacidades segun permisos. | No validado visualmente en navegador. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, eventos QA_A | Validar aislamiento QA_A. | Ver eventos QA_B o DEFAULT. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, eventos QA_A | Validar aislamiento QA_A. | Ver eventos QA_B o DEFAULT. | QA_A aislado; no asumir permiso LIVE. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, eventos QA_B | Validar aislamiento QA_B. | Ver eventos QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, eventos QA_B | Validar aislamiento QA_B. | Ver eventos QA_A o DEFAULT. | QA_B aislado; no asumir permiso LIVE. | Validado indirectamente por AUTH-Z/F6. |

## Resultado funcional

- Bitacora operacional LIVE creada en `live_events`.
- Endpoint `GET /api/lives/{id}/events`.
- Registro de inicio/cierre, producto activo, reserva creada y cambios de estado.
- Activity feed queda listo para mostrar eventos reales cuando el widget se habilite.

## GO/NO-GO

GO tecnico condicionado a smoke visual manual.

## Siguiente fase recomendada

LIVE-Z5: consulta operativa de bitacora LIVE por filtros y validacion runtime QA_A/QA_B sobre eventos.
