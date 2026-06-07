# PRODUCT-D6.4 - Operational Legacy AppShell Report

Fecha/hora: 2026-06-06 18:25:17

## Objetivo

Migrar pantallas operativas legacy a `AppShell` premium, con foco en `Venta puerta`, sin tocar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, contratos API ni reglas LIVE.

## Alcance ejecutado

Pantallas migradas:

- `/door-sale` (`app/door-sale.tsx`)
- `/door-reservation` (`app/door-reservation.tsx`)
- `/items` (`app/items.tsx`)
- `/items-create` (`app/items-create.tsx`)
- `/batches` (`app/batches.tsx`)

Pantallas auditadas y no migradas:

- `/cash-closures` y `/cash-closure-detail`: existen, siguen legacy, no se migran porque caja queda explicitamente fuera de alcance.

Rutas no encontradas:

- `/inventory`
- `/checkout`
- `/sales`
- `/pos`
- `/cash`

## Cambios aplicados

- Reemplazo de `AppScreen` por `AppShellPage` en rutas prioritarias.
- Eliminacion de `AppBackButton` como navegacion superior legacy en esas rutas.
- `activeRoute` corregido para:
  - `door-sale`
  - `door-reservation`
  - `items`
  - `items-create`
  - `batches`
- Acciones principales movidas al TopBar cuando aplica:
  - alta de prenda en inventario;
  - volver contextual en alta de prendas;
  - nuevo lote en lotes.
- Textos principales conectados a i18n en `operationalScreens.*`.
- Bordes de tarjetas de prendas en venta/apartado pasan a token `borderSubtle`.
- Colores de estado de inventario pasan a tokens semanticos (`success`, `danger`, `accent`, `textMuted`).

## No se cambio

- Logica de venta puerta.
- Logica de apartado puerta.
- Validacion de alta rapida de prendas agregada en LIVE-Z9E.
- `returnTo=/live`.
- Permisos/canales.
- Llamadas a servicios.
- Endpoints.
- Persistencia.
- Caja.

## Validaciones tecnicas

- `git branch --show-current`: OK, `feature/product-d6-4-operational-legacy-appshell`
- `git status`: OK inicial limpio
- `git --no-pager diff --check`: OK inicial y OK final sin errores
- `npm.cmd run lint`: OK, 0 errores, 51 warnings heredados/estructurales
- `npx.cmd tsc --noEmit`: OK
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK
- `./mvnw.cmd test`: OK, 73 tests, 0 failures, 0 errors
- `./mvnw.cmd -q -DskipTests package`: OK

Warnings relevantes:

- Lint mantiene warnings existentes de hooks, BOM y tipos en rutas no intervenidas.
- En rutas intervenidas quedan warnings de dependencias de hooks ya existentes; no se modificaron para evitar cambios funcionales.
- Maven registra warnings conocidos de MySQL 5.7 y Mockito/dynamic agent, sin afectar el resultado.

## Riesgos y pendientes

- Textos secundarios/alertas historicas pueden seguir hardcodeados en algunas rutas operativas; D6.4 prioriza shell, active state e i18n principal sin alterar flujo.
- Rutas hijas `batch-form`, `batch-detail` e `items/[id]` siguen fuera del alcance de esta fase.
- Rutas de caja siguen legacy por exclusion explicita.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/door-sale`.
3. Confirmar AppShell/sidebar/drawer.
4. Confirmar que no aparece `Menu principal` legacy.
5. Confirmar active state `Venta puerta`.
6. Abrir `/door-reservation` y confirmar `Apartado puerta`.
7. Abrir `/items` y confirmar `Prendas / Inventario`.
8. Abrir `/items-create?returnTo=%2Flive` y confirmar retorno contextual.
9. Abrir `/batches` y confirmar `Lotes`.
10. Validar Espanol/English, light/dark, presets y responsive desktop/tablet/mobile.

## GO/NO-GO

GO tecnico. GO visual queda sujeto a validacion manual en navegador/AnyDesk.
