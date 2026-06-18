# ERP LIVE-M - Tablet UX Redesign

Fecha: 2026-05-19

Rama: `feature/live-m-smoke-responsive-layouts`

## Objetivo

Convertir tablet en la consola operativa principal de `En vivo`, corrigiendo el layout detectado como incomodo en prueba real.

## Problema detectado

Antes de esta fase, tablet se sentia como desktop comprimido:

- metricas angostas,
- textos partidos verticalmente,
- exceso de columnas,
- demasiada altura y scroll,
- captura de reserva demasiado abajo,
- linea de tiempo ocupando espacio operacional,
- tarjetas visuales buenas para demo pero pesadas para captura real.

## Cambios aplicados

- `LiveTabletLayout` ahora prioriza la columna operativa a la izquierda.
- El bloque visual/producto queda a la derecha como apoyo comercial.
- Tablet mantiene maximo dos columnas.
- Las metricas demo se compactan en tablet:
  - se muestran solo metricas principales,
  - se ocultan ayudas largas,
  - se reduce altura de tarjetas,
  - se evita que textos se partan.
- La linea de tiempo se resume en tablet a los primeros eventos.
- Las reservas recientes se limitan visualmente en tablet y se muestra contador de reservas adicionales.
- Se reduce la altura del producto visual en tablet.
- Se eliminan separadores mojibake visibles en `app/live.tsx`.

## Resultado esperado en tablet

- Captura y reservas quedan en la zona principal.
- Producto visual y metricas quedan como soporte.
- Menos scroll inicial.
- CTA `Reservar ahora` queda mas cerca del flujo operativo.
- Las metricas no compiten con la captura.
- El layout se mantiene tactil y legible en 1024x768 y 1280x800.

## Desktop

Sin cambio funcional esperado:

- mantiene layout de tres columnas,
- conserva metricas completas,
- conserva linea de tiempo completa,
- conserva panel visual completo.

## Movil

Sin cambio estructural esperado:

- mantiene stack vertical,
- conserva secciones completas,
- conserva comportamiento actual.

## Validaciones solicitadas

- `npm run lint`
- `npx tsc --noEmit`
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`
- busqueda de mojibake en `app`, `components`, `locales` y `docs`

## Riesgos pendientes

- Validacion visual final en Galaxy Tab y iPad fisicos.
- Ajuste fino si el teclado virtual reduce demasiado el espacio visible.
- Confirmar que modales de cliente/prenda conservan altura comoda en tablet real.

## Decision

`GO tecnico` si lint, TypeScript y export web pasan.

`GO runtime` queda sujeto a smoke visual real en tablet fisica.
