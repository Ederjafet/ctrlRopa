# PRODUCT-I18N-A - Expansion multi-idioma base

Fecha: 2026-06-06

## Objetivo

Preparar la app para nuevos idiomas comerciales sin cambiar logica funcional, backend, AUTH/RBAC, pagos, caja, reportes backend, billing, IA, endpoints ni reglas LIVE.

## Idiomas agregados

| Codigo | Nombre visible |
| --- | --- |
| `pt-BR` | Português Brasil |
| `fr` | Français |
| `ja` | 日本語 |
| `zh` | 中文 |
| `ko` | 한국어 |

Se mantienen `es` y `en` sin cambio de comportamiento funcional.

## Archivos creados

- `locales/pt-BR/common.json`
- `locales/fr/common.json`
- `locales/ja/common.json`
- `locales/zh/common.json`
- `locales/ko/common.json`

Cada archivo conserva la misma estructura de claves que `locales/en/common.json` y `locales/es/common.json`. La auditoria automatica confirma 1085 claves hoja por idioma, sin faltantes ni extras.

## Selector de idioma

`app/system.tsx` ahora renderiza el selector desde una lista tipada de idiomas soportados:

- Español
- English
- Português Brasil
- Français
- 日本語
- 中文
- 한국어

Al seleccionar un idioma se sigue usando `changeAppLanguage`, por lo que se conserva la persistencia local existente y la actualizacion global de AppShell, Sidebar, TopBar, theme toggle y logout.

## Fuente i18n

`services/i18n.ts` ahora registra los recursos nuevos y normaliza codigos de dispositivo:

- `pt` y `pt-BR` resuelven a `pt-BR`;
- `zh`, `zh-CN` y `zh-Hans` resuelven a `zh`;
- `fr`, `ja` y `ko` resuelven directo.

El fallback global se mantiene en `es`, consistente con la configuracion previa. Ademas, los nuevos archivos nacen con estructura completa basada en `en/common.json`, por lo que no deben aparecer valores `undefined` aunque una traduccion de dominio siga pendiente de revision.

## Traduccion base aplicada

La traduccion base cubre:

- nombres de idioma;
- acciones comunes;
- navegacion y categorias del menu;
- theme toggle;
- TopBar;
- `/system`;
- `/reports`;
- validaciones principales de `/items-create`;
- etiquetas centrales de `/live` como actor, refresh, prenda al aire, prenda preparada y acciones principales.

Los textos largos o especializados que quedaron heredados de `en/common.json` son fallback intencional de base tecnica. Deben pasar por revision humana/nativa antes de un release internacional.

## Layout y UX

No se agregan fuentes externas ni assets de fuentes. La validacion visual esperada debe revisar:

- sidebar y drawer mobile;
- botones del selector en `/system`;
- textos largos en portugues/frances;
- textos asiaticos en sidebar, TopBar y cards;
- light/dark y presets visuales.

## Validacion manual esperada

1. Entrar con `qa.admin`.
2. Abrir `/system`.
3. Cambiar a `Português Brasil` y validar menu + pantalla.
4. Cambiar a `Français` y validar menu + pantalla.
5. Cambiar a `日本語` y validar menu + pantalla.
6. Cambiar a `中文` y validar menu + pantalla.
7. Cambiar a `한국어` y validar menu + pantalla.
8. Abrir `/live`, `/customers`, `/reports`, `/ui-kit` y `/appearance`.
9. Confirmar que no aparece `undefined`, `null` ni claves crudas.
10. Confirmar que light/dark siguen funcionando.
11. Refrescar navegador y confirmar persistencia del idioma si el almacenamiento local esta disponible.

## Limitaciones

- Las traducciones nuevas son base de QA tecnico, no traduccion final comercial.
- No se traducen codigos tecnicos, permisos, rutas ni estados backend cuando son datos.
- No se implementa deteccion regional avanzada para variantes adicionales como `fr-CA`, `ko-KR` o `ja-JP`; i18n puede caer al codigo base cuando aplica.
- La revision nativa queda como requisito antes de publicar una version internacional.

## Continuidad PRODUCT-I18N-B

PRODUCT-I18N-B corrige mezclas visibles detectadas en QA, especialmente en `/live` con idiomas asiaticos activos. La fase reduce valores heredados de ingles/espanol en `live.*`, `operationalScreens.*`, pantallas de sistema y formularios cercanos al AppShell, manteniendo estructura completa de claves y sin tocar pagos/caja.
