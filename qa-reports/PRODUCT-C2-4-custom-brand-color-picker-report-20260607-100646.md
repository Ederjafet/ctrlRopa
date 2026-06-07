# PRODUCT-C2.4 - Custom brand color picker QA report

Fecha: 2026-06-07 10:06:46
Rama: `feature/product-c2-4-custom-brand-color-picker`

## Resumen

PRODUCT-C2.4 agrega un selector propio de colores en `/ui-kit` para evitar que la experiencia principal dependa del picker nativo del navegador o Windows. El flujo guiado de `Diseno de la aplicacion` ahora soporta hasta tres colores de marca: principal, secundario y acento.

## Cambios auditados

- Se reemplazo el control principal `input type=color` del generador por `AppColorPicker`.
- Se agrego soporte de `BrandColorInputs` en `theme/colorUtils.ts`.
- La paleta sugerida respeta 1, 2 o 3 colores de marca.
- `success`, `warning` y `danger` conservan semantica de estado.
- El contraste visible evalua principal, secundario, acento, fondo, superficie y reservado.
- La preview refleja los tres colores de marca antes de aplicar.
- `/appearance` mantiene el acceso al editor visual y menciona colores de marca.
- Las nuevas claves i18n se agregaron en `es`, `en`, `pt-BR`, `fr`, `ja`, `zh` y `ko`.

## Validaciones ejecutadas

```text
npm.cmd run lint
Resultado: PASS con 53 warnings preexistentes, 0 errores.

npx.cmd tsc --noEmit
Resultado: PASS.

npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export
Resultado: PASS. Exporto 73 rutas estaticas, incluyendo /ui-kit.

backend/control-ropa/.\\mvnw.cmd test
Resultado: PASS. Tests run: 73, Failures: 0, Errors: 0, Skipped: 0.

backend/control-ropa/.\\mvnw.cmd -q -DskipTests package
Resultado: PASS.

git --no-pager diff --check
Resultado: PASS. Solo avisos LF/CRLF.
```

## Auditoria i18n

```text
es: leaves=1213 missing=0 extra=0
en: leaves=1213 missing=0 extra=0
pt-BR: leaves=1213 missing=0 extra=0
fr: leaves=1213 missing=0 extra=0
ja: leaves=1213 missing=0 extra=0
zh: leaves=1213 missing=0 extra=0
ko: leaves=1213 missing=0 extra=0
```

## Flujo manual esperado

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Ir a `Colores de marca`.
4. Cambiar color principal.
5. Confirmar que no se abre la ventana nativa de Windows como experiencia principal.
6. Cambiar color secundario.
7. Cambiar color de acento.
8. Ver paleta sugerida.
9. Revisar contraste.
10. Ver preview.
11. Aplicar paleta.
12. Abrir `/live` o `/customers` y confirmar tema aplicado.
13. Volver a `/ui-kit`.
14. Restaurar plantilla.
15. Validar light/dark.
16. Validar mobile/tablet.

## Resultado

GO tecnico. La fase queda lista para commit si el staged diff conserva el mismo alcance y `git diff --cached --check` pasa.
