# ERP - Roles y permisos SaaS

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania y SaaS admin  
Tipo: propuesta, sin cambios de seguridad real

## Objetivo

Separar roles de plataforma HPSQ-SOFT de roles operativos del ERP cliente.

Regla principal: un rol cliente nunca debe acceder a la consola SaaS HPSQ-SOFT.

## Roles HPSQ-SOFT

### HPSQ_SUPERADMIN

Alcance:

- Plataforma completa.

Permisos:

- Crear/editar/suspender/reactivar empresas.
- Gestionar planes y modulos.
- Gestionar usuarios HPSQ-SOFT.
- Ver auditoria global.
- Abrir soporte delegado.

Limites:

- No operar ventas/pagos directamente.
- No borrar datos productivos sin proceso formal.

Modulos visibles:

- Dashboard SaaS.
- Empresas.
- Planes.
- Soporte.
- Auditoria.
- Salud.
- Incidencias.

Auditoria:

- Obligatoria en todas las acciones.

### HPSQ_SUPPORT

Alcance:

- Soporte tecnico por empresa autorizada.

Permisos:

- Ver estado de empresa.
- Consultar logs filtrados.
- Desbloquear usuarios segun politica.
- Abrir sesion de soporte con motivo/ticket.

Limites:

- No cambiar plan.
- No suspender/reactivar empresa.
- No modificar ventas/pagos.
- Preferir lectura sobre escritura.

Auditoria:

- Obligatoria con `support_access_session`.

### HPSQ_BILLING

Alcance:

- Suscripciones y estado comercial.

Permisos:

- Ver planes.
- Cambiar plan.
- Aplicar periodo de gracia.
- Suspender/reactivar por estado comercial.
- Ver vencimientos.

Limites:

- No acceder a detalle operativo sensible.
- No operar soporte tecnico profundo.

Auditoria:

- Obligatoria en cambios de plan/estado.

### HPSQ_IMPLEMENTATION

Alcance:

- Alta inicial y puesta en marcha.

Permisos:

- Crear empresa en implementacion.
- Configurar branding inicial.
- Crear primer administrador de compania.
- Configurar sucursales base si el flujo lo permite.

Limites:

- No gestionar facturacion.
- No operar datos productivos despues del go-live sin soporte autorizado.

Auditoria:

- Obligatoria en alta/configuracion inicial.

### HPSQ_AUDITOR

Alcance:

- Revision y cumplimiento.

Permisos:

- Ver bitacoras SaaS.
- Ver historial de soporte.
- Ver cambios de plan/estado.
- Ver evidencia de acciones HPSQ-SOFT.

Limites:

- Solo lectura.
- No impersonation.
- No cambios de configuracion.

Auditoria:

- Registrar consultas sensibles.

## Roles cliente

### COMPANY_OWNER

Alcance:

- Toda su compania.

Permisos:

- Administrar compania dentro de limites del plan.
- Ver reportes globales de compania.
- Administrar usuarios/sucursales permitidos.
- Ver configuracion propia.

Limites:

- No acceder consola SaaS.
- No cambiar estado comercial ni plan sin flujo HPSQ-SOFT.
- No ver otras companias.

### COMPANY_ADMIN

Alcance:

- Compania asignada.

Permisos:

- Administrar usuarios operativos.
- Administrar catalogos permitidos.
- Ver reportes segun permiso.
- Gestionar sucursales si el plan lo permite.

Limites:

- No cambiar owner.
- No acceder a billing HPSQ-SOFT.
- No ver auditoria global.

### BRANCH_MANAGER

Alcance:

- Sucursales asignadas dentro de su compania.

Permisos:

- Operacion y consulta de sucursal.
- Ver reportes de sucursal.
- Supervisar caja/inventario segun permisos.

Limites:

- No ver otras sucursales no asignadas.
- No administrar plan/empresa.

### CASHIER

Alcance:

- Sucursal asignada.

Permisos:

- Venta puerta.
- Pagos/cobros.
- Reservas segun permiso.
- Consulta minima de clientes/prendas.

Limites:

- No reportes globales.
- No usuarios/permisos.
- No consola SaaS.

### INVENTORY_MANAGER

Alcance:

- Inventario/lotes de sucursales asignadas.

Permisos:

- Alta/consulta de prendas.
- Recepcion/clasificacion de lotes.
- Transferencias/devoluciones segun permiso.

Limites:

- No pagos.
- No planes.
- No datos de otras companias.

### REPORTS_USER

Alcance:

- Reportes de compania/sucursal asignada.

Permisos:

- Ver reportes habilitados.
- Exportar si existe permiso.

Limites:

- Solo lectura.
- No modificar operaciones.
- No reportes de otras companias.

### SUPPORT_CONTACT

Alcance:

- Contacto del cliente para soporte.

Permisos:

- Levantar incidencias.
- Ver estado de tickets propios si se implementa.
- Autorizar soporte delegado si politica lo requiere.

Limites:

- No es soporte HPSQ-SOFT.
- No accede a consola SaaS.

### NO_ACCESS

Alcance:

- Usuario autenticable sin modulos operativos.

Permisos:

- Login basico si esta activo.
- Ver pantalla sin accesos o mensaje de contacto.

Limites:

- No acciones operativas.
- No reportes.
- No consola SaaS.

## Permisos SaaS sugeridos

- `SAAS_COMPANY_VIEW`
- `SAAS_COMPANY_CREATE`
- `SAAS_COMPANY_UPDATE`
- `SAAS_COMPANY_SUSPEND`
- `SAAS_COMPANY_REACTIVATE`
- `SAAS_SUBSCRIPTION_VIEW`
- `SAAS_SUBSCRIPTION_MANAGE`
- `SAAS_MODULES_MANAGE`
- `SAAS_SUPPORT_OPEN_SESSION`
- `SAAS_SUPPORT_VIEW_LOGS`
- `SAAS_SUPPORT_UNLOCK_USER`
- `SAAS_AUDIT_VIEW`
- `SAAS_INCIDENT_MANAGE`
- `SAAS_BRANDING_MANAGE`

## Acciones prohibidas por rol

| Rol | Prohibido |
|---|---|
| HPSQ_SUPPORT | Cambiar plan, borrar datos, modificar ventas/pagos |
| HPSQ_BILLING | Ver detalle operativo sensible, soporte tecnico profundo |
| HPSQ_IMPLEMENTATION | Operar datos productivos post go-live sin soporte |
| HPSQ_AUDITOR | Modificar configuracion o impersonar |
| COMPANY_OWNER | Consola SaaS, otras companias |
| COMPANY_ADMIN | Billing/planes HPSQ-SOFT, otras companias |
| BRANCH_MANAGER | Sucursales no asignadas |
| CASHIER | Usuarios, permisos, reportes globales |
| INVENTORY_MANAGER | Pagos/caja si no tiene permiso |
| REPORTS_USER | Modificar datos |
| SUPPORT_CONTACT | Acceso tecnico HPSQ-SOFT |
| NO_ACCESS | Todo modulo operativo |

## Regla de auditoria

Auditoria obligatoria para:

- Cualquier permiso `SAAS_*`.
- Cambios de estado de empresa.
- Cambios de suscripcion.
- Acceso soporte.
- Reset/desbloqueo de usuarios.
- Consulta de logs.
- Intentos bloqueados cross-company.
