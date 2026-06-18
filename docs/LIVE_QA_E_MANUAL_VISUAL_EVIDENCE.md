# LIVE-QA-E / Evidencia visual manual asistida HOME + LIVE

Fecha: 2026-06-10
Rama: feature/live-qa-e-manual-visual-evidence

## Alcance

Preparar y documentar la ejecucion manual de QA visual para:

- card de LIVE activo en home agregado por HOME-LIVE-A;
- navegacion desde home hacia `/live`;
- comportamiento visual base de LIVE por rol;
- confirmacion visual de que seller no puede retirar prenda al aire sin `REMOVE_LIVE_ACTIVE_ITEM`;
- confirmacion de que usuario sin permisos no ve acceso operativo LIVE.

Esta fase no implementa funcionalidad nueva. No se modifican backend, frontend funcional, RBAC, permisos, endpoints, migraciones, pagos, caja, precio LIVE, devoluciones, autorizaciones ni venta financiera.

## Historial confirmado

- `5a2771f LIVE-QA-D valida home live por rol`
- `dfe373e HOME-LIVE-A muestra live activo en inicio`
- `00101a4 LIVE-QA-C2 valida permiso retirar prenda live`
- `020a265 LIVE-PERM-FIX-A1 exige permiso retirar prenda live`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`

## Auditoria tecnica de referencia

La auditoria sin editores confirma:

- `app/index.tsx` usa `DashboardTemplate`.
- El card HOME-LIVE-A se renderiza en `summary`, antes de metricas, pendientes, seguimiento y accesos rapidos.
- La visibilidad del card usa `canViewLive(session)`.
- El boton `Ir a LIVE` navega a `/live`.
- `components/templates/DashboardTemplate.tsx` renderiza `summary` antes del resto de secciones.
- `app/live.tsx` usa `liveCapabilities.canClearActiveItem`.
- `services/liveCapabilities.ts` calcula `canClearActiveItem` con `REMOVE_LIVE_ACTIVE_ITEM`.
- `LiveService.assertCanRemoveLiveActiveItem(...)` exige `PermissionCode.REMOVE_LIVE_ACTIVE_ITEM`.

## Usuarios

Usuarios QA esperados:

- `qa.admin@local.test`
- `qa.supervisor.centro@local.test`
- `qa.vendedor.centro@local.test`
- `qa.sinpermisos@local.test`

No documentar passwords, tokens ni capturas que muestren secretos.

## Evidencia esperada

Guardar screenshots o evidencia manual verificable bajo:

`qa-reports/manual-evidence/`

Nombres sugeridos:

- `LIVE-QA-E-admin-home.png`
- `LIVE-QA-E-admin-live.png`
- `LIVE-QA-E-supervisor-home.png`
- `LIVE-QA-E-supervisor-live.png`
- `LIVE-QA-E-seller-home.png`
- `LIVE-QA-E-seller-live.png`
- `LIVE-QA-E-seller-no-remove-action.png`
- `LIVE-QA-E-no-access-home-or-login-block.png`
- `LIVE-QA-E-no-access-live-direct.png`

## Evidencia recibida

No se recibieron screenshots, rutas capturadas ni descripcion visual verificable en esta fase.

Resultado de evidencia: `PENDING_QA_VISUAL`.

## Checklist visual por rol

### Admin

Pasos:

1. Login como `qa.admin@local.test`.
2. Abrir home en `http://localhost:8081`.
3. Confirmar que el card de LIVE activo aparece arriba si hay LIVE activo.
4. Confirmar boton `Ir a LIVE`.
5. Pulsar `Ir a LIVE` y confirmar navegacion a `/live`.
6. Confirmar que el contenido anterior del home sigue debajo del card.
7. En `/live`, confirmar que puede retirar prenda del aire si hay active item.

Evidencia requerida:

- screenshot home;
- screenshot LIVE;
- screenshot o descripcion verificable de accion de retiro si hay active item.

Resultado actual: `PENDING_QA_VISUAL`.

### Supervisor

Pasos:

1. Login como `qa.supervisor.centro@local.test`.
2. Abrir home.
3. Confirmar card LIVE activo si hay LIVE activo.
4. Confirmar boton `Ir a LIVE`.
5. Confirmar navegacion a `/live`.
6. Confirmar acciones permitidas segun rol y ausencia de acciones fuera de permiso.

Evidencia requerida:

- screenshot home;
- screenshot LIVE.

Resultado actual: `PENDING_QA_VISUAL`.

### Vendedor

Pasos:

1. Login como `qa.vendedor.centro@local.test`.
2. Abrir home.
3. Confirmar card LIVE activo si hay LIVE activo.
4. Confirmar boton `Ir a LIVE`.
5. Confirmar navegacion a `/live`.
6. Confirmar que no puede retirar prenda al aire.
7. Si la accion no aparece, registrar PASS visual.
8. Si aparece pero esta bloqueada/deshabilitada, registrar evidencia y microcopy.
9. Si aparece habilitada, registrar `NO_GO` visual.

Evidencia requerida:

- screenshot home;
- screenshot LIVE;
- screenshot de la ausencia, bloqueo o estado deshabilitado de la accion de retiro.

Resultado actual: `PENDING_QA_VISUAL`.

### Sin permisos

Pasos:

1. Login con `qa.sinpermisos@local.test` o documentar bloqueo 403.
2. Confirmar que no ve card LIVE en home.
3. Confirmar que no ve acceso operativo a LIVE.
4. Intentar acceso directo a `/live`.
5. Confirmar bloqueo visual o ausencia total de acciones operativas.

Evidencia requerida:

- screenshot home o evidencia de login bloqueado;
- screenshot de `/live` directo o evidencia de bloqueo.

Resultado actual: `PENDING_QA_VISUAL`.

## Checklist HOME-LIVE-A

- Card arriba del contenido anterior del home: pendiente de screenshot.
- Contenido previo del home visible debajo: pendiente de screenshot.
- Si hay LIVE activo, card muestra resumen real: pendiente de screenshot.
- Si no hay prenda al aire, el card no rompe UI: pendiente de screenshot.
- Boton `Ir a LIVE` navega a `/live`: pendiente de screenshot o ruta visible.

## No alcance visual

Durante la ejecucion manual no se deben validar ni forzar:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- RBAC/permisos;
- migraciones;
- endpoints nuevos;
- venta financiera.

Si aparecen visualmente como implementados o accionables en este flujo base sin alcance aprobado, registrar hallazgo y no corregir en esta fase.

## Resultado por rol

| Rol | Estado actual | Motivo |
| --- | --- | --- |
| Admin | `PENDING_QA_VISUAL` | Falta screenshot home + LIVE |
| Supervisor | `PENDING_QA_VISUAL` | Falta screenshot home + LIVE |
| Vendedor | `PENDING_QA_VISUAL` | Falta screenshot de home, LIVE y retiro bloqueado/ausente |
| Sin permisos | `PENDING_QA_VISUAL` | Falta screenshot o evidencia visual/API manual de bloqueo |

## GO/NO-GO

- Resultado documental: `GO_TECNICO_DOCUMENTAL`
- Resultado visual: `PENDING_QA_VISUAL`
- No se marca `QA_VISUAL_PASS` porque no hay evidencia visual real suficiente.

## Pendientes

- Ejecutar QA visual manual por rol con screenshots.
- Adjuntar evidencia bajo `qa-reports/manual-evidence/`.
- Repetir esta fase o actualizar reporte con evidencia real para poder marcar `QA_VISUAL_PASS`.
