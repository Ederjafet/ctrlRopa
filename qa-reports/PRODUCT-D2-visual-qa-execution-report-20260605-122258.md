# PRODUCT-D2 - Corrida visual/manual QA por roles

Fecha: 2026-06-05 12:22:58
Rama: feature/product-d2-visual-qa-execution

## Objetivo

Preparar la corrida visual/manual real por usuario, rol, ruta, tema, preset y dispositivo. Esta fase estructura evidencia y validaciones tecnicas, pero no marca resultados visuales como PASS sin ejecucion manual en navegador/AnyDesk.

## Alcance

Incluido:

- handoff de ejecucion visual;
- CSV smoke con casos `PENDIENTE_MANUAL`;
- reporte de corrida;
- validaciones tecnicas frontend/backend;
- evidencia git-diff/stat.

No incluido:

- cambios funcionales;
- cambios backend;
- cambios AUTH/RBAC;
- pagos/caja/reportes backend;
- billing;
- IA;
- reglas LIVE nuevas;
- resultados visuales inventados.

## Usuarios QA

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

## Rutas

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

## Smoke minimo

| Caso | Usuario | Dimension | Resultado esperado |
| --- | --- | --- | --- |
| Inicio admin | Admin | desktop + claro + retailPremium | AppShell completo sin duplicidad |
| LIVE operador dark | Admin | desktop + oscuro + darkConsole | Consola LIVE legible |
| UI Kit presets/editor | Admin | desktop + claro/oscuro | Selector y editor solo admin |
| LIVE vendedor | Vendedor | tablet/mobile + claro | Vista apoyo, sin acciones admin |
| LIVE supervisor | Supervisor | desktop + oscuro | Dashboard supervisor, no vendedor |
| NO_ACCESS | Sin permisos | desktop/mobile | Acceso restringido |
| Prenda reservada | Admin | LIVE | Rojo premium, no ambar dominante |
| Reservation detail | Admin | id real | DetailTemplate y restricciones correctas |

## Matriz extendida

La matriz extendida queda en:

```text
qa-reports/PRODUCT-D2-visual-qa-execution-smoke-20260605-122258.csv
```

Todos los casos quedan inicialmente en `PENDIENTE_MANUAL`.

## Instrucciones de ejecucion manual

1. Levantar backend y frontend segun `docs/PRODUCT_D2_VISUAL_QA_EXECUTION_HANDOFF.md`.
2. Ejecutar casos en orden por usuario.
3. Registrar resultado real.
4. Adjuntar evidencia por caso.
5. Marcar estado: `PASS`, `FAIL`, `BLOQUEADO`, `NO_APLICA`.
6. Si falla, asignar severidad `S1` a `S4`.

## Captura de evidencia

Nombre sugerido:

```text
PRODUCT-D2_<ID>_<usuario>_<ruta>_<tema>_<dispositivo>.png
```

No guardar contrasenas en capturas o notas.

## Criterios PASS / FAIL

PASS:

- resultado coincide con esperado;
- evidencia adjunta;
- no hay errores visibles ni permisos indebidos.

FAIL:

- ruta visible sin permiso;
- vista LIVE incorrecta;
- editor UI Kit visible para no admin;
- texto critico invisible;
- overflow que bloquea uso;
- detalle confunde 403/404;
- pagos consultados sin permiso.

BLOQUEADO:

- backend no disponible;
- dato real requerido no existe;
- usuario QA no disponible;
- ambiente no permite reproducir.

## Riesgos

- El CSV requiere ejecucion real en browser/AnyDesk para cerrar GO visual.
- `reservation-detail` requiere un id valido de reserva.
- La vista de vendedor/supervisor depende de permisos reales en `/api/me`.
- Presets extremos y overrides locales requieren validacion visual humana.

## Hallazgos pendientes

No hay hallazgos visuales confirmados en esta fase. Pendientes de corrida manual:

- screenshots por usuario/ruta;
- resultado PASS/FAIL por caso;
- evidencias de responsive;
- validacion de prenda reservada rojo premium con reserva real.

## Validaciones tecnicas

- `git branch --show-current`: OK, `feature/product-d2-visual-qa-execution`.
- `git status`: OK inicial limpio.
- `git log --oneline -12`: OK.
- `git --no-pager diff --stat`: OK inicial vacio.
- `git --no-pager diff --name-only`: OK inicial vacio.
- `git --no-pager diff --check`: OK inicial.
- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `cd backend/control-ropa; .\\mvnw.cmd test`: OK, 73 tests.
- `cd backend/control-ropa; .\\mvnw.cmd -q -DskipTests package`: OK.

## GO / NO-GO

GO tecnico. Validaciones automatizadas ejecutadas correctamente.

GO visual pendiente: requiere ejecutar manualmente el CSV y adjuntar evidencias.

## Siguiente fase

Si la corrida visual pasa: mergear a develop segun flujo del equipo.

Si falla: abrir PRODUCT-D3 para correcciones puntuales priorizadas por severidad.
