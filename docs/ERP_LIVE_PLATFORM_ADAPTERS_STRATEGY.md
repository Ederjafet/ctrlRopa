# ERP LIVE-L - Platform Adapters Strategy

Fecha: 2026-05-19

## Objetivo

Disenar la estrategia futura para conectar `En vivo` con plataformas externas sin implementar integraciones reales en esta fase.

## Principio arquitectonico

Cada plataforma debe integrarse mediante un adaptador aislado:

- Facebook Adapter,
- YouTube Adapter,
- Instagram Adapter,
- TikTok Adapter,
- Generic Manual Adapter.

El core del ERP no debe depender directamente de un SDK o API especifica.

## Multi-tenant

- Cada token debe pertenecer a una company.
- Nunca almacenar tokens globales.
- La company A no puede leer transmisiones, metricas ni comentarios de company B.
- Toda accion de conexion/desconexion debe auditarse.

## Responsabilidades del adaptador

- Autenticacion OAuth o equivalente.
- Renovacion de tokens.
- Consulta de comentarios.
- Consulta de reacciones.
- Consulta de espectadores si la API lo permite.
- Normalizacion de eventos.
- Manejo de errores/rate limits.

## Limitaciones por plataforma

### Facebook

- Requiere permisos de Meta.
- Puede requerir revision de app.
- Comentarios/reacciones dependen de permisos y tipo de pagina.

### YouTube

- Requiere OAuth y cuotas API.
- Disponibilidad de chat depende de transmision y configuracion.

### Instagram

- API mas restringida.
- Comentarios/live pueden requerir permisos comerciales especificos.

### TikTok

- Disponibilidad API puede variar.
- Integracion productiva debe validarse contra terminos y permisos vigentes.

## Eventos normalizados futuros

- `LIVE_STARTED`
- `VIEWER_JOINED`
- `COMMENT_RECEIVED`
- `REACTION_RECEIVED`
- `PRODUCT_PINNED`
- `RESERVATION_CREATED`
- `LIVE_CLOSED`

## Seguridad

- No registrar tokens en logs.
- No exponer IDs externos a usuarios sin permiso.
- Auditar soporte HPSQ-SOFT.
- Separar permisos SaaS de permisos operativos.

## Roadmap recomendado

1. Normalizar eventos internos sin plataforma externa.
2. Crear modelo de comentarios/interacciones manuales.
3. Crear adaptador generico mock/QA.
4. Disenar OAuth por tenant.
5. Implementar una plataforma piloto.
6. Agregar dashboard de integracion y errores.

## Fuera de alcance actual

- Runtime real de plataformas.
- Webhooks.
- WebSockets.
- Persistencia nueva de tokens.
- Sincronizacion realtime.
