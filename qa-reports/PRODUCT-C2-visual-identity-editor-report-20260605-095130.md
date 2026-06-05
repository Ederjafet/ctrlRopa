# PRODUCT-C2 - Editor controlado de identidad visual

Fecha: 2026-06-05 09:51:30
Rama real: feature/product-c2-visual-identity-editor

## Resumen

PRODUCT-C2 agrega un editor controlado de identidad visual local en `/ui-kit`. La app mantiene presets controlados y suma overrides semanticos limitados, sin tocar backend, AUTH/RBAC, pagos, caja, billing, reportes backend, IA ni reglas LIVE.

## Que se implemento

- Tipos y helpers para identidad visual custom local.
- Validacion hex `#RRGGBB`.
- Overrides locales por modo claro/oscuro.
- Persistencia local con `AsyncStorage`.
- Restauracion de plantilla base.
- Preview en vivo de botones, cards, badges, inputs y prenda reservada.
- Documentacion PRODUCT-C2 y actualizacion de documentos PRODUCT-C/C1/presets.

## Tokens editables

- primary;
- secondary;
- accent;
- success;
- warning;
- danger / reserved;
- background;
- surface;
- radius;
- density.

## Que NO permite

- editar colores por componente;
- editar texto libremente;
- persistir por tenant/backend;
- crear endpoints;
- crear migraciones;
- cambiar reglas LIVE;
- saltarse AUTH/RBAC.

## Como se guarda

Local frontend:

- `controlRopa.localVisualPreset`;
- `controlRopa.localVisualIdentityOverrides`.

La resolucion del tema queda:

```text
preset base + overrides locales + light/dark mode = tokens finales
```

## Validacion de contraste

Se implemento validacion basica:

- bloquea colores no hexadecimales;
- muestra advertencias simples para contraste de fondo/superficie.

Pendiente:

- validacion WCAG completa;
- validacion backend antes de persistir por tenant.

## Archivos modificados

- `app/ui-kit.tsx`
- `context/AppThemeContext.tsx`
- `theme/designPresets.ts`
- `docs/PRODUCT_C2_VISUAL_IDENTITY_EDITOR.md`
- `docs/PRODUCT_C_CLIENT_VISUAL_IDENTITY_PRESETS.md`
- `docs/PRODUCT_C_PREMIUM_VISUAL_SYSTEM.md`
- `docs/PRODUCT_C1_GLOBAL_PREMIUM_ROLLOUT.md`

## Validaciones ejecutadas

- `git branch --show-current`: rama real `feature/product-c2-visual-identity-editor`.
- `git status`: cambios esperados antes del commit.
- `git log --oneline -12`: OK.
- `git --no-pager diff --stat`: OK.
- `git --no-pager diff --name-only`: OK.
- `git --no-pager diff --check`: OK, solo warnings LF/CRLF.
- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `cd backend/control-ropa; .\\mvnw.cmd test`: OK, 73 tests.
- `cd backend/control-ropa; .\\mvnw.cmd -q -DskipTests package`: OK.

## Warnings

- ESLint mantiene 60 warnings historicos/preexistentes, sin errores.
- Maven mantiene warnings preexistentes de Mockito dynamic agent, MySQL 5.7 y password generada en tests.
- Git muestra conversion LF/CRLF normal en Windows.

## Riesgos

- La personalizacion sigue siendo local por dispositivo.
- La validacion de contraste no es WCAG completa.
- Cambios extremos de fondo/superficie pueden requerir QA manual adicional.
- Persistencia tenant requiere backend y auditoria futura.

## GO / NO-GO

GO tecnico si el staged diff pasa `git diff --cached --check`.

## Siguiente fase recomendada

PRODUCT-C3 / PRODUCT-E:

- persistencia de identidad visual por cliente/tenant;
- politica de presets permitidos;
- auditoria y rollback;
- validador WCAG completo;
- preview visual por tenant antes de publicar.
