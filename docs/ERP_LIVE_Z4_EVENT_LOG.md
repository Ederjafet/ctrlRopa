# LIVE-Z4 - Bitacora operacional de En vivo

Proyecto: control-ropa-app
Rama: feature/live-z4-event-log
Fecha: 2026-05-29
Base revisada: `3220a40 Merge branch 'feature/live-z3-operational-reservation-status' into develop`

## Objetivo

Crear una bitacora operacional LIVE real, separada de la auditoria de seguridad AUTH, para registrar trazabilidad del flujo live-commerce sin implementar realtime.

## Separacion entre seguridad y operacion LIVE

La auditoria de seguridad sigue viviendo en `security_audit_events` y se usa para:

- login bloqueado;
- token invalido/revocado;
- permiso denegado;
- NO_ACCESS;
- branch/company/cross-tenant denegado.

LIVE-Z4 no registra eventos operativos en esa tabla. La operacion comercial de En vivo queda en `live_events`.

## Alcance

- Se agrega tabla operacional `live_events`.
- Se registran eventos desde `LiveService` y `ReservationService`.
- Se agrega lectura basica `GET /api/lives/{id}/events`.
- La lectura valida que el live pertenezca a la company/branch activa.
- El activity feed queda conectado a eventos reales cuando el widget se habilite.
- El modo minimo LIVE se conserva sin reactivar widgets demo.
- No se implementa WebSocket, SSE ni realtime.

## Eventos implementados

| Evento | Origen | Cuando se registra |
|---|---|---|
| `LIVE_STARTED` | `LiveService.activate` | Al activar una transmision. |
| `LIVE_CLOSED` | `LiveService.close` | Al cerrar una transmision. |
| `ACTIVE_ITEM_CHANGED` | `LiveService.setActiveItem` | Al marcar o limpiar producto al aire. |
| `LIVE_RESERVATION_CREATED` | `ReservationService.create` | Al crear una reserva con `liveId`. |
| `LIVE_RESERVATION_STATUS_CHANGED` | `ReservationService.updateLiveOperationalStatus` / `cancel` | Al cambiar estado operativo LIVE. |
| `LIVE_OPERATIONAL_SOLD` | `ReservationService.updateLiveOperationalStatus` | Adicionalmente cuando el nuevo estado es `OPERATIONAL_SOLD`. |
| `LIVE_RESERVATION_CANCELLED` | `ReservationService.updateLiveOperationalStatus` / `cancel` | Adicionalmente cuando el nuevo estado operativo es `CANCELLED`. |

Decision de duplicidad controlada: cuando una reserva cambia a vendido operativo o cancelado, se registra el evento general `LIVE_RESERVATION_STATUS_CHANGED` y tambien el evento especifico. Esto permite consultar todos los cambios de estado o filtrar solo hitos comerciales.

## Backend

Archivos creados:

- `backend/control-ropa/src/main/resources/db/migration/V49__live_operational_events.sql`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEvent.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventType.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveEventService.java`

Archivos modificados:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/live/LiveServiceTests.java`
- `backend/control-ropa/src/test/java/com/hpsqsoft/ctrlropa/reservation/ReservationServiceLiveOperationalStatusTests.java`

## Modelo / tabla usada

Tabla nueva: `live_events`.

Campos:

- `id`
- `company_id`
- `branch_id`
- `live_id`
- `actor_user_id`
- `event_type`
- `entity_type`
- `entity_id`
- `payload_json`
- `created_at`

Indices:

- `idx_live_events_live_created`
- `idx_live_events_company_branch`
- `idx_live_events_type`
- `idx_live_events_actor`

La migracion es aditiva, usa `CREATE TABLE IF NOT EXISTS`, no usa `DROP`, no usa `DELETE` y no modifica datos existentes.

## Endpoints usados/agregados

Nuevo endpoint:

```http
GET /api/lives/{id}/events
```

Respuesta:

```json
[
  {
    "id": 1,
    "companyId": 1,
    "branchId": 4,
    "liveId": 4,
    "actorUserId": 10,
    "eventType": "ACTIVE_ITEM_CHANGED",
    "entityType": "ITEM",
    "entityId": 8,
    "payloadJson": "{\"previousItemId\":null,\"activeItemId\":8}",
    "createdAt": "2026-05-29T13:54:00"
  }
]
```

## Payloads

Ejemplos:

```json
{"status":"ACTIVE"}
```

```json
{"previousItemId":null,"activeItemId":8}
```

```json
{"reservationId":10,"itemId":8,"customerId":27,"operationalStatus":"RESERVED"}
```

```json
{"reservationId":10,"previousStatus":"RESERVED","newStatus":"OPERATIONAL_SOLD"}
```

Los payloads no guardan tokens, passwords ni cuerpos completos de request.

## Frontend

Archivos modificados:

- `services/liveService.ts`
- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`

Cambios:

- `LiveEvent` y `getLiveEvents(liveId)` en servicio frontend.
- `/live` carga eventos del live seleccionado.
- El activity feed se alimenta de eventos reales cuando el widget esta habilitado.
- Si no hay eventos, muestra un estado vacio.
- No se reactivan widgets demo en el modo minimo operativo.

## Permisos y guards considerados

- Escritura de eventos ocurre despues de operaciones ya protegidas:
  - activar/cerrar live: `DO_LIVE_RESERVATION`.
  - cambiar producto activo: `DO_LIVE_RESERVATION`.
  - crear reserva LIVE: `DO_LIVE_RESERVATION`.
  - cambiar estado operativo LIVE: `DO_LIVE_RESERVATION`.
- Lectura de eventos valida tenant/branch del live.
- No se crea permiso nuevo `VIEW_LIVE` en Z4.
- NO_ACCESS sigue bloqueado por AUTH.

## Usuarios/roles para validacion visual

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

## Restricciones respetadas

- No se toco AUTH.
- No se metieron eventos operativos en auditoria de seguridad.
- No se debilito tenant isolation.
- No se modifico NO_ACCESS.
- No se tocaron pagos reales.
- No se tocaron reportes.
- No se toco billing.
- No se toco IA.
- No se implemento realtime.
- No se modificaron migraciones existentes.
- Se agrego migracion nueva V49 aditiva y segura.

## Validaciones

- `npx.cmd tsc --noEmit`: OK.
- `./mvnw.cmd test`: OK, 73 tests.
- `npm.cmd run lint`: OK sin errores; warnings preexistentes del repo.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd -q -DskipTests package`: OK.
- AUTH-Z regresivo: OK, `PASS=6 FAIL=0 SKIP=0`.
- Smoke manual AUTH con `qa.admin@local.test`: login OK; `/api/security/audit-events/summary` devuelve 403 esperado por falta de `VIEW_SECURITY_AUDIT`.
- `git diff --check`: OK; solo warnings CRLF preexistentes del entorno Git.

## Riesgos

- Sin realtime, otros usuarios ven eventos al recargar.
- Lectura usa tenant/branch pero no permiso fino `VIEW_LIVE`; se mantiene hasta definir RBAC LIVE avanzado.
- `payload_json` es minimo y no sustituye un modelo analitico.
- Activity feed sigue oculto por modo minimo si el widget esta desactivado.

## Pendientes

- Smoke visual real en navegador/tablet.
- Definir permiso fino `VIEW_LIVE` / `MANAGE_LIVE`.
- Definir retencion de `live_events` si el volumen crece.
- Convertir el feed en tiempo real en una fase posterior.

## Siguiente fase recomendada

LIVE-Z5: consulta operativa de bitacora LIVE por filtros y validacion runtime QA_A/QA_B sobre eventos, todavia sin realtime.
