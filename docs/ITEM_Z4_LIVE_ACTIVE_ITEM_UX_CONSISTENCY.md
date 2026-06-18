# ITEM-Z4 - Consistencia visual de prenda al aire en selector LIVE

Fecha: 2026-06-09
Rama: `feature/item-z4-live-active-item-ux-consistency`
Tipo: mejora frontend/UI, sin cambios de inventario real.

## Resumen ejecutivo

ITEM-Z4 corrige una confusion visual en `/live`: cuando una prenda ya esta al aire y el operador abre `Seleccionar prenda`, esa misma prenda podia verse solamente como `Libre` dentro de `Disponibles`.

Tecnicamente el item sigue `AVAILABLE`, porque `lives.active_item_id` no bloquea inventario ni cambia `items.status`. Operativamente, sin embargo, el selector debe explicar que esa prenda ya esta en el LIVE.

## Decision aplicada

- La prenda al aire sigue apareciendo en `Disponibles` si su `items.status` es `AVAILABLE`.
- El selector agrega un panel visible `Actualmente al aire`.
- El panel aclara que la prenda sigue disponible para apartado, pero no debe elegirse como reemplazo de si misma.
- La fila queda deshabilitada para evitar preparar/cambiar por la misma prenda actualmente al aire.

## Lo que no cambio

- No se cambio `items.status`.
- No se creo estado nuevo de inventario.
- No se tocaron backend, migraciones ni endpoints.
- No se tocaron permisos ni RBAC.
- No se tocaron pagos, caja, precio LIVE, devoluciones ni autorizaciones.

## Archivos principales

- `app/live.tsx`
- `components/ui/AppOptionRow.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `locales/pt-BR/common.json`
- `locales/fr/common.json`
- `locales/ja/common.json`
- `locales/zh/common.json`
- `locales/ko/common.json`

## QA visual esperado

1. Abrir `/live`.
2. Poner una prenda al aire.
3. Abrir `Buscar prenda` / `Seleccionar prenda`.
4. Confirmar que la prenda al aire aparece en `Disponibles` si sigue `AVAILABLE`.
5. Confirmar que no se ve solo como `Libre`.
6. Confirmar que muestra `Actualmente al aire`.
7. Confirmar que el texto aclara que sigue disponible para apartado.
8. Confirmar que no se puede seleccionarla como prenda preparada/reemplazo de si misma.
9. Confirmar que ninguna accion cambia `items.status` solo por estar al aire.

## Riesgos pendientes

- Falta QA visual con navegador/capturas reales.
- La separacion entre disponibilidad tecnica y estado operativo LIVE debe seguir explicandose en futuras pantallas.
- ITEM-Z5 debe continuar con auditoria/idempotencia y trazabilidad de reservas si se aprueba.

## GO/NO-GO

- `GO_TECNICO` si lint, TypeScript, export web y checks Git pasan.
- `PENDING_QA_VISUAL` hasta tener evidencia visual real.
