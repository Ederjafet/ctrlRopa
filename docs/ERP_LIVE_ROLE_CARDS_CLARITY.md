# ERP LIVE - Claridad de tarjetas de roles

Fecha: 2026-05-20  
Fase: LIVE-U

## Objetivo

Evitar que las tarjetas `Presentadora`, `Operador` y `Supervisor` parezcan botones cuando actualmente solo son informativas.

## Cambio UX

- Se agrega encabezado `Roles del equipo`.
- Se agrega microcopy corto de contexto.
- Las tarjetas cambian a estilo compacto/informativo.
- Se reduce altura y protagonismo visual.
- Se mantiene la separacion de roles sin convertirlos en acciones.

## Decision

Las tarjetas siguen siendo informativas. No se habilitan como botones hasta que exista comportamiento real por rol, permisos o vistas separadas.

## QA esperado

- En desktop/tablet las tarjetas no deben competir con producto, reserva ni estado.
- En movil no se muestran para evitar ruido operativo.
- No deben sugerir accion tactil.
