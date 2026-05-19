# ERP LIVE-K - Responsive Tablet Commerce UI

Fecha: 2026-05-19

Rama: `feature/live-k-responsive-tablet-commerce-ui`

## Objetivo

Transformar la pantalla `En vivo` hacia una experiencia visual tipo live commerce moderno, optimizada para tablet horizontal, desktop, demos comerciales y operacion rapida sin tocar backend, pagos reales, reportes, migraciones ni integraciones externas.

## Alcance implementado

- Layout responsive tablet-first en `app/live.tsx`.
- Distribucion por columnas en tablet/desktop:
  - columna izquierda: producto visual, badge `En vivo`, espectadores, comentarios simulados, estado operativo y metricas demo;
  - columna central: transmisiones abiertas, sesion seleccionada, creacion de transmision y captura de reserva;
  - columna derecha: reservas recientes y cierre de transmision.
- En movil el contenido conserva stack vertical para evitar desbordes.
- CTA principal de captura cambiado a `Reservar ahora`.
- Textos nuevos agregados a i18n ES/EN.
- Sin cambios a servicios, endpoints, pagos, reservas backend o logica financiera.

## Decisiones UX

- Se mantuvo la operacion actual y solo se reorganizo la presentacion.
- El producto visual usa la prenda seleccionada cuando existe; si no, usa datos demo controlados.
- Las metricas siguen siendo demostrativas y no representan analitica real.
- En espanol no se agregaron terminos visibles como `Dashboard`, `Timeline` o `Live`; se usa `Panel`, `Linea de tiempo` y `En vivo` donde aplica.

## Validacion responsive esperada

### Tablet 1024x768 / 1280x800

- En vivo debe mostrar columnas.
- La columna central debe priorizar captura de reserva.
- Las tarjetas laterales no deben tapar CTA ni modales.
- El CTA `Reservar ahora` debe quedar visible dentro del bloque de captura.

### Desktop

- El layout debe conservar tres columnas con mas aire visual.
- Las metricas y reservas recientes deben servir para demo comercial sin recorrer toda la pantalla.

### Movil

- El layout debe apilarse en una sola columna.
- No debe haber texto cortado ni controles inaccesibles.

## Riesgos

- La validacion visual real en Galaxy Tab/iPad queda pendiente de ejecucion manual.
- Las metricas visuales son demo; no deben venderse como integracion real Facebook/TikTok.
- La pantalla sigue acumulando mucha logica historica en `app/live.tsx`; conviene componentizar en una fase posterior controlada.

## Rollback

- Revertir cambios de `app/live.tsx` y claves i18n agregadas.
- No hay cambios de backend, datos ni migraciones.

## Decision

`GO tecnico` si pasan lint, TypeScript y export web.

`GO runtime` depende del smoke visual en tablet/desktop/movil con datos QA.
