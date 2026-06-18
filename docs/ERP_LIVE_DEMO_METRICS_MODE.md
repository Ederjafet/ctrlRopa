# ERP LIVE-E - Demo metrics mode

Fecha: 2026-05-18  
Rama: `feature/live-e-demo-metricas-engagement`

## Objetivo

Crear una experiencia visual fuerte para presentacion/comercial de LIVE, mostrando metricas y engagement simulados sin depender de backend realtime, Facebook/Meta, WebSockets, ventas, pagos, reportes ni reservaciones.

## Alcance

- Frontend `app/live.tsx`.
- Diccionarios i18n `locales/es/common.json` y `locales/en/common.json`.
- Documentacion ERP.

## Fuera de alcance

- Backend Java.
- Migraciones Flyway.
- Facebook runtime.
- Analytics reales.
- WebSockets reales.
- Ventas LIVE.
- Pagos LIVE.
- Reportes.
- Reservaciones.

## Implementacion

Se agrego un panel `Metricas demo` en LIVE con:

- viewers actuales simulados,
- viewers pico,
- engagement,
- comentarios demo,
- reacciones demo,
- productos destacados,
- actividad por minuto,
- productos destacados con clics demo,
- timeline visual con eventos:
  - `LIVE_STARTED`,
  - `VIEWER_JOINED`,
  - `PRODUCT_PINNED`,
  - `COMMENT_RECEIVED`,
  - `REACTION_RECEIVED`,
  - `LIVE_CLOSED`.

El panel es frontend-only y puede ocultarse/mostrarse desde la pantalla. No modifica datos, no llama endpoints nuevos y no altera el flujo de captura de reservas.

## Decisiones UX

- El panel queda visible por default para facilitar demo comercial.
- Se marca como `Demo visual` para evitar confundirlo con metricas reales.
- Los valores cambian solo de forma controlada segun estado visual de LIVE (`OPEN`, `ACTIVE`, `CLOSED`) y no representan datos reales.
- Se mantiene i18n ES/EN para todos los textos nuevos.

## Riesgos

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Usuario confunde metricas demo con reales | MEDIO | Badge `Demo visual` y documentacion explicita |
| Demo visual se interpreta como integracion Facebook | MEDIO | Texto indica que no usa Facebook ni realtime backend |
| Panel ocupa espacio operativo | BAJO | Toggle para ocultarlo |

## QA Esperado

- Abrir LIVE.
- Ver panel de metricas demo.
- Ocultar/mostrar panel.
- Cambiar ES/EN y validar textos.
- Validar que no hay mojibake.
- Validar que crear/seleccionar/activar/cerrar live mantiene comportamiento existente.
- Validar que customers/items/batches siguen abriendo.

## Validaciones Ejecutadas

- `npm run lint`: ejecutado sin errores; permanecen warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente; `/live`, `/customers`, `/items` y `/batches` fueron exportados.
- Busqueda de mojibake en `app/live.tsx` y locales ES/EN: sin coincidencias.
- Runtime local `http://localhost:8081/live`: pendiente; `npx expo start --web --port 8081` no dejo servidor accesible desde esta sesion.

## Decision

`GO tecnico` para build/export del modo demo.

`NO-GO visual pendiente` para cierre completo hasta repetir smoke real en navegador con `8081` accesible.
