# LIVE-Z9D - Reporte de correcciones de prenda preparada

## Objetivo

Corregir el flujo frontend de prenda preparada para que `Cambiar por prenda preparada` y `Quitar prenda preparada` sean acciones claras, directas y sin efectos colaterales.

## Cambios implementados

- `Cambiar por prenda preparada` ya no abre el selector cuando existe una prenda preparada visible.
- El cambio usa directamente la prenda preparada actual y la pone al aire mediante el flujo existente.
- Despues del cambio exitoso se limpia la prenda preparada.
- El precio principal queda sincronizado con la nueva prenda al aire al actualizar `activeItem`.
- Se agrego `Quitar prenda preparada`, que limpia solo la seleccion preparada local.
- Si se selecciona la misma prenda que ya esta al aire, se muestra aviso `Prenda ya al aire` y no se modifica estado.
- Se agregaron locales ES/EN para acciones y avisos.

## Alcance

- Frontend, locales, documentacion y evidencia.
- Sin cambios backend, AUTH/RBAC, pagos, caja, reportes, billing, IA, endpoints ni contratos API.

## Validaciones tecnicas

Ejecutadas el 2026-06-05:

- OK - `npm.cmd run lint` (sin errores; 60 warnings preexistentes).
- OK - `npx.cmd tsc --noEmit`.
- OK - `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` (73 rutas exportadas).
- OK - `cd backend/control-ropa; ./mvnw.cmd test` (73 tests, 0 fallas, 0 errores).
- OK - `cd backend/control-ropa; ./mvnw.cmd -q -DskipTests package`.
- Pendiente de cierre - `git diff --check`.

Warnings observados:

- Lint conserva 60 warnings ya existentes, no introducidos por esta fase.
- Maven test muestra warnings de entorno conocidos: MySQL 5.7 fuera de soporte comunitario, Mockito dynamic agent y password generado por Spring Security en contexto de test.

## Riesgos

- La validacion manual debe confirmar que el endpoint existente de prenda al aire actualiza precio y eventos como antes.
- La accion `Quitar prenda preparada` es local; no persiste estado porque no existe contrato backend para una preparacion separada.

## GO/NO-GO

GO tecnico condicionado a `git diff --check` final.
