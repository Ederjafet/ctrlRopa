# ERP LIVE Events Tracking Model

Fecha: 2026-05-18  
Rama: `feature/live-b-arquitectura-metricas-engagement`  
Tipo: modelo conceptual futuro, sin migraciones

## Objetivo

Definir el modelo futuro de eventos LIVE para tracking, metricas, engagement, auditoria y futura integracion Facebook. Este documento no crea tablas ni cambia codigo.

## Evento Canonico Futuro

Campos recomendados:

| Campo | Descripcion |
|---|---|
| `id` | Identificador interno |
| `company_id` | Tenant obligatorio |
| `branch_id` | Sucursal operativa |
| `live_id` | Live asociado |
| `event_type` | Tipo normalizado |
| `event_source` | `ERP`, `FACEBOOK`, `SYSTEM`, `SUPPORT` |
| `external_event_id` | Id externo para deduplicacion |
| `customer_id` | Opcional |
| `item_id` | Opcional |
| `reservation_id` | Opcional |
| `actor_user_id` | Usuario ERP que ejecuto accion |
| `viewer_external_id` | Identificador externo seudonimizado si aplica |
| `payload_json` | Payload minimo sanitizado |
| `occurred_at` | Fecha real del evento |
| `received_at` | Fecha en que ERP recibio evento |
| `request_id` | Trazabilidad tecnica |
| `correlation_id` | Correlacion entre eventos |

## Tipos De Evento

| Evento | Fuente | Proposito |
|---|---|---|
| `LIVE_CREATED` | ERP | Live creado |
| `LIVE_SCHEDULED` | ERP | Live programado |
| `LIVE_STARTED` | ERP/FACEBOOK | Live iniciado |
| `LIVE_PAUSED` | ERP | Pausa operativa |
| `LIVE_RESUMED` | ERP | Reanudacion |
| `LIVE_CLOSED` | ERP | Cierre operativo |
| `LIVE_CANCELLED` | ERP | Cancelacion |
| `VIEWER_JOINED` | FACEBOOK | Viewer entra |
| `VIEWER_LEFT` | FACEBOOK | Viewer sale |
| `COMMENT_RECEIVED` | FACEBOOK | Comentario recibido |
| `REACTION_RECEIVED` | FACEBOOK | Reaccion recibida |
| `PRODUCT_PINNED` | ERP | Producto destacado |
| `PRODUCT_CLICKED` | FACEBOOK/ERP | Interaccion con producto |
| `RESERVATION_CREATED` | ERP | Reserva creada |
| `SALE_INTENT_CREATED` | ERP/FACEBOOK | Intencion de compra |
| `MODERATOR_ACTION` | ERP | Accion de moderacion |
| `FACEBOOK_SYNC_STARTED` | SYSTEM | Inicio sincronizacion |
| `FACEBOOK_SYNC_FAILED` | SYSTEM | Error sincronizacion |

## Deduplicacion

Reglas futuras:

- Si `external_event_id` existe, debe ser unico por `company_id`, `event_source`, `event_type`.
- Si no existe, deduplicar por hash de payload minimo + `occurred_at` aproximado.
- Nunca deduplicar globalmente sin `company_id`.

## Agregacion

LIVE Engagement Aggregator futuro debe calcular:

- Conteos por minuto.
- Viewers pico.
- Comentarios totales.
- Reacciones totales.
- Productos destacados/clicados.
- Reservas generadas.
- Intenciones de venta.
- Engagement rate.

Agregacion recomendada:

- Evento crudo inmutable.
- Tabla/materializacion de metricas por `company_id/live_id/minute`.
- Recalculo seguro ante eventos tardios.

## Privacidad

- Evitar guardar nombres personales externos si no son necesarios.
- Seudonimizar viewer externo cuando aplique.
- No guardar tokens ni payload completo Meta.
- Logs tecnicos sin datos sensibles.

## Multi-Tenant Enforcement

Reglas obligatorias:

- `company_id` obligatorio en cada evento.
- `live_id` debe pertenecer a la misma company.
- `branch_id` debe pertenecer a la misma company.
- `item_id`, `customer_id` y `reservation_id` deben validarse contra company activa.
- Consultas analytics siempre filtran por company activa.

## QA Futuro

- Evento de Empresa A no aparece en Empresa B.
- Evento duplicado no infla metricas.
- Evento tardio recalcula agregacion.
- Live cerrado rechaza eventos operativos internos nuevos.
- Evento Facebook fallido genera `FACEBOOK_SYNC_FAILED`.
- Payload sensible no aparece en logs.

## Roadmap De Implementacion

1. Diseno final de tabla y migracion.
2. Eventos internos ERP sin Facebook.
3. Agregador interno.
4. Dashboard interno.
5. Adapter Facebook.
6. QA cross-company.
7. Hardening de auditoria y observabilidad.
