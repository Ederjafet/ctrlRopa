# ERP - Escenarios de riesgo tenant

Fecha: 2026-05-13  
Fase: 2C - tenant core foundation  
Tipo: analisis de riesgo, sin implementacion

## Objetivo

Documentar escenarios reales de riesgo en SaaS multi-tenant y definir mitigacion/monitoreo antes de implementar.

## Matriz de escenarios

| Riesgo | Impacto | Probabilidad | Severidad | Mitigacion | Monitoreo recomendado |
|---|---|---|---|---|---|
| Fuga cross-company por query sin `company_id` | Cliente ve datos de otra empresa | Alta durante migracion | CRITICO | Enforcement rules, pruebas negativas P0, revision queries | Alertas por intentos 403/404 cross-company, QA reportes A/B |
| Bypass JWT/token manipulado | Usuario fuerza company/branch ajena | Media | CRITICO | Token firmado, resolver server-side, validar user-company | Logs auth, intentos company no permitida |
| BranchId manipulado en URL | Acceso a sucursal ajena | Alta | CRITICO | Validador branch-company-user central | Auditoria de branch denegada |
| Lookup global por QR/codigo | Prenda de empresa B aparece en A | Alta | CRITICO | Lookup tenant-scoped, indices `(company_id, code/qr)` | Alertas por lookup sin company |
| Reporte sin filtro tenant | Totales financieros mezclados | Media | CRITICO | Revisar joins, pruebas reportes A/B | Comparacion totals por company, QA export |
| Dashboard con metricas cruzadas | Decision operativa equivocada | Media | CRITICO | Todas las fuentes filtran company | Pruebas dashboard Empresa A/B |
| Permiso global heredado | Usuario admin A administra B | Media | CRITICO | `user_company_roles`, `user_company_permissions` | Auditoria de cambios permisos |
| Acceso delegado indebido HPSQ | Soporte ve/modifica datos sin autorizacion | Media | CRITICO | `support_access_sessions`, motivo, expiracion, roles | Alertas sesiones soporte activas, acciones soporte |
| Impersonation inseguro | HPSQ actua como cliente sin trazabilidad | Media si se implementa mal | CRITICO | No implementar al inicio; doble aprobacion futuro | Auditoria por supportSessionId |
| Cache contaminado | Usuario recibe catalogo/reporte de otra company | Media | CRITICO | Cache key incluye company/branch | Logs cache miss/hit por company |
| Exports globales | Archivo incluye datos de otra empresa | Media | CRITICO | Export tenant-scoped, auditoria, pruebas | Auditoria de export, conteos por company |
| Jobs batch incorrectos | Proceso mueve/cierra datos de varias companies | Media futura | ALTO | Jobs iteran por company, idempotencia | Logs job por company |
| Indices insuficientes | Lentitud severa al crecer tenants | Alta si no se planifica | ALTO | Indices compuestos company+branch+fecha/status | Metricas latencia endpoints P0 |
| Company suspendida con token previo | Cliente suspendido sigue operando | Media | CRITICO | Validar estado company por request critico | Alertas actividad company suspendida |
| Plan limits solo frontend | Cliente excede usuarios/sucursales | Media | ALTO | Backend valida limites | Metricas limite por company |
| Logs con datos sensibles | Exposicion PII o tokens | Media | ALTO | Sanitizar logs, no token/password | Escaneo logs, revision soporte |
| Error revela existencia de entidad ajena | Enumeracion de ids | Media | ALTO | 404 para entidad fuera tenant | Analisis de errores 403/404 |
| Backfill incorrecto | Datos quedan en company equivocada | Media durante migracion | CRITICO | Backup, conteos, validaciones FK | Reporte conteo nulos/mismatch |
| Detalle sin company y cabecera cruzada | Pago/item asociado a cabecera ajena | Media | CRITICO | Validar detalle-cabecera misma company | Queries de integridad |
| SaaS console visible a cliente | Cliente ve administracion global | Baja si se separa bien | CRITICO | Rutas privadas `SAAS_*`, pruebas negativas | Alertas 403 rutas SaaS |
| HPSQ_BILLING ve datos operativos | Exposicion innecesaria | Media | ALTO | Separacion permisos SaaS | Auditoria consultas billing |
| HPSQ_SUPPORT modifica finanzas | Caja/saldos incorrectos | Baja/Media | CRITICO | Prohibir por defecto, herramienta auditada futura | Alertas acciones financieras en supportMode |

## Escenarios narrativos

### 1. Usuario cambia `branchId` manualmente

Un usuario de Empresa A modifica la URL o request para consultar `branchId` de Empresa B.

Mitigacion:

- Validar `branch.company_id = activeCompanyId`.
- Validar branch en `allowedBranchIds`.
- Responder 403/404.
- Auditar intento.

### 2. QR de prenda global

Un cajero escanea QR de una prenda que existe en Empresa B.

Mitigacion:

- Lookup por `(company_id, qr_code)`.
- Si QR se decide global, devolver solo si pertenece a activeCompanyId.
- Auditar intentos cruzados si se detectan.

### 3. Reporte de depositos mezcla pagos

Un reporte filtra por fecha pero olvida `company_id`.

Mitigacion:

- Report service exige `companyId`.
- Tests con pagos A/B mismo dia.
- Conteo de totales esperado por company.

### 4. Soporte HPSQ abre empresa sin motivo

Soporte consulta logs o datos sin ticket.

Mitigacion:

- No permitir `supportMode` sin motivo.
- Caducidad obligatoria.
- Auditoria por accion.
- Alertas de sesiones soporte largas.

### 5. Cache de catalogos sin company

Empresa A configura marcas/metodos; Empresa B recibe catalogo cacheado.

Mitigacion:

- Cache key con `companyId`.
- Invalidacion por company.
- QA catalogos A/B con valores distintos.

### 6. Backfill asigna pagos a company incorrecta

Un pago se asigna por customer pero el branch apunta a otra company.

Mitigacion:

- Validar branch/customer/payment coherentes antes del backfill.
- Reportar mismatches.
- No automatizar registros ambiguos.

## Senales de monitoreo

- Aumento de 403/404 por branch/entity.
- Lookup por QR/codigo sin resultado en company activa.
- Reportes con totales inesperados vs conteos SQL.
- Actividad en company suspendida.
- Sesiones soporte activas mas de X minutos.
- Exportaciones grandes por HPSQ.
- Endpoints P0 con latencia creciente.
- Registros nuevos con `company_id` null.

## Severidad para release

Bloquean release:

- Cualquier fuga cross-company.
- Cualquier accion financiera cross-company.
- Cualquier reporte con totales mezclados.
- Consola SaaS visible a cliente.
- Soporte HPSQ sin auditoria.
- Company suspendida opera.

Condicionado:

- Performance degradada con workaround y sin fuga.
- Issues visuales de selector company sin impacto seguridad.
- Logs incompletos no sensibles en endpoints P2.
