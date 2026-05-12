# ERP - Auditoria y trazabilidad

## Estado actual

Existe `SystemMovementAuditInterceptor.java`, que registra en `system_movement_audit_log` operaciones `/api/*` no GET, exitosas, excluyendo login. La migracion esta en `V24__system_movement_audit_log.sql`.

Campos observados:

- categoria
- event_type
- http_method
- request_path
- query_string
- status_code
- branch_id
- user_id
- user_name
- detail

## Brechas ERP

- No audita GET, lo cual esta bien para volumen, pero hay consultas sensibles que podrian requerir auditoria.
- No audita intentos fallidos con status >= 400.
- No guarda payload resumido ni entidad afectada.
- No diferencia eventos de negocio: "venta registrada", "pago anulado", "lote recibido".
- No audita login en esta tabla; PENDIENTE DE VALIDAR auditoria en `user_login_security`.

## Recomendacion futura

- Agregar `entity_type`, `entity_id`, `business_event`, `before_snapshot`, `after_snapshot` cuando aplique.
- Auditar fallos 403/409 de acciones sensibles.
- Mantener politicas de retencion.
- Exponer bitacora a perfil tecnico/administrativo, no operativo.

