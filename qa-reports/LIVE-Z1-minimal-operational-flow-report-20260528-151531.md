# LIVE-Z1 - Reporte QA de flujo minimo operativo

Fecha: 2026-05-28
Rama: feature/live-z1-minimal-operational-flow
Commit base: `b9d4ce2 Merge branch 'feature/live-z0-audit' into develop`

## Alcance

Consolidar En vivo como flujo minimo operativo para operador unico, sin realtime, sin pagos reales, sin reportes, sin billing, sin IA y sin cambios de backend.

## Cambios aplicados

- Modo minimo operativo en `/live`.
- Guia visual compacta de pasos: transmision, producto, cliente, apartado y cierre.
- Widgets demo/avanzados aislados en modo minimo:
  - roles;
  - vista presentadora;
  - analiticos demo;
  - activity feed demo/hibrido.
- Producto activo local basado en la prenda seleccionada, sin fallback demo ni ultima reserva.
- Marca local `vendido operativo` por reserva LIVE.
- Persistencia local de vendido operativo por branch/user/live en AsyncStorage.
- Textos i18n ES/EN.

## Archivos modificados

- `app/live.tsx`
- `services/liveWorkflowStorage.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/ERP_LIVE_Z1_MINIMAL_OPERATIONAL_FLOW.md`
- `qa-reports/LIVE-Z1-minimal-operational-flow-report-20260528-151531.md`
- `qa-reports/LIVE-Z1-minimal-operational-flow-smoke-20260528-151531.csv`
- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow.diff`
- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow-stat.txt`

## Archivos revisados pero no modificados

- `docs/ERP_LIVE_Z0_AUDIT.md`
- `components/live/LiveDesktopLayout.tsx`
- `components/live/LiveTabletLayout.tsx`
- `components/live/LiveMobileLayout.tsx`
- `components/live/LiveCommerceCards.tsx`
- `services/liveLayoutPreferences.ts`
- `services/livePermissionGuards.ts`
- `services/liveService.ts`
- `services/reservationService.ts`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`

## Archivos o modulos no tocados por restriccion

- Backend funcional.
- Pagos reales.
- Reportes.
- Billing.
- IA.
- AUTH/RBAC/NO_ACCESS.
- Tenant isolation.
- SQL.
- Migraciones.
- Contratos publicos de API.

## Comandos ejecutados

### Git inicial

```bash
git status
git branch --show-current
git log --oneline -5
```

Resultado inicial:

- Rama correcta: `feature/live-z1-minimal-operational-flow`.
- Working tree limpio.
- Ultimos commits:
  - `b9d4ce2 Merge branch 'feature/live-z0-audit' into develop`
  - `05a2dbb Docs audita estado LIVE y roadmap operativo`
  - `b8a741a Docs consolida cierre AUTH y entrega QA`
  - `f8187ae AUTH-Z cierra validacion integral de seguridad`
  - `58e9094 AUTH-J5 agrega export de auditoria`

### Frontend

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
```

Resultado:

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK, ruta `/live` exportada.

Scripts no existentes en `package.json`:

- `npm run typecheck`
- `npm run test`
- `npm run build`

### Backend

```bash
cd backend/control-ropa
.\mvnw.cmd test
.\mvnw.cmd -q -DskipTests package
```

Resultado:

- `.\mvnw.cmd test`: OK. 67 tests, 0 failures, 0 errors, 0 skipped.
- `.\mvnw.cmd -q -DskipTests package`: OK.

### Git final

```bash
git status
git diff --stat
git diff --name-only
git diff --check
```

Resultado:

- `git status`: rama `feature/live-z1-minimal-operational-flow`; 4 archivos modificados tracked y 1 documento nuevo no trackeado. `qa-reports/` y `git-diffs/` existen como evidencia local ignorada por Git.
- `git diff --stat`: 4 archivos tracked, 201 inserciones, 23 eliminaciones.
- `git diff --name-only`: `app/live.tsx`, `locales/en/common.json`, `locales/es/common.json`, `services/liveWorkflowStorage.ts`.
- `git diff --check`: OK sin errores; solo warnings CRLF/LF.

Evidencia `git-diffs` regenerada desde Git Bash:

- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow.diff`
- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow-stat.txt`
- Verificacion de encoding: `NUL=0`, `BOM=NO_BOM` en ambos archivos.

### AUTH regresivo

```bash
API_BASE_URL=http://192.168.0.128:8090 bash docs/qa/99-auth-z-final-security-smoke.sh
```

Resultado:

- AUTH-F6: PASS=20 FAIL=0 SKIP=5
- AUTH-H: PASS=9 FAIL=0 SKIP=0
- AUTH-I2: PASS=10 FAIL=0 SKIP=0
- AUTH-J2: PASS=9 FAIL=0 SKIP=0
- AUTH-J4: PASS=13 FAIL=0 SKIP=0
- AUTH-J5: PASS=13 FAIL=0 SKIP=0
- AUTH-Z: PASS=6 FAIL=0 SKIP=0

Evidencia generada:

- `qa-reports/AUTH-Z-final-security-report-20260528-170938.md`
- `qa-reports/AUTH-Z-final-security-report-20260528-170938.csv`

Validacion manual solicitada:

- Backend disponible en `http://192.168.0.128:8090`.
- `qa.admin@local.test` inicio sesion correctamente y obtuvo `sessionToken`.
- `GET /api/security/audit-events/summary` con token de `qa.admin@local.test` respondio `403`.
- Se reporta como falla de la expectativa manual, no como bug LIVE-Z1. Desde AUTH-I2 la consulta de auditoria requiere `VIEW_SECURITY_AUDIT`, que no debe asignarse a admin por defecto.
- Sanidad adicional: `qa.soporte@local.test` inicio sesion y el endpoint respondio `200`.

## Matriz visual por usuarios y roles

| Usuario | Rol | Tenant/empresa | Pantalla/ruta | Debe poder hacer | Que NO debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Entrar a En vivo, ver modo minimo, iniciar/finalizar transmision si tiene permiso, seleccionar prenda, seleccionar/crear cliente rapido, registrar apartado/vendido operativo y ver reservas. | Procesar pagos reales desde vendido operativo, saltarse reportes/caja o ver funciones fuera de permisos. | Flujo minimo disponible si conserva permisos LIVE. | No validado visualmente; login AUTH OK. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Operar flujo minimo si tiene permisos LIVE. | Ver administracion avanzada indebida. | Vista operativa sin widgets demo/avanzados. | No validado visualmente. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Revisar operacion segun permisos reales. | Crear reserva si no tiene permiso operativo. | Capacidades segun permisos efectivos. | No validado visualmente. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Debe quedar bloqueado. | Ver operacion LIVE o pantallas protegidas. | Login bloqueado. | Validado por AUTH-Z PASS. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/system-security-audit`, `/live` | Consultar auditoria con `VIEW_SECURITY_AUDIT`; usar LIVE solo si tiene permisos LIVE. | Saltarse permisos LIVE o tenant isolation. | Auditoria 200; LIVE segun permisos. | Auditoria summary 200 validado; LIVE no validado visualmente. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar LIVE solo si tiene permisos LIVE. | Ver QA_B o DEFAULT; asumir `DO_LIVE_RESERVATION`. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6; LIVE no validado visualmente. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar solo segun permisos. | Ver QA_B o DEFAULT. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6; LIVE no validado visualmente. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar LIVE solo si tiene permisos LIVE. | Ver QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6; LIVE no validado visualmente. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar solo segun permisos. | Ver QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6; LIVE no validado visualmente. |

## Validaciones OK

- Lint sin errores.
- TypeScript sin errores.
- Export web OK.
- Maven test OK.
- Maven package OK.
- AUTH-Z smoke maestro OK.
- Auditoria con `qa.soporte@local.test` OK.
- No se tocaron backend ni contratos API.

## Validaciones fallidas

- Validacion manual solicitada con `qa.admin@local.test` contra `/api/security/audit-events/summary`: respondio `403`. No se modifica AUTH porque el comportamiento actual es coherente con `VIEW_SECURITY_AUDIT`.

## Validaciones no ejecutadas

- Smoke visual manual en navegador/tablet/movil: no ejecutado en esta fase automatica; queda para QA runtime.
- `npm run typecheck`, `npm run test`, `npm run build`: no existen scripts en `package.json`.

## Warnings

- `npm.cmd run lint` reporto 60 warnings preexistentes del repositorio.
- Git reporto warnings CRLF/LF en archivos modificados. No son fallas de contenido.
- Maven reporto warnings de entorno/JDK/Mockito/MySQL 5.7 ya conocidos; tests pasaron.

## Restricciones confirmadas

| Restriccion | Estado |
|---|---|
| AUTH | No tocado |
| Tenant isolation | No tocado |
| NO_ACCESS | No tocado |
| Pagos reales | No tocado |
| Reportes | No tocado |
| Billing | No tocado |
| IA | No tocado |
| Migraciones | No tocado |
| SQL | No tocado |
| Contratos API existentes | No tocado |
| Realtime | No implementado |
| Commit/merge | No ejecutado |

## GO / NO-GO

GO tecnico recomendado para smoke visual de LIVE-Z1.

NO-GO para realtime, supervisor avanzado, presentadora separada o integraciones externas hasta cerrar producto activo oficial backend y eventos LIVE internos.

## Siguiente fase recomendada

LIVE-Z2: producto activo oficial y hardening de lecturas LIVE.

Objetivo propuesto:

- definir producto activo por transmision;
- revisar tenant/permiso explicito en lecturas de `LiveService`;
- preparar eventos LIVE internos sin realtime externo todavia.
