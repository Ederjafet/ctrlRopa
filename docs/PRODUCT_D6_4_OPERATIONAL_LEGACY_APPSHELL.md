# PRODUCT-D6.4 - Migracion premium de pantallas operativas legacy a AppShell

Fecha: 2026-06-06

## Objetivo

Migrar pantallas operativas legacy a `AppShell` premium, especialmente `Venta puerta`, sin cambiar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, contratos API ni reglas LIVE.

## Rutas auditadas

| Ruta | Archivo | Estado previo | Menu | Permiso/canal esperado | Decision D6.4 |
| --- | --- | --- | --- | --- | --- |
| `/door-sale` | `app/door-sale.tsx` | `AppScreen` + `AppBackButton` | Operacion / Venta puerta | `DOOR_SALE` + `DO_DOOR_SALE` | Migrada a `AppShellPage` |
| `/door-reservation` | `app/door-reservation.tsx` | `AppScreen` + `AppBackButton` | Operacion / Apartado puerta | `DOOR_RESERVATION` + `DO_DOOR_RESERVATION` | Migrada a `AppShellPage` |
| `/items` | `app/items.tsx` | `AppScreen` + `AppBackButton` | Inventario / Prendas | `VIEW_INVENTORY` o `MANAGE_INVENTORY` | Migrada a `AppShellPage` |
| `/items-create` | `app/items-create.tsx` | `AppScreen` + `AppBackButton` | Inventario / Alta de prendas | `MANAGE_INVENTORY` | Migrada a `AppShellPage` |
| `/batches` | `app/batches.tsx` | `AppScreen` + `AppBackButton` | Inventario / Lotes | `VIEW_INVENTORY` o `MANAGE_INVENTORY` | Migrada a `AppShellPage` |
| `/inventory` | No encontrada | N/A | N/A | N/A | No existe ruta real |
| `/checkout` | No encontrada | N/A | N/A | N/A | No existe ruta real |
| `/sales` | No encontrada | N/A | N/A | N/A | No existe ruta real |
| `/pos` | No encontrada | N/A | N/A | N/A | No existe ruta real |
| `/cash-closures` | `app/cash-closures.tsx` | Legacy | No auditado para menu D6.4 | Caja | Documentada, no migrada por exclusion de caja |
| `/cash-closure-detail` | `app/cash-closure-detail.tsx` | Legacy | No auditado para menu D6.4 | Caja | Documentada, no migrada por exclusion de caja |

## Pantallas migradas

- `app/door-sale.tsx`
- `app/door-reservation.tsx`
- `app/items.tsx`
- `app/items-create.tsx`
- `app/batches.tsx`

## Cambios visuales aplicados

- Se reemplazo `AppScreen` por `AppShellPage`.
- Se retiro `AppBackButton` como navegacion superior legacy en rutas migradas.
- El titulo principal ahora vive en `TopBar` dentro de `AppShell`.
- El sidebar categorizado queda visible en desktop y el drawer en tablet/mobile.
- Se asignaron `activeRoute` especificos:
  - `door-sale`
  - `door-reservation`
  - `items`
  - `items-create`
  - `batches`
- Acciones principales como `Alta prenda`, `Volver` y `Nuevo lote` pasan al header cuando aplica.
- Se conservaron formularios, filtros, listas, modales, validaciones, `returnTo=/live`, llamadas a servicios y permisos existentes.

## i18n aplicado

Se agrego `operationalScreens.*` en `locales/es/common.json` y `locales/en/common.json` para:

- subtitulos de pantallas operativas;
- botones principales;
- filtros de inventario/lotes;
- labels de cliente, prenda, pago, anticipo y validaciones visibles;
- textos principales de `items-create`.

No se traducen codigos tecnicos, estados backend ni datos retornados por API.

## Pantallas no migradas

- `cash-closures` y `cash-closure-detail` quedan pendientes porque D6.4 excluye caja.
- Rutas no encontradas: `/inventory`, `/checkout`, `/sales`, `/pos`, `/cash`.

## Riesgos pendientes

- Algunas alertas historicas y textos secundarios de flujo operativo siguen hardcodeados; no se tocaron para evitar cambios funcionales fuera de la migracion visual.
- `batch-form`, `batch-detail` e `items/[id]` siguen como rutas hijas con patron legacy. Se recomienda evaluarlas en una fase posterior si QA las marca como parte del recorrido visual.
- Las rutas de caja siguen legacy por alcance y requieren una fase separada si se decide migrarlas.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/door-sale` y confirmar AppShell/sidebar/drawer.
3. Confirmar que no aparece `Menu principal` ni barra superior legacy.
4. Abrir `/door-reservation`.
5. Abrir `/items`.
6. Abrir `/items-create?returnTo=%2Flive`.
7. Abrir `/batches`.
8. Confirmar active state correcto en sidebar.
9. Confirmar que `returnTo=/live` se conserva en alta de prendas.
10. Confirmar light/dark y presets visuales.
11. Confirmar idioma Espanol/English en titulos, acciones principales y filtros.
12. Confirmar responsive desktop/tablet/mobile.

## GO/NO-GO

GO tecnico condicionado a validacion visual manual en navegador/AnyDesk.
