# PRODUCT-C2.5 - Brand editor simplification QA report

Fecha: 2026-06-07 11:04:59
Rama: `feature/product-c2-5-brand-editor-simplification`

## Resumen

PRODUCT-C2.5 simplifica `/ui-kit` para que la vista principal funcione como editor visual de marca y no como laboratorio tecnico. Se conserva la capacidad tecnica en opciones avanzadas.

## Cambios auditados

- La vista principal queda enfocada en plantilla visual, colores de marca, paleta sugerida, legibilidad, preview y aplicar/restaurar.
- `tints`, `shades` y `tones` se movieron al modal `AppColorPicker`.
- El selector de armonia queda en opciones avanzadas.
- La armonia se presenta como sugerencia automatica cuando faltan secundario/acento, no como limitacion.
- `Identidad visual local` se renombra como `Editor avanzado de tokens locales`.
- `Design tokens` queda en avanzado con explicacion de diagnostico tecnico.
- El resumen visible de contraste se reduce a `Legibilidad`.
- `/appearance` conserva el acceso simple al editor visual.

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
es: leaves=1238 missing=0 extra=0
en: leaves=1238 missing=0 extra=0
pt-BR: leaves=1238 missing=0 extra=0
fr: leaves=1238 missing=0 extra=0
ja: leaves=1238 missing=0 extra=0
zh: leaves=1238 missing=0 extra=0
ko: leaves=1238 missing=0 extra=0
```

## Flujo manual esperado

1. Entrar con `qa.admin`.
2. Abrir `/ui-kit`.
3. Confirmar que la vista principal no parece laboratorio tecnico.
4. Revisar plantilla visual.
5. Revisar colores de marca.
6. Cambiar principal, secundario y acento con el picker propio.
7. Confirmar que claros, oscuros y desaturados aparecen dentro del modal.
8. Confirmar que armonia no aparece como limitante en la vista principal.
9. Revisar paleta sugerida.
10. Revisar legibilidad.
11. Confirmar preview antes de aplicar.
12. Aplicar paleta localmente.
13. Restaurar plantilla.
14. Abrir opciones avanzadas.
15. Confirmar que editor de tokens locales, design tokens, componentes y templates siguen disponibles.
16. Validar light/dark y mobile/tablet.

## Resultado

GO tecnico. La fase queda lista para commit si el staged diff conserva el alcance y `git diff --cached --check` pasa.
