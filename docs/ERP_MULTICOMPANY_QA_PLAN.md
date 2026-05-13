# ERP - QA multi-compania

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania  
Tipo: plan QA, sin ejecucion

## Objetivo

Definir pruebas para demostrar que varias empresas pueden operar en la misma aplicacion/base sin ver ni modificar datos entre si.

Tambien validar que la consola SaaS HPSQ-SOFT administra empresas, planes, soporte y auditoria sin exponer funciones internas a clientes ni alterar datos operativos indebidamente.

## Dataset minimo

Empresas:

- Empresa A: `QA_COMP_A`
- Empresa B: `QA_COMP_B`
- HPSQ-SOFT soporte: `HPSQ_SUPPORT`

Sucursales:

- `A_CTR`, `A_NTE`
- `B_CTR`, `B_SUR`

Usuarios:

- `qa.owner.a@local.test`
- `qa.seller.a@local.test`
- `qa.inventory.a@local.test`
- `qa.reports.a@local.test`
- `qa.owner.b@local.test`
- `qa.seller.b@local.test`
- `qa.sinpermisos.a@local.test`
- `qa.support@hpsqsoft.test`
- `qa.superadmin@hpsqsoft.test`

Datos:

- Clientes A y B con telefonos parecidos.
- Proveedores A y B con nombres/codigos repetibles.
- Items A y B con codigos similares.
- Lotes A y B.
- Ventas, pagos, reservas/live, paquetes y envios por empresa.
- Plan Basico para Empresa A.
- Plan Profesional para Empresa B.
- Empresa suspendida de prueba: `QA_COMP_SUSP`.
- Branding distinto por empresa.
- Sesion de soporte HPSQ-SOFT con ticket ficticio.

## Pruebas criticas

### Login y contexto

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-AUTH-01 | Usuario Empresa A inicia sesion. | Sesion contiene empresa A y sucursales A. | Si |
| MC-AUTH-02 | Usuario Empresa B inicia sesion. | Sesion contiene empresa B y sucursales B. | Si |
| MC-AUTH-03 | Usuario multi-compania cambia contexto. | Datos se recargan solo de compania activa. | Si |
| MC-AUTH-04 | Usuario sin permisos entra. | No ve modulos operativos. | Si |

### Sucursales

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-BR-01 | Usuario A lista sucursales. | Solo A_CTR/A_NTE. | Si |
| MC-BR-02 | Usuario A solicita branch B por URL/API. | 403/404 amigable. | Si |
| MC-BR-03 | Admin A crea sucursal. | Se crea en empresa A. | Si |

### Clientes

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-CUS-01 | Buscar cliente A. | Solo clientes A. | Si |
| MC-CUS-02 | Buscar telefono existente en B desde A. | No devuelve B. | Si |
| MC-CUS-03 | Abrir customerId de B con usuario A. | 403/404. | Si |

### Inventario

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-INV-01 | Usuario A lista prendas. | Solo prendas A. | Si |
| MC-INV-02 | Usuario A escanea QR de B. | Rechazo amigable. | Si |
| MC-INV-03 | Usuario A intenta vender item B. | Bloqueado backend. | Si |

### Lotes y proveedores

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-BAT-01 | Usuario A lista lotes. | Solo lotes A. | Si |
| MC-BAT-02 | Proveedor con mismo nombre en A y B. | Historial/calidad separados. | Si |
| MC-BAT-03 | Lote B por id desde A. | 403/404. | Si |

### Ventas, pagos y caja

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-SALE-01 | Venta A con item A y cliente A. | OK. | Si |
| MC-SALE-02 | Venta A con item B. | Bloqueado. | Si |
| MC-PAY-01 | Pago A aplicado a venta A. | OK. | Si |
| MC-PAY-02 | Pago A aplicado a venta B. | Bloqueado. | Si |
| MC-CASH-01 | Cierre caja A. | No incluye B. | Si |

### Live, reservas, paquetes y envios

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-LIVE-01 | Usuario A lista lives. | Solo lives A. | Si |
| MC-RES-01 | Reserva A con prenda A. | OK. | Si |
| MC-RES-02 | Reserva A con prenda B. | Bloqueado. | Si |
| MC-PKG-01 | Paquete A no acepta item B. | Bloqueado. | Si |
| MC-SHP-01 | Envio A no muestra paquetes B. | OK. | Si |

### Reportes

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-REP-01 | Reporte diario A. | Totales solo A. | Si |
| MC-REP-02 | Reporte depositos A. | Pagos solo A. | Si |
| MC-REP-03 | Reporte live A. | Lives/reservas solo A. | Si |
| MC-REP-04 | Movement history A. | Movimientos solo A. | Si |
| MC-REP-05 | Usuario A envia `branchId` B. | 403/404. | Si |

### Seguridad y soporte

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-SEC-01 | Rol admin A no aplica en B. | Bloqueado. | Si |
| MC-SEC-02 | Soporte abre empresa A con justificacion. | Acceso auditado. | Si |
| MC-SEC-03 | Soporte intenta pago/cancelacion sin permiso. | Bloqueado. | Si |
| MC-SEC-04 | Superadmin crea empresa. | OK y auditado. | Si |

### Consola SaaS HPSQ-SOFT

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-SAAS-01 | Cliente intenta abrir ruta SaaS admin. | 403/404 amigable. | Si |
| MC-SAAS-02 | HPSQ_SUPERADMIN lista empresas. | Ve empresas con estado, plan y salud. | Si |
| MC-SAAS-03 | HPSQ_SUPPORT lista empresas asignadas/permitidas. | Ve solo informacion necesaria. | Si |
| MC-SAAS-04 | HPSQ_BILLING modifica plan. | Cambio auditado sin tocar operacion. | Si |
| MC-SAAS-05 | HPSQ_AUDITOR entra a bitacora. | Solo lectura. | Si |
| MC-SAAS-06 | HPSQ_IMPLEMENTATION crea empresa inicial. | Empresa queda en implementacion y auditada. | Si |

### Suspension/reactivacion

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-SUB-01 | Empresa activa opera normalmente. | Login y operacion OK. | Si |
| MC-SUB-02 | Empresa suspendida intenta login. | Bloqueo amigable sin exponer datos. | Si |
| MC-SUB-03 | Empresa suspendida intenta endpoint con token previo. | Backend bloquea. | Si |
| MC-SUB-04 | Empresa reactivada vuelve a operar. | Acceso recuperado sin perdida de datos. | Si |
| MC-SUB-05 | Historial de estado registra suspension/reactivacion. | Auditoria completa. | Si |

### Limites de plan

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-PLAN-01 | Crear usuario dentro del limite. | OK. | No |
| MC-PLAN-02 | Crear usuario excediendo limite. | Bloqueado por backend. | Si |
| MC-PLAN-03 | Crear sucursal excediendo limite. | Bloqueado por backend. | Si |
| MC-PLAN-04 | Acceder modulo no incluido en plan. | Bloqueado por backend y oculto en UI. | Si |
| MC-PLAN-05 | Upgrade de plan habilita modulo. | Acceso disponible tras recarga. | Si |

### Branding por empresa

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-BRAND-01 | Empresa A inicia sesion. | Muestra nombre/logo/colores A. | No |
| MC-BRAND-02 | Empresa B inicia sesion. | Muestra nombre/logo/colores B. | No |
| MC-BRAND-03 | Usuario multi-compania cambia contexto. | Branding cambia sin mezclar datos. | Si |

### Auditoria SaaS

| ID | Prueba | Esperado | Bloquea |
|---|---|---|---|
| MC-AUD-01 | HPSQ abre sesion soporte. | Queda registrado usuario, empresa, motivo y ticket. | Si |
| MC-AUD-02 | HPSQ consulta logs filtrados. | Queda registro de consulta. | Si |
| MC-AUD-03 | HPSQ suspende empresa. | Queda registro de cambio de estado. | Si |
| MC-AUD-04 | HPSQ intenta accion prohibida. | Bloqueo y auditoria. | Si |

## Evidencia requerida

Para cada prueba critica:

- Usuario.
- Compania activa.
- Sucursal activa.
- Endpoint o pantalla.
- Resultado esperado.
- Resultado real.
- Captura o log.
- Decision: OK/BLOCKED.

## Criterio GO/NO-GO

NO-GO automatico:

- Cualquier dato de empresa B visible para usuario A.
- Cualquier accion financiera cruzada.
- Cualquier reporte con totales mezclados.
- Soporte tecnico sin auditoria.
- Permiso global heredado indebidamente entre companias.
- Consola SaaS visible a usuarios cliente.
- Empresa suspendida puede operar.
- HPSQ-SOFT modifica datos financieros sin herramienta auditada.
- Limites de plan solo aplican en frontend.

GO condicionado:

- Solo issues visuales menores sin fuga de datos.
- Performance degradada leve con workaround temporal.

## Automatizacion recomendada

Crear pruebas backend por servicio/controlador:

- `TenantIsolationSecurityTests`
- `CompanyScopedReportsTests`
- `CompanyScopedSalesPaymentsTests`
- `CompanyScopedInventoryTests`
- `SaasAdminAccessTests`
- `CompanySubscriptionStatusTests`
- `SupportAccessAuditTests`

Crear pruebas SQL de conteo:

- Conteos por company antes/despues.
- FKs huerfanas.
- Entidades con `company_id` nulo despues de migracion.

## Pendiente de validar

- Herramienta final para evidencia visual.
- Ambientes QA/STAGING multi-compania.
- Politica de datos demo por cliente.
