# Control Ropa - Documentacion del sistema

Este directorio contiene la fuente de verdad del sistema para desarrollo backend, frontend y uso con Codex.

## Estructura de documentos

Reglas y logica de negocio:
- `definitions.md`
- `backend-rules.md`

Pantallas y UX:
- `screens.md`
- `frontend-guidelines.md`

Flujos del sistema:
- `flows.md`

Modelo de datos:
- `data-model.md`

Backend real:
- `backend-current-state.md`
- `catalogo_endpoints_control_ropa_actualizado.md`

## Reglas importantes

Pedidos:
- No se crean manualmente desde UI.
- Se crean automaticamente al crear reserva o venta.
- Debe existir 1 pedido activo por cliente por sucursal cuando el flujo lo requiera.

Pagos:
- Pueden ser parciales.
- Pueden exceder el monto; el excedente queda como saldo a favor.
- No permitir pago si saldo pendiente = 0.
- La pantalla Pagos / Cobros debe operar sobre pedidos con apartados pendientes.
- Venta puerta no se cobra desde Pagos / Cobros; se cobra dentro de su propio flujo.

Reservas:
- Siempre requieren cliente.
- No generan venta directa.
- Pueden agruparse en un pedido cuando el cliente aparta varias prendas.

Venta puerta:
- El cliente compra fisicamente en sucursal y se lleva sus prendas.
- Debe terminar con venta pagada y prendas vendidas.
- No genera paquete.

## Uso con Codex

Usa los documentos en `/docs` como fuente de verdad.
No inventes endpoints ni logica fuera de estos archivos.

## Que no debe hacer Codex

- Crear endpoints nuevos sin validación.
- Permitir creacion manual de pedidos.
- Romper flujos del sistema.

## Que si debe hacer Codex

- Usar endpoints existentes.
- Respetar reglas de negocio.
- Seguir flujos definidos.
- Revisar el backend real cuando haya duda entre documento y código.

## Flujo principal

Apartado puerta:
- Reserva -> Pedido -> Pago -> Paquete si hay entrega posterior.

Venta puerta:
- Venta -> Pedido cerrado/pagado -> Sin paquete.
