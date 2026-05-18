# ERP LIVE Facebook Integration Design

Fecha: 2026-05-18  
Rama: `feature/live-b-arquitectura-metricas-engagement`  
Tipo: diseno tecnico futuro, sin integracion runtime

## Objetivo

Disenar la futura integracion con Facebook/Meta Live como un adaptador tenant-aware, auditable y desacoplado del flujo operativo actual. Esta fase no implementa Graph API, tokens, webhooks ni UI nueva.

## Principios

- La integracion sera por company.
- Tokens Facebook nunca seran globales.
- HPSQ-SOFT no debe operar tokens de clientes sin auditoria.
- Los errores de Facebook no deben romper captura local de reservas.
- El ERP debe poder operar LIVE sin Facebook.

## Permisos Facebook/Meta A Evaluar

PENDIENTE DE VALIDAR contra documentacion Meta vigente antes de implementar:

- Lectura de paginas vinculadas.
- Lectura de videos/live asociados a pagina.
- Lectura de comentarios.
- Lectura de reacciones/engagement disponible.
- Webhooks para comentarios/reacciones si aplica.

Regla: no solicitar permisos mas amplios que los necesarios.

## Modelo Por Tenant

Elementos futuros por company:

- `company_id`
- `facebook_page_id`
- `facebook_page_name`
- `facebook_token_reference`
- `token_expires_at`
- `sync_enabled`
- `last_sync_at`
- `last_sync_status`
- `created_by`
- `updated_by`
- auditoria

No guardar:

- Tokens planos en logs.
- Comentarios con datos sensibles innecesarios.
- Respuestas completas de Graph API sin sanitizar.

## Adapter Facebook

Responsabilidades futuras:

- Encapsular Graph API.
- Renovar o marcar tokens vencidos.
- Consultar comentarios.
- Consultar reacciones.
- Consultar viewers si la API lo permite.
- Mapear errores externos a errores amigables ERP.
- Aplicar rate limit y backoff.
- Emitir eventos `FACEBOOK_SYNC_STARTED`, `FACEBOOK_SYNC_FAILED`.

No debe:

- Crear ventas.
- Crear pagos.
- Modificar reservas sin servicio de dominio.
- Saltarse `CurrentTenantContext`.
- Compartir tokens entre companies.

## Polling vs Webhook

Polling:

- Mas simple para primera version.
- Menor dependencia de configuracion publica.
- Riesgo de retraso en metricas.
- Riesgo de rate limit si se consulta demasiado.

Webhook:

- Mas cercano a tiempo real.
- Requiere endpoint publico seguro.
- Requiere verificacion de firma.
- Mayor complejidad operativa.

Recomendacion:

1. LIVE-E: metricas internas sin Facebook.
2. LIVE-F: decidir polling/webhook con prueba tecnica.
3. LIVE-G: iniciar con polling controlado si Meta lo permite y pasar a webhook solo cuando haya observabilidad y seguridad listas.

## Seguridad

Controles obligatorios:

- Token cifrado o referenciado mediante almacenamiento seguro.
- Token por company.
- Auditoria de conexion/desconexion.
- Auditoria de sincronizaciones manuales.
- No loggear token ni payload completo.
- Validar `company_id` en cada request.
- Prohibir que usuario Empresa A vincule pagina de Empresa B.
- Soporte HPSQ-SOFT con acceso delegado, motivo y expiracion.

## Errores De Sincronizacion

Errores esperados:

- Token vencido.
- Permiso revocado.
- Pagina no encontrada.
- Live no encontrado.
- Rate limit.
- Error temporal Meta.
- Payload inesperado.

UX futura:

- Mostrar alerta no alarmante.
- Mantener operacion local.
- Permitir reintentar si el usuario tiene permiso.
- Enviar detalle tecnico solo a soporte.

## Auditoria

Acciones auditables:

- Conectar cuenta/pagina.
- Desconectar pagina.
- Renovar token.
- Fallo de sincronizacion.
- Sincronizacion manual.
- Cambio de live externo asociado.
- Acceso soporte a configuracion Facebook.

Campos minimos:

- `company_id`
- `live_id`
- `actor_user_id`
- `actor_role`
- `action`
- `reason`
- `timestamp`
- `request_id`
- resultado

## QA Futuro

- Empresa A conecta pagina A y no ve pagina B.
- Usuario sin permiso no ve configuracion Facebook.
- Token vencido muestra alerta amigable.
- Sin Facebook, LIVE local sigue funcionando.
- Error Meta no crea duplicados.
- Comentarios duplicados no duplican engagement.
- Logs no contienen token.

## NO Implementar Todavia

- OAuth Meta.
- Persistencia de tokens.
- Webhooks.
- Polling runtime.
- UI de comentarios.
- Dashboard de metricas.
- Automatizacion de ventas o pagos desde comentarios.
