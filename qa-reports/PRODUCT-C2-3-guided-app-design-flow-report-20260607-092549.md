# PRODUCT-C2.3 - Guided app design flow report

Fecha: 2026-06-07 09:25:49

## Resumen

PRODUCT-C2.3 reposiciona `/ui-kit` como pantalla de `Diseno de la aplicacion`. La experiencia principal ahora comunica que el usuario esta configurando la plantilla visual, el color principal, la paleta sugerida, contraste, legibilidad y vista previa del sistema.

## Cambios principales

- El AppShell de `/ui-kit` usa titulo y subtitulo orientados a diseno de aplicacion.
- `UI Kit` queda como referencia tecnica secundaria.
- El stepper se vuelve accionable: elegir plantilla, color principal, paleta, contraste, preview y aplicar/restaurar.
- La seccion de plantillas explica que son la base visual.
- El generador habla de color principal de marca y paleta sugerida para la aplicacion.
- La paleta visible usa labels de usuario final, no tokens tecnicos.
- El contraste visible se presenta como contraste y legibilidad.
- La preview se presenta como vista previa de la aplicacion.
- Aplicar/restaurar queda como cierre del flujo.
- Opciones avanzadas conservan editor HEX, tokens, componentes, templates y variantes.
- `/appearance` mantiene branding y actualiza la tarjeta hacia `Diseno de la aplicacion` / `Abrir editor visual`.

## I18N

Se agregaron y ajustaron claves `paletteGenerator.*` en:

- `es`
- `en`
- `pt-BR`
- `fr`
- `ja`
- `zh`
- `ko`

Auditoria de estructura:

```text
es: leaves=1194 missing=0 extra=0
en: leaves=1194 missing=0 extra=0
pt-BR: leaves=1194 missing=0 extra=0
fr: leaves=1194 missing=0 extra=0
ja: leaves=1194 missing=0 extra=0
zh: leaves=1194 missing=0 extra=0
ko: leaves=1194 missing=0 extra=0
```

## Validaciones ejecutadas

- `npm.cmd run lint` - PASS con 53 warnings existentes.
- `npx.cmd tsc --noEmit` - PASS.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` - PASS.
- `backend/control-ropa/.mvnw.cmd test` - PASS, 73 tests.
- `backend/control-ropa/.mvnw.cmd -q -DskipTests package` - PASS.
- `git --no-pager diff --check` - PASS.

## Validacion manual esperada

1. Abrir `/ui-kit`.
2. Confirmar titulo `Diseno de la aplicacion`.
3. Confirmar secuencia logica en pasos.
4. Elegir plantilla visual.
5. Elegir color principal de marca.
6. Revisar paleta sugerida.
7. Revisar contraste y legibilidad.
8. Confirmar vista previa antes de aplicar.
9. Aplicar paleta localmente.
10. Restaurar plantilla.
11. Abrir opciones avanzadas.
12. Confirmar que el contenido tecnico no satura por defecto.
13. Abrir `/appearance`.
14. Confirmar tarjeta `Diseno de la aplicacion` y boton `Abrir editor visual`.

## Riesgos y pendientes

- No hay persistencia backend ni por tenant.
- Las traducciones nuevas requieren revision humana/nativa.
- La validacion de contraste sigue siendo basica.
- QA visual debe confirmar desktop/tablet/mobile y light/dark en navegador.

## Resultado

GO tecnico para QA visual/manual.
