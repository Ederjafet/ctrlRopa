# ITEM-Z4 - Live active item UX consistency report

Fecha: 2026-06-09 13:54:04
Rama: `feature/item-z4-live-active-item-ux-consistency`
Resultado: `GO_TECNICO` / `PENDING_QA_VISUAL`

## Objetivo

Corregir la confusion visual donde una prenda actualmente al aire seguia apareciendo en el selector LIVE solamente como `Libre`.

## Historial previo validado

Comandos ejecutados:

- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z1"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z2"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z3B"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A2"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A3"`

Commits confirmados:

- `6aa2eda ITEM-Z1 documenta handoff inventario live`
- `80a8aa1 ITEM-Z2 valida elegibilidad de prenda live`
- `5748040 ITEM-Z3A documenta handoff atomicidad reservas`
- `92e937a ITEM-Z3B protege reserva atomica`
- `5f5cf4d LIVE-PERM-A1 agrega permisos live minimos`
- `4975138 LIVE-PERM-A1B corrige dependencias de permisos live`
- `6c757c9 LIVE-PERM-A1 documenta cierre final`
- `5c7aced LIVE-PERM-A2 ajusta capacidades live por rol`
- `c818cb1 LIVE-PERM-A3 documenta smoke visual por rol`

## Archivos tocados

- `app/live.tsx`
- `components/ui/AppOptionRow.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `locales/pt-BR/common.json`
- `locales/fr/common.json`
- `locales/ja/common.json`
- `locales/zh/common.json`
- `locales/ko/common.json`
- `docs/ITEM_Z4_LIVE_ACTIVE_ITEM_UX_CONSISTENCY.md`
- `docs/ERP_RIESGOS_OPERATIVOS.md`
- `docs/ERP_TENANT_IMPLEMENTATION_BACKLOG.md`
- `docs/ERP_BITACORA_CAMBIOS.md`

## Implementacion

- El selector de prendas LIVE detecta si `item.id === activeItem.id`.
- La fila de esa prenda muestra un panel `Actualmente al aire`.
- El panel aclara que la prenda sigue disponible para apartado, pero debe elegirse otra para preparar cambio.
- La fila queda deshabilitada para evitar preparar la misma prenda como reemplazo de si misma.
- `AppOptionRow` agrega soporte opcional `disabled`.
- Se agrego microcopy i18n en ES/EN/PT-BR/FR/JA/ZH/KO.

## Confirmacion de alcance

No se tocaron:

- backend;
- inventario real;
- `items.status`;
- migraciones;
- endpoints;
- permisos;
- RBAC;
- pagos;
- caja;
- precio LIVE;
- devoluciones;
- autorizaciones;
- venta financiera.

## Validaciones ejecutadas

- PASS: JSON parse de locales ES/EN/PT-BR/FR/JA/ZH/KO.
- PASS: `npm.cmd run lint`
  - 0 errores.
  - 53 warnings historicos fuera de alcance.
- PASS: `npx.cmd tsc --noEmit`
- PASS: `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

Maven no se ejecuto porque no se tocaron backend ni migraciones.

## Checklist visual pendiente

1. Abrir `/live`.
2. Tener una prenda al aire.
3. Abrir `Seleccionar prenda`.
4. Confirmar que la prenda al aire no aparece solo como `Libre`.
5. Confirmar badge/panel `Actualmente al aire`.
6. Confirmar texto de ayuda sobre apartado y cambio.
7. Confirmar que la fila no permite seleccionarse como reemplazo de si misma.
8. Confirmar que `items.status` no cambia solo por estar al aire.

## GO/NO-GO

- `GO_TECNICO`: validaciones frontend pasan.
- `PENDING_QA_VISUAL`: falta evidencia real en navegador/capturas.
- `NO_GO`: no aplica en esta corrida.
