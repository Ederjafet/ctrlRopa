# LIVE-AUTH-B1 - MVP autorizaciones operativas LIVE

Fecha: 2026-06-10
Rama: feature/live-auth-b1-operational-authorizations-mvp

## Resumen ejecutivo

LIVE-AUTH-B1 implementa el MVP backend de autorizaciones operativas LIVE siguiendo el handoff `LIVE_AUTH_B0_OPERATIONAL_AUTHORIZATIONS_HANDOFF.md`.

Resultado tecnico esperado: `GO_TECNICO` si las validaciones completas pasan.

La implementacion queda deliberadamente acotada:

- crea permisos reales para solicitar, ver, aprobar y aplicar autorizaciones operativas LIVE;
- crea tabla persistente de solicitudes;
- expone endpoints backend para crear, listar, aprobar, rechazar, cancelar y aplicar;
- permite aplicar solo `UNDO_LIVE_OPERATIONAL_SALE` cuando no hay pago activo y el snapshot sigue consistente;
- deja `CANCEL_RESERVATION_WITH_PAYMENT`, `RELEASE_RESERVED_ITEM`, `REASSIGN_RESERVATION` y `EDIT_LOCKED_ITEM` como solicitud/aprobacion documental, sin aplicacion real todavia.

No se implementan pagos, caja, precio LIVE, devoluciones ni venta financiera.

## Handoff aplicado

B0 recomienda:

- entidad generica `operational_authorization_requests`;
- estados `REQUESTED`, `APPROVED`, `REJECTED`, `APPLIED`, `EXPIRED`, `CANCELLED`;
- scope `company_id`, `branch_id`, usuario solicitante, target y snapshot;
- permisos de solicitud, aprobacion, visualizacion y aplicacion;
- primer caso aplicable seguro: `UNDO_LIVE_OPERATIONAL_SALE` sin pago activo.

B1 implementa ese recorte y mantiene gate para cualquier accion que toque pago/caja/venta financiera o edicion funcional amplia.

## Permisos creados

Migracion: `V55__live_operational_authorizations_mvp.sql`.

Permisos nuevos:

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`

Asignacion inicial:

| Rol | Permisos |
| --- | --- |
| ADMIN | Solicitar, ver, aprobar, aplicar y permisos finos de acciones objetivo |
| SUPERVISOR | Solicitar, ver, aprobar, aplicar y permisos finos de acciones objetivo |
| SELLER | Solicitar y `UNDO_LIVE_OPERATIONAL_SALE`; no ve cola completa, no aprueba y no aplica |
| Sin permisos | Sin acceso a endpoints de autorizacion |

## Modelo persistente

Tabla: `operational_authorization_requests`.

Campos principales:

- `operation_type`
- `status`
- `company_id`
- `branch_id`
- `requested_by_user_id`
- `decided_by_user_id`
- `applied_by_user_id`
- `expires_at`
- `target_type`
- `target_id`
- `live_id`
- `reservation_id`
- `item_id`
- `payment_id`
- `sale_id`
- `reason`
- `decision_reason`
- `current_state_hash`
- `snapshot_json`
- `payload_json`

Reglas:

- no guarda secretos;
- usa snapshot minimo y hash para detectar drift;
- bloquea solicitud duplicada `REQUESTED` por accion + target + scope;
- bloquea self-approval;
- marca expiradas en validacion lazy;
- revalida tenant/branch en lectura, decision y aplicacion.

## Endpoints creados

Base: `/api/operational-authorizations`.

| Metodo | Ruta | Permiso |
| --- | --- | --- |
| `POST` | `/api/operational-authorizations` | `REQUEST_LIVE_OPERATION_AUTHORIZATION` + permiso fino de accion |
| `GET` | `/api/operational-authorizations/branch/{branchId}` | `VIEW_LIVE_OPERATION_AUTHORIZATIONS` |
| `GET` | `/api/operational-authorizations/pending/branch/{branchId}` | `VIEW_LIVE_OPERATION_AUTHORIZATIONS` |
| `GET` | `/api/operational-authorizations/mine/branch/{branchId}` | `REQUEST_LIVE_OPERATION_AUTHORIZATION` |
| `GET` | `/api/operational-authorizations/{id}` | `VIEW_LIVE_OPERATION_AUTHORIZATIONS` |
| `PATCH` | `/api/operational-authorizations/{id}/approve` | `APPROVE_LIVE_OPERATION_AUTHORIZATION` |
| `PATCH` | `/api/operational-authorizations/{id}/reject` | `APPROVE_LIVE_OPERATION_AUTHORIZATION` |
| `PATCH` | `/api/operational-authorizations/{id}/cancel` | `REQUEST_LIVE_OPERATION_AUTHORIZATION` y solicitante original |
| `POST` | `/api/operational-authorizations/{id}/apply` | `APPLY_LIVE_OPERATION_AUTHORIZATION` + permiso fino de aplicacion |

## Aplicacion implementada

Solo se implementa aplicacion para:

`UNDO_LIVE_OPERATIONAL_SALE`

Condiciones:

- solicitud en estado `APPROVED`;
- no expirada;
- reserva sigue `ACTIVE`;
- reserva pertenece a LIVE;
- `liveOperationalStatus` sigue `OPERATIONAL_SOLD`;
- item sigue `RESERVED`;
- no hay `PaymentAllocation` con `PaymentStatus.ACTIVE`;
- snapshot hash coincide;
- aplicador tiene `APPLY_LIVE_OPERATION_AUTHORIZATION`;
- aplicador tiene `UNDO_LIVE_OPERATIONAL_SALE`.

Efecto:

- cambia `liveOperationalStatus` a `RESERVED`;
- conserva `ReservationStatus.ACTIVE`;
- conserva item en `RESERVED`;
- no crea venta;
- no crea pago;
- no toca caja;
- registra eventos `LIVE_RESERVATION_STATUS_CHANGED` y `LIVE_OPERATIONAL_SOLD_UNDONE`.

## Acciones pendientes

Estas acciones pueden solicitarse/aprobarse si el usuario tiene permisos, pero no se aplican todavia:

- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`

Motivo: requieren contrato funcional/financiero especifico para no tocar pagos, caja, ventas, saldos o edicion de inventario de forma insegura.

## Frontend

No se agrego UI en B1.

Motivo: el alcance seguro era cerrar backend, permisos, migracion y tests primero. La UI de cola/solicitud debe implementarse en una fase posterior con i18n y QA visual, usando estos endpoints reales.

Pendiente recomendado:

`LIVE-AUTH-B2 - UI cola y solicitud de autorizaciones operativas LIVE`

## Tests

Tests agregados:

- `OperationalAuthorizationServiceTests`.

Cobertura:

- crear solicitud exige permiso de solicitud y permiso fino;
- snapshot se persiste;
- self-approval se bloquea;
- seller/no aprobador no aprueba si `AccessService` deniega;
- autorizacion rechazada no aplica;
- `UNDO_LIVE_OPERATIONAL_SALE` aprobado se aplica sin pago activo y registra evento.

## Rollback

Si B1 se integra y requiere rollback:

1. Revertir el merge/commit de B1.
2. No borrar filas de `operational_authorization_requests` sin plan DBA.
3. Si V55 ya fue aplicada en ambiente con datos, tratarla como migracion con datos operativos y no hacer DROP directo.
4. Mantener permisos creados sin asignacion o retirar con migracion nueva controlada si negocio lo aprueba.

## QA

Checklist API:

- usuario sin permiso no crea solicitud;
- seller crea solicitud autorizable pero no aprueba ni aplica;
- admin/supervisor aprueba;
- solicitante no aprueba su propia solicitud;
- solicitud rechazada no aplica;
- solicitud aprobada no aplica dos veces;
- `UNDO_LIVE_OPERATIONAL_SALE` sin pago activo revierte a `RESERVED`;
- `UNDO_LIVE_OPERATIONAL_SALE` con pago activo queda bloqueado;
- acciones con pago/caja no aplican en B1.

Checklist visual:

- `PENDING_QA_VISUAL` hasta existir UI y screenshots.

## Resultado

- `GO_TECNICO` si validaciones pasan.
- `PARTIAL_GO_BACKEND` porque frontend queda pendiente documentado.
- `PENDING_QA_VISUAL` porque no hubo navegador/screenshots.
