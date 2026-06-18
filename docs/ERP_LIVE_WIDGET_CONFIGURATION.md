# ERP LIVE - Configuracion de widgets

Fecha: 2026-05-20  
Fase: LIVE-V - widgets configurables

## Objetivo

Permitir que la experiencia visual de En vivo se adapte por operador, dispositivo y escenario de demo sin tocar backend ni reglas operativas.

## Widgets configurables

- Spotlight producto.
- Vista presentadora.
- Estado operativo.
- Roles del equipo.
- Analiticos En vivo.
- Actividad En vivo.

## Persistencia actual

Se crea `services/liveLayoutPreferences.ts` con persistencia local en `AsyncStorage`.

La preferencia se guarda:

- por usuario cuando existe sesion local: `live_layout_preferences:user:{userId}`;
- por dispositivo como fallback: `live_layout_preferences:device`.

## Default

Todos los widgets inician visibles en desktop/tablet, pero mobile aplica reglas automaticas para reducir ruido:

- roles ocultos,
- analiticos ocultos,
- actividad oculta.

## Arquitectura futura

La misma estructura puede persistirse despues en backend por:

- usuario,
- empresa,
- sucursal,
- rol,
- layout/dispositivo.

## Alcance

- Solo frontend.
- Sin backend.
- Sin SQL ni migraciones.
- Sin pagos, ventas ni reportes.
