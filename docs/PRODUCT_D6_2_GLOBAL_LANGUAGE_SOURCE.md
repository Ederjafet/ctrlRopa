# PRODUCT-D6.2 - Fuente global de idioma y theme toggle traducible

Fecha: 2026-06-05

## Objetivo

Unificar la fuente visible de idioma para `AppShell`, `Sidebar`, `TopBar`, selector de tema y `/system`, de forma que el idioma activo se refleje en toda la UI preparada para i18n.

Esta fase no modifica backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, permisos ni reglas LIVE.

## Causa encontrada

PRODUCT-D6.1 centralizo la navegacion y agrego claves i18n para el sidebar, pero quedaban dos fuentes de inconsistencia:

- `TopBar` mantenia textos hardcodeados: `Panel operativo`, `Claro`, `Oscuro` y `Sin rol`.
- `services/i18n.ts` condicionaba la persistencia local a `window`, lo que hacia menos consistente la fuente de idioma entre web/native y podia retrasar el refresco global.

Ademas, el cambio en `/system` ya usaba `i18n.changeLanguage`, pero el shell no tenia todos sus textos conectados a `useTranslation`.

## Fuente global de idioma

La fuente runtime sigue siendo `i18next` con namespace `common`, envuelta por `I18nextProvider` en `app/_layout.tsx`.

La persistencia local se mantiene en AsyncStorage con la clave:

- `app_language`

El cambio de idioma ahora:

1. llama primero a `i18n.changeLanguage(language)`;
2. guarda la preferencia en AsyncStorage;
3. permite que los componentes con `useTranslation('common')` se actualicen inmediatamente.

## Componentes corregidos

| Componente | Cambio |
| --- | --- |
| `services/i18n.ts` | AsyncStorage queda como persistencia local global, sin depender de `window`. |
| `components/layout/TopBar.tsx` | Usa `useTranslation('common')` para eyebrow, fallback de rol y boton de tema. |
| `components/layout/Sidebar.tsx` | El fallback `Sin rol` queda traducible. |
| `locales/es/common.json` | Agrega claves `theme`, `topBar` y `navigation.noRole`. |
| `locales/en/common.json` | Agrega equivalentes `Light`, `Dark`, `Operational panel`, `No role`. |

## Theme toggle

El boton de tema muestra la accion siguiente:

- Si el tema actual es claro:
  - ES: `Oscuro`
  - EN: `Dark`
- Si el tema actual es oscuro:
  - ES: `Claro`
  - EN: `Light`

Tambien se agrego `accessibilityLabel` con el mismo texto traducido.

## Sidebar / logout

El `Sidebar` ya traducia secciones, items, subtitulo de marca y logout desde D6.1. D6.2 refuerza el fallback de rol para que tambien respete idioma:

- ES: `Sin rol`
- EN: `No role`

## Claves i18n agregadas

```json
{
  "theme": {
    "light": "Claro / Light",
    "dark": "Oscuro / Dark"
  },
  "topBar": {
    "operationalPanel": "Panel operativo / Operational panel"
  },
  "navigation": {
    "noRole": "Sin rol / No role"
  }
}
```

## Pendientes legacy

Algunas pantallas fuera de AppShell o no preparadas por completo para i18n pueden conservar textos hardcodeados. Esta fase no migra esas pantallas ni rediseña legacy; el alcance es corregir la fuente global del shell y los controles comunes.

## Nota PRODUCT-D6.2B

PRODUCT-D6.2B cierra hardcodes visibles adicionales en `AppBackButton`, `/reports`, `/system-roles`, `/system-channels` y `/system-security-audit`. La migracion profunda de reportes detallados y pantallas legacy queda separada para D6.3.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/system`.
3. Seleccionar Espanol.
4. Confirmar pantalla, menu, logout y boton de tema en espanol.
5. Cambiar a English.
6. Confirmar screen, menu, logout and theme button in English.
7. Abrir `/customers`, `/live`, `/reports`, `/ui-kit`.
8. Confirmar que el idioma se conserva al navegar.
9. Refrescar navegador y confirmar persistencia local.
10. Validar light/dark y drawer mobile.

## Decision

GO tecnico condicionado a validacion visual manual. AppShell, Sidebar, TopBar y theme toggle quedan conectados a la misma fuente de i18n.
