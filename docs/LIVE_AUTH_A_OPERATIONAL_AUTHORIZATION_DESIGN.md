# LIVE-AUTH-A - Diseno de autorizaciones operativas LIVE

## 1. Resumen ejecutivo

LIVE-AUTH-A define un modelo general para autorizaciones operativas en LIVE, apartados e inventario bloqueado. Esta fase no implementa codigo, endpoints, migraciones ni cambios de permisos. El objetivo es evitar que futuras fases resuelvan cada bloqueo con excepciones locales y, en su lugar, usen un contrato uniforme, auditable y tenant-aware.

Resultado de diseno:

- Usar una entidad generica `operational_authorization_requests`.
- Mantener acciones sensibles bloqueadas si no hay autorizacion real.
- Separar actor visual de permiso/capacidad efectiva.
- Usar aprobadores por permiso como MVP.
- Evaluar tabla de jerarquia empleado-supervisor como mejora si negocio requiere rutas por supervisor directo.

Estado recomendado: `DESIGN_READY / PENDING_ARCH_REVIEW`.

## 2. Problemas detectados por QA

QA encontro casos donde la UI no debe ejecutar libremente una accion operativa:

- Una prenda ya apartada no puede apartarse otra vez.
- Liberar una prenda apartada requiere autorizacion o flujo formal.
- Cancelar o deshacer cierre LIVE de un apartado con pago requiere autorizacion y reversa controlada.
- Cambio de precio LIVE no debe simular autorizacion si no hay backend real.
- Vendedor/operador/supervisor deben ver acciones segun permisos reales, no solo por actor.

Estos casos mezclan inventario, apartados, LIVE, pagos, caja y permisos. Por eso cualquier implementacion debe pasar por aprobacion arquitectonica antes de tocar backend.

## 3. Casos que requieren autorizacion

| Caso | Regla propuesta | Comentario |
| --- | --- | --- |
| Liberar prenda apartada | Requiere autorizacion | Debe validar que no tenga pago y que no exista venta/caja asociada. |
| Cancelar apartado sin pago | Puede ejecutarse con permiso `CANCEL_RESERVATION` y motivo obligatorio | No requiere aprobacion adicional si no hay pago ni estado cerrado. |
| Cancelar apartado con pago | Requiere autorizacion y flujo formal de reversa | No debe tocar caja sin contrato de pagos/reversa. |
| Deshacer cierre de venta LIVE sin pago | Puede ejecutarse con permiso operativo si no hay pago | Requiere auditoria y motivo. |
| Deshacer cierre de venta LIVE con pago | Requiere autorizacion y flujo formal de reversa | Bloquear si no hay backend real de autorizacion/reversa. |
| Cambiar precio LIVE | Requiere autorizacion real o permiso dedicado | No mostrar solicitud pendiente si no existe backend. |
| Reasignar apartado a otro cliente | Requiere autorizacion | Impacta trazabilidad de cliente, reportes y posibles pagos. |
| Editar prenda relacionada con apartado o venta operativa | Requiere autorizacion | Debe bloquear campos sensibles si hay venta/pago. |
| Vendedor prepara prenda sin controlar prenda al aire | Requiere permiso granular futuro | No conceder por actor; disenar `PREPARE_LIVE_ITEM` o equivalente. |

## 4. Modelo de empleados y supervisores

### Estado actual observado

- La sesion frontend tiene `userId`, `companyId`, `branchId`, `roles`, `channels` y `effectivePermissions`.
- El backend usa relaciones `user_companies` y `user_branches`.
- La administracion de usuarios permite `branchId` principal y `branchIds`.
- Existen roles como `ADMIN`, `SUPERVISOR`, `SELLER`, `QA_TENANT_ADMIN` y `QA_TENANT_SELLER`.
- No se encontro una relacion explicita de supervisor directo por empleado en el contrato frontend actual.

### Respuestas de arquitectura

| Pregunta | Respuesta actual | Decision sugerida |
| --- | --- | --- |
| Existe relacion usuario-sucursal/company? | Si, por sesion y tablas `user_companies` / `user_branches`. | Usarla como scope obligatorio. |
| Existe supervisor asignado? | No confirmado. | No depender de supervisor directo en MVP. |
| Existe rol suficiente para aprobar? | Existen roles/permisos efectivos. | Aprobar por permiso dedicado, no solo por rol. |
| Hace falta tabla de jerarquia? | Para aprobacion por jefe directo, si. | MVP con permisos; fase futura para jerarquia. |

### Jerarquia futura sugerida

Si negocio requiere supervisor directo, agregar una relacion separada, por ejemplo:

`employee_supervisor_assignments`

Campos sugeridos:

- `id`
- `employee_user_id`
- `supervisor_user_id`
- `company_id`
- `branch_id`
- `status`
- `valid_from`
- `valid_until`
- `created_at`
- `updated_at`

Regla: aun con supervisor directo, el aprobador debe tener permiso efectivo para aprobar el tipo de solicitud.

## 5. Modelo de autorizacion propuesto

Entidad sugerida:

`operational_authorization_requests`

Campos minimos:

| Campo | Tipo sugerido | Uso |
| --- | --- | --- |
| `id` | bigint | Identificador. |
| `request_type` | varchar/enum | Tipo de solicitud. |
| `status` | varchar/enum | Estado actual. |
| `requested_by_user_id` | bigint | Solicitante. |
| `requested_at` | datetime | Fecha de solicitud. |
| `approved_by_user_id` | bigint nullable | Aprobador. |
| `decided_at` | datetime nullable | Fecha de decision. |
| `reason` | text | Motivo del solicitante. |
| `decision_reason` | text nullable | Motivo de aprobacion/rechazo. |
| `target_type` | varchar | `ITEM`, `RESERVATION`, `LIVE`, etc. |
| `target_id` | bigint | Recurso principal. |
| `live_id` | bigint nullable | LIVE relacionado. |
| `item_id` | bigint nullable | Prenda relacionada. |
| `reservation_id` | bigint nullable | Apartado relacionado. |
| `current_state` | varchar/json | Estado antes de solicitar. |
| `requested_state` | varchar/json | Estado esperado. |
| `payload_json` | json | Datos especificos y snapshot seguro. |
| `expires_at` | datetime | Vencimiento. |
| `company_id` | bigint | Tenant. |
| `branch_id` | bigint | Sucursal. |
| `created_at` | datetime | Auditoria. |
| `updated_at` | datetime | Auditoria. |

Estados:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `EXPIRED`
- `CANCELLED`
- `APPLIED`

Tipos:

- `RELEASE_RESERVED_ITEM`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `UNDO_LIVE_SALE_WITH_PAYMENT`
- `LIVE_PRICE_CHANGE`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`
- `PREPARE_LIVE_ITEM_AS_SELLER`

## 6. Reglas de negocio

### Acciones sin autorizacion adicional

- Apartar prenda disponible con permiso operativo.
- Cancelar apartado sin pago con `CANCEL_RESERVATION` y motivo obligatorio.
- Deshacer cierre LIVE sin pago si el usuario tiene capacidad operativa y el estado lo permite.
- Ver detalle, consultar estado y refrescar informacion.

### Acciones con autorizacion

- Liberar prenda apartada.
- Cancelar apartado con pago.
- Deshacer cierre LIVE con pago.
- Cambiar precio LIVE si el usuario no tiene permiso dedicado.
- Reasignar apartado a otro cliente.
- Editar prenda bloqueada por apartado, venta operativa o pago.
- Permitir a vendedor preparar prenda sin controlar la prenda al aire.

### Acciones bloqueadas completamente

- Modificar prenda vendida sin flujo formal de devolucion/reversa.
- Cancelar pago o caja desde LIVE.
- Aplicar autorizacion vencida, rechazada o de otra sucursal/company.
- Aprobar una solicitud con target que ya cambio de estado y no coincide con `current_state`.

### Pago registrado

Si hay pago mayor a cero:

- No cancelar directamente.
- No deshacer cierre LIVE directamente.
- No liberar inventario sin reversa formal.
- Requerir autorizacion y contrato de reversa.

Si el frontend/backend no puede confirmar pago:

- No asumir que no hay pago.
- Bloquear o pedir revision hasta obtener estado confiable.

### Doble solicitud pendiente

Para el mismo `request_type + target_type + target_id`:

- No crear duplicado si ya existe `PENDING`.
- Mostrar solicitud existente y su estado.
- Permitir cancelar la propia solicitud si sigue `PENDING`.

### Solicitante y aprobador

- El mismo usuario no debe aprobar su propia solicitud.
- Admin global/tenant puede aprobar solo si tiene permiso dedicado y misma company/branch o scope permitido.
- Supervisor por rol no basta si no tiene permiso de aprobacion.

### Auditoria obligatoria

Registrar eventos para:

- Solicitud creada.
- Solicitud aprobada.
- Solicitud rechazada.
- Solicitud vencida.
- Solicitud cancelada.
- Solicitud aplicada.
- Intento de aplicar solicitud invalida.
- Intento cross-tenant/cross-branch.

## 7. Permisos sugeridos

Permisos futuros posibles:

- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_RELEASE_RESERVED_ITEM`
- `APPROVE_RESERVATION_PAYMENT_REVERSAL`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPROVE_REASSIGN_RESERVATION`
- `APPROVE_EDIT_LOCKED_ITEM`
- `PREPARE_LIVE_ITEM`

Regla: los permisos finos deben mapearse en backend, frontend y QA. No deben habilitarse solo por nombre de rol.

## 8. Endpoints sugeridos

No se implementan en esta fase. Propuesta para fase futura:

| Metodo | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/operational-authorizations` | Crear solicitud. |
| `GET` | `/api/operational-authorizations/pending` | Cola de aprobador por tenant/branch/permisos. |
| `GET` | `/api/operational-authorizations/my-requests` | Solicitudes del usuario. |
| `GET` | `/api/operational-authorizations/{id}` | Detalle con snapshot. |
| `PATCH` | `/api/operational-authorizations/{id}/approve` | Aprobar. |
| `PATCH` | `/api/operational-authorizations/{id}/reject` | Rechazar. |
| `PATCH` | `/api/operational-authorizations/{id}/cancel` | Cancelar solicitud pendiente. |
| `POST` | `/api/operational-authorizations/{id}/apply` | Aplicar accion aprobada con revalidacion. |

Requisitos de endpoints:

- Validar sesion, company y branch.
- Validar permiso del solicitante.
- Validar permiso del aprobador.
- Revalidar estado del recurso antes de aplicar.
- No tocar pagos/caja salvo contrato especifico aprobado.

## 9. Eventos de auditoria

Eventos sugeridos:

- `LIVE_AUTH_REQUEST_CREATED`
- `LIVE_AUTH_REQUEST_APPROVED`
- `LIVE_AUTH_REQUEST_REJECTED`
- `LIVE_AUTH_REQUEST_CANCELLED`
- `LIVE_AUTH_REQUEST_EXPIRED`
- `LIVE_AUTH_REQUEST_APPLIED`
- `LIVE_AUTH_REQUEST_APPLY_DENIED`
- `LIVE_AUTH_CROSS_TENANT_DENIED`
- `LIVE_AUTH_PAYMENT_GUARD_BLOCKED`
- `LIVE_AUTH_DUPLICATE_PENDING_BLOCKED`

Cada evento debe incluir:

- `request_id`
- `request_type`
- `target_type`
- `target_id`
- `requested_by_user_id`
- `approved_by_user_id` si aplica
- `company_id`
- `branch_id`
- `live_id`, `item_id`, `reservation_id` si aplican
- resultado y motivo

## 10. UX por rol

### Solicitante

- Si la accion requiere autorizacion, mostrar `Solicitar autorizacion`.
- Motivo obligatorio.
- Mostrar impacto: prenda, cliente, apartado, pago, precio actual/nuevo.
- Mostrar estado: pendiente, aprobada, rechazada, vencida.
- Si no hay flujo real, mostrar mensaje honesto y no simular pendiente.

### Supervisor/Admin aprobador

- Cola de solicitudes pendientes.
- Filtros por sucursal, tipo, prioridad y antiguedad.
- Ver snapshot antes/despues.
- Ver pago registrado y saldo si aplica.
- Aprobar/rechazar con motivo.
- No aprobar solicitud propia.

### Vendedor

- Ver acciones permitidas por permisos reales.
- Si no puede controlar prenda al aire, explicar bloqueo.
- Si se define permiso futuro, permitir preparar prenda sin ponerla al aire solo con `PREPARE_LIVE_ITEM`.

## 11. Riesgos

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Autorizar sin revalidar estado | Inventario o pago inconsistente | Revalidar antes de aplicar. |
| Aprobador sin scope correcto | Cross-branch/tenant | Validar company/branch y permisos. |
| Misma persona solicita y aprueba | Control interno debil | Bloquear self-approval. |
| Duplicar solicitudes pendientes | Confusion operativa | Unicidad logica por target/tipo. |
| Reversa con pago sin caja | Riesgo financiero | Bloquear hasta contrato formal. |
| Permisos por rol visual | Acciones indebidas | Usar permisos efectivos. |

## 12. Decisiones pendientes

- Confirmar si el MVP aprueba por permisos o por supervisor directo.
- Definir si se necesita tabla de jerarquia empleado-supervisor.
- Definir permisos exactos y roles que los recibirian.
- Definir TTL por tipo de solicitud.
- Definir si `APPROVED` aplica automaticamente o requiere `APPLIED` manual.
- Definir contratos de reversa para pagos/caja antes de permitir cancelaciones con pago.
- Definir si vendedor puede preparar prendas sin controlar prenda al aire.

## 13. Fases futuras

| Fase | Objetivo | Sensibilidad |
| --- | --- | --- |
| LIVE-AUTH-B | Contrato backend y migracion de autorizaciones operativas | Alta |
| LIVE-AUTH-C | UI de solicitud y cola de aprobacion | Media/alta |
| LIVE-PAYMENT-GUARD-A | Reversa autorizada de apartados con pago | Critica |
| LIVE-Z10B | Autorizacion real de cambio de precio LIVE | Alta |
| LIVE-ROLE-A | Permiso granular para vendedor preparando prendas | Alta |
| AUTH-LIVE-PERMISSIONS-A | Matriz final de permisos LIVE finos | Alta |

## 14. Criterio GO/NO-GO

GO para:

- Usar este documento como base de revision arquitectonica.
- Mantener bloqueos honestos en UI mientras no exista backend.
- Preparar handoff para fases futuras.

NO-GO para:

- Implementar endpoints sin aprobacion arquitectonica.
- Tocar pagos/caja desde LIVE sin contrato formal.
- Simular solicitudes pendientes.
- Aprobar por rol visual sin permiso efectivo.
- Permitir reversa/cancelacion con pago sin auditoria y revalidacion.
