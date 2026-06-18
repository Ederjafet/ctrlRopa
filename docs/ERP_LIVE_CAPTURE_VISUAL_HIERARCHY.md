# ERP LIVE - Jerarquia visual de captura

Fecha: 2026-05-21  
Fase: LIVE-W refinamiento adicional

## Objetivo

Hacer que el operador entienda rapidamente que el flujo principal es:

1. Seleccionar cliente.
2. Ingresar codigo o QR.
3. Agregar prenda.
4. Reservar ahora.

## Jerarquia aplicada

### Acciones primarias

- Seleccionar cliente.
- Codigo/QR de la prenda.
- Agregar prenda.
- Reservar ahora.

### Acciones secundarias

- Buscar prenda.
- Escanear QR.

### Acciones terciarias

- Crear cliente rapido.
- Crear prenda rapida.

## Cambios UX

- Las altas rapidas pasan a estilo discreto tipo ghost.
- `Crear prenda rapida` queda separada bajo el texto `La prenda no existe?`.
- La busqueda y escaneo se mantienen visibles, pero ya no compiten con `Agregar prenda`.
- Se redujo padding vertical en el flujo de captura para hacerlo mas operativo.

## Criterios QA

- El operador debe identificar la accion primaria sin leer todos los botones.
- Las acciones excepcionales no deben parecer obligatorias.
- El flujo debe seguir funcionando sin cambios de backend.
