# LIVE-Z9E - Reporte de validacion de alta rapida de prendas

## Objetivo

Mejorar la validacion visual de `/items-create?returnTo=/live` para que el usuario vea claramente que campos obligatorios faltan antes de generar prendas.

## Cambios implementados

- Se agrego validacion frontend previa que acumula errores por campo.
- Se muestra resumen visible `No se pudo generar la prenda`.
- Se marcan campos con error usando borde danger y helper debajo.
- Se agrego soporte opcional de `error` a `AppInput` y `AppSelectorField`.
- Se mantiene la validacion anterior como respaldo.
- Se conserva `returnTo=/live` y el flujo actual de `pendingQuickItems`.
- Se agrego ayuda contextual cuando la pantalla viene desde LIVE.

## Campos validados

- Tipo de prenda.
- Talla.
- Precio cuando `returnTo` exige flujo rapido.
- Cantidad.

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

- Lint conserva 60 warnings ya existentes; el warning de `items-create.tsx` sobre dependencia de hook ya existia en la pantalla.
- Maven test muestra warnings de entorno conocidos: MySQL 5.7 fuera de soporte comunitario, Mockito dynamic agent y password generado por Spring Security en contexto de test.

## Riesgos

- No se ejecuto validacion manual en navegador en esta fase.
- El scroll/foco automatico al primer campo con error queda pendiente; la pantalla ya muestra resumen y error persistente por campo.

## GO/NO-GO

GO tecnico condicionado a `git diff --check` final.
