# LIVE-Z10B - Diseno especifico de autorizacion real de cambio de precio LIVE

## 1. Resumen ejecutivo

LIVE-Z10B disena el flujo real de autorizacion para cambio de precio en LIVE. Esta fase no implementa codigo, backend, permisos, endpoints, migraciones ni cambios funcionales. Su objetivo es cerrar la brecha detectada por QA y preparar un contrato claro para futuras fases.

Decision central:

- Usar el modelo generico de `operational_authorization_requests` propuesto por LIVE-AUTH-A.
- Representar el caso con `request_type = LIVE_PRICE_CHANGE`.
- Guardar los datos especificos de precio en columnas dedicadas o en `payload_json` segun se apruebe la implementacion.
- No simular autorizaciones mientras no exista backend real.

Estado recomendado: `DESIGN_READY / PENDING_ARCH_REVIEW`.

## 2. Relacion con LIVE-Z10A

LIVE-Z10A audito el flujo actual y concluyo que no existe backend real para:

- crear solicitudes de cambio de precio;
- aprobar o rechazar solicitudes;
- consultar cola de pendientes;
- aplicar un precio autorizado;
- auditar solicitante, aprobador y decision.

Por seguridad, Z10A removio la simulacion frontend de `Solicitud pendiente` y dejo mensaje honesto: la autorizacion de cambio de precio aun no esta disponible.

LIVE-Z10B no revierte esa decision. Este documento define lo necesario para habilitar autorizacion real en fases futuras.

## 3. Relacion con LIVE-AUTH-A

LIVE-AUTH-A propuso un modelo general para autorizaciones operativas con:

- entidad `operational_authorization_requests`;
- estados `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`, `APPLIED`;
- aprobadores por permiso efectivo;
- revalidacion de estado antes de aplicar;
- bloqueo de self-approval;
- scope por company/branch/tenant.

LIVE-Z10B toma ese modelo y lo especializa para `LIVE_PRICE_CHANGE`.

## 4. Relacion con LIVE-ROLE-A

LIVE-ROLE-A detecto que faltan permisos finos relacionados con precio y autorizaciones:

- `REQUEST_LIVE_PRICE_CHANGE`;
- `APPROVE_LIVE_PRICE_CHANGE`;
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`;
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`;
- `CHANGE_LIVE_PRICE` si se decide permitir cambio directo a roles especificos.

LIVE-Z10B usa esos permisos como propuesta final para cambio de precio, pero no los implementa ni modifica RBAC.

## 5. Reglas de negocio

### Usuario con permiso directo para cambiar precio

Si el usuario tiene `CHANGE_LIVE_PRICE`:

- puede cambiar precio solo si el estado LIVE, prenda y apartado lo permiten;
- el cambio debe auditarse aunque no requiera aprobacion;
- no debe aplicar a apartados con pago o venta cerrada sin regla adicional aprobada;
- debe revalidar company/branch/live/item/reservation.

Decision pendiente: confirmar si `CHANGE_LIVE_PRICE` existira o si todo cambio fuera de precio sugerido debe pasar por autorizacion.

### Usuario que solo puede solicitar autorizacion

Si el usuario tiene `REQUEST_LIVE_PRICE_CHANGE` pero no `CHANGE_LIVE_PRICE`:

- el campo de precio queda bloqueado o editable solo dentro del formulario de solicitud;
- debe capturar `requested_price` y motivo obligatorio;
- no se crea duplicado si ya existe una solicitud `PENDING` para el mismo live/item/reservation;
- debe ver el estado de su solicitud;
- no puede aprobar su propia solicitud.

### Prenda libre

Si la prenda esta disponible y no tiene apartado:

- se puede solicitar cambio de precio para la prenda al aire o preparada;
- al aplicar debe revalidarse que la prenda siga siendo la misma y no haya sido vendida/apartada con pago;
- si el precio autorizado aplica al item base, debe definirse si afecta inventario general o solo precio LIVE temporal.

Recomendacion: en MVP, el precio autorizado debe ser precio operativo LIVE temporal, no cambio permanente del inventario, salvo aprobacion explicita.

### Prenda al aire

Si la prenda esta al aire:

- se puede solicitar cambio antes de crear apartado;
- el snapshot debe guardar `live_id`, `item_id`, precio actual y precio solicitado;
- al aplicar, la prenda al aire debe seguir siendo la misma;
- si cambio la prenda activa, la solicitud queda no aplicable o requiere nueva solicitud.

### Prenda apartada

Si ya existe apartado:

- se puede solicitar cambio solo si el apartado esta activo, sin pago y no cerrado como venta LIVE;
- debe registrar `reservation_id`;
- al aplicar, debe revalidarse estado del apartado, pago y precio actual;
- si hay pago o cierre posterior, no aplicar sin autorizacion adicional.

### Apartado con pago

Si el apartado tiene pago registrado:

- no aplicar cambio de precio directamente;
- no reducir precio si eso impacta saldo, caja o historial;
- no aumentar precio sin confirmar deuda/saldo y contrato de pagos;
- derivar a `LIVE-PAYMENT-GUARD-A` o fase de pagos/caja aprobada.

Regla de seguridad: si no se puede confirmar estado de pago, no asumir que no hay pago.

### Cerrada como venta LIVE

Si el apartado esta cerrado como venta LIVE:

- no aplicar cambio de precio directo;
- si no hay pago, puede requerir autorizacion adicional de reversa operativa;
- si hay pago, queda bloqueado hasta flujo formal de reversa/pagos.

### Solicitud pendiente existente

Para el mismo `live_id + item_id + reservation_id + request_type`:

- si existe `PENDING`, no crear otra;
- mostrar solicitud existente;
- permitir cancelar solo al solicitante o a usuario con permiso de administracion de solicitudes;
- si expiro, permitir nueva solicitud.

### Solicitud expirada

Si `expires_at` paso:

- cambiar estado a `EXPIRED` de forma controlada;
- no permitir aprobar ni aplicar;
- permitir crear nueva solicitud con snapshot actualizado.

### Supervisor rechaza

Si se rechaza:

- capturar `decision_reason` obligatorio;
- notificar/mostrar estado al solicitante;
- no modificar precio.

### Supervisor aprueba

Si se aprueba:

- capturar `approved_price`, que puede ser igual o distinto al solicitado;
- registrar aprobador y motivo;
- no aplicar automaticamente salvo decision explicita.

Recomendacion MVP: aprobar no aplica automaticamente. El estado `APPROVED` habilita accion `Aplicar precio autorizado`.

### Aplicacion del precio autorizado

Para aplicar:

- usuario requiere `APPLY_APPROVED_LIVE_PRICE_CHANGE`;
- solicitud debe estar `APPROVED`;
- solicitud no debe estar vencida;
- live/item/reservation/company/branch deben coincidir;
- el estado actual debe coincidir con el snapshot esperado o pasar una revalidacion explicita;
- al aplicar cambia a `APPLIED`.

## 6. Permisos propuestos

| Permiso | Uso | Actor/rol sugerido | Comentario |
| --- | --- | --- | --- |
| `REQUEST_LIVE_PRICE_CHANGE` | Crear solicitud de cambio de precio | Vendedor u operador con acceso LIVE | No concede cambiar precio. |
| `APPROVE_LIVE_PRICE_CHANGE` | Aprobar/rechazar solicitud | Supervisor/admin con permiso explicito | No debe depender solo del rol visual. |
| `APPLY_APPROVED_LIVE_PRICE_CHANGE` | Aplicar precio ya aprobado | Operador LIVE, supervisor/admin o aprobador segun politica | Requiere revalidacion. |
| `VIEW_LIVE_PRICE_AUTHORIZATIONS` | Ver cola/historial de autorizaciones de precio | Supervisor/admin/operador autorizado | Scope por company/branch. |
| `CHANGE_LIVE_PRICE` | Cambiar precio directo sin solicitud | Opcional; solo admin/operador senior si negocio lo aprueba | Debe auditarse y no saltar reglas de pago/cierre. |

Recomendaciones:

- Vendedor puede solicitar, pero no aprobar.
- Operador puede solicitar; puede aplicar solo si se le concede permiso.
- Supervisor/admin pueden aprobar solo con permiso explicito.
- Nadie debe autoaprobar su propia solicitud.

## 7. Modelo de datos recomendado

### Opcion A: tabla especifica

`live_price_authorization_requests`

Ventajas:

- columnas claras para precio;
- consulta simple para cola de precio;
- menor dependencia de `payload_json`.

Desventajas:

- duplica estados, auditoria y flujo frente a otras autorizaciones;
- obliga a crear otra tabla para cada tipo operativo;
- aumenta mantenimiento.

### Opcion B: modelo generico

`operational_authorization_requests` con `request_type = LIVE_PRICE_CHANGE`.

Ventajas:

- un solo flujo de aprobacion, rechazo, expiracion y aplicacion;
- compatible con LIVE-AUTH-A;
- permite reutilizar cola, auditoria, permisos y UI;
- evita proliferacion de tablas.

Desventajas:

- requiere buen contrato de `payload_json` o columnas auxiliares;
- consultas de precio pueden necesitar indices por `request_type`, `live_id`, `item_id` y `reservation_id`.

### Recomendacion

Usar opcion B: `operational_authorization_requests`.

Para facilitar reportes y validaciones, se recomienda que el contrato soporte estos campos minimos como columnas o payload tipado:

| Campo | Uso |
| --- | --- |
| `id` | Identificador de solicitud. |
| `request_type` | `LIVE_PRICE_CHANGE`. |
| `status` | `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`, `APPLIED`. |
| `live_id` | LIVE relacionado. |
| `item_id` | Prenda relacionada. |
| `reservation_id` | Apartado relacionado, nullable. |
| `requested_by_user_id` | Solicitante. |
| `requested_at` | Fecha de solicitud. |
| `original_price` | Precio vigente al solicitar. |
| `requested_price` | Precio solicitado. |
| `approved_price` | Precio aprobado, nullable. |
| `reason` | Motivo del solicitante. |
| `approved_by_user_id` / `decided_by_user_id` | Aprobador, nullable. |
| `decided_at` | Fecha de decision, nullable. |
| `decision_reason` | Motivo de aprobacion/rechazo, nullable. |
| `expires_at` | Vencimiento. |
| `applied_at` | Fecha de aplicacion, nullable. |
| `applied_by_user_id` | Usuario que aplica, nullable. |
| `company_id` / `branch_id` | Scope. |
| `current_state` | Snapshot de live/item/reservation/pago. |
| `requested_state` | Precio/estado esperado. |
| `payload_json` | Datos especificos versionados. |
| `created_at` / `updated_at` | Auditoria. |

## 8. Endpoints futuros propuestos

No se implementan en esta fase.

| Metodo | Ruta | Permiso requerido | Uso |
| --- | --- | --- | --- |
| `POST` | `/api/lives/{liveId}/price-authorizations` | `REQUEST_LIVE_PRICE_CHANGE` | Crear solicitud. |
| `GET` | `/api/lives/{liveId}/price-authorizations` | `VIEW_LIVE_PRICE_AUTHORIZATIONS` o solicitante propio | Listar solicitudes del LIVE. |
| `GET` | `/api/lives/{liveId}/price-authorizations/pending` | `VIEW_LIVE_PRICE_AUTHORIZATIONS` | Cola de pendientes por scope. |
| `POST` | `/api/lives/{liveId}/price-authorizations/{requestId}/approve` | `APPROVE_LIVE_PRICE_CHANGE` | Aprobar solicitud. |
| `POST` | `/api/lives/{liveId}/price-authorizations/{requestId}/reject` | `APPROVE_LIVE_PRICE_CHANGE` | Rechazar solicitud. |
| `POST` | `/api/lives/{liveId}/price-authorizations/{requestId}/apply` | `APPLY_APPROVED_LIVE_PRICE_CHANGE` | Aplicar precio aprobado. |
| `POST` | `/api/lives/{liveId}/price-authorizations/{requestId}/cancel` | Solicitante propio o permiso de administracion | Cancelar solicitud pendiente. |

### `POST /api/lives/{liveId}/price-authorizations`

Request DTO:

- `itemId`;
- `reservationId` nullable;
- `requestedPrice`;
- `reason`;
- `clientRequestId` opcional para idempotencia.

Response DTO:

- `id`;
- `status`;
- `originalPrice`;
- `requestedPrice`;
- `expiresAt`;
- `createdAt`;
- snapshot seguro de prenda/apartado.

Validaciones:

- usuario con `REQUEST_LIVE_PRICE_CHANGE`;
- LIVE existe y pertenece a company/branch;
- item pertenece al LIVE o es el item activo/preparado;
- precio solicitado valido y positivo;
- motivo obligatorio;
- sin solicitud `PENDING` duplicada;
- si hay apartado con pago o venta cerrada, bloquear o exigir fase de pagos aprobada.

Errores esperados:

- `401` sesion expirada;
- `403` sin permiso;
- `404` live/item/reservation no encontrado;
- `409` estado cambio o solicitud duplicada;
- `422` precio/motivo invalido;
- `500` error interno accionable.

Auditoria/evento:

- `LIVE_PRICE_CHANGE_REQUESTED`;
- `LIVE_PRICE_CHANGE_DUPLICATE_BLOCKED` si aplica.

### `GET /api/lives/{liveId}/price-authorizations`

Validaciones:

- solicitante puede ver sus solicitudes;
- aprobador con `VIEW_LIVE_PRICE_AUTHORIZATIONS` puede ver cola/historial de su scope;
- filtrar por company/branch.

Response DTO:

- lista paginada;
- estado;
- precios;
- solicitante;
- aprobador;
- item/reservation;
- timestamps.

### `POST /approve`

Request DTO:

- `approvedPrice`;
- `decisionReason`.

Validaciones:

- permiso `APPROVE_LIVE_PRICE_CHANGE`;
- no self-approval;
- solicitud `PENDING`;
- no expirada;
- mismo company/branch;
- estado del target aun aplicable o decision explicitamente marcada como solo aprobacion.

Evento:

- `LIVE_PRICE_CHANGE_APPROVED`.

### `POST /reject`

Request DTO:

- `decisionReason`.

Validaciones:

- permiso `APPROVE_LIVE_PRICE_CHANGE`;
- solicitud `PENDING`;
- motivo obligatorio.

Evento:

- `LIVE_PRICE_CHANGE_REJECTED`.

### `POST /apply`

Request DTO:

- `confirmCurrentPrice`;
- `confirmReservationStatus` opcional;
- `applyReason` opcional.

Validaciones:

- permiso `APPLY_APPROVED_LIVE_PRICE_CHANGE`;
- solicitud `APPROVED`;
- no expirada;
- no aplicada;
- target sigue en estado compatible;
- no hay pago/cierre que bloquee;
- precio actual coincide con snapshot o se maneja conflicto `409`.

Evento:

- `LIVE_PRICE_CHANGE_APPLIED`;
- `LIVE_PRICE_CHANGE_APPLY_DENIED` si falla revalidacion.

### `POST /cancel`

Request DTO:

- `cancelReason` opcional u obligatorio segun politica.

Validaciones:

- solicitante propio o permiso de administracion;
- solicitud `PENDING`;
- no permitir cancelar una ya aprobada/aplicada.

Evento:

- `LIVE_PRICE_CHANGE_CANCELLED`.

## 9. Eventos de auditoria

Eventos requeridos:

- `LIVE_PRICE_CHANGE_REQUESTED`;
- `LIVE_PRICE_CHANGE_APPROVED`;
- `LIVE_PRICE_CHANGE_REJECTED`;
- `LIVE_PRICE_CHANGE_EXPIRED`;
- `LIVE_PRICE_CHANGE_CANCELLED`;
- `LIVE_PRICE_CHANGE_APPLIED`;
- `LIVE_PRICE_CHANGE_APPLY_DENIED`;
- `LIVE_PRICE_CHANGE_DUPLICATE_BLOCKED`;
- `LIVE_PRICE_CHANGE_SELF_APPROVAL_BLOCKED`;
- `LIVE_PRICE_CHANGE_PAYMENT_GUARD_BLOCKED`.

Payload minimo:

- `authorizationRequestId`;
- `liveId`;
- `itemId`;
- `reservationId` si aplica;
- `originalPrice`;
- `requestedPrice`;
- `approvedPrice` si aplica;
- `requestedByUserId`;
- `decidedByUserId` si aplica;
- `appliedByUserId` si aplica;
- `reason`;
- `decisionReason` si aplica;
- `status`;
- `companyId`;
- `branchId`;
- `timestamp`.

No incluir datos sensibles innecesarios ni informacion de pago/caja fuera del contrato aprobado.

## 10. UX por actor/permiso

### Vendedor u operador sin permiso directo

- Precio visible pero bloqueado.
- Boton `Solicitar cambio de precio` solo si existe backend real y tiene `REQUEST_LIVE_PRICE_CHANGE`.
- Motivo obligatorio.
- Estado visible: pendiente, aprobada, rechazada, vencida, cancelada, aplicada.
- Si no existe backend: mantener mensaje honesto de Z10A.

### Supervisor/admin aprobador

- Cola de solicitudes pendientes.
- Ver prenda, live, cliente si aplica, apartado si aplica, precio actual, precio solicitado, motivo y antiguedad.
- Aprobar con precio aprobado y motivo.
- Rechazar con motivo.
- No aprobar solicitud propia.
- Ver historial.

### Operador con autorizacion aprobada

- Ver solicitud aprobada y precio aprobado.
- Accion `Aplicar precio autorizado`.
- Confirmar antes de aplicar.
- Si el estado cambio, mostrar conflicto y pedir nueva solicitud.

### Usuario sin permisos

- Precio solo lectura.
- Mensaje claro: no tiene permiso para solicitar o aprobar cambios de precio.
- No botones mudos.

### Sin backend disponible

- No mostrar `Solicitud pendiente`.
- No abrir formulario que aparente enviar solicitud.
- Mensaje: `La autorizacion de cambio de precio aun no esta disponible.`

## 11. Riesgos

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Cambiar precio despues de pago | Inconsistencia financiera | Bloquear hasta contrato de pagos/reversa. |
| Cambiar precio despues de cierre LIVE | Estado operativo inconsistente | Requerir reversa o solicitud nueva. |
| Cross-tenant/cross-branch | Fuga o abuso de autorizacion | Scope obligatorio por company/branch. |
| Autoaprobacion | Control interno debil | Bloquear solicitante = aprobador. |
| Solicitudes duplicadas | Confusion operativa | Unicidad logica por target/tipo/status. |
| Perdida de auditoria | Imposible rastrear decisiones | Eventos obligatorios y snapshots. |
| Inconsistencia con caja/pagos | Riesgo financiero | No tocar pagos/caja en Z10B/Z10C sin fase especifica. |
| Permisos demasiado amplios | Usuarios aprueban sin control | Usar permisos finos de LIVE-ROLE-A. |
| UX que simula backend | QA/usuario cree que existe aprobacion real | Mantener bloqueo honesto hasta implementar backend. |

## 12. Decisiones pendientes

- Confirmar si se usara `operational_authorization_requests` o tabla especifica.
- Confirmar si `CHANGE_LIVE_PRICE` existira como permiso directo.
- Definir si aprobacion aplica automaticamente o requiere `APPLY_APPROVED_LIVE_PRICE_CHANGE`.
- Definir TTL de solicitudes.
- Definir rangos o reglas de precio minimo/maximo.
- Definir si aprobador puede ajustar `approved_price`.
- Definir si vendedor centro puede solicitar por defecto.
- Definir si operador puede aplicar autorizaciones aprobadas.
- Definir comportamiento con apartados con pago.
- Definir si precio autorizado afecta solo LIVE temporal o inventario base.

## 13. Plan de implementacion futuro

### LIVE-Z10C - Backend, migracion y servicio

Alcance:

- crear migracion de permisos aprobados;
- crear o extender entidad de autorizaciones;
- crear servicio de solicitud/aprobacion/rechazo/aplicacion;
- crear endpoints REST;
- agregar auditoria/eventos;
- validar company/branch y permisos.

Archivos esperados:

- backend `authorization` o `live` package;
- migration Flyway;
- `PermissionCode`;
- servicios y DTOs;
- tests backend.

Validaciones:

- Maven test/package;
- pruebas unitarias de permisos, self-approval, duplicados, expiracion y revalidacion.

GO/NO-GO:

- GO solo con arquitectura aprobada.
- NO-GO si requiere tocar pagos/caja sin fase dedicada.

### LIVE-Z10D - Frontend solicitud, cola y aplicacion

Alcance:

- formulario real de solicitud;
- estado de solicitud en `/live`;
- cola supervisor/admin;
- aplicar precio aprobado;
- i18n;
- errores accionables.

Archivos esperados:

- `app/live.tsx` o componentes LIVE extraidos;
- servicios frontend;
- componentes de cola/autorizacion;
- locales.

Validaciones:

- lint;
- TypeScript;
- expo export;
- QA mobile/tablet/light/dark.

### LIVE-Z10E - QA/regresion/auditoria

Alcance:

- matriz QA real multiusuario;
- casos de vendedor, operador, supervisor/admin;
- casos de rechazo, expiracion, duplicado, self-approval y estado cambiado;
- evidencia de eventos.

### LIVE-PAYMENT-GUARD-A

Alcance:

- definir reglas cuando apartado tiene pago;
- no mezclar con caja/pagos sin aprobacion;
- puede depender de permisos de pagos y autorizacion supervisor.

### AUTH-LIVE-PERMISSIONS-A

Alcance:

- aprobar catalogo final de permisos LIVE finos;
- migrar roles/permisos;
- actualizar UI de roles y QA.

## 14. QA requerido

QA/arquitectura debe validar documentalmente:

1. Que no se implemento backend ni UI funcional.
2. Que el documento responde quien solicita, quien aprueba y quien aplica.
3. Que permisos propuestos no se conceden aun.
4. Que endpoints futuros tienen permisos, DTOs, errores y eventos definidos.
5. Que se bloquea aplicacion sobre pago/cierre sin regla formal.
6. Que no se simula autorizacion si no hay backend.
7. Que el plan futuro separa backend, frontend, QA y pagos.

## 15. GO/NO-GO

GO:

- usar este documento como handoff para arquitectura;
- mantener Z10A como bloqueo honesto mientras no exista backend;
- preparar LIVE-Z10C/LIVE-Z10D solo despues de aprobar modelo, permisos y riesgos.

NO-GO:

- implementar endpoints o migraciones en esta fase;
- crear permisos reales sin aprobacion;
- tocar pagos/caja;
- autoaprobar solicitudes;
- aplicar precio autorizado si el estado cambio;
- simular una autorizacion pendiente en frontend.
