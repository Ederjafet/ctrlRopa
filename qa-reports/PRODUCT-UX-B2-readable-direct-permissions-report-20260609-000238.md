# PRODUCT-UX-B2 - Reporte permisos directos legibles

## Datos

- Fecha: 2026-06-09 00:02:38 America/Mexico_City.
- Rama: `feature/product-ux-b2-hide-visible-internal-codes`.
- Alcance: presentación legible de permisos directos adicionales y ocultamiento de código interno por defecto.

## Permisos que se veían en inglés

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
- En español, `Permisos directos adicionales` usa etiquetas en español y no mezcla inglés devuelto por backend.
- En inglés, la lista usa etiquetas principales en inglés.
- `Código interno` queda oculto por defecto en roles y permisos directos.
- Se agregó el toggle `Ver detalles técnicos` / `Ocultar detalles técnicos`.
- Se agregaron claves i18n del toggle a ES/EN/PT-BR/FR/JA/ZH/KO.
- Se actualizó QA handoff y matriz PRODUCT-D4 REAL con el caso de validación.

## Restricciones respetadas

- No se modificó backend.
- No se modificó RBAC.
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

GO técnico para la presentación legible de permisos.

NO-GO para cambios backend/RBAC/permisos reales en esta fase.
