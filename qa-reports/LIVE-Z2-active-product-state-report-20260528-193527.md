# LIVE-Z2 - Reporte QA de producto activo oficial

Fecha: 2026-05-28
Rama: feature/live-z2-active-product-state
Commit base: `ccc8e8a Merge branch 'feature/live-z1-minimal-operational-flow' into develop`

## Alcance

Implementar producto activo oficial por transmision En vivo, sin realtime y sin tocar pagos reales, reportes, billing, IA ni AUTH.

## Cambios aplicados

- Nueva columna `lives.active_item_id`.
- Nuevo endpoint `GET /api/lives/{id}/active-item`.
- Nuevo endpoint `PATCH /api/lives/{id}/active-item`.
- `LiveResponse` ahora expone datos resumidos del producto activo.
- `/live` prioriza producto activo oficial desde backend.
- La prenda seleccionada queda como candidata hasta presionar `Marcar producto al aire`.
- El cierre de transmision limpia el producto activo.

## Archivos modificados

- `app/live.tsx`
- `services/liveService.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `backend/control-ropa/src/main/resources/db/migration/V47__live_active_product_state.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/Live.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveActiveItemRequest.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `docs/ERP_LIVE_Z2_ACTIVE_PRODUCT_STATE.md`
- `qa-reports/LIVE-Z2-active-product-state-report-20260528-193527.md`
- `qa-reports/LIVE-Z2-active-product-state-smoke-20260528-193527.csv`
- `git-diffs/20260528-LIVE-Z2-active-product-state.diff`
- `git-diffs/20260528-LIVE-Z2-active-product-state-stat.txt`

## Archivos revisados pero no modificados

- `docs/ERP_LIVE_Z0_AUDIT.md`
- `docs/ERP_LIVE_Z1_MINIMAL_OPERATIONAL_FLOW.md`
- `services/liveWorkflowStorage.ts`
- `services/livePermissionGuards.ts`
- `services/liveLayoutPreferences.ts`
- `components/live/LiveDesktopLayout.tsx`
- `components/live/LiveTabletLayout.tsx`
- `components/live/LiveMobileLayout.tsx`
- `components/live/LiveCommerceCards.tsx`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`

## Archivos o modulos no tocados por restriccion

- Pagos reales.
- Reportes.
- Billing.
- IA.
- AUTH, sesion unica, NO_ACCESS y auditoria.
- Ventas/caja/cobro.
- Integraciones externas.
- WebSocket/SSE/realtime.
- Migraciones existentes.
- SQL de datos.

## Comandos ejecutados

### Git inicial

```bash
git status
git branch --show-current
git log --oneline -5
```

Resultado inicial:

- Rama: `feature/live-z2-active-product-state`.
- Working tree limpio.
- Ultimos commits:
  - `ccc8e8a Merge branch 'feature/live-z1-minimal-operational-flow' into develop`
  - `9e2beb8 LIVE-Z1 consolida flujo minimo operativo`
  - `b9d4ce2 Merge branch 'feature/live-z0-audit' into develop`
  - `05a2dbb Docs audita estado LIVE y roadmap operativo`
  - `b8a741a Docs consolida cierre AUTH y entrega QA`

### Frontend

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
```

Resultado parcial:

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK. Incluye ruta `/live`.

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

Resultado parcial:

- `.\mvnw.cmd test`: OK. 71 tests, 0 failures, 0 errors, 0 skipped.
- `.\mvnw.cmd -q -DskipTests package`: OK.

## AUTH regresivo

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

- `qa-reports/AUTH-Z-final-security-report-20260528-193718.md`
- `qa-reports/AUTH-Z-final-security-report-20260528-193718.csv`

Validacion manual regresiva:

- `qa.admin@local.test` inicio sesion correctamente.
- Se obtuvo `sessionToken`.
- `GET /api/security/audit-events/summary` respondio `403`.
- Se considera respuesta esperada segun permisos reales porque AUTH-I2 requiere `VIEW_SECURITY_AUDIT` para auditoria.

## Git final

```bash
git status
git diff --stat
git diff --name-only
git diff --check
```

Resultado:

- `git status`: rama `feature/live-z2-active-product-state`; 8 archivos tracked modificados y 4 rutas nuevas no trackeadas.
- `git diff --stat`: 8 archivos tracked, 341 inserciones, 31 eliminaciones.
- `git diff --name-only`:
  - `app/live.tsx`
  - `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/Live.java`
  - `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
  - `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveResponse.java`
  - `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
  - `locales/en/common.json`
  - `locales/es/common.json`
  - `services/liveService.ts`
- `git diff --check`: OK sin errores; solo warnings CRLF/LF.

Rutas nuevas no trackeadas:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveActiveItemRequest.java`
- `backend/control-ropa/src/main/resources/db/migration/V47__live_active_product_state.sql`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `docs/ERP_LIVE_Z2_ACTIVE_PRODUCT_STATE.md`

Evidencia `git-diffs`:

- `git-diffs/20260528-LIVE-Z2-active-product-state.diff`
- `git-diffs/20260528-LIVE-Z2-active-product-state-stat.txt`
- Verificacion de encoding: `NUL=0`, `BOM=NO_BOM` en ambos archivos.

## Matriz visual por usuarios y roles

| Usuario | Rol | Tenant/empresa | Ruta | Debe poder hacer | Que NO debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Entrar, seleccionar prenda, marcar producto al aire, refrescar y conservar producto, seguir reservando. | Procesar pago real desde producto al aire. | Producto activo oficial persiste. | No validado visualmente en navegador. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Operar producto activo si tiene permiso. | Ver administracion indebida. | Producto activo segun permisos reales. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Revisar producto activo si puede ver En vivo. | Modificarlo si no tiene permiso operativo. | Lectura segun permisos; escritura protegida. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Quedar bloqueado. | Ver En vivo. | Login bloqueado. | Validado indirectamente por AUTH-Z si se ejecuta. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Usar LIVE solo con permisos reales. | Saltarse permisos. | Capacidades segun permisos. | No validado visualmente en navegador. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A. | Ver QA_B o DEFAULT. | QA_A aislado. | Pendiente/indirecto por AUTH-Z. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A. | Ver QA_B o DEFAULT. | QA_A aislado. | Pendiente/indirecto por AUTH-Z. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B. | Ver QA_A o DEFAULT. | QA_B aislado. | Pendiente/indirecto por AUTH-Z. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B. | Ver QA_A o DEFAULT. | QA_B aislado. | Pendiente/indirecto por AUTH-Z. |

## Validaciones OK

- TypeScript OK.
- Lint OK sin errores.
- Maven test OK, incluyendo branch activo en lecturas LIVE y producto activo.
- Expo export web OK.
- Maven package OK.
- AUTH-Z smoke maestro OK.
- Login manual `qa.admin@local.test` OK.
- `git diff --check` OK.

## Validaciones fallidas

- Ninguna critica.
- La validacion manual de auditoria con `qa.admin@local.test` respondio `403`; se documenta como esperado por permisos reales (`VIEW_SECURITY_AUDIT` no asignado).

## Validaciones no ejecutadas

- Smoke visual navegador/tablet/movil: pendiente de QA manual.
- Runtime especifico de `PATCH /api/lives/{id}/active-item`: no ejecutado contra navegador/API levantado con esta rama; queda para QA visual/runtime porque el objetivo de esta corrida fue build/test/export y evidencia.

## Warnings

- Lint mantiene 60 warnings preexistentes del repositorio.
- Maven mantiene warnings preexistentes de MySQL 5.7, Mockito/JDK y logs DEBUG/INFO de pruebas.

## Restricciones confirmadas

| Restriccion | Estado |
|---|---|
| AUTH | No tocado |
| Tenant isolation | No debilitado |
| NO_ACCESS | No tocado |
| Pagos reales | No tocado |
| Reportes | No tocado |
| Billing | No tocado |
| IA | No tocado |
| Migraciones existentes | No tocadas |
| SQL de datos | No tocado |
| Contratos API existentes | No rotos; se agregaron campos/endpoints |
| Realtime | No implementado |
| Commit/merge | No ejecutado |

## GO / NO-GO

GO tecnico preliminar para validar visualmente producto activo oficial.

NO-GO para realtime hasta implementar eventos internos de En vivo.

## Siguiente fase recomendada

LIVE-Z3: eventos internos de En vivo para reemplazar activity feed demo por actividad real.
