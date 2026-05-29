# LIVE-Z2 - Producto activo oficial de En vivo

Proyecto: control-ropa-app
Rama: feature/live-z2-active-product-state
Fecha: 2026-05-28
Base revisada: `ccc8e8a Merge branch 'feature/live-z1-minimal-operational-flow' into develop`

## Objetivo

Consolidar el producto activo oficial de En vivo sin implementar realtime. La fase mueve el estado principal de "producto en pantalla" desde estado local del frontend hacia la transmision persistida en backend.

## Alcance

- Se agrega producto activo oficial por transmision usando la tabla existente `lives`.
- Se conserva el modo minimo operativo de LIVE-Z1.
- La prenda seleccionada queda como estado temporal de captura.
- El producto al aire se actualiza solo cuando el operador presiona la accion explicita.
- Al recargar `/live`, el producto al aire se lee desde backend.
- Al cerrar una transmision, el producto activo se limpia.
- No se implementa realtime, WebSocket ni SSE.

## Flujo implementado

1. Usuario autorizado entra a `/live`.
2. La pantalla carga transmisiones de la sucursal activa.
3. Si la transmision tiene `activeItem`, el spotlight muestra ese producto.
4. El operador selecciona o escanea una prenda.
5. La prenda seleccionada se muestra como candidata.
6. El operador presiona `Marcar producto al aire`.
7. Frontend llama `PATCH /api/lives/{id}/active-item`.
8. Backend valida tenant, branch y permiso operativo.
9. `lives.active_item_id` queda persistido.
10. Otro usuario autorizado puede consultar el producto al aire al recargar.

## Frontend

Archivos modificados:

- `app/live.tsx`
- `services/liveService.ts`
- `locales/es/common.json`
- `locales/en/common.json`

Cambios:

- `Live` ahora incluye campos `activeItem*` devueltos por backend.
- `setLiveActiveItem(liveId, itemId)` llama al nuevo endpoint.
- `activeItem` de `/live` se deriva de `selectedLive.activeItemId`.
- `selectedItem` queda como prenda candidata para reserva y producto al aire.
- Se agrega CTA secundaria `Marcar producto al aire`.
- Se agrega estado visual:
  - sin producto al aire oficial;
  - producto al aire actual;
  - producto seleccionado ya al aire.
- El spotlight ya no depende de ultima reserva ni fallback demo.

## Backend

Archivos modificados/creados:

- `backend/control-ropa/src/main/resources/db/migration/V47__live_active_product_state.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/Live.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveActiveItemRequest.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`

Modelo usado:

- Se reutiliza `lives`.
- Nueva columna nullable: `lives.active_item_id`.
- FK: `active_item_id -> items.id`.
- Indice: `idx_lives_active_item`.

No se crea tabla nueva porque el objetivo es estado unico vigente por transmision, no historico ni eventos.

## Endpoints usados/agregados

- `GET /api/lives/branch/{branchId}`: ahora devuelve campos `activeItem*` cuando hay producto al aire.
- `GET /api/lives/{id}`: ahora devuelve campos `activeItem*`.
- `GET /api/lives/{id}/active-item`: devuelve `200` con la prenda activa o `204` si no hay producto al aire.
- `PATCH /api/lives/{id}/active-item`: marca o limpia producto activo oficial.

Contrato `PATCH`:

```json
{
  "itemId": 8
}
```

Si `itemId` es `null`, limpia el producto activo.

## Permisos y tenant

Lectura:

- Se valida que la sucursal/live pertenezca a la company/branch activa.
- `GET /api/lives/branch/{branchId}` rechaza branch ajena a la sesion activa.
- No se agrega `VIEW_LIVE` en Z2 porque no existe en catalogo.
- No se endurece lectura con `DO_LIVE_RESERVATION` para no bloquear vistas de supervisor/presentadora hasta definir permiso fino.

Escritura:

- Crear/activar/cerrar transmision conserva `DO_LIVE_RESERVATION`.
- Marcar producto al aire requiere `DO_LIVE_RESERVATION` en canal `LIVE` y branch de la transmision.
- El item seleccionado debe pertenecer a la misma sucursal del En vivo.
- NO_ACCESS sigue bloqueado por AUTH.

## Usuarios/roles para validacion visual

| Usuario | Rol | Tenant/empresa | Ruta | Debe poder hacer | No debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Entrar, seleccionar prenda, marcar producto al aire, refrescar y conservar producto, seguir reservando. | Procesar pago real desde producto al aire. | Producto activo oficial persiste. | No validado visualmente en navegador. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Operar producto activo si tiene `DO_LIVE_RESERVATION`. | Ver administracion indebida. | Producto activo segun permisos reales. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Revisar producto activo si puede ver En vivo. | Modificar producto activo si no tiene permiso operativo. | Lectura posible segun permisos; escritura bloqueada si no opera. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Quedar bloqueado. | Ver En vivo o producto activo. | Login bloqueado. | Validado indirectamente por AUTH-Z. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Usar LIVE solo si tiene permisos LIVE reales. | Saltarse permisos o tenant. | Capacidades segun permisos. | No validado visualmente en navegador. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar si tiene permisos LIVE. | Ver QA_B o DEFAULT. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar si tiene permisos LIVE. | Ver QA_B o DEFAULT. | QA_A aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar si tiene permisos LIVE. | Ver QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar si tiene permisos LIVE. | Ver QA_A o DEFAULT. | QA_B aislado. | Validado indirectamente por AUTH-Z/F6. |

## Restricciones respetadas

- No se tocaron pagos reales.
- No se tocaron reportes.
- No se toco billing.
- No se toco IA.
- No se modifico AUTH.
- No se modifico NO_ACCESS.
- No se debilito tenant isolation.
- No se modificaron migraciones existentes.
- No se toco SQL de datos.
- No se cambiaron contratos publicos existentes; se agregaron campos opcionales y endpoints nuevos.
- No se implemento realtime.
- No se borraron componentes.

## Validacion regresiva AUTH

Se ejecuto el smoke maestro contra `API_BASE_URL=http://192.168.0.128:8090`:

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

Validacion manual:

- `qa.admin@local.test` inicio sesion y obtuvo `sessionToken`.
- `GET /api/security/audit-events/summary` respondio `403`.
- El `403` es esperado con permisos reales porque auditoria requiere `VIEW_SECURITY_AUDIT`; no se modifica AUTH/RBAC en LIVE-Z2.

## Riesgos

- La lectura de En vivo sigue sin permiso fino `VIEW_LIVE`; queda pendiente para RBAC LIVE avanzado.
- El producto activo persistido no genera historico ni eventos.
- Sin realtime, otros usuarios deben recargar para ver cambios.
- `active_item_id` puede apuntar a item reservado o vendido; esto es intencional para que el producto siga visible durante operacion.
- La migracion V47 modifica esquema; requiere backup y validacion Flyway antes de QA/produccion.

## Pendientes

- Definir `VIEW_LIVE`, `MANAGE_LIVE` u otro permiso fino si el negocio separa presentadora/supervisor/operador.
- Crear eventos LIVE internos para historial de producto activo.
- Agregar realtime/SSE/WebSocket despues de tener eventos internos.
- Decidir si se necesita limpiar producto activo por cambio de estado de item fuera de LIVE.
- Smoke visual real en navegador/tablet/movil.

## Siguiente fase recomendada

LIVE-Z3: eventos internos de En vivo sin realtime externo.

Alcance sugerido:

- Registrar eventos `LIVE_STARTED`, `ACTIVE_PRODUCT_CHANGED`, `RESERVATION_CREATED`, `OPERATIONAL_SOLD_MARKED`, `LIVE_CLOSED`.
- Usar los eventos para activity feed real.
- Mantener sin integraciones Facebook/TikTok/Instagram.

## Decision

GO tecnico para validar visualmente producto activo oficial persistido.

NO-GO para realtime hasta que exista historial/eventos internos de En vivo.
