# LIVE-Z3 - Estado operativo persistido de reservas En vivo

Proyecto: control-ropa-app
Rama: feature/live-z3-operational-reservation-status
Fecha: 2026-05-28
Base revisada: `386e78f Merge branch 'feature/live-z2-active-product-state' into develop`

## Objetivo

Persistir en backend el estado operativo de reservas LIVE para que "vendido operativo" deje de ser una marca local por dispositivo. El objetivo es trazabilidad operacional compartida al recargar `/live`, sin procesar pagos reales, caja, billing ni reportes.

## Alcance

- Se conserva el modo minimo operativo de LIVE-Z1.
- Se conserva el producto activo oficial de LIVE-Z2 (`lives.active_item_id`).
- Se agrega estado operativo propio para reservas de En vivo.
- El estado operativo es independiente del `status` transaccional de la reserva.
- No se implementa realtime, WebSocket ni SSE.
- No se toca pagos, caja, ventas reales, reportes, billing ni IA.

## Flujo implementado

1. Usuario autorizado entra a `/live`.
2. La pantalla carga transmisiones, producto activo oficial y reservas de la branch activa.
3. El operador registra una reserva LIVE con el flujo existente.
4. El backend inicializa la reserva LIVE como `RESERVED` en estado operativo.
5. Desde reservas recientes, el operador puede cambiar estado operativo a:
   - `RESERVED`
   - `OPERATIONAL_SOLD`
   - `CANCELLED`
6. Al refrescar `/live`, el estado operativo se conserva porque viene de backend.
7. Otro usuario autorizado puede consultar el estado al recargar.
8. `OPERATIONAL_SOLD` no crea venta, no crea pago, no mueve caja y no afecta reportes financieros.

## Frontend

Archivos modificados:

- `app/live.tsx`
- `services/reservationService.ts`
- `locales/es/common.json`
- `locales/en/common.json`

Cambios:

- `/live` deja de usar `AsyncStorage` para vendido operativo.
- `Reservation` incluye campos `liveOperationalStatus`, `liveOperationalStatusUpdatedAt`, `liveOperationalStatusUpdatedByUserId` y `liveOperationalStatusReason`.
- Se agrega `updateLiveReservationOperationalStatus`.
- Reservas recientes muestran estado operativo real:
  - Pendiente
  - Apartado
  - Vendido operativo
  - Cancelado operativo
- Se agregan acciones operativas:
  - Marcar vendido
  - Volver a apartado
  - Cancelar operativo
  - Reactivar apartado
- El CTA de cobro se mantiene separado y no se dispara al marcar vendido operativo.

## Backend

Archivos modificados/creados:

- `backend/control-ropa/src/main/resources/db/migration/V48__live_reservation_operational_status.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/LiveReservationOperationalStatus.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/Reservation.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationController.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`

Modelo usado:

- Se reutiliza `reservations`.
- Nuevas columnas:
  - `live_operational_status`
  - `live_operational_status_updated_at`
  - `live_operational_status_updated_by_user_id`
  - `live_operational_status_reason`
- Nuevo indice:
  - `idx_reservations_live_operational_status (live_id, live_operational_status)`
- FK:
  - `live_operational_status_updated_by_user_id -> users(id)`

La migracion backfillea reservas LIVE existentes con `RESERVED` cuando no tienen estado operativo.

## Endpoints usados/agregados

Existentes:

- `GET /api/reservations/branch/{branchId}`
- `POST /api/reservations`

Nuevo:

- `PATCH /api/reservations/{reservationId}/live-operational-status`

Contrato:

```json
{
  "status": "OPERATIONAL_SOLD",
  "reason": "Opcional"
}
```

Respuesta:

- `ReservationResponse` con los campos operativos LIVE.

## Estados operativos

| Estado | Uso | Impacto financiero |
|---|---|---|
| `PENDING` | Estado preparado para flujo futuro de interes/pre-reserva. | Ninguno |
| `RESERVED` | Apartado/reserva operativo LIVE. Es el default al crear reserva LIVE. | Ninguno |
| `OPERATIONAL_SOLD` | La presentadora/operador considera la pieza vendida en la transmision. | Ninguno |
| `CANCELLED` | Cancelacion operativa LIVE. | Ninguno |

## Vendido operativo vs pago

`OPERATIONAL_SOLD` es una marca operacional del LIVE. No equivale a:

- pago registrado;
- venta creada;
- caja afectada;
- factura;
- reporte financiero;
- liquidacion de reserva.

El pago sigue siendo un flujo separado en `/payments`.

## Permisos y tenant

- Cambiar estado operativo requiere el mismo permiso operativo usado por reservas LIVE: `DO_LIVE_RESERVATION` con canal `LIVE` y branch activa.
- `findEntityById` conserva `TenantAccessGuard.requireBranch`.
- El endpoint rechaza reservas que no pertenecen a LIVE.
- NO_ACCESS sigue bloqueado por AUTH.
- No se agregaron permisos RBAC nuevos en esta fase.

## Usuarios/roles para validacion visual

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

## Validaciones

- `npx.cmd tsc --noEmit`: OK.
- `npm.cmd run lint`: OK sin errores; warnings preexistentes del repo.
- `./mvnw.cmd test`: OK, 73 tests.
- AUTH-Z regresivo: OK, `PASS=6 FAIL=0 SKIP=0`.
- Smoke manual AUTH con `qa.admin@local.test`: login OK; `/api/security/audit-events/summary` devuelve 403 esperado por falta de `VIEW_SECURITY_AUDIT`.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK; solo warnings CRLF preexistentes del entorno Git.

## Restricciones respetadas

- No se toco AUTH.
- No se debilito tenant isolation.
- No se modifico NO_ACCESS.
- No se tocaron pagos reales.
- No se tocaron reportes.
- No se toco billing.
- No se toco IA.
- No se modifico SQL destructivo ni migraciones existentes.
- Se agrego una migracion nueva V48, justificada por persistencia backend del estado operativo.
- No se implemento realtime.
- No se cambiaron contratos publicos existentes; se agrego endpoint nuevo y campos nuevos compatibles en respuesta.

## Riesgos

- `PENDING` queda preparado para fase futura, pero la UI actual usa principalmente `RESERVED`, `OPERATIONAL_SOLD` y `CANCELLED`.
- Cancelado operativo no equivale necesariamente a cancelacion transaccional de reserva; si se requiere liberar prenda/inventario, debe definirse una fase posterior.
- Sin realtime, otros usuarios ven cambios al recargar.
- QA_A/QA_B no deben usarse como prueba funcional LIVE si no tienen `DO_LIVE_RESERVATION`.

## Pendientes

- Smoke visual real en navegador/tablet con usuarios DEFAULT / QA_CTR.
- Definir si "cancelado operativo" debe disparar el cancel transaccional en una fase futura.
- Definir permiso fino `VIEW_LIVE` / `MANAGE_LIVE` si el producto lo requiere.
- Diseñar eventos LIVE/realtime en fase posterior.

## Siguiente fase recomendada

LIVE-Z4: bitacora/eventos LIVE de operacion. Registrar eventos de cambio de producto activo, reserva creada, estado operativo cambiado y cierre de transmision, sin realtime todavia.
