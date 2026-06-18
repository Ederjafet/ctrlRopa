# PRODUCT-I18N-A - Multilanguage base QA report

Fecha: 2026-06-06 22:15:19 America/Mexico_City

## Alcance

Se agrego soporte base para nuevos idiomas comerciales sin tocar backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

Idiomas agregados:

- `pt-BR` - Português Brasil
- `fr` - Français
- `ja` - 日本語
- `zh` - 中文
- `ko` - 한국어

## Cambios revisados

- `services/i18n.ts` registra los nuevos recursos y normaliza codigos de idioma.
- `/system` muestra un selector tipado con siete idiomas.
- `locales/es/common.json` y `locales/en/common.json` incluyen labels visibles de los nuevos idiomas.
- Se crearon archivos completos `common.json` para los cinco idiomas nuevos.
- Se documento la estrategia de fallback y la necesidad de revision humana/nativa.

## Verificacion de estructura i18n

Comando ejecutado:

```text
node - <script de comparacion de claves>
```

Resultado:

```text
es: leaves=1085 missing=0 extra=0
en: leaves=1085 missing=0 extra=0
pt-BR: leaves=1085 missing=0 extra=0
fr: leaves=1085 missing=0 extra=0
ja: leaves=1085 missing=0 extra=0
zh: leaves=1085 missing=0 extra=0
ko: leaves=1085 missing=0 extra=0
```

## Validaciones ejecutadas

| Validacion | Resultado |
| --- | --- |
| `npm.cmd run lint` | PASS, 0 errores. Persisten advertencias existentes fuera del alcance. |
| `npx.cmd tsc --noEmit` | PASS |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | PASS, 73 rutas exportadas |
| `./mvnw.cmd test` | PASS, 73 tests, 0 fallas, 0 errores |
| `./mvnw.cmd -q -DskipTests package` | PASS |
| `git --no-pager diff --check` | PASS |

## Notas de lint

El lint conserva advertencias preexistentes en rutas fuera del alcance, principalmente `react-hooks/exhaustive-deps`, `array-type`, `no-unused-vars` y BOM en archivos existentes. La advertencia nueva detectada en `app/system.tsx` fue corregida antes de cerrar la fase.

## Fallback y limites

Los archivos nuevos tienen estructura completa para evitar `undefined` o claves faltantes. La configuracion global mantiene fallback a `es`, y las nuevas traducciones base cubren shell, navegacion, sistema, reportes, validaciones principales y etiquetas centrales de LIVE. Textos largos de dominio que conservan base inglesa requieren revision humana/nativa antes de release internacional.

## Flujo manual sugerido

1. Entrar con `qa.admin`.
2. Abrir `/system`.
3. Cambiar a `Português Brasil`.
4. Validar menu y pantalla.
5. Cambiar a `Français`.
6. Validar menu y pantalla.
7. Cambiar a `日本語`.
8. Validar menu y pantalla.
9. Cambiar a `中文`.
10. Validar menu y pantalla.
11. Cambiar a `한국어`.
12. Validar menu y pantalla.
13. Abrir `/live`, `/customers`, `/reports`, `/ui-kit` y `/appearance`.
14. Confirmar que no aparecen `undefined`, `null` ni claves crudas.
15. Confirmar light/dark y persistencia al refrescar navegador.

## Resultado

GO tecnico para commit, condicionado a revision visual/manual y revision nativa de traducciones antes de release internacional.
