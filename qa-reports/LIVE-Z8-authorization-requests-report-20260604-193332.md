# LIVE-Z8 - Authorization requests report

## Rama

- `feature/live-z8-authorization-requests`
- Estado inicial: limpio.
- No commit.
- No merge.

## Alcance

Crear una base UI controlada para solicitudes de autorizacion operativa en LIVE, sin simular aprobaciones ni saltarse RBAC.

## Archivos revisados

- `app/live.tsx`
- `services/liveCapabilities.ts`
- `services/liveActorResolver.ts`
- `services/livePermissionGuards.ts`
- `services/apiClient.ts`
- `services/apiError.ts`
- `components/live/LiveCommerceCards.tsx`
- `components/ui/*`
- `context/AppThemeContext.tsx`
- `theme/designTokens.ts`
- backend LIVE events y seguridad/auditoria
- docs LIVE-Z6/Z7 y matriz de actores

## Archivos creados

- `components/live/AuthorizationRequestPanel.tsx`
- `docs/LIVE_Z8_AUTHORIZATION_REQUESTS.md`
- `qa-reports/LIVE-Z8-authorization-requests-report-20260604-193332.md`
- `git-diffs/20260604-LIVE-Z8-authorization-requests.diff`
- `git-diffs/20260604-LIVE-Z8-authorization-requests-stat.txt`

## Archivos modificados

- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`
- `docs/LIVE_Z7_PERMISSIONS_PRICE_APPROVAL.md`

## Implementado

- Componente reutilizable `AuthorizationRequestPanel`.
- Panel de solicitud para precio LIVE bloqueado.
- Panel de solicitud para cancelar apartado sin capacidad.
- Panel de solicitud para finalizar live sin capacidad.
- Modal de motivos con accion solicitada visible.
- Mensaje honesto de backend pendiente.
- Seccion Supervisor/Admin `Solicitudes pendientes`.
- EmptyState real sin datos fake ni aprobacion simulada.

## Queda pendiente backend

- Persistir solicitudes.
- Inbox supervisor real.
- Aprobar/rechazar solicitudes.
- Auditoria operacional de solicitudes.
- Permisos granulares `REQUEST_LIVE_AUTHORIZATION` y `APPROVE_LIVE_AUTHORIZATION`.
- Eventos `LIVE_AUTHORIZATION_REQUESTED`, `LIVE_AUTHORIZATION_APPROVED`, `LIVE_AUTHORIZATION_REJECTED`.

## Restricciones respetadas

- No se toco backend funcional.
- No se modifico AUTH/RBAC.
- No se tocaron pagos/caja/reportes/billing/IA.
- No se implemento WebSocket/SSE.
- No se simularon autorizaciones reales.

## Validaciones

OK:

- `npm.cmd run lint` - OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit` - OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` - OK.
- `cd backend/control-ropa && ./mvnw.cmd test` - OK, 73 tests, 0 failures.
- `cd backend/control-ropa && ./mvnw.cmd -q -DskipTests package` - OK.

Git:

- `git status --short --untracked-files=all` - OK, cambios esperados.
- `git diff --stat` - OK, 5 archivos tracked, 160 inserciones, 25 eliminaciones.
- `git diff --name-only` - OK.
- `git diff --check` - OK; solo warnings LF -> CRLF esperados en Windows.

## GO/NO-GO

GO funcional para UI base:

- solicitudes visibles y contextuales;
- sin datos fake;
- sin aprobacion simulada;
- sin ejecutar acciones bloqueadas.

NO-GO:

- autorizacion real;
- persistencia;
- aprobar/rechazar;
- liberacion automatica.

## Siguiente fase recomendada

LIVE-Z9:

- backend de solicitudes;
- permisos granulares;
- inbox supervisor real;
- auditoria operacional.
