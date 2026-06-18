# ERP LIVE - Flujo multioperador

Fecha: 2026-05-19  
Fase: LIVE-P - runtime realistic flow

## Objetivo

Convertir `En vivo` en una consola operativa de live-commerce donde el trabajo queda separado por rol:

- Presentadora: muestra prendas, mantiene energia comercial y consulta senales clave.
- Operador: registra cliente, prenda, precio y reserva con minima friccion.
- Supervisor: lee pulso comercial, reservas, audiencia e interaccion.

## Cambios aplicados

- `app/live.tsx` agrega una franja de roles visibles antes del layout principal.
- Product Spotlight muestra senales de urgencia y producto al aire.
- La consola del operador muestra acciones rapidas: reserva, cambio de producto y cobro pendiente.
- El feed deja de sentirse como log tecnico y muestra eventos humanos con badges y timestamps.

## Comportamiento esperado

### Presentadora

- Ve producto actual, audiencia y senales rapidas.
- No opera formularios largos.
- Puede tomar decisiones comerciales con poca lectura.

### Operador

- Mantiene cliente, prenda y precio en un bloque principal.
- Usa acciones tactiles grandes para cambiar cliente, buscar prenda o registrar reserva.
- Consulta actividad y reservas recientes sin abandonar la pantalla.

### Supervisor

- Lee espectadores, reservas, comentarios y reacciones.
- Puede interpretar si el producto tiene interes real.
- Usa la vista como panel comercial durante demostraciones.

## Fuera de alcance

- Backend realtime.
- WebSockets.
- Integraciones Facebook/TikTok/Instagram/YouTube.
- Cambios a pagos, ventas, reportes o logica financiera.

## Riesgos pendientes

- Los indicadores siguen siendo simulados.
- Falta validar con operador real en tablet fisica.
- La separacion de roles aun es visual; no hay permisos por rol LIVE dedicados.
