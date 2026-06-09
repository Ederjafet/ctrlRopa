# LIVE-PERM-A0 - Handoff arquitectónico de permisos LIVE reales

## Resumen ejecutivo

LIVE-PERM-A0 confirma que los permisos LIVE granulares diseñados en LIVE-Z10B, LIVE-AUTH-A y LIVE-ROLE-A todavía no existen como permisos reales de backend/RBAC. Hoy el flujo LIVE se apoya principalmente en `DO_LIVE_RESERVATION`, permisos de inventario/clientes/pagos y capacidades compuestas de frontend.

Esta fase no implementa cambios funcionales. El objetivo es entregar una propuesta controlada para que arquitectura apruebe LIVE-PERM-A1 antes de crear permisos, migraciones, enforcement backend o cambios de UI.

Resultado: `HANDOFF_ARQUITECTONICO_COMPLETO`, `NO_IMPLEMENTATION`, `PENDING_APPROVAL_FOR_LIVE_PERM_A1`.

## Documentos revisados

Documentos encontrados:

- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`
- `docs/LIVE_Z10B_PRICE_AUTHORIZATION_DESIGN.md`
- `docs/LIVE_AUTH_A_OPERATIONAL_AUTHORIZATION_DESIGN.md`
- `docs/LIVE_ROLE_A_CAPABILITIES_PERMISSIONS_AUDIT.md`
- `docs/PRODUCT_UX_B2_READABLE_DIRECT_PERMISSIONS.md`
- `docs/QA_TODO_HANDOFF.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Documentos solicitados que no existen con ese nombre exacto:

- `docs/LIVE_AUTH_A_OPERATION_AUTHORIZATIONS.md`
- `docs/LIVE_ROLE_A_OPERATIONAL_PERMISSIONS_AUDIT.md`

Equivalentes reales usados:

- `docs/LIVE_AUTH_A_OPERATIONAL_AUTHORIZATION_DESIGN.md`
- `docs/LIVE_ROLE_A_CAPABILITIES_PERMISSIONS_AUDIT.md`

## Estado actual real de permisos LIVE

Permisos reales actuales observados en backend/RBAC y frontend:

| Permiso | Estado real | Evidencia | Uso actual |
| --- | --- | --- | --- |
| `DO_LIVE_RESERVATION` | Existe | `PermissionCode.java`, migraciones `V12`, `V28`, `LiveService`, `ReservationService`, frontend `/live` | Opera LIVE y apartados LIVE con alcance demasiado amplio. |
| `CANCEL_RESERVATION` | Existe | `PermissionCode.java`, migraciones `V2`, `V12`, `V28`, `ReservationService`, `liveCapabilities.ts` | Cancela apartados; no distingue pago ni reversa formal. |
| `VIEW_PAYMENTS` | Existe actualmente | `PermissionCode.java`, migración `V44`, `PaymentService`, `app/live.tsx`, `reservation-detail.tsx` | Consulta pagos; algunos documentos antiguos todavía lo describen como pendiente. |
| `REGISTER_PAYMENTS` | Existe | `PermissionCode.java`, migraciones `V2`, `V12`, `V28`, `PaymentService` | Registra pagos. No debe mezclarse con consulta si `VIEW_PAYMENTS` basta. |
| `CANCEL_SALE` | Existe | `PermissionCode.java`, migraciones `V2`, `V12`, `V28`, `SaleService` | Cancela ventas. No cubre reversas operativas LIVE con pago. |
| `REQUEST_REFUND` | Existe | `PermissionCode.java`, migraciones `V12`, `V28`, `RefundService` | Solicita devolución/reembolso. |
| `APPROVE_REFUND` | Existe | `PermissionCode.java`, migraciones `V12`, `V28`, `RefundService` | Aprueba devolución/reembolso. |
| `PROCESS_REFUND` | Existe | `PermissionCode.java`, migraciones `V12`, `V28`, `RefundService` | Procesa devolución/reembolso. |
| `EXECUTE_REFUND` | Parcial/legado | migración `V2`, mapper frontend | Aparece como seed/alias histórico; no aparece como constante actual en `PermissionCode.java`. Requiere decisión antes de usarlo como permiso operativo. |

Hallazgo central: `DO_LIVE_RESERVATION` cubre demasiadas acciones distintas: ver/operar LIVE, crear apartado LIVE, iniciar/cerrar sesión LIVE, y acciones alrededor de prenda al aire según frontend/capacidades. Esto crea riesgo de permisos excesivos.

## Permisos futuros solo documentados o mapeados

Estos permisos no aparecen en backend, migraciones, seeds reales actuales ni pantallas de asignación como permisos propios. Aparecen como etiquetas visibles futuras en `services/permissionDependencies.ts` y como propuestas en documentación:

- `REQUEST_LIVE_PRICE_CHANGE`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`
- `CHANGE_LIVE_PRICE`
- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `PREPARE_LIVE_ITEM`
- `OPERATE_LIVE`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- `CLOSE_LIVE_OPERATIONAL_SALE`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `RELEASE_RESERVED_ITEM`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`
- `VIEW_PAYMENT_STATUS`

Conclusión: no es bug que no sean asignables. La UI de roles/usuarios consume el catálogo real del backend; el mapper solo evita códigos crudos si esos permisos llegan a existir más adelante.

## Separación propuesta por roles

### Operador LIVE

Debe poder operar la sesión LIVE y prendas, pero sin permiso automático para acciones financieras o reversas sensibles.

Permisos candidatos:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- `DO_LIVE_RESERVATION`
- `CLOSE_LIVE_OPERATIONAL_SALE`
- `VIEW_PAYMENT_STATUS` o `VIEW_PAYMENTS` según decisión.

### Supervisor

Debe supervisar, aprobar acciones sensibles y ver cola de autorizaciones dentro de su sucursal/tenant.

Permisos candidatos:

- `VIEW_LIVE`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`
- `APPROVE_LIVE_PRICE_CHANGE`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `RELEASE_RESERVED_ITEM`
- `UNDO_LIVE_OPERATIONAL_SALE`

### Admin

Puede administrar y aprobar si tiene permisos explícitos. No debería saltarse auditoría por rol visual solamente.

Permisos candidatos:

- Todos los permisos de supervisor cuando el negocio lo apruebe.
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`
- `CHANGE_LIVE_PRICE` solo si arquitectura aprueba cambio directo sin solicitud.

### Soporte

Debe tener visibilidad limitada y diagnóstico, no ejecución operativa sensible.

Permisos candidatos:

- `VIEW_LIVE`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS` en modo consulta si se aprueba.
- Sin permisos de aplicar/aprobar/cancelar/revertir salvo flujo formal.

## Decisión recomendada de MVP

### MVP de permisos mínimos para operar LIVE

Implementar primero:

1. `VIEW_LIVE`: permite ver estado LIVE sin operar.
2. `OPERATE_LIVE`: permite iniciar/cerrar sesión LIVE básica si negocio lo aprueba.
3. `PREPARE_LIVE_ITEM`: permite preparar prenda sin controlar la prenda al aire.
4. `CHANGE_LIVE_ACTIVE_ITEM`: permite poner/cambiar prenda al aire.
5. `REMOVE_LIVE_ACTIVE_ITEM`: permite retirar prenda del aire.

Motivo: separa vendedor/apoyo, operador y supervisor sin tocar pagos/caja.

### MVP de acciones sensibles

Implementar después de permisos base:

1. `CLOSE_LIVE_OPERATIONAL_SALE`
2. `UNDO_LIVE_OPERATIONAL_SALE`
3. `RELEASE_RESERVED_ITEM`
4. `CANCEL_RESERVATION_WITH_PAYMENT`
5. `REASSIGN_RESERVATION`
6. `EDIT_LOCKED_ITEM`

Motivo: estas acciones requieren reglas de estado, auditoría y, si hay pago, autorización formal.

### MVP de autorizaciones

Implementar cuando exista entidad/flujo de autorización:

1. `REQUEST_LIVE_OPERATION_AUTHORIZATION`
2. `APPROVE_LIVE_OPERATION_AUTHORIZATION`
3. `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
4. `APPLY_LIVE_OPERATION_AUTHORIZATION`

Motivo: no deben existir botones que simulen autorización real sin backend.

### MVP de precio LIVE

Implementar como fase específica posterior a LIVE-Z10B:

1. `REQUEST_LIVE_PRICE_CHANGE`
2. `APPROVE_LIVE_PRICE_CHANGE`
3. `VIEW_LIVE_PRICE_AUTHORIZATIONS`
4. `APPLY_APPROVED_LIVE_PRICE_CHANGE`
5. `CHANGE_LIVE_PRICE` solo si arquitectura aprueba cambio directo.

Motivo: cambio de precio tiene riesgo de pago/caja, estado de apartado y auditoría.

### Permisos de consulta

`VIEW_PAYMENTS` ya existe actualmente. Para LIVE puede bastar si el usuario necesita consultar pagos. `VIEW_PAYMENT_STATUS` debe decidirse solo si se requiere un permiso más acotado que permita ver estado de pago sin acceso amplio a pagos.

## Endpoints o servicios que requerirían enforcement

Servicios actuales a revisar en LIVE-PERM-A1:

- `LiveService`: hoy usa `DO_LIVE_RESERVATION` para operar LIVE. Requiere separación por `VIEW_LIVE`, `OPERATE_LIVE`, `CHANGE_LIVE_ACTIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`.
- `ReservationService`: hoy usa `DO_LIVE_RESERVATION` para apartados LIVE y `CANCEL_RESERVATION` para cancelación. Requiere distinguir apartado, cierre operativo, reversa y cancelación con pago.
- `PaymentService`: ya usa `VIEW_PAYMENTS`, `REGISTER_PAYMENTS` y `VOID_PAYMENT`. No tocar pagos/caja en el MVP LIVE salvo lectura de estado.
- `SaleService`: ya usa `CANCEL_SALE` y `VIEW_SALES`. No debe confundirse con cierre operativo LIVE si no registra pago/caja.
- Futuro servicio de autorizaciones operativas: requerido para `REQUEST/APPROVE/VIEW/APPLY_LIVE_OPERATION_AUTHORIZATION`.
- Futuro servicio de autorización de precio LIVE: requerido para `REQUEST/APPROVE/VIEW/APPLY_APPROVED_LIVE_PRICE_CHANGE`.

Endpoints futuros probables:

- `GET /api/lives/**`: `VIEW_LIVE`.
- `POST/PATCH /api/lives/**` de iniciar/cerrar: `OPERATE_LIVE`.
- endpoints de prenda al aire: `CHANGE_LIVE_ACTIVE_ITEM`, `REMOVE_LIVE_ACTIVE_ITEM`.
- `POST /api/reservations` canal LIVE: `DO_LIVE_RESERVATION`.
- cancelación/reversa con pago: autorización operativa + permiso específico.
- endpoints de precio: los definidos en `docs/LIVE_Z10B_PRICE_AUTHORIZATION_DESIGN.md`.

## Migraciones necesarias propuestas

No crear migraciones en esta fase. Para LIVE-PERM-A1/A2 se requeriría:

- Insertar permisos aprobados en catálogo `permissions`.
- Asignar permisos a roles QA/operativos con cuidado.
- Mantener `DO_LIVE_RESERVATION` durante transición para compatibilidad.
- Registrar dependencias o documentación de permisos si el backend maneja relaciones.
- Agregar pruebas de migración/seed para evitar permisos huérfanos.
- Revisar si `EXECUTE_REFUND` debe permanecer como legado, eliminarse o mapearse formalmente a `PROCESS_REFUND`.

## Cambios frontend necesarios propuestos

No implementados en esta fase.

- `services/liveCapabilities.ts`: reemplazar gaps genéricos por permisos reales aprobados.
- `/live`: habilitar acciones por capacidades efectivas, no por actor visual.
- Pantallas de roles/usuarios: no requieren hardcode; mostrarán permisos si backend los devuelve.
- `services/permissionDependencies.ts`: conservar etiquetas visibles para permisos futuros; agregar etiquetas adicionales solo si se aprueban nuevos códigos.
- Mensajes UX: bloqueo claro cuando falte permiso real o cuando la acción requiera autorización no implementada.

## Cambios QA necesarios propuestos

QA debe preparar casos separados por permiso, no solo por actor:

- Usuario con `VIEW_LIVE` ve LIVE sin operar.
- Usuario con `PREPARE_LIVE_ITEM` prepara prenda, pero no la pone al aire.
- Usuario con `CHANGE_LIVE_ACTIVE_ITEM` pone/cambia prenda al aire.
- Usuario con `REMOVE_LIVE_ACTIVE_ITEM` retira prenda al aire.
- Usuario con `DO_LIVE_RESERVATION` aparta en LIVE.
- Usuario sin `CANCEL_RESERVATION_WITH_PAYMENT` no cancela apartado con pago.
- Usuario con `VIEW_PAYMENTS` ve pago; usuario sin `VIEW_PAYMENTS` ve bloqueo/estado restringido.
- Solicitud/aprobación de precio solo cuando exista backend real.
- Confirmar aislamiento tenant/branch en cada endpoint protegido.

No marcar `QA_PASS` hasta ejecutar con usuarios y permisos reales creados por backend.

## Riesgos

- Romper RBAC existente si se reemplaza `DO_LIVE_RESERVATION` sin transición.
- Dar permisos excesivos si `OPERATE_LIVE` vuelve a concentrar todas las acciones.
- Bloquear operación LIVE si roles actuales pierden permisos antes de actualizar seeds/roles.
- Inconsistencia entre UI y backend si frontend oculta acciones pero backend sigue permitiéndolas.
- Inconsistencia inversa si backend bloquea acciones que UI muestra como disponibles.
- Riesgo de tenant/branch isolation si autorizaciones o aprobaciones no validan scope.
- Riesgo contable si reversas/cancelaciones con pago se permiten sin autorización formal.
- Riesgo de soporte si `EXECUTE_REFUND` y `PROCESS_REFUND` no se concilian.

## Recomendación GO/NO-GO para LIVE-PERM-A1

Recomendación: `GO_CONDICIONADO`.

LIVE-PERM-A1 puede iniciar solo si arquitectura aprueba:

1. Lista exacta de permisos MVP.
2. Si `VIEW_LIVE` se agrega junto a los permisos propuestos.
3. Transición de `DO_LIVE_RESERVATION` sin romper roles existentes.
4. Qué roles QA/operativos reciben permisos iniciales.
5. Si `VIEW_PAYMENT_STATUS` se crea o se usa `VIEW_PAYMENTS`.
6. Si `CHANGE_LIVE_PRICE` existirá o todo cambio de precio requiere autorización.
7. Tratamiento de `EXECUTE_REFUND` legado vs `PROCESS_REFUND` actual.

## Criterios de aprobación arquitectónica

Antes de implementar:

- Revisar matriz acción-permiso final.
- Aprobar migración de catálogo y asignaciones iniciales.
- Aprobar enforcement por endpoint/servicio.
- Definir transición y compatibilidad con `DO_LIVE_RESERVATION`.
- Definir política de supervisor/admin: aprobar por permiso, no solo por rol.
- Definir contratos de auditoría.
- Definir QA mínimo por rol, permiso, tenant y branch.
- Confirmar que pagos/caja no se tocan en LIVE-PERM-A1 salvo lectura protegida por permiso existente.

## Siguiente fase propuesta

`LIVE-PERM-A1 - Permisos base LIVE y transición segura`

Alcance sugerido:

- Crear permisos base aprobados.
- Mantener `DO_LIVE_RESERVATION` temporalmente.
- Agregar enforcement backend mínimo para ver/operar/preparar/cambiar/retirar prenda.
- Ajustar frontend solo para usar permisos reales devueltos por backend.
- Agregar QA técnico y manual.

No iniciar LIVE-PERM-A1 sin aprobación arquitectónica.
