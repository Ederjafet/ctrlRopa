# ERP LIVE - Estrategia de visibilidad de roles

Fecha: 2026-05-20  
Fase: LIVE-V

## Problema

Las tarjetas `Presentadora`, `Operador` y `Supervisor` son utiles para explicar la operacion, pero pueden sentirse invasivas o parecer botones.

## Decision UX

- Siguen siendo informativas.
- No ejecutan acciones.
- Se pueden ocultar desde `Sistema -> Experiencia En vivo`.
- En mobile permanecen ocultas automaticamente para priorizar reserva rapida.

## Criterio por dispositivo

- Desktop: visibles si la preferencia esta activa, utiles para demo y capacitacion.
- Tablet: visibles si la preferencia esta activa, pero con menor peso visual.
- Mobile: ocultas por espacio y foco tactil.

## Futuro

Cuando existan vistas reales por rol, estas tarjetas podran evolucionar a selector de modo operativo con permisos y auditoria.
