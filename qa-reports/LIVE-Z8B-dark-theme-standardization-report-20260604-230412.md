# LIVE-Z8B / PRODUCT-B4 - Dark theme premium + visual standardization

Fecha: 2026-06-04 23:04 CST

Rama: `feature/live-z8-authorization-requests`

## Alcance

- Se fortalecio dark mode para pantallas AppShell/UI Kit.
- Se corrigio contraste de textos secundarios, helper texts, inputs y estados disabled.
- Se reviso `/live`, con foco en `3. PRECIO`.
- Se alinearon componentes base con tokens semanticos.
- Se actualizo `/ui-kit` como catalogo visual de tokens semanticos y comparativo claro/oscuro.

## Archivos modificados en esta fase

- `theme/designTokens.ts`
- `context/AppThemeContext.tsx`
- `components/layout/AppShell.tsx`
- `components/live/LiveCommerceCards.tsx`
- `components/ui/AppButton.tsx`
- `components/ui/AppCard.tsx`
- `components/ui/AppInput.tsx`
- `components/ui/AppNoticeDropdown.tsx`
- `components/ui/AppText.tsx`
- `components/ui/StatusBadge.tsx`
- `app/live.tsx`
- `app/reservation-detail.tsx`
- `app/ui-kit.tsx`
- `docs/LIVE_Z8B_DARK_THEME_STANDARDIZATION.md`
- `docs/PRODUCT_B_INTERNAL_UI_KIT_FOUNDATION.md`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`

## Archivos con cambios previos de LIVE-Z8 presentes en el worktree

- `components/live/AuthorizationRequestPanel.tsx`
- `docs/LIVE_Z8_AUTHORIZATION_REQUESTS.md`
- `docs/LIVE_Z7_PERMISSIONS_PRICE_APPROVAL.md`
- `locales/es/common.json`
- `locales/en/common.json`

## Cambios aplicados

- `mutedText`, `textSecondary` y `textMuted` quedan gobernados por el tema, no por el color secundario configurable.
- Dark mode usa superficies premium: `background`, `surface`, `surfaceAlt`, `surfaceMuted`.
- Inputs usan tokens especificos y estado readonly/disabled legible.
- Botones secundarios/neutrales tienen borde sutil para conservar jerarquia visual.
- Badges neutrales usan `surfaceMuted`, `textSecondary` y `borderStrong`.
- AppShell usa overlay del tema para drawer.
- Alerts warning se suavizan en dark mode.
- `reservation-detail` usa tokens warning en lugar de colores hardcodeados.
- `/ui-kit` muestra tokens semanticos del tema activo y comparativo light/dark.

## Validaciones ejecutadas

- `npm.cmd run lint` - OK con 60 warnings preexistentes.
- `npx.cmd tsc --noEmit` - OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` - OK.
- `./mvnw.cmd test` desde `backend/control-ropa` - OK, 73 tests.
- `./mvnw.cmd -q -DskipTests package` desde `backend/control-ropa` - OK.
- `git diff --check` - OK, solo avisos CRLF de Windows.
- `git status --short --untracked-files=all` - ejecutado.
- `git --no-pager diff --stat` - ejecutado.
- `git --no-pager diff --name-only` - ejecutado.

## Warnings

- Lint mantiene 60 warnings preexistentes del proyecto.
- Maven muestra warnings preexistentes de MySQL 5.7 fuera de soporte comunitario y Mockito dynamic agent.
- Git advierte conversion LF -> CRLF al tocar archivos en Windows.

## QA visual recomendada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/live`.
3. Alternar claro/oscuro desde TopBar.
4. Confirmar que `3. PRECIO` muestra label, helper, input, placeholder y valor sin seleccionar texto.
5. Confirmar botones primary/secondary/neutral/danger/disabled coherentes.
6. Abrir `/reservation-detail?id=<id valido>` desde una reserva y validar dark mode.
7. Abrir `/ui-kit` y revisar tokens semanticos, comparativo claro/oscuro y previews.
8. Validar responsive en desktop/tablet/mobile.

## No se cambio

- Backend funcional.
- AUTH/RBAC.
- Pagos/caja/reportes/billing/IA.
- Capacidades LIVE.
- Reglas operativas LIVE-Z6/Z7/Z8.
- Contratos de API.

## GO / NO-GO

GO tecnico: validaciones automatizadas OK.

GO visual condicionado a QA manual en navegador/dispositivo real para contraste y responsive.

## Siguiente fase recomendada

PRODUCT-B5: auditoria de pantallas legacy fuera de AppShell, catalogo de contraste/accesibilidad y migracion gradual de componentes visuales antiguos.
