# AUTH-J1 - Retencion y limpieza segura de auditoria de seguridad

Fecha: 2026-05-27  
Rama: `feature/auth-j1-security-audit-retention`  
Tipo: backend, seguridad, retencion operativa

## Objetivo

Controlar el crecimiento de `security_audit_events` sin cambiar la auditoria existente ni exponer un endpoint de borrado manual.

AUTH-J1 agrega una politica configurable de retencion y un job programado que elimina solo eventos antiguos.

## Configuracion

Propiedades agregadas:

| Propiedad | Default | Uso |
|---|---:|---|
| `security.audit.retention-days` | `180` | Dias que deben conservarse los eventos. |
| `security.audit.cleanup.enabled` | `true` | Habilita o deshabilita la limpieza automatica. |
| `security.audit.cleanup-cron` | `0 0 3 * * *` | Cron Spring para ejecutar la limpieza diaria de madrugada. |

Regla segura:

- Si `cleanup.enabled=false`, no se elimina nada.
- Si `retention-days <= 0`, no se elimina nada y se registra warning.
- Si no existen eventos antiguos, el job termina sin error.

## Componentes agregados

- `SecurityAuditRetentionProperties`
- `SecurityAuditCleanupConfiguration`
- `SecurityAuditCleanupService`
- `SecurityAuditCleanupJob`

Repositorio:

- `SecurityAuditEventRepository.deleteByOccurredAtBefore(...)`

## Politica de limpieza

El servicio calcula:

`cutoff = now - security.audit.retention-days`

Luego elimina:

`occurred_at < cutoff`

No toca eventos recientes ni modifica la forma en que se registran o consultan eventos.

## Scheduling

AUTH-J1 habilita scheduling de Spring de forma acotada en la configuracion de limpieza de auditoria.

El job usa:

`@Scheduled(cron = "${security.audit.cleanup-cron:0 0 3 * * *}")`

## Endpoint manual

No se crea endpoint manual de purge en AUTH-J1.

Motivo:

- Evita superficie adicional de borrado.
- Reduce riesgo operativo.
- Mantiene la fase enfocada en limpieza automatica controlada.

## Pruebas

Pruebas agregadas:

`SecurityAuditCleanupServiceTests`

Casos cubiertos:

- Evento mas viejo que la retencion se elimina mediante cutoff.
- Evento reciente se conserva porque el borrado solo usa `occurred_at < cutoff`.
- Limpieza deshabilitada no elimina nada.
- `retention-days=0` no elimina nada.
- `retention-days` negativo no elimina nada.
- Sin eventos antiguos devuelve `0` sin fallar.

## Datos sensibles

AUTH-J1 no cambia los datos almacenados y no agrega nuevos campos. Se mantiene la regla de AUTH-G:

- No guardar passwords.
- No guardar tokens completos.
- No guardar cuerpos completos de request.

## Rollback

- Revertir clases de limpieza y propiedades.
- No se requiere migracion de rollback porque AUTH-J1 no cambia estructura de base.
- Si se configurara una retencion demasiado corta, restaurar backup antes de reactivar el job.

## Limitaciones

- No hay retencion diferenciada por tipo de evento.
- No hay archivado historico a tabla fria o archivo externo.
- No hay endpoint manual de purge.
- No hay UI para configurar estos valores; se administran por properties/despliegue.

## Siguiente fase recomendada

- AUTH-J2: resumen estadistico para analizar eventos disponibles sin revisar linea por linea. Implementado en `docs/AUTH_J2_SECURITY_AUDIT_SUMMARY.md`.
- AUTH-J3: archivado/export controlado si soporte requiere conservar evidencia mas alla de la retencion.
- AUTH-J4: alertas por patrones repetidos de `TOKEN_REVOKED`, `PERMISSION_DENIED` o `BRANCH_DENIED`.
