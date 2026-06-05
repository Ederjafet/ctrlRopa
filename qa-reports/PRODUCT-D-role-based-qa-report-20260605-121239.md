# PRODUCT-D - QA operativo por roles

Fecha: 2026-06-05 12:12:39
Rama: feature/product-d-role-based-qa

## Objetivo

Formalizar la validacion operativa por usuario/rol para rutas, permisos, vistas LIVE, tema claro/oscuro, presets visuales, editor controlado y responsive.

## Alcance

Incluye:

- documentacion de matriz QA por rol;
- checklist operativo manual;
- handoff para corrida visual/manual real;
- validaciones tecnicas frontend/backend;
- evidencia documental y CSV smoke.

No incluye:

- cambios backend;
- cambios AUTH/RBAC;
- pagos/caja/reportes backend;
- billing;
- IA;
- reglas LIVE nuevas;
- datos fake;
- merge a develop.

## Usuarios QA cubiertos

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

## Rutas cubiertas

- `/`
- `/live`
- `/ui-kit`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`
- `/appearance`
- `/reservation-detail?id=<id valido>`

## Matriz resumida

| Usuario | Resultado esperado |
| --- | --- |
| Admin | Acceso completo a rutas principales, LIVE operador, UI Kit, presets/editor local |
| Vendedor | Solo rutas permitidas, LIVE apoyo/presentador si tiene capacidad, sin administracion |
| Supervisor | LIVE supervisor/monitoreo, no fallback vendedor, acciones solo por capacidad |
| Sin permisos | Acceso restringido, sin navegacion util ni operacion LIVE |

## Checklist creado

`docs/PRODUCT_D_QA_CHECKLIST.md` cubre:

- login/logout;
- navegacion;
- visual;
- LIVE;
- pantallas principales;
- responsive;
- evidencia minima.

## Hallazgos

No se detectaron errores funcionales nuevos porque esta fase solo agrega documentacion y evidencia. La corrida visual/manual real queda propuesta para PRODUCT-D2.

## Riesgos

- La matriz depende de permisos reales devueltos por `/api/me`; si cambian roles/permissions QA, debe actualizarse.
- El CSV smoke queda preparado como plan, no como evidencia visual ejecutada.
- Presets visuales y editor local requieren QA manual en browser para validar contraste real.

## Validaciones tecnicas

- `git branch --show-current`: OK, `feature/product-d-role-based-qa`.
- `git status`: OK inicial limpio.
- `git log --oneline -12`: OK.
- `git --no-pager diff --stat`: OK.
- `git --no-pager diff --name-only`: OK.
- `git --no-pager diff --check`: OK inicial.
- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `cd backend/control-ropa; .\\mvnw.cmd test`: OK, 73 tests.
- `cd backend/control-ropa; .\\mvnw.cmd -q -DskipTests package`: OK.

## GO / NO-GO

GO documental. Validaciones tecnicas ejecutadas correctamente; queda pendiente la corrida visual/manual con capturas para PRODUCT-D2.

## Siguiente fase recomendada

PRODUCT-D2: corrida visual/manual real con capturas por rol, tema, preset, dispositivo y hallazgos priorizados.
