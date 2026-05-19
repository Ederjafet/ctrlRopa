# Refinamiento i18n global y terminologia LIVE

Fecha: 2026-05-18

Rama observada: `develop`

## Objetivo

Centralizar el cambio de idioma fuera de LIVE y preparar una experiencia mas limpia para demo y operacion, evitando terminos tecnicos en espanol como `Live`, `Dashboard`, `Timeline`, `Engagement`, `Viewers` o `Demo visual`.

## Cambios aplicados

- El selector ES/EN se movio a `Configuracion -> Sistema` en `app/system.tsx`.
- El idioma se persiste globalmente desde `services/i18n.ts`.
- LIVE ya no contiene selector propio de idioma.
- LIVE reacciona al idioma global mediante `react-i18next`.
- Se agregaron textos de Sistema a `locales/es/common.json` y `locales/en/common.json`.
- Se corrigieron textos visibles con mojibake en `app/system.tsx`.
- Se reemplazaron textos visibles de LIVE en espanol:
  - `Live` -> `En vivo` / `transmision`
  - `Dashboard` -> `Panel`
  - `Timeline` -> `Linea de tiempo`
  - `Viewers` -> `Espectadores`
  - `Engagement` -> `Participacion`
  - `Demo visual` -> `Vista demostrativa`

## Eventos demo localizados

Los eventos internos siguen existiendo como conceptos tecnicos, pero la UI ya no debe mostrar codigos crudos.

| Evento tecnico | ES visible | EN visible |
|---|---|---|
| `LIVE_STARTED` | Inicio de transmision | Live started |
| `VIEWER_JOINED` | Espectador conectado | Viewer joined |
| `PRODUCT_PINNED` | Producto destacado | Product pinned |
| `COMMENT_RECEIVED` | Comentario recibido | Comment received |
| `REACTION_RECEIVED` | Reaccion recibida | Reaction received |
| `LIVE_CLOSED` | Transmision finalizada | Live closed |

## Compatibilidad

- Espanol sigue siendo el fallback.
- Si no hay preferencia persistida, se usa el idioma del dispositivo cuando sea `es` o `en`.
- Durante export web estatico no se lee `AsyncStorage`; la lectura persistida ocurre solo en runtime para evitar errores `window is not defined`.
- No se modifico backend, ventas, pagos, reportes ni base de datos.

## Validaciones realizadas

- `rg -n "Ã|Â|�" app services locales`: sin coincidencias.
- `npm run lint`: sin errores; permanecen warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: exitoso.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: exitoso.

## Riesgos pendientes

- La app completa todavia no esta 100% traducida. Esta fase centraliza el idioma y limpia LIVE/Sistema, pero no migra todo el ERP.
- Algunas etiquetas del menu principal siguen siendo literales en espanol; se corrigieron terminos criticos visibles, pero falta una fase de i18n global por modulo.
- El smoke visual runtime en navegador debe repetirse con backend y frontend activos para evidenciar cambio ES/EN real.

## Criterio de salida

Estado: `GO tecnico` para i18n global base y terminologia LIVE corregida.

No se considera cierre total de i18n ERP hasta migrar el resto de pantallas.
