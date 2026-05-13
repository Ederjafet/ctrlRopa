# ERP - Riesgos operativos

Fecha: 2026-05-12

## Escala

Severidad:

- CRITICO: puede afectar dinero, seguridad, inventario o continuidad operativa.
- ALTO: puede afectar un flujo principal o generar reproceso fuerte.
- MEDIO: afecta eficiencia, soporte o trazabilidad parcial.
- BAJO: afecta claridad o mantenimiento sin detener operacion.

Probabilidad:

- ALTA: ya se observo o es probable por estructura actual.
- MEDIA: depende de uso, datos o permisos.
- BAJA: posible pero no frecuente.

## Matriz de riesgos

| Riesgo | Severidad | Probabilidad | Impacto operacional | Mitigacion | Rollback |
|---|---|---|---|---|---|
| Venta sin validacion clara | CRITICO | MEDIA | Venta incompleta, prenda mal afectada, diferencia de caja. | Validaciones accionables, regresion de venta puerta, mensajes claros. | Revertir pantalla/servicio afectado y validar item/pago. |
| Pago/anulacion con error | CRITICO | MEDIA | Saldo o caja incorrecta. | QA especifico de pagos, auditoria financiera, permisos revisados. | Revertir backend/frontend y revisar movimientos financieros. |
| Permisos incompletos | CRITICO | ALTA | Usuario ejecuta accion indebida o queda bloqueado. | Matriz endpoint-permiso, pruebas con usuario permitido/no permitido. | Revertir cambio de permisos o rol; validar sesion. |
| Seguridad dispersa por servicio | CRITICO | ALTA | Endpoint sin `assertCan` podria quedar expuesto. | Fase de seguridad dedicada, pruebas por controlador, revision `SecurityConfig.java`. | Revertir cambio de seguridad; bloquear ruta si aplica. |
| Lote recibido con mala captura | ALTO | MEDIA | Inventario incorrecto desde origen. | Validaciones de cantidad/calidad/proveedor, QA de recepcion. | Revertir recepcion si existe operacion; si no, correccion controlada. |
| Live asociado incorrectamente | ALTO | MEDIA | Reservas quedan en live equivocado o sin contexto. | Seleccion clara, historial paginado, pruebas de crear/cerrar live. | Reabrir/corregir reserva si existe soporte; si no, ajuste manual documentado. |
| Cancelaciones sin autorizacion formal | ALTO | ALTA | Perdida de trazabilidad y posibles errores operativos. | Flujo futuro solicitud/aprobacion, motivo obligatorio, auditoria. | Revertir cancelacion solo con procedimiento administrativo. |
| Historiales inmanejables | MEDIO | ALTA | Pantallas lentas o dificiles de operar. | Paginacion/filtros por fase futura. | Revertir pantalla o ocultar historial pesado temporalmente. |
| Logs tecnicos visibles a usuarios operativos | MEDIO | MEDIA | Confusion, exposicion de informacion tecnica. | Perfil tecnico separado, permisos y UX de soporte. | Ocultar ruta/menu de logs. |
| Codificacion rota en textos | MEDIO | MEDIA | Mala experiencia, mensajes poco confiables. | Barridos de mojibake, usar UTF-8, QA visual. | Revertir archivo o corregir texto. |
| Artefactos no rastreados en Git | MEDIO | ALTA | Release con archivos no controlados o ruido en diff. | Limpiar/ignorar antes de release; checklist Git. | No incluir artefactos; restaurar working tree limpio. |
| Auditoria insuficiente | ALTO | ALTA | No se puede explicar quien hizo una accion sensible. | Fase de auditoria, eventos de negocio, revision de logs. | No aplica rollback completo; se mitiga hacia adelante. |
| Fuga de datos entre companias | CRITICO | ALTA si se habilita multi-compania sin tenant scope | Una empresa podria ver clientes, ventas, pagos, inventario o reportes de otra. | Diseno Fase 2A, `company_id` obligatorio, validacion backend, QA negativo por compania. | Desactivar acceso multi-compania, volver a compania default y restaurar backup si hubo migracion. |
| Permisos globales aplicados a varias companias | CRITICO | MEDIA | Un usuario podria heredar permisos administrativos en empresas donde no debe operar. | Roles/permisos por compania, `AccessService` tenant-aware, pruebas con usuario multi-compania. | Revertir asignaciones por compania y bloquear usuario afectado. |
| Reportes sin filtro tenant | CRITICO | MEDIA | Totales financieros o inventario mezclados entre empresas. | Filtros obligatorios por `company_id`, indices compuestos, QA de reportes cruzados. | Bloquear reportes multi-compania y corregir consultas. |
| Soporte tecnico con acceso excesivo | ALTO | MEDIA | HPSQ-SOFT podria ver u operar datos sensibles sin control. | Modo soporte auditado, justificacion, caducidad y permisos limitados. | Revocar sesiones soporte y auditar acciones. |
| Consola SaaS visible para clientes | CRITICO | MEDIA si se mezclan roles | Cliente podria administrar otras empresas o ver informacion global. | Rutas privadas, roles `SAAS_*`, pruebas negativas y auditoria. | Ocultar/deshabilitar consola y revocar permisos SaaS. |
| Suspension comercial mal aplicada | ALTO | MEDIA | Empresa suspendida podria seguir operando o empresa activa quedar bloqueada. | Validar estado de compania en login/endpoints y QA reactivacion. | Revertir estado desde historial y revalidar acceso. |
| Limites de plan solo en frontend | ALTO | MEDIA | Cliente podria exceder usuarios, sucursales o modulos por API. | Validacion backend contra `company_subscriptions`. | Desactivar recurso excedente con proceso administrativo. |
| Soporte HPSQ-SOFT modifica datos financieros | CRITICO | BAJA/MEDIA | Riesgo de saldos/caja incorrectos y responsabilidad operativa. | Prohibir por defecto; herramienta auditada y aprobacion formal si se requiere. | Auditoria, reversa operacional y bloqueo de sesion soporte. |
| Endpoint P0 sin tenant validation | CRITICO | ALTA durante migracion | Un id directo, folio o branchId podria exponer datos de otra empresa. | Usar `ERP_TENANT_ENDPOINT_MATRIX.md`, bloquear release si endpoint P0 queda sin `company_id`. | Deshabilitar multi-compania o bloquear endpoint afectado. |
| Tabla P0 sin company_id/backfill | CRITICO | ALTA durante migracion | Datos existentes podrian quedar huerfanos o mezclados. | Usar `ERP_TENANT_TABLE_MATRIX.md`, conteos antes/despues, migracion gradual. | Restaurar backup o mantener columna nullable hasta corregir. |
| Accion HPSQ-SOFT sin auditoria SaaS | CRITICO | MEDIA | No se podria explicar quien suspendio, cambio plan o accedio a soporte. | Usar `ERP_SAAS_AUDIT_ACTIONS_MATRIX.md`, motivo y doble confirmacion cuando aplique. | Revocar permisos SaaS y suspender consola. |
| CurrentTenantContext incompleto | CRITICO | MEDIA durante implementacion | Servicios podrian validar usuario pero no company/branch/plan, dejando huecos cross-company. | Diseno Fase 2C, tenant resolver central, pruebas negativas. | Bloquear endpoints tenant o revertir foundation. |
| Cache o logs sin company context | ALTO | MEDIA | Datos/logs de una empresa podrian verse en otra o soporte podria analizar informacion equivocada. | Reglas de enforcement tenant-aware, cache key con companyId, logs sanitizados. | Desactivar cache o filtros afectados. |
| Company suspendida opera con token previo | CRITICO | MEDIA | Cliente suspendido podria seguir vendiendo/cobrando. | Validar estado company en cada request P0 y revocar sesiones al suspender. | Revocar sesiones y bloquear company. |

## Acciones que deberian auditarse

- Login fallido/bloqueo/desbloqueo.
- Crear/editar/desactivar proveedor.
- Crear/recibir/conciliar/cancelar lote.
- Alta/modificacion de prenda.
- Venta, cancelacion de venta, reserva, cancelacion de reserva.
- Pago/anulacion/aplicacion de saldo.
- Cierre/cancelacion de caja.
- Preparacion/cancelacion de paquete.
- Envio/despacho/resolucion/reapertura.
- Cambios de permisos, roles, usuarios y configuracion de seguridad.
- Alta/edicion/suspension/reactivacion de empresa.
- Cambios de plan, limites y modulos habilitados.
- Acceso soporte HPSQ-SOFT a una empresa.
- Consulta de logs por HPSQ-SOFT.
- Reset/desbloqueo de usuarios cliente desde consola SaaS.
- Cambios de branding por empresa.

## Riesgos criticos actuales

- Permisos incompletos por validacion dispersa.
- Multi-compania sin tenant context seria riesgo CRITICO de fuga de datos.
- Consola SaaS sin separacion de roles HPSQ-SOFT/cliente seria riesgo CRITICO.
- Fase 2B identifica endpoints/tablas P0; implementacion sin esas matrices cerradas seria riesgo CRITICO.
- Fase 2C define foundation tenant; implementacion sin `CurrentTenantContext` central seria riesgo CRITICO.
- Pagos/ventas sin regresion automatizada suficiente.
- Auditoria de negocio todavia parcial.
- Artefactos no rastreados antes de release.
