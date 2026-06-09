# LIVE-PERM-A0 - Reporte de handoff arquitectónico

## Datos

- Fecha: 2026-06-09 00:45:10 America/Mexico_City.
- Rama: `feature/live-perm-a0-architectural-handoff`.
- Tipo de fase: auditoría/documentación/handoff.
- Resultado esperado: `HANDOFF_ARQUITECTONICO_COMPLETO`, `NO_IMPLEMENTATION`, `PENDING_APPROVAL_FOR_LIVE_PERM_A1`.

## Comandos iniciales ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -15`
- `git --no-pager log --oneline --all --decorate --grep="PRODUCT-UX-B2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-Z10B"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-AUTH-A"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-ROLE-A"`

Resultados:

- Rama actual: `feature/live-perm-a0-architectural-handoff`.
- Estado inicial: working tree limpio.
- Commits relacionados encontrados:
  - `069ff23 PRODUCT-UX-B2 valida cierre tecnico`
  - `5093ec7 PRODUCT-UX-B2 traduce permisos directos`
  - `72235e8 LIVE-Z10B diseña autorizacion de precio live`
  - `ca1ed47 LIVE-AUTH-A diseña autorizaciones operativas live`
  - `4758cc5 LIVE-ROLE-A audita permisos operativos live`

## Auditoría git grep

Se ejecutaron los comandos obligatorios con `git grep -n` y los patrones indicados. En esta shell, los patrones con `|` no se interpretaron como alternancia y no devolvieron coincidencias.

Para obtener auditoría real sin modificar archivos, se repitió con `git grep -n -E` usando los mismos términos.

### Permisos actuales

Términos auditados:

- `DO_LIVE_RESERVATION`
- `CANCEL_RESERVATION`
- `VIEW_PAYMENTS`
- `REGISTER_PAYMENTS`
- `CANCEL_SALE`
- `EXECUTE_REFUND`
- `REQUEST_REFUND`
- `APPROVE_REFUND`
- `PROCESS_REFUND`

Hallazgos:

- `DO_LIVE_RESERVATION` existe en `PermissionCode.java`, migraciones `V12`/`V28`, `LiveService`, `ReservationService`, menú y frontend LIVE.
- `CANCEL_RESERVATION` existe en `PermissionCode.java`, migraciones y `ReservationService`.
- `VIEW_PAYMENTS` existe actualmente en `PermissionCode.java`, migración `V44`, `PaymentService`, `/live` y `reservation-detail`.
- `REGISTER_PAYMENTS` existe en `PermissionCode.java`, migraciones y `PaymentService`.
- `CANCEL_SALE` existe en `PermissionCode.java`, migraciones y `SaleService`.
- `REQUEST_REFUND`, `APPROVE_REFUND` y `PROCESS_REFUND` existen en `PermissionCode.java`, migraciones y `RefundService`.
- `EXECUTE_REFUND` aparece como seed/alias histórico y en mapper visible, pero no como constante actual en `PermissionCode.java`.

### Permisos futuros/propuestos LIVE

Términos auditados:

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

Hallazgos:

- No aparecen en backend.
- No aparecen en migraciones/seeds reales como permisos creados.
- No aparecen en `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`.
- No aparecen en `app/users-form.tsx` ni `app/system-roles.tsx`.
- Aparecen en `services/permissionDependencies.ts` como etiquetas visibles ES/EN.
- Aparecen en documentación y evidencia de fases de diseño: LIVE-Z10B, LIVE-AUTH-A, LIVE-ROLE-A y PRODUCT-UX-B1/B2.

Conclusión: son futuros/propuestos, no asignables todavía.

## Archivos revisados

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/reservation/ReservationService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/payment/PaymentService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/sale/SaleService.java`
- `services/liveCapabilities.ts`
- `services/permissionDependencies.ts`
- `app/live.tsx`
- `app/users-form.tsx`
- `app/system-roles.tsx`
- `docs/AUTH_F_RBAC_PERMISSION_MATRIX.md`
- `docs/LIVE_Z10B_PRICE_AUTHORIZATION_DESIGN.md`
- `docs/LIVE_AUTH_A_OPERATIONAL_AUTHORIZATION_DESIGN.md`
- `docs/LIVE_ROLE_A_CAPABILITIES_PERMISSIONS_AUDIT.md`
- `docs/PRODUCT_UX_B2_READABLE_DIRECT_PERMISSIONS.md`
- `docs/QA_TODO_HANDOFF.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`

Documentos solicitados no existentes con nombre exacto:

- `docs/LIVE_AUTH_A_OPERATION_AUTHORIZATIONS.md`
- `docs/LIVE_ROLE_A_OPERATIONAL_PERMISSIONS_AUDIT.md`

## Confirmación de no implementación

No se implementó código funcional.
No se tocó backend.
No se tocó RBAC.
No se crearon permisos reales.
No se crearon endpoints.
No se crearon migraciones.
No se modificaron seeds.
No se modificaron pantallas de asignación.
No se inventó QA_PASS.

## Entregable creado

- `docs/LIVE_PERM_A0_ARCHITECTURAL_HANDOFF.md`

## Estado final esperado

- Handoff arquitectónico completo.
- Siguiente fase propuesta: `LIVE-PERM-A1 - Permisos base LIVE y transición segura`.
- Estado de implementación: `PENDING_APPROVAL_FOR_LIVE_PERM_A1`.
