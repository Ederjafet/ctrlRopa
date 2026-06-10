# LIVE-QA-D / QA visual home + LIVE base

Fecha: 2026-06-10
Rama: feature/live-qa-d-visual-home-live

## Alcance

Validacion unificada del card HOME-LIVE-A en inicio, navegacion esperada a LIVE y smoke API real por rol para confirmar que el flujo base LIVE sigue protegido despues de LIVE-QA-C2.

Esta fase no implemento features nuevas ni fixes funcionales. No se tocaron backend, frontend funcional, RBAC, permisos, endpoints, migraciones, pagos, caja, precio LIVE, devoluciones ni autorizaciones.

## Historial confirmado

- `619b482 Merge branch 'feature/home-live-a-active-live-card' into develop`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Ambiente

- Backend: `http://localhost:8090`
- Frontend local: `http://localhost:8081`
- Frontend LAN: `http://192.168.0.128:8081`

Resultados de ambiente:

- `GET /api/health`: 200
- `GET /api/me` sin token: 401
- `GET http://localhost:8081`: 200
- `GET http://192.168.0.128:8081`: 200

## Auditoria del card HOME-LIVE-A

Se reviso `app/index.tsx` y componentes relacionados:

- El home renderiza `DashboardTemplate`.
- El card de LIVE activo se inyecta como `summary` superior, antes de metricas, pendientes, seguimiento y accesos rapidos.
- La visibilidad del card usa `canViewLive(session)`.
- El boton del card ejecuta navegacion a `/live`.
- Si no hay LIVE activo, el card no se muestra y el contenido anterior del home continua debajo.
- Si la carga secundaria de reservas/eventos falla, el card conserva resumen seguro y marca datos parciales.

Datos que puede mostrar el card cuando hay LIVE activo:

- estado LIVE activo;
- identificador o notas del LIVE;
- prenda al aire, si existe;
- reservas activas, si el endpoint de reservas responde;
- vendidos operativos, si el endpoint de reservas responde;
- ultima actividad, si hay evento o fecha del LIVE.

## Roles probados por API

Credenciales y tokens se usaron solo en variables temporales y no se imprimen.

| Rol QA | Login | `/api/me` | Resultado LIVE |
| --- | --- | --- | --- |
| `qa.admin@local.test` | 200 | 200 | `VIEW_LIVE=true`, `OPERATE_LIVE=true`, `REMOVE_LIVE_ACTIVE_ITEM=true` |
| `qa.supervisor.centro@local.test` | 200 | 200 | `VIEW_LIVE=true`, `OPERATE_LIVE=true`, `REMOVE_LIVE_ACTIVE_ITEM=true` |
| `qa.vendedor.centro@local.test` | 200 | 200 | `VIEW_LIVE=true`, `OPERATE_LIVE=true`, `REMOVE_LIVE_ACTIVE_ITEM=false` |
| `qa.sinpermisos@local.test` | 403 | 401 sin token valido | Sin permisos LIVE efectivos |

## Dataset

Se reutilizo solo como referencia el dataset desechable de LIVE-QA-C:

- Prefijo: `QA_LIVE_DISPOSABLE_20260610104008`
- LIVE activo observado: `15`
- Sucursal: `4`
- Prenda al aire observada durante LIVE-QA-D: sin item activo

No se ejecutaron mutaciones destructivas. El intento focalizado de seller para retirar active item con `itemId=null` fue usado como smoke negativo seguro y respondio 403. Como el LIVE ya no tenia prenda al aire despues de C2, el card debe poder mostrar LIVE activo sin prenda al aire.

## Smoke API realizado

Operaciones principales:

- Login QA admin, supervisor, vendedor y sin permisos.
- `/api/me` por rol para confirmar permisos LIVE.
- `GET /api/lives/branch/4` con admin para ubicar LIVE activo.
- `PATCH /api/lives/15/active-item` con seller y `{ "itemId": null }`.

Resultado focal:

- Seller sin `REMOVE_LIVE_ACTIVE_ITEM`: 403 esperado.
- No se reprodujo el bug de LIVE-QA-C.
- No se probo retiro positivo por admin en esta fase para evitar mutaciones innecesarias; ya fue validado en LIVE-QA-C2.

## Smoke visual

No se obtuvo navegador/screenshot real en esta sesion:

- La herramienta Browser del plugin requiere Node REPL, pero no estuvo expuesta.
- No hay `playwright`, `@playwright/test` ni `playwright-core` instalados.
- No se detecto navegador CLI local con `Get-Command`.

Resultado visual: `PENDING_QA_VISUAL`.

Checklist visual pendiente:

- Admin ve card LIVE arriba si hay LIVE activo.
- Supervisor ve card LIVE arriba si hay LIVE activo.
- Vendedor ve card LIVE arriba si hay LIVE activo.
- Usuario sin permisos no ve card LIVE ni acceso operativo.
- Boton `Ir a LIVE` navega a `/live`.
- Contenido anterior del home sigue visible debajo.
- Seller no ve accion de retirar prenda si no tiene permiso.

## Fixes aplicados

No se aplicaron fixes. La auditoria y el smoke API no evidenciaron inconsistencia critica que habilite una correccion menor segura en esta fase.

## Resultado

- API: `GO_TECNICO_API`
- Visual: `PENDING_QA_VISUAL`
- GO/NO-GO: `GO_TECNICO_API`

## Pendientes

- Ejecutar QA visual real con navegador/screenshot por rol.
- Repetir inspeccion visual cuando el LIVE tenga prenda al aire si se requiere evidencia del detalle del card.
