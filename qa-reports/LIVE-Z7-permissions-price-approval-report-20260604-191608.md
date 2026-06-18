# LIVE-Z7 - Permissions, price and approval report

## Rama y base

- Rama: `feature/live-z7-permissions-price-approval`
- Estado inicial: rama limpia.
- No se hizo commit.
- No se hizo merge.

## Alcance

LIVE-Z7 formaliza controles frontend conservadores para:

- capacidades LIVE derivadas de AUTH real;
- precio LIVE vs precio base;
- confirmacion de cambio de precio LIVE;
- solicitud de autorizacion sin backend real;
- cancelacion con motivo existente;
- gaps de liberacion segura de prenda y auditoria operacional.

## Archivos revisados

- `app/live.tsx`
- `services/liveCapabilities.ts`
- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `services/accessControl.ts`
- `services/liveService.ts`
- `services/reservationService.ts`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/security/access/PermissionCode.java`
- migraciones/permisos backend via busqueda `rg`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`

## Archivos creados

- `docs/LIVE_Z7_PERMISSIONS_PRICE_APPROVAL.md`
- `qa-reports/LIVE-Z7-permissions-price-approval-report-20260604-191608.md`
- `git-diffs/20260604-LIVE-Z7-permissions-price-approval.diff`
- `git-diffs/20260604-LIVE-Z7-permissions-price-approval-stat.txt`

## Archivos modificados

- `app/live.tsx`
- `services/liveCapabilities.ts`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`

## Auditoria /api/me

Backend local: `http://localhost:8090`

Usuarios auditados:

- `qa.admin@local.test`: rol `ADMIN`, canal LIVE activo, permisos operativos amplios, sin `VIEW_PAYMENTS` en /api/me.
- `qa.vendedor.centro@local.test`: rol `SELLER`, `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, sin cancelacion ni dashboard.
- `qa.supervisor.centro@local.test`: rol `SUPERVISOR`, `DO_LIVE_RESERVATION`, `CANCEL_RESERVATION`, `MANAGE_INVENTORY`, `VIEW_REPORTS`, sin `VIEW_PAYMENTS`.
- `qa.sinpermisos@local.test`: login rechazado con 403.

## Implementado

- `canChangeLivePrice` ya no depende solo de `DO_LIVE_RESERVATION`.
- Precio LIVE queda solo lectura cuando no hay capacidad.
- Se agrega boton `Solicitar autorizacion` para cambio de precio bloqueado.
- La solicitud permite seleccionar motivo, pero muestra mensaje de pendiente de implementacion.
- No se simula aprobacion real.
- Si el precio LIVE difiere del precio sugerido/base, se pide confirmacion antes de crear reserva.
- La confirmacion aclara que no modifica el precio base de la prenda.

## Documentado como gap

- Permisos granulares backend:
  - `START_LIVE`
  - `CLOSE_LIVE`
  - `SET_ACTIVE_LIVE_ITEM`
  - `CLEAR_LIVE_ACTIVE_ITEM`
  - `UPDATE_LIVE_PRICE`
  - `RELEASE_LIVE_RESERVED_ITEM`
  - `REQUEST_LIVE_AUTHORIZATION`
- Mensajeria interna de autorizaciones.
- Evento/bitacora granular de cambio de precio LIVE.
- Liberacion segura de prenda con endpoint backend.
- Auditoria operacional de intentos bloqueados.
- Nota libre para motivo `Otro` en cancelacion.

## Restricciones respetadas

- No se toco backend funcional.
- No se modifico AUTH/RBAC backend.
- No se tocaron pagos reales.
- No se tocaron caja, reportes financieros, billing ni IA.
- No se implemento WebSocket/SSE.
- No se metieron datos fake en pantallas reales.

## Validaciones

OK:

- `npm.cmd run lint` - OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit` - OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` - OK.
- `cd backend/control-ropa && ./mvnw.cmd test` - OK, 73 tests, 0 failures.
- `cd backend/control-ropa && ./mvnw.cmd -q -DskipTests package` - OK.

Git:

- `git status --short --untracked-files=all` - OK, cambios esperados y doc Z7 nuevo untracked.
- `git diff --stat` - OK, 5 archivos tracked, 156 inserciones, 5 eliminaciones.
- `git diff --name-only` - OK.
- `git diff --check` - OK; solo warnings LF -> CRLF esperados en Windows.

## GO/NO-GO

GO funcional para frontend Z7:

- control conservador de precio LIVE;
- solicitud de autorizacion como UX pendiente;
- documentacion clara de permisos/gaps.

NO-GO:

- liberar prenda sin endpoint seguro;
- simular autorizacion;
- crear permisos backend sin migracion formal;
- tocar pagos/caja/Auth/RBAC.

## Siguiente fase recomendada

LIVE-Z8:

- permisos granulares backend/RBAC;
- solicitud de autorizacion persistente;
- auditoria operacional de cambios de precio e intentos bloqueados;
- endpoint seguro para liberar prenda con validacion de pagos.
