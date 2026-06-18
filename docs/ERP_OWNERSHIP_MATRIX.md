# ERP - Ownership matrix

Fecha: 2026-05-12

| Modulo | Responsabilidad | Criticidad | Dependencia | Riesgo | Estado actual |
|---|---|---|---|---|---|
| Auth | Login, logout, cambio de password, sesion API. | CRITICO | `auth`, `security`, `services/authService.ts`, `services/sessionStorage.ts` | Bloqueo total de acceso, sesion expirada mal manejada. | MEDIO |
| Ventas | Venta puerta, cancelacion, actualizacion de item/pedido. | CRITICO | `sale`, `payment`, `item`, `app/door-sale.tsx` | Impacto financiero e inventario incorrecto. | MEDIO/FRAGIL |
| Pagos | Registro, anulacion, pagos por folio/codigo/QR. | CRITICO | `payment`, `balance`, `app/payments.tsx` | Diferencias de caja, saldo incorrecto. | MEDIO |
| Lotes | Crear, recibir, clasificar, conciliar, cancelar. | ALTO | `batch`, `item`, `catalog/Supplier*`, `app/batch-detail.tsx` | Inventario mal originado, calidad no trazada. | MEDIO |
| Live | Crear/activar/cerrar live y reservas live. | ALTO | `live`, `reservation`, `app/live.tsx` | Reservas perdidas o asociadas al live incorrecto. | FRAGIL |
| Dashboard | Indicadores, accesos a detalle operativo. | MEDIO | `dashboard`, `app/dashboard.tsx` | Indicadores incorrectos inducen mala operacion. | MEDIO |
| Reportes | Reportes diarios, historico, depositos, entregas. | ALTO | `report`, `app/report-*.tsx`, `app/movement-history.tsx` | Decisiones con datos incompletos. | FRAGIL |
| Reservaciones | Apartados live/puerta, cancelacion, caja. | ALTO | `reservation`, `live`, `payment`, `app/door-reservation.tsx` | Prendas bloqueadas o liberadas incorrectamente. | MEDIO |
| Envios | Paquetes, despacho, entrega, incidencias. | ALTO | `shipment`, `customerpackage`, `incident` | Entregas sin trazabilidad o cobros contra entrega incorrectos. | MEDIO |
| Seguridad | Configuracion, sesiones, bloqueos, password policy. | CRITICO | `security`, `useradmin`, `AccessService.java` | Acceso indebido o bloqueo operacional. | MEDIO |
| Auditoria | Bitacora tecnica y eventos de sistema. | ALTO | `audit`, `system`, `SystemMovementAuditInterceptor.java` | Acciones sensibles sin trazabilidad suficiente. | FRAGIL |
| Catalogos | Marcas, tallas, tipos, metodos de pago, proveedores, canales. | MEDIO | `catalog`, `branch`, `app/catalogs.tsx` | Datos maestros duplicados o inactivos usados en operacion. | MEDIO |
| Usuarios/permisos | Roles, permisos efectivos, sucursales. | CRITICO | `useradmin`, `security/access`, `app/users-form.tsx`, `app/system-roles.tsx` | Usuarios ven o ejecutan acciones indebidas. | MEDIO |
| Multi-compania | Aislamiento por empresa, tenant context, company_id, sucursales por compania. | CRITICO | `auth`, `security/access`, todos los servicios por `branchId`, futuras migraciones `companies` | Fuga de datos entre clientes si falta filtro tenant. | DISENO |
| Consola SaaS HPSQ-SOFT | Administracion privada de empresas, planes, soporte, auditoria y salud. | CRITICO | futuros modulos `saas-admin`, `companies`, `company_subscriptions`, `support_access_sessions` | Cliente ve administracion global o HPSQ toca datos operativos sin control. | DISENO |
| Planes/suscripciones | Limites por plan, suspension, reactivacion y modulos habilitados. | ALTO | futuras tablas `company_subscriptions`, `tenant_settings`, permisos SaaS | Bloqueo incorrecto de empresas o exceso de uso no controlado. | DISENO |
| Soporte HPSQ-SOFT | Acceso delegado, logs filtrados, desbloqueo controlado, incidencias por cliente. | ALTO | futuros `support_access_sessions`, auditoria SaaS, logs tenant-aware | Exposicion de datos sensibles o acciones sin trazabilidad. | DISENO |

## Regla de ownership

- Todo cambio debe tener modulo propietario.
- Si toca dos modulos criticos, se considera cambio critico.
- Si toca permisos, pagos, seguridad, ventas o lotes, requiere regresion especifica.
- Si toca multi-compania, consola SaaS o soporte HPSQ-SOFT, requiere QA cross-company y auditoria.
- Si toca planes/suspension, requiere pruebas de login, bloqueo, reactivacion y rollback.

