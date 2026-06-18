# LIVE-PERM-A1B - Dependencias minimas de permisos LIVE

Fecha: 2026-06-09

Rama: `feature/live-perm-a1-minimal-live-permissions`

Commit base revisado: `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`

## Resumen ejecutivo

LIVE-PERM-A1B corrige una inconsistencia visible en la pantalla de permisos: un rol podia mostrar `DO_LIVE_RESERVATION` / "Apartar en LIVE" como incluido mientras `VIEW_LIVE` / "Ver LIVE" aparecia como agregable.

La decision aplicada es que cualquier rol que pueda apartar en LIVE debe tener como minimo capacidad de ver LIVE. Tambien se alinea el mapper visible para que los permisos LIVE minimos dependan directamente de `VIEW_LIVE`.

## Problema confirmado

QA observo una combinacion operativamente incoherente:

- `DO_LIVE_RESERVATION` / Apartar en LIVE: incluido.
- `VIEW_LIVE` / Ver LIVE: agregable.
- permisos LIVE minimos como operar, preparar, cambiar o retirar prenda tambien aparecian independientes de la capacidad de ver LIVE.

Esto podia hacer que el administrador asignara permisos LIVE sin entender la base minima de acceso al modulo.

## Decision aplicada

Se definieron estas dependencias minimas:

| Permiso | Dependencia minima |
| --- | --- |
| `DO_LIVE_RESERVATION` | `VIEW_LIVE` |
| `OPERATE_LIVE` | `VIEW_LIVE` |
| `PREPARE_LIVE_ITEM` | `VIEW_LIVE` |
| `CHANGE_LIVE_ACTIVE_ITEM` | `VIEW_LIVE` |
| `REMOVE_LIVE_ACTIVE_ITEM` | `VIEW_LIVE` |

`DO_LIVE_RESERVATION` se conserva como permiso legacy/funcional para apartados LIVE. No reemplaza `VIEW_LIVE`.

## Cambios realizados

### Frontend / mapper visible

`services/permissionDependencies.ts` ahora declara:

- `DO_LIVE_RESERVATION -> VIEW_LIVE`;
- `OPERATE_LIVE -> VIEW_LIVE`;
- `PREPARE_LIVE_ITEM -> VIEW_LIVE`;
- `CHANGE_LIVE_ACTIVE_ITEM -> VIEW_LIVE`;
- `REMOVE_LIVE_ACTIVE_ITEM -> VIEW_LIVE`.

Las pantallas de roles siguen usando el mapper central. No se hardcodearon permisos en pantallas.

### Migracion RBAC

Se agrega `backend/control-ropa/src/main/resources/db/migration/V51__live_permission_view_dependency_backfill.sql`.

La migracion es idempotente y solo hace backfill:

- todo rol que ya tenga `DO_LIVE_RESERVATION` recibe `VIEW_LIVE`;
- no crea permisos nuevos;
- no modifica `DO_LIVE_RESERVATION`;
- no asigna permisos sensibles;
- no asigna `REMOVE_LIVE_ACTIVE_ITEM` a `SELLER`.

No se edito `V50__live_minimal_permissions.sql` porque puede estar aplicada en ambientes existentes.

## Backend / enforcement

No se cambiaron endpoints ni reglas funcionales.

`LiveService` conserva la compatibilidad legacy existente con `DO_LIVE_RESERVATION` mientras los roles migran a los permisos finos. La navegacion/operacion de LIVE sigue usando las capacidades ya definidas en A1.

## Fuera de alcance

No se toco:

- precio LIVE;
- pagos;
- caja;
- devoluciones;
- autorizaciones complejas;
- endpoints;
- migraciones ajenas;
- permisos no aprobados;
- reglas de negocio sensibles.

## QA esperado

QA debe validar visualmente en la pantalla de permisos:

1. Si "Apartar en LIVE" esta incluido, "Ver LIVE" tambien debe quedar incluido o sugerido como dependencia obligatoria.
2. "Operar LIVE", "Preparar prenda para LIVE", "Cambiar prenda al aire" y "Retirar prenda del aire" muestran `VIEW_LIVE` como dependencia minima.
3. No aparecen permisos nuevos fuera de A1.
4. `DO_LIVE_RESERVATION` sigue disponible para apartados LIVE.
5. Precio, pagos, caja, devoluciones y autorizaciones no tienen cambios nuevos.

Sin evidencia visual real posterior, el estado queda `PENDING_QA_VISUAL`.

## Resultado

Resultado tecnico esperado: `GO_TECNICO` si pasan Maven, lint, TypeScript, export web y checks de Git.

Resultado QA: `PENDING_QA_VISUAL` hasta confirmar la pantalla de permisos en ambiente real.
