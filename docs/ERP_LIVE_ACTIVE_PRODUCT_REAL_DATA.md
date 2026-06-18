# ERP LIVE - Producto activo con datos reales

Fecha: 2026-05-20  
Fase: LIVE-U - producto activo real y estado presentadora

## Objetivo

Evitar que `Producto en pantalla` dependa de datos demostrativos cuando ya existe informacion real en el flujo En vivo.

## Fuente de datos aplicada

El producto visible se resuelve en este orden:

1. Prenda seleccionada en el flujo de reserva.
2. Ultima prenda reservada en la transmision seleccionada.
3. Fallback operativo `Sin producto en pantalla`.

## Datos mostrados

Cuando existe prenda seleccionada se muestran:

- nombre/tipo de prenda,
- precio real si existe,
- codigo,
- talla,
- estado,
- marca/talla/sucursal como contexto compacto.

Cuando falta informacion se usan textos claros:

- `Sin codigo`,
- `Sin talla`,
- `Precio no definido`,
- `Sin producto en pantalla`.

## Alcance

- Solo frontend LIVE.
- No se modifico backend.
- No se modificaron pagos, ventas, reportes, SQL ni migraciones.
- No se implemento realtime.

## Riesgo pendiente

La ultima prenda reservada solo trae codigo desde reservaciones; para mostrar precio/talla completa desde historial se requiere enriquecer API o mantener cache local de items en una fase posterior.
