# PRODUCT-UX-B2 - Reporte permisos directos legibles

## Datos

- Fecha: 2026-06-09 00:02:38 America/Mexico_City.
- Rama: `feature/product-ux-b2-hide-visible-internal-codes`.
- Alcance: presentacion legible de permisos directos adicionales y ocultamiento de codigo interno por defecto.

## Permisos que se veian en ingles

- `APPROVE_REFUND`
- `CANCEL_CONSIGNMENTS`
- `CANCEL_REFUND`
- `CANCEL_TRANSFERS`
- `MANAGE_BRANDING`
- `MANAGE_CUSTOMER_PACKAGES`
- `PROCESS_REFUND`
- `RECEIVE_TRANSFERS`
- `REQUEST_REFUND`
- `SEND_TRANSFERS`
- `SETTLE_CONSIGNMENTS`
- `VIEW_DEPOSIT_REPORTS`

## Cambios realizados

- El mapper visible de permisos ahora acepta idioma activo.
- En espanol, `Permisos directos adicionales` usa etiquetas en espanol y no mezcla ingles devuelto por backend.
- En ingles, la lista usa etiquetas principales en ingles.
- `Codigo interno` queda oculto por defecto en roles y permisos directos.
- Se agrego el toggle `Ver detalles tecnicos` / `Ocultar detalles tecnicos`.
- Se agregaron claves i18n del toggle a ES/EN/PT-BR/FR/JA/ZH/KO.
- Se actualizo QA handoff y matriz PRODUCT-D4 REAL con el caso de validacion.

## Restricciones respetadas

- No se modifico backend.
- No se modifico RBAC.
- No se crearon permisos reales.
- No se cambiaron asignaciones de roles/permisos.
- No se habilitaron capacidades frontend nuevas.

## Validaciones ejecutadas

- JSON parse de `locales/es/en/pt-BR/fr/ja/zh/ko/common.json`: PASS.
- `npm.cmd run lint`: PASS con warnings preexistentes, 0 errores.
- `npx.cmd tsc --noEmit`: PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: PASS.
- `git --no-pager diff --check`: PASS.

## GO/NO-GO

GO tecnico para la presentacion legible de permisos.

NO-GO para cambios backend/RBAC/permisos reales en esta fase.
