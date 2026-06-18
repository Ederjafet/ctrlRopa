# ERP LIVE - Responsive overlap fixes

Fecha: 2026-05-20  
Fase: LIVE-T

## Objetivo

Reducir objetos encimados y mejorar estabilidad visual mobile/tablet/desktop en el modulo En vivo.

## Cambios relacionados

- Se mantiene `flexWrap` en badges, chips, metadata y botones.
- El Product Spotlight muestra metadata compacta con `minWidth` controlado.
- Al apagar analiticos desde Sistema se ocultan bloques visuales pesados para reducir scroll y ruido.
- `AppScreen` refuerza safe area Android para que headers no se empalmen con barra del sistema.
- El padding root agrega guard adicional para Android y web touch device sin afectar desktop.

## Elementos revisados

- Badges de En vivo.
- Metadata de producto.
- Comentarios demo.
- Metricas demo.
- Activity feed.
- Botones de cliente/prenda/reserva.
- Safe area superior.

## QA pendiente

- Tablet 1024x768.
- Tablet 1280x800.
- Galaxy Tab.
- Android telefono.
- Desktop.

## Riesgos

- El smoke visual fisico sigue siendo obligatorio porque Expo web/export no detecta ergonomia tactil ni notch real.
