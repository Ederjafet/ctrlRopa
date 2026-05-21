# ERP LIVE - Vista para presentadora y estado real

Fecha: 2026-05-20  
Fase: LIVE-U

## Objetivo

La vista para presentadora debe mostrar estado operativo real o derivado del flujo actual, no textos genericos de demostracion.

## Comportamiento definido

- Sin transmision seleccionada: indica que debe seleccionarse una transmision para iniciar la operacion.
- Con transmision y sin producto: indica que debe seleccionarse una prenda para mostrarla en pantalla.
- Con producto y transmision abierta: muestra producto listo y sugiere activar la transmision al iniciar operacion.
- Con producto y transmision activa: muestra que la presentadora puede presentar el producto y pedir reservas.

## Estado operativo

El bloque `Estado operativo` usa la transmision seleccionada:

- Sin transmision seleccionada.
- Transmision abierta.
- Transmision activa.
- Transmision cerrada.

El texto se redujo para lectura rapida en tablet y movil.

## Pendiente futuro

Para operacion multioperador real se requiere sincronizacion de producto activo entre dispositivos. En esta fase se mantiene estado local/frontend y datos disponibles del flujo actual.
