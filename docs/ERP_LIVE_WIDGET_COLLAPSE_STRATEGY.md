# ERP LIVE - Estrategia de colapso de widgets

Fecha: 2026-05-21  
Fase: LIVE-W refinamiento adicional

## Objetivo

Definir como debe comportarse En vivo cuando el usuario oculta widgets configurables desde Sistema.

## Widgets considerados

- Spotlight producto.
- Vista presentadora.
- Estado operativo.
- Roles del equipo.
- Analiticos.
- Actividad En vivo.

## Regla de colapso

Si la columna visual de contexto queda sin widgets utiles, el layout no debe reservar ese espacio.

## Desktop

- Se elimina la columna izquierda.
- La consola del operador queda como columna principal.
- Reservas y cierre quedan como columna secundaria.

## Tablet

- Se usa una sola columna operativa amplia.
- Se prioriza captura, reservas y cierre.

## Mobile

- Se omite cualquier columna vacia.
- Se conserva stack vertical compacto.

## Persistencia

La configuracion sigue siendo local. La persistencia backend por usuario, empresa, rol o layout queda pendiente para una fase posterior.

## Riesgo

Ocultar demasiados widgets puede reducir contexto para supervisor. QA debe validar perfiles de operacion antes de usarlo en produccion.
