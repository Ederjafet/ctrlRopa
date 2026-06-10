# HOME-LIVE-A - QA report active live card

Fecha: 2026-06-10 10:57:13

## Rama

`feature/home-live-a-active-live-card`

## Comandos ejecutados

- `git branch --show-current`
- `git status`
- `git log --oneline -100`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-C"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-B"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-QA-A"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z8"`
- `git --no-pager log --oneline --all --decorate --grep="ITEM-Z7"`
- `git --no-pager log --oneline --all --decorate --grep="LIVE-PERM-A1"`
- Auditorias `git grep` solicitadas para home/dashboard, servicios LIVE y permisos LIVE.
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint`
- Validacion JSON de `locales/**/common.json`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- `git --no-pager diff --check`
- `git --no-pager diff --cached --check`
- `git status --short`

## Historial confirmado

- `612d82e LIVE-QA-C ejecuta QA live con dataset desechable`
- `db8bbee LIVE-QA-B ejecuta smoke real live por rol`
- `33ba0c3 LIVE-QA-A prepara matriz smoke live por rol`
- `90ab2eb ITEM-Z8 valida consistencia live inventario reservas`
- `a5541e4 ITEM-Z7 endurece vendido operativo live`
- `5f5cf4d LIVE-PERM-A1 agrega permisos minimos live`

## Implementacion

Se agrego card superior read-only en `app/index.tsx` usando:

- `canViewLive(session)` para visibilidad.
- `getLivesByBranch(branchId)` para LIVE activo.
- `getReservationsByBranch(branchId)` para conteos disponibles.
- `getLiveEvents(liveId)` para ultima actividad disponible.

No se toco backend ni se ejecutaron mutaciones reales.

## Permisos / capabilities usados

- `canViewLive(session)`.
- Capacidades existentes derivadas de `VIEW_LIVE`, `OPERATE_LIVE`, `DO_LIVE_RESERVATION` y reglas actuales del proyecto.

## Checklist visual

| Caso | Resultado |
| --- | --- |
| Admin ve card si hay LIVE activo | PENDING_QA_VISUAL |
| Supervisor ve card si tiene permisos | PENDING_QA_VISUAL |
| Vendedor ve card si tiene permisos | PENDING_QA_VISUAL |
| Usuario sin permisos no ve card | PENDING_QA_VISUAL |
| Boton navega a LIVE | PENDING_QA_VISUAL |
| Contenido anterior del home sigue visible debajo | PENDING_QA_VISUAL |

No se capturaron screenshots reales durante este reporte. Se intento detectar herramienta de navegador local y no hubo capacidad de browser/screenshot disponible en esta sesion.

## Validaciones tecnicas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS, sin errores; 53 warnings preexistentes/no relacionados. |
| JSON locales | PASS, todos los `common.json` parsean. |
| `npx.cmd tsc --noEmit` | PASS. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS. |
| `git --no-pager diff --check` | PASS. |
| `git --no-pager diff --cached --check` | PASS sin staged changes al momento de la validacion. |
| Backend tests | No ejecutado; backend no fue tocado. |

## Resultado

`GO_TECNICO / PENDING_QA_VISUAL`

Validaciones tecnicas completas pasan. QA visual queda pendiente por falta de navegador/screenshot real disponible.
