# ERP LIVE - Flujo operacional de captura

Fecha: 2026-05-20  
Fase: LIVE-W - refinamiento UX operacional

## Objetivo

Convertir la consola En vivo en un flujo guiado para reducir errores durante transmisiones.

## Cambio aplicado

El bloque de reserva ahora ordena la operacion:

1. Seleccionar cliente existente.
2. Usar alta rapida solo si el cliente es nuevo.
3. Agregar prenda por codigo o QR como accion principal.
4. Buscar o crear prenda solo cuando no hay codigo.
5. Capturar precio.
6. Reservar ahora.

## Jerarquia

- Primario: seleccionar cliente, agregar prenda, reservar ahora.
- Secundario: buscar prenda, escanear QR.
- Terciario: crear cliente rapido, crear prenda rapida.

## Alcance

Solo frontend LIVE. No se modifica backend, navegacion, pagos, ventas ni logica de reservas.
