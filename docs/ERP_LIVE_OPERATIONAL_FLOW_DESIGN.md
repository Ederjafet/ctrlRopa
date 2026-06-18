# ERP LIVE-L - Operational Flow Design

Fecha: 2026-05-19

## Objetivo

Definir como debe operar `En vivo` como flujo real de Live Commerce antes de integrar plataformas externas o metricas realtime.

## Flujo operativo

1. El negocio inicia transmision en una plataforma externa:
   - Facebook,
   - YouTube,
   - Instagram,
   - TikTok,
   - otra plataforma.
2. En HPSQ-SOFT se crea una sesion `En vivo` ligada a company/sucursal.
3. El operador marca o busca la prenda actual.
4. La presentadora muestra la prenda y responde comentarios.
5. El operador registra interesados, clientes y reservas.
6. El supervisor revisa reservas, monto estimado y actividad.
7. Al terminar, se cierra la sesion y se genera/revisa reporte final.

## Roles

### Presentadora

- Muestra prendas.
- Explica tallas, estado, precio y disponibilidad.
- Interactua con clientes.
- No debe cargar con la operacion completa del sistema.

### Operador / capturista

- Selecciona prenda actual.
- Busca prendas anteriores mostradas.
- Registra cliente/interesado.
- Crea reservas.
- Envia a cobro si corresponde.

### Supervisor / dueno

- Revisa metricas.
- Supervisa reservas.
- Identifica productos mas solicitados.
- Revisa reporte final.

### Cliente / espectador

Estados sugeridos:

- espectador,
- interesado,
- cliente,
- comprador,
- cliente recurrente.

## Prenda actual y prendas anteriores

El flujo futuro debe permitir:

- marcar prenda actual;
- reservar prenda ya mostrada en la misma sesion;
- mantener historial de prendas presentadas;
- mostrar producto destacado;
- tener lista rapida de prendas recientes.

## Interacciones

Se debe distinguir:

- quien pide prenda,
- quien solo comenta,
- quien solo reacciona,
- quien se convierte a cliente,
- quien compra o reserva.

## Panel realtime futuro

Para operador/supervisor:

- total de reservas,
- monto estimado,
- prendas apartadas,
- clientes activos,
- comentarios/interacciones,
- productos mas solicitados.

## Metricas deseadas

- prendas mas solicitadas,
- personas mas activas,
- clientes que mas compran,
- comentarios por producto,
- reservas por producto,
- conversion interes -> reserva,
- potencial de venta futura,
- sugerencia de mercancia para otros canales.

## UX por dispositivo

- Tablet: dispositivo principal para operador.
- Desktop: supervision y demo comercial.
- Movil: apoyo o consulta rapida.

## Fuera de alcance actual

- WebSockets.
- Integracion Facebook/YouTube/Instagram/TikTok runtime.
- Pagos LIVE reales.
- Reporte runtime nuevo.
- Automatizacion de comentarios.
