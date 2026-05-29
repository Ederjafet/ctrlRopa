# LIVE-Z3 - Reporte QA de estado operativo de reservas

Fecha: 2026-05-28
Rama: `feature/live-z3-operational-reservation-status`
Commit base: `386e78f Merge branch 'feature/live-z2-active-product-state' into develop`

## Alcance

Persistir el estado operativo de reservas LIVE en backend. La marca `vendido operativo` deja de ser local por usuario/dispositivo y ahora se guarda en `reservations.live_operational_status`.

## Archivos modificados/creados

- `app/live.tsx`
- `services/reservationService.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `backend/control-ropa/src/main/resources/db/migration/V48__live_reservation_operational_status.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/LiveReservationOperationalStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`
- `docs/ERP_LIVE_Z3_OPERATIONAL_RESERVATION_STATUS.md`
- `qa-reports/LIVE-Z3-operational-reservation-status-smoke-20260528-201556.csv`
- `qa-reports/LIVE-Z3-operational-reservation-status-report-20260528-201556.md`

## Archivos revisados pero no modificados

- `docs/ERP_LIVE_Z0_AUDIT.md`
- `docs/ERP_LIVE_Z1_MINIMAL_OPERATIONAL_FLOW.md`
- `docs/ERP_LIVE_Z2_ACTIVE_PRODUCT_STATE.md`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationRepository.java`
- `services/liveWorkflowStorage.ts`
- `services/liveService.ts`
- `services/livePermissionGuards.ts`
- `services/liveLayoutPreferences.ts`

## Modulos no tocados por restriccion

- AUTH/RBAC/sesion unica.
- Tenant isolation existente.
- NO_ACCESS.
- Pagos reales.
- Caja/cobros reales.
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
git diff --check
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
| `git diff --check` | OK | Solo warnings CRLF del entorno |
| AUTH-Z regresivo | OK | `PASS=6 FAIL=0 SKIP=0` |
| Smoke manual login admin DEFAULT | OK | Session token obtenido |
| Smoke manual audit summary | OK | 403 esperado por falta de `VIEW_SECURITY_AUDIT` |

## Git final

`git status --short --untracked-files=all`:

```text
 M app/live.tsx
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationResponse.java
 M backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java
 M locales/en/common.json
 M locales/es/common.json
 M services/reservationService.ts
?? backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/LiveReservationOperationalStatus.java
?? backend/control-ropa/src/main/resources/db/migration/V48__live_reservation_operational_status.sql
?? backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java
?? docs/ERP_LIVE_Z3_OPERATIONAL_RESERVATION_STATUS.md
```

`git diff --stat`:

```text
 app/live.tsx                                       | 226 +++++++++++++++++----
 .../hpsqsoft/ctrlropa/reservation/Reservation.java |  47 ++++-
 .../reservation/ReservationController.java         |  10 +-
 .../ctrlropa/reservation/ReservationResponse.java  |  16 ++
 .../ctrlropa/reservation/ReservationService.java   |  62 ++++++
 locales/en/common.json                             |  12 ++
 locales/es/common.json                             |  12 ++
 services/reservationService.ts                     |  24 +++
 8 files changed, 363 insertions(+), 46 deletions(-)
```

`git diff --name-only`:

```text
app/live.tsx
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationResponse.java
backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java
locales/en/common.json
locales/es/common.json
services/reservationService.ts
```

`git diff --check`: OK; sin errores de whitespace. Git reporta warnings CRLF del entorno. Los archivos nuevos no aparecen en `git diff --stat/name-only` hasta que se agreguen al indice; quedaron listados en `git status` y en `git-diffs/20260528-LIVE-Z3-operational-reservation-status-stat.txt`.

## Evidencia generada

- `qa-reports/LIVE-Z3-operational-reservation-status-report-20260528-201556.md`
- `qa-reports/LIVE-Z3-operational-reservation-status-smoke-20260528-201556.csv`
- `git-diffs/20260528-LIVE-Z3-operational-reservation-status.diff`
- `git-diffs/20260528-LIVE-Z3-operational-reservation-status-stat.txt`

## Matriz visual por usuarios/roles

| Usuario | Rol | Tenant/empresa | Ruta | Debe poder hacer | No debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Entrar, ver producto activo oficial, registrar reserva/apartado, cambiar a vendido operativo, refrescar y conservar estado, cancelar operativo si tiene permiso. | Procesar pago real al marcar vendido operativo. | Estado operativo persiste en backend. | No validado visualmente en navegador. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Operar reservas si tiene `DO_LIVE_RESERVATION`. | Ver funciones administrativas indebidas. | Puede cambiar estado solo si su permiso real lo permite. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Revisar reservas segun permisos reales. | Modificar estados si no tiene permiso operativo. | Lectura/escritura segun RBAC real. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Quedar bloqueado. | Ver u operar LIVE. | Login/acceso bloqueado. | Validado indirectamente por AUTH-Z. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Acceder solo si tiene permisos LIVE reales. | Saltarse permisos o tenant. | Capacidades segun permisos. | No validado visualmente en navegador. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento tenant QA_A; operar solo si tiene permiso LIVE. | Ver QA_B o DEFAULT. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento tenant QA_A. | Ver QA_B o DEFAULT. | QA_A aislado; no asumir permiso LIVE. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento tenant QA_B; operar solo si tiene permiso LIVE. | Ver QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento tenant QA_B. | Ver QA_A o DEFAULT. | QA_B aislado; no asumir permiso LIVE. | Validado indirectamente por AUTH-Z/F6. |

## Resultado funcional

- Nuevo estado operativo LIVE persistido en backend.
- `OPERATIONAL_SOLD` no toca pagos, caja, ventas ni reportes.
- `/live` muestra y cambia estado operativo desde backend.
- El estado operativo queda preparado para lectura multiusuario por refresh.
- Sin realtime todavia.

## GO/NO-GO

GO tecnico condicionado a smoke visual manual en navegador/tablet.

## Siguiente fase recomendada

LIVE-Z4: bitacora/eventos LIVE de operacion sin realtime.
