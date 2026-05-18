# ERP Frontend I18N Base

Fecha: 2026-05-18  
Rama: `feature/live-a-i18n-base-live-ux`

## Objetivo

Preparar una base minima de multi idioma en el frontend sin cambiar reglas de negocio ni tocar backend. La primera pantalla cubierta es `app/live.tsx`, porque es un flujo operativo visible y con historial reciente de problemas de textos/mojibake.

## Alcance Implementado

- Dependencias agregadas: `i18next`, `react-i18next`, `expo-localization` alineada con Expo SDK 54 mediante `expo install`.
- Inicializacion i18n en `services/i18n.ts`.
- Recursos de traduccion en `locales/es/common.json` y `locales/en/common.json`.
- Integracion global en `app/_layout.tsx` mediante `I18nextProvider`.
- Idioma default: espanol, con fallback a espanol.
- Selector minimo ES/EN dentro de LIVE para validar runtime sin redisenar navegacion global.

## Decision Tecnica

Se usa una estructura simple por namespace `common` para no introducir complejidad antes de tener una estrategia completa de producto multi idioma. El idioma inicial se resuelve desde `expo-localization`, pero solo se aceptan `es` y `en`; cualquier otro idioma cae a `es`.

## Convenciones Iniciales

- Las llaves deben agruparse por modulo: `live.*`, `common.*`, `language.*`.
- No se deben traducir codigos tecnicos, folios, rutas, endpoints ni permisos.
- Los mensajes al usuario deben vivir en JSON, no como literales nuevos en pantallas migradas.
- Las siguientes pantallas se migraran por fase, no en bloque.

## Fuera De Alcance

- Traduccion completa del ERP.
- Persistencia de idioma por usuario.
- Traducciones backend.
- Integracion Facebook/Live externo.
- Cambios de seguridad, ventas, pagos, reportes o base de datos.

## Riesgos

- Algunas pantallas siguen con literales directos y deberan migrarse gradualmente.
- El selector temporal de idioma esta en LIVE; una configuracion global debe definirse en una fase futura.
- Si se agregan textos nuevos en LIVE fuera del diccionario, puede reaparecer inconsistencia UX.

## Siguiente Paso Recomendado

Validar LIVE en web y mobile con espanol default. Despues, definir una fase UX para selector global de idioma y migracion gradual de pantallas operativas prioritarias.

## Validacion De Fase

- `npm.cmd run lint`: sin errores, con warnings historicos fuera de alcance.
- `npx.cmd tsc --noEmit`: correcto.
- `npx.cmd expo export --platform web --output-dir C:\tmp\control-ropa-web-export`: correcto, incluyendo ruta `/live`.
- `npm.cmd run web`: pendiente en `8081` porque el puerto local estaba ocupado por un proceso `node` que no respondia HTTP.
