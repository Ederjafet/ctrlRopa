# ERP - Matriz de acciones SaaS auditables HPSQ-SOFT

Fecha: 2026-05-13  
Fase: 2B - acciones auditables SaaS  
Rama: `feature/fase2b-matriz-tenant-endpoints`  
Tipo: analisis documental, sin implementacion

## Objetivo

Definir las acciones de la consola privada HPSQ-SOFT que deben quedar auditadas antes de implementar la operacion SaaS multi-compania.

Regla principal: toda accion HPSQ-SOFT sobre una empresa debe responder quien, cuando, sobre que empresa, con que rol, con que motivo, desde donde, que cambio y con que resultado.

## Campos minimos de auditoria SaaS

- `audit_id`
- `company_id`
- `actor_user_id`
- `actor_role`
- `support_session_id` si aplica
- `action_code`
- `entity_type`
- `entity_id`
- `before_value` o resumen seguro
- `after_value` o resumen seguro
- `reason`
- `ticket_reference`
- `ip_address`
- `user_agent`
- `result`
- `created_at`

## Matriz

| Accion HPSQ-SOFT | Rol HPSQ permitido | Impacto | Auditoria requerida | Motivo obligatorio | Doble confirmacion | Visible para cliente | Riesgo |
|---|---|---|---|---|---|---|---|
| Crear empresa | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` | Alta de nuevo tenant | Alta completa, plan inicial, admin inicial si aplica | Si | No | Parcial, empresa ve su alta | ALTO |
| Editar empresa | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` limitado | Cambia datos comerciales/config | Antes/despues de campos editados | Si | No | Parcial | MEDIO |
| Activar empresa | `HPSQ_SUPERADMIN`, `HPSQ_BILLING`, `HPSQ_IMPLEMENTATION` | Permite operacion | Estado anterior/nuevo, motivo | Si | Si si venia cancelada | Si, por acceso recuperado | ALTO |
| Suspender empresa | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Bloquea operacion cliente | Estado, motivo, periodo, actor | Si | Si | Si, mensaje de suspension | CRITICO |
| Cancelar empresa | `HPSQ_SUPERADMIN` | Bloquea y prepara retencion | Estado, motivo, aprobacion, politica retencion | Si | Si | Si | CRITICO |
| Reactivar empresa | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Recupera operacion | Estado anterior/nuevo, motivo | Si | Si | Si | ALTO |
| Cambiar plan | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Cambia limites/modulos | Plan anterior/nuevo, vigencia, actor | Si | Si si downgrade | Parcial | ALTO |
| Habilitar modulos | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION`, `HPSQ_BILLING` | Expone funcionalidad | Modulos antes/despues | Si | No | Si, menu cambia | ALTO |
| Deshabilitar modulos | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Puede bloquear flujo operativo | Modulos antes/despues, impacto | Si | Si | Si, menu cambia | ALTO |
| Modificar limites de usuarios | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Afecta crecimiento | Limite anterior/nuevo | Si | No | Parcial | MEDIO |
| Modificar limites de sucursales | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Afecta operacion | Limite anterior/nuevo | Si | No | Parcial | MEDIO |
| Modificar limite almacenamiento | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Afecta archivos/futuro | Limite anterior/nuevo | Si | No | Parcial | MEDIO |
| Crear admin cliente inicial | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` | Da control al cliente | Usuario, company, rol asignado | Si | No | Si | ALTO |
| Reset usuario cliente | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Recuperacion acceso | Usuario afectado, metodo, expiracion | Si | Si | Si, usuario recibe cambio | ALTO |
| Desbloquear usuario cliente | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Permite login | Usuario, bloqueo anterior | Si | No | Si | MEDIO |
| Revocar sesiones cliente | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Corta accesos activos | Usuario/company/sesiones | Si | Si si masivo | Si, usuario sale | ALTO |
| Impersonation/acceso delegado | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Acceso a contexto cliente | Sesion, motivo, ticket, alcance, expiracion | Si | Si | No como menu, si puede notificarse al owner | CRITICO |
| Cerrar sesion soporte | `HPSQ_SUPPORT`, `HPSQ_SUPERADMIN` | Finaliza acceso delegado | Duracion, acciones realizadas | No si cierre normal | No | No | MEDIO |
| Consultar logs filtrados | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT`, `HPSQ_AUDITOR` | Exposicion tecnica | Filtros, rango, company, resultado | Si | No | No | ALTO |
| Exportar logs/evidencia | `HPSQ_SUPERADMIN`, `HPSQ_AUDITOR` | Posible fuga informacion | Filtros, archivo, destino | Si | Si | No | CRITICO |
| Cambiar branding | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION`, `HPSQ_BILLING` si plan | UX cliente | Campos antes/despues | Si | No | Si | MEDIO |
| Reiniciar configuracion segura | `HPSQ_SUPERADMIN`, `HPSQ_SUPPORT` | Puede restaurar defaults | Config afectada, motivo | Si | Si | Parcial | ALTO |
| Cambiar estado de suscripcion | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Comercial/acceso | Estado anterior/nuevo, vigencia | Si | Si | Si | ALTO |
| Aplicar periodo de gracia | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Permite operar temporalmente | Fechas, motivo | Si | No | Si a admins cliente | MEDIO |
| Quitar periodo de gracia | `HPSQ_SUPERADMIN`, `HPSQ_BILLING` | Puede suspender pronto | Fechas, motivo | Si | Si | Si a admins cliente | ALTO |
| Registrar incidencia cliente | `HPSQ_SUPPORT`, `HPSQ_IMPLEMENTATION`, `HPSQ_SUPERADMIN` | Seguimiento soporte | Empresa, modulo, severidad, comentario | Si | No | Si si portal futuro | MEDIO |
| Cambiar estado incidencia | `HPSQ_SUPPORT`, `HPSQ_IMPLEMENTATION` | Seguimiento soporte | Estado anterior/nuevo | Si | No | Si si portal futuro | BAJO |
| Ver auditoria global | `HPSQ_SUPERADMIN`, `HPSQ_AUDITOR` | Acceso sensible | Filtros consultados | Si para filtros amplios | No | No | ALTO |
| Editar configuracion tenant | `HPSQ_SUPERADMIN`, `HPSQ_IMPLEMENTATION` limitado | Cambia comportamiento cliente | Clave antes/despues | Si | Si si critica | Parcial | ALTO |
| Bloquear/desbloquear modulo por seguridad | `HPSQ_SUPERADMIN` | Puede detener operacion | Modulo, motivo, duracion | Si | Si | Si | CRITICO |

## Acciones prohibidas sin proceso formal

- Borrar datos productivos de cliente.
- Modificar ventas, pagos, caja o saldos directamente.
- Cambiar inventario sin flujo operativo.
- Impersonar sin ticket/motivo/caducidad.
- Consultar logs globales sin filtro cuando el incidente es de una sola empresa.
- Exportar datos de cliente sin autorizacion.

## Niveles de confirmacion

- Confirmacion simple: accion reversible o bajo impacto.
- Doble confirmacion: suspension, cancelacion, downgrade, revocacion masiva, exportacion, reset sensible.
- Aprobacion futura: acciones financieras o borrado productivo. No implementar en Fase 2.

## Eventos que deben bloquear release SaaS

- Accion HPSQ sin auditoria.
- Accion HPSQ sin motivo cuando esta marcado obligatorio.
- Soporte delegado sin expiracion.
- Cliente puede ver rutas SaaS.
- HPSQ_SUPPORT puede cambiar plan o suspender empresa.
- HPSQ_BILLING puede ver detalle operativo sensible sin permiso.
