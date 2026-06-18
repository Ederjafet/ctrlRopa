# LIVE-Z9F.1 - Paneles accionables contextuales para bloqueos LIVE

Fecha: 2026-06-06 20:39:17

## Objetivo

Unificar el patron visual de validaciones bloqueantes para que LIVE use panel contextual accionable y `items-create` conserve dialogo modal alineado al mismo sistema.

## Alcance

- Se reviso `components/ui/AppActionDialog.tsx`.
- Se extendio `AppActionDialog` con modos `modal`, `contextual` e `inline`.
- Se agrego `actionLayout` para preparar orden de acciones futuro.
- Se reemplazo el bottom modal de `No se puede agregar apartado` por un panel contextual dentro de `/live`.
- Se mantuvo `items-create` con dialogo modal y helpers inline.
- No se tocaron backend, endpoints, AUTH/RBAC, pagos, caja, billing, IA ni reglas LIVE profundas.

## Casos cubiertos

- Falta cliente/interesado para apartar.
- Falta prenda al aire.
- Prenda ya apartada.
- Precio faltante o invalido.
- Live/canal/permisos no disponibles.
- Campos faltantes en `items-create?returnTo=/live` mediante modal existente.

## Decision UX

- Operacion LIVE: panel contextual para no sacar al operador del flujo.
- Formularios generales: dialogo modal cuando se necesita listar campos faltantes.
- Helpers inline: se mantienen para corregir campo por campo.
- Confirmaciones operativas simples: se mantienen como aviso ligero con `AppActionDialog` en modo modal.

## Ergonomia futura

`actionLayout` soporta `default`, `primaryRight` y `primaryLeft`. En esta fase no existe preferencia de usuario ni persistencia; queda listo para una fase PRODUCT-UX-A.

## Validaciones tecnicas

Resultado:

- `npm.cmd run lint`: OK, 0 errores. Se mantienen 53 warnings heredados/estructurales fuera del alcance de LIVE-Z9F.1.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK, 73 rutas exportadas.
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors, 0 skipped.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK.

## Riesgos

- La validacion visual de panel contextual requiere prueba manual en desktop/tablet/mobile.
- `items-create` conserva modo modal por ser formulario; no se fuerza panel inline en esta fase.

## GO/NO-GO

GO tecnico para commit. GO visual pendiente de corrida manual en navegador con `/live`, `/items-create?returnTo=%2Flive`, light/dark y mobile/tablet.
