# LIVE-Z1 - Flujo minimo operativo de En vivo

Proyecto: control-ropa-app
Rama: feature/live-z1-minimal-operational-flow
Fecha: 2026-05-28
Base revisada: `b9d4ce2 Merge branch 'feature/live-z0-audit' into develop`

## Objetivo

Consolidar En vivo como una consola minima para operador unico, usando la base existente sin rehacer el modulo ni introducir realtime. La fase prioriza que el operador entienda el orden operativo:

1. Abrir o seleccionar transmision.
2. Activar transmision.
3. Seleccionar producto/prenda.
4. Seleccionar o crear cliente.
5. Registrar apartado.
6. Marcar vendido operativo si aplica.
7. Ver reservas del En vivo.
8. Cerrar transmision.

## Alcance aplicado

- Se agrego un modo minimo operativo en frontend mediante `LIVE_MINIMAL_OPERATIONAL_MODE`.
- Se mantuvo `Product Spotlight` y estado operativo como apoyo al flujo.
- Se aislaron visualmente widgets demo/avanzados:
  - roles del equipo;
  - vista presentadora;
  - analiticos demo;
  - activity feed demo/hibrido.
- Se agrego una guia compacta de pasos operativos dentro de `/live`.
- Se separo `activeItem` como producto activo local de la prenda seleccionada para reserva.
- Se agrego marca local de `vendido operativo` por reserva LIVE, persistida en AsyncStorage por branch/user/live.
- La marca de vendido operativo no registra pago, no toca caja, no toca reportes y no modifica backend.

## Flujo implementado

### Iniciar transmision

El operador puede crear una transmision con notas y seleccionar una transmision abierta existente. La activacion sigue usando `PATCH /api/lives/{id}/activate`.

### Seleccionar producto/prenda

El operador selecciona la prenda por codigo, QR o modal. Al seleccionar prenda, tambien se actualiza `activeItem`, que alimenta el bloque `Producto en pantalla`.

### Capturar cliente rapido/interesado

El flujo mantiene:

- seleccion de cliente existente;
- navegacion a `customers-create?returnTo=/live` para alta rapida.

No se creo cliente temporal nuevo en backend. La recomendacion se mantiene: usar cliente real/generico existente hasta una fase dedicada.

### Registrar apartado

La reserva LIVE sigue usando `createReservation` con `liveId`, `itemId`, `customerId`, `branchId`, `salesChannelId`, precio y usuario. No se cambio contrato API.

### Registrar vendido operativo

Se agrego boton `Marcar vendido` en reservas recientes cuando:

- la reserva no esta liquidada;
- no esta marcada como vendido operativo;
- el usuario puede operar En vivo.

La marca se guarda localmente en:

```text
live_operational_sold_{branchId}_{userId}_{liveId}
```

Esta marca es visual/operativa para la transmision actual. No procesa cobros, no crea pagos, no afecta caja y no cambia estados financieros.

### Ver reservas del LIVE

Se conserva el listado de reservas recientes filtrado por `liveId`. Cada reserva muestra cliente, prenda, precio, estado operativo y accesos existentes a detalle/cobro.

### Finalizar LIVE

Se mantiene cierre existente con confirmacion y `PATCH /api/lives/{id}/close`.

## Frontend

Archivos modificados:

- `app/live.tsx`
- `services/liveWorkflowStorage.ts`
- `locales/es/common.json`
- `locales/en/common.json`

Cambios relevantes:

- Modo minimo operativo constante para aislar widgets demo.
- Guia de pasos operativos.
- Producto activo local basado en `activeItem`.
- Persistencia local de vendido operativo.
- Textos ES/EN para modo minimo y vendido operativo.

## Backend

No se modifico backend.

Se revisaron:

- `LiveController`
- `LiveService`
- `ReservationService`
- `CustomerService`
- `ItemService`

La base existente soporta el flujo minimo:

- `lives` para transmision;
- `reservations.live_id` para asociar reservas a En vivo;
- clientes/items tenant-aware;
- reserva LIVE con validacion de canal, branch, item, customer y live abierto/activo.

Riesgo heredado documentado desde Z0: lecturas `LiveService.findByBranch` y `findById` deben revisarse en una fase de hardening LIVE porque no aplican explicitamente `TenantAccessGuard` ni permiso de lectura LIVE. No se corrigio en Z1 para no cambiar tenant/RBAC sin autorizacion de alcance.

## Componentes reutilizados

- `LiveDesktopLayout`
- `LiveTabletLayout`
- `LiveMobileLayout`
- `LiveInfoCard`
- `LiveActionCard`
- `LiveCompactCard`
- `LiveWarningCard`
- `AppBottomModal`
- `QRScannerModal`
- servicios actuales de live, reservas, clientes, items y pagos por reserva.

## Componentes apagados o aislados

En modo minimo quedan apagados:

- roles del equipo;
- vista presentadora;
- analiticos demo;
- activity feed demo/hibrido;
- comentarios overlay;
- metricas simuladas.

No se eliminaron archivos ni componentes. La capa demo queda disponible para una futura configuracion avanzada.

## Permisos y guards considerados

Se respetaron guards existentes:

- `canViewLive`
- `canOperateLive`
- `canSelectLiveCustomer`
- `canCreateLiveCustomer`
- `canSelectLiveItem`
- `canCreateLiveItem`

`Marcar vendido` usa `canOperateLive`. No se agregaron permisos nuevos.

## Validacion regresiva AUTH

Se ejecuto el smoke maestro AUTH-Z contra `API_BASE_URL=http://192.168.0.128:8090`:

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

Evidencia de diff regenerada desde Git Bash:

- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow.diff`
- `git-diffs/20260528-LIVE-Z1-minimal-operational-flow-stat.txt`
- Verificacion: `NUL=0`, `BOM=NO_BOM` en ambos archivos.

Validacion manual regresiva solicitada:

- `qa.admin@local.test` pudo iniciar sesion y obtuvo `sessionToken`.
- `GET /api/security/audit-events/summary` respondio `403` para `qa.admin@local.test`.
- Este resultado no se corrigio en LIVE-Z1 porque AUTH-I2 separo la consulta de auditoria al permiso `VIEW_SECURITY_AUDIT`; modificarlo implicaria tocar AUTH/RBAC fuera del alcance.
- Como contraste de sanidad, `qa.soporte@local.test` inicio sesion y el mismo endpoint respondio `200`.

## Matriz visual por usuarios y roles

Esta matriz define el smoke visual esperado antes de commit. En esta fase no se modificaron permisos ni tenant isolation.

| Usuario | Rol | Tenant/empresa | Pantalla/ruta | Debe poder hacer | No debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Entrar a En vivo, ver modo minimo, iniciar/finalizar transmision si tiene permiso, seleccionar prenda, seleccionar/crear cliente rapido, registrar apartado/vendido operativo, ver reservas. | No debe saltarse pagos reales ni reportes; vendido operativo no debe procesar cobro. | Flujo minimo operativo disponible si conserva permiso LIVE. | No validado visualmente en navegador en esta complementacion; AUTH login OK. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Operar flujo minimo si sus permisos efectivos incluyen operacion LIVE. | No debe ver funciones administrativas indebidas ni configuracion avanzada. | Vista operativa sin widgets demo/avanzados. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Revisar operacion segun permisos reales; ver reservas si tiene permiso. | No debe crear reserva si no tiene permiso operativo. | Documentar permiso real durante smoke visual. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Debe quedar bloqueado desde autenticacion. | No debe ver operacion LIVE ni navegar pantallas protegidas. | Login bloqueado por AUTH. | Validado indirectamente por AUTH-Z PASS. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/system-security-audit`, `/live` | Consultar auditoria si tiene `VIEW_SECURITY_AUDIT`; usar LIVE solo si tiene permisos LIVE reales. | No debe operar LIVE si no tiene permiso; no debe saltarse tenant isolation. | Auditoria 200; LIVE segun permisos. | Auditoria summary 200 validado; LIVE no validado visualmente. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A y operar LIVE solo si tiene permiso LIVE real. | No debe ver datos QA_B ni DEFAULT; no asumir `DO_LIVE_RESERVATION`. | QA_A aislado de QA_B/DEFAULT. | Validado indirectamente por AUTH-Z/F6 cross-tenant; LIVE visual no validado. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar solo si permisos LIVE lo permiten. | No debe ver datos QA_B ni DEFAULT. | QA_A aislado; capacidades LIVE segun permisos reales. | Validado indirectamente por AUTH-Z/F6 cross-tenant; LIVE visual no validado. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B y operar LIVE solo si tiene permiso LIVE real. | No debe ver datos QA_A ni DEFAULT. | QA_B aislado de QA_A/DEFAULT. | Validado indirectamente por AUTH-Z/F6 cross-tenant; LIVE visual no validado. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar solo si permisos LIVE lo permiten. | No debe ver datos QA_A ni DEFAULT. | QA_B aislado; capacidades LIVE segun permisos reales. | Validado indirectamente por AUTH-Z/F6 cross-tenant; LIVE visual no validado. |

## Restricciones respetadas

- No se tocaron pagos reales.
- No se tocaron reportes.
- No se toco billing.
- No se toco IA.
- No se toco AUTH.
- No se toco NO_ACCESS.
- No se toco tenant isolation.
- No se crearon migraciones.
- No se toco SQL.
- No se cambiaron contratos publicos de API.
- No se implemento realtime.
- No se borraron archivos.

## Riesgos

- `vendido operativo` es local por equipo/usuario; no sincroniza entre operadores.
- Producto activo es local frontend; no existe producto activo oficial backend.
- El boton de cobro real sigue visible como flujo existente; debe distinguirse operativamente de la marca local.
- Widgets demo quedan apagados por constante de modo minimo, no por configuracion backend.
- LIVE sigue sin eventos oficiales para activity feed real.

## Pendientes

- Definir producto activo oficial en backend.
- Definir eventos LIVE reales.
- Revisar tenant/RBAC explicito en lecturas de `LiveService`.
- Diseñar cliente temporal/interesado backend si negocio lo requiere.
- Definir si vendido operativo debe convertirse en estado backend o mantenerse como auxiliar de operacion.
- Separar modo minimo/demo desde configuracion formal.

## Siguiente fase recomendada

LIVE-Z2: producto activo oficial y hardening de lecturas LIVE.

Alcance sugerido:

- Agregar modelo/contrato para producto activo por transmision.
- Revisar `GET /api/lives/branch/{branchId}` y `GET /api/lives/{id}` con tenant/permiso explicito.
- Mantener sin realtime todavia.
- Preparar eventos LIVE internos, sin integraciones externas.

## Decision

GO tecnico para smoke visual/operativo de LIVE-Z1 como consola minima de operador unico.
NO-GO para realtime/multioperador hasta tener producto activo oficial y eventos LIVE internos.
