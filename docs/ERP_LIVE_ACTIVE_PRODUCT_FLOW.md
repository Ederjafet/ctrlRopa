# ERP LIVE - Flujo de producto activo

Fecha: 2026-05-20  
Fase: LIVE-S

## Objetivo

Hacer visible para presentadora y operador cual prenda esta al aire durante la transmision.

## Implementacion aplicada

En esta fase no se implemento realtime ni backend nuevo. El producto activo se deriva de la prenda seleccionada en el flujo de reserva de `app/live.tsx`.

Se muestra:

- nombre/tipo de prenda,
- precio,
- codigo,
- talla,
- estado visual `Producto al aire`.

## Flujo operativo actual

1. Operador selecciona o escanea una prenda.
2. Product Spotlight actualiza la prenda visible.
3. Presentadora puede leer producto, precio, codigo y talla.
4. La reserva usa la misma prenda seleccionada.

## Arquitectura futura

Para multioperador real se recomienda:

- tabla/evento `live_active_product_changed`,
- `company_id`, `branch_id`, `live_id`, `item_id`,
- evento auditable,
- refresh controlado o canal realtime futuro,
- bloqueo de producto si no pertenece a company/branch activa.

## Riesgos

- Si otro dispositivo cambia producto, esta fase no lo sincroniza.
- El producto activo actual es estado frontend, no fuente de verdad multiusuario.
- No debe usarse como promesa de realtime hasta tener backend/eventos.
