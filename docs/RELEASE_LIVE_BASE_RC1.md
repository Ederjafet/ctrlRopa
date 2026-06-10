# RELEASE LIVE BASE RC1

Fecha: 2026-06-10
Rama: feature/live-base-rc1-release-candidate

## 1. Resumen ejecutivo

La base LIVE queda consolidada como release candidate tecnico `RC1` para merge manual posterior.

Estado:

- Release candidate tecnico: `GO_TECNICO_RC`
- Evidencia visual: `PENDING_QA_VISUAL`
- QA_PASS: no aplica; no se marca sin screenshots/evidencia visual real.

Quedo listo:

- permisos LIVE minimos y capacidades frontend;
- separacion de permiso para retirar prenda al aire;
- control de prenda al aire;
- reserva atomica y segura sobre inventario;
- idempotencia de reservas con `X-Idempotency-Key`;
- constraint de reserva activa por item;
- trazabilidad de rechazos de reserva;
- cancelacion/liberacion segura;
- vendido operativo LIVE sin venta financiera;
- card de LIVE activo en home;
- smoke API por roles con seller bloqueado para retirar prenda.

No quedo listo:

- QA visual completo con screenshots por rol;
- pagos/caja/precio LIVE/devoluciones;
- autorizaciones operativas reales;
- venta financiera desde LIVE;
- limpieza automatica del dataset QA desechable.

## 2. Alcance incluido

### Permisos LIVE minimos

Incluye:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`
- compatibilidad de `DO_LIVE_RESERVATION` para apartados LIVE.

Evidencia:

- `LIVE-PERM-A1`
- `LIVE-PERM-A2`
- `LIVE-PERM-A3`
- `LIVE-PERM-FIX-A1`
- `LIVE-QA-C2`

### Control de prenda al aire

Incluye:

- solo item elegible/disponible puede ponerse al aire;
- selector distingue la prenda `Actualmente al aire`;
- retirar prenda al aire exige `REMOVE_LIVE_ACTIVE_ITEM` en backend.

Evidencia:

- `ITEM-Z2`
- `ITEM-Z4`
- `LIVE-PERM-FIX-A1`
- `LIVE-QA-C2`

### Reserva atomica

Incluye:

- `ItemRepository.reserveIfAvailable(...)`;
- transicion atomica `AVAILABLE -> RESERVED`;
- rechazo si el item ya no esta disponible.

Evidencia:

- `ITEM-Z3B`
- `ITEM-Z8`

### Idempotencia

Incluye:

- soporte de `X-Idempotency-Key` en creacion de reservas;
- reintentos exactos protegidos;
- hashes seguros para trazabilidad.

Evidencia:

- `ITEM-Z5B`
- `ITEM-Z5D`

### Constraint de reserva activa

Incluye:

- columna generada `active_reservation_item_id`;
- indice unico `uq_reservations_active_item`;
- una sola reserva `ACTIVE` por item/sucursal.

Evidencia:

- `ITEM-Z5C`
- migracion `V53__active_reservation_item_constraint.sql`

### Trazabilidad de rechazo

Incluye:

- tabla `reservation_rejection_events`;
- registro tecnico de rechazos por disponibilidad, idempotencia y validacion;
- sin exponer payload completo ni secretos.

Evidencia:

- `ITEM-Z5D`
- migracion `V54__reservation_rejection_events.sql`

### Cancelacion segura

Incluye:

- `ItemRepository.releaseIfReserved(...)`;
- liberacion condicional `RESERVED -> AVAILABLE`;
- cancelacion bloqueada si no corresponde liberar con seguridad.

Evidencia:

- `ITEM-Z6B`
- `ITEM-Z8`

### Vendido operativo seguro

Incluye:

- `OPERATIONAL_SOLD` como cierre operativo LIVE;
- evento `LIVE_OPERATIONAL_SOLD`;
- no crea venta financiera;
- no crea pago;
- no toca caja.

Evidencia:

- `ITEM-Z7`
- `ITEM-Z8`
- `LIVE-QA-C`

### Card LIVE en home

Incluye:

- card superior de LIVE activo en `app/index.tsx`;
- visibilidad por `canViewLive(session)`;
- boton `Ir a LIVE`;
- contenido previo del home permanece debajo.

Evidencia:

- `HOME-LIVE-A`
- `LIVE-QA-D`
- `LIVE-QA-E`

### Smoke API por roles

Incluye:

- admin/supervisor con `REMOVE_LIVE_ACTIVE_ITEM`;
- vendedor con LIVE operativo pero sin `REMOVE_LIVE_ACTIVE_ITEM`;
- seller recibe 403 al intentar retirar active item por API;
- usuario sin permisos bloqueado.

Evidencia:

- `LIVE-QA-A`
- `LIVE-QA-B`
- `LIVE-QA-C`
- `LIVE-QA-C2`
- `LIVE-QA-D`

## 3. Alcance excluido

No se incluye en RC1:

- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones operativas reales;
- autorizaciones de precio;
- venta financiera;
- dashboards financieros;
- QA visual completo si no hay screenshots/evidencia real;
- limpieza automatica de dataset QA desechable.

## 4. Matriz de permisos LIVE

| Rol | Ver LIVE | Operar LIVE | Preparar prenda | Cambiar prenda al aire | Retirar prenda al aire | Apartar en LIVE | Estado RC1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin | Si | Si | Si | Si | Si, con `REMOVE_LIVE_ACTIVE_ITEM` | Si | GO tecnico/API |
| Supervisor | Si | Si | Si | Si | Si, con `REMOVE_LIVE_ACTIVE_ITEM` | Si | GO tecnico/API |
| Vendedor | Si | Si, flujo acotado | Si, segun permisos actuales | Si, segun permisos actuales | No | Si, con `DO_LIVE_RESERVATION` | GO tecnico/API: retiro bloqueado |
| Sin permisos | No | No | No | No | No | No | Bloqueado |

Nota: la confirmacion visual por rol sigue `PENDING_QA_VISUAL`.

## 5. Flujo LIVE base validado

| Flujo | Estado | Evidencia |
| --- | --- | --- |
| Ver LIVE | GO tecnico/API | LIVE-QA-A/B/D |
| Preparar prenda | GO tecnico/API/documental | LIVE-QA-A/B, HOME/LIVE docs |
| Poner/cambiar prenda al aire | GO tecnico/API | ITEM-Z2, ITEM-Z4, LIVE-QA-C |
| Retirar prenda por permiso | GO tecnico/API | LIVE-PERM-FIX-A1, LIVE-QA-C2 |
| Reservar con idempotencia | GO tecnico/API | ITEM-Z5B, LIVE-QA-C |
| Cancelar reserva segura | GO tecnico/API | ITEM-Z6B, LIVE-QA-C, ITEM-Z8 |
| Vendido operativo sin venta financiera | GO tecnico/API | ITEM-Z7, LIVE-QA-C, ITEM-Z8 |
| Home card LIVE | GO tecnico/documental/API indirecta | HOME-LIVE-A, LIVE-QA-D/E |

## 6. Riesgos conocidos

| Riesgo | Severidad | Estado | Mitigacion |
| --- | --- | --- | --- |
| Falta QA visual real | Media | `PENDING_QA_VISUAL` | Ejecutar QA manual con screenshots por rol antes de QA_PASS |
| Dataset QA desechable no limpiado automaticamente | Baja/Media | Conocido | No borrar sin plan; limpiar con DBA/QA owner |
| No hay pagos/caja en LIVE base | Alta si se confunde alcance | Excluido | Mantener microcopy y docs: operativo no financiero |
| No hay autorizaciones operativas reales | Media | Excluido | Fase futura separada |
| No hay precio LIVE real | Media | Excluido | Fase futura separada |
| Screenshots pendientes | Media | Pendiente | LIVE-QA-E define nombres/rutas esperadas |
| Rollback de migraciones con datos | Alta | Requiere plan | No revertir V52/V53/V54 sin DBA |

## 7. Rollback

Rollback recomendado si RC1 se mergea y aparece incidencia critica:

1. Identificar commit de merge de `feature/live-base-rc1-release-candidate` en `develop`.
2. Crear rama de hotfix/rollback desde `develop`.
3. Usar `git revert -m 1 <merge_commit>` para revertir el merge completo si aplica.
4. Ejecutar suite backend/frontend completa.
5. Revisar migraciones ya aplicadas antes de desplegar rollback a ambientes con datos.

Migraciones relevantes:

- `V50__live_minimal_permissions.sql`
- `V51__live_permission_view_dependency_backfill.sql`
- `V52__reservation_idempotency_keys.sql`
- `V53__active_reservation_item_constraint.sql`
- `V54__reservation_rejection_events.sql`

Riesgos de rollback:

- `V52` puede contener llaves de idempotencia ya usadas.
- `V53` agrega constraint/columna generada; retirarlo sin revisar reservas activas puede permitir duplicidad de reserva por item.
- `V54` puede contener trazabilidad util de rechazos; no borrar sin retencion/export.

Regla: no borrar datos QA o productivos sin plan explicito, respaldo y dueño de datos.

## 8. Checklist QA final

### API

- Confirmar `/api/me` por rol.
- Confirmar permisos LIVE por rol.
- Confirmar seller sin `REMOVE_LIVE_ACTIVE_ITEM` recibe 403 al retirar active item.
- Confirmar admin/supervisor puede retirar si hay active item.
- Confirmar reserva con `X-Idempotency-Key`.
- Confirmar doble reserva rechazada.
- Confirmar cancelacion libera item si corresponde.
- Confirmar `OPERATIONAL_SOLD` no crea venta/pago/caja.

### Visual

- Admin: home card + `/live` + acciones permitidas.
- Supervisor: home card + `/live` + acciones permitidas.
- Vendedor: home card + `/live` + retiro ausente/bloqueado.
- Sin permisos: sin card, sin acceso operativo, `/live` bloqueado.
- Confirmar contenido anterior del home debajo del card.
- Confirmar estado sin prenda al aire no rompe UI.

### Dataset

- Usar dataset desechable identificado.
- No borrar dataset sin aprobacion.
- No mutar datos reales.
- Registrar IDs usados en reporte.

### Evidencia requerida

- Screenshots home/LIVE por rol.
- Resultado API por rol.
- Registro de dataset.
- Logs o reportes de validacion tecnica.

## 9. Recomendacion

Recomendacion actual:

- `GO_TECNICO_RC` para release candidate tecnico.
- `PENDING_QA_VISUAL` para evidencia visual real.
- No marcar `QA_PASS`.

No se detecta hallazgo critico vigente que obligue a `NO_GO_RELEASE_CANDIDATE`.

La siguiente fase recomendada es QA visual real con screenshots por rol, o merge manual del RC1 si el criterio del equipo permite avanzar con GO tecnico y visual pendiente declarado.
