# ERP - Resumen ejecutivo

Fecha de analisis inicial: 2026-05-11  
Ultima actualizacion: 2026-05-17
Alcance: Fase 0 a Fase 2O, incluyendo RC candidato Fase 1, smoke runtime tenant-aware, primeras tablas P0 tenant-aware, lotes tenant-aware runtime, dataset QA Empresa A/B y validacion runtime A/B.

## Estado general

Estado estimado: MEDIO, con modulos FRAGILES en flujos operativos de alto cambio.

El proyecto ya tiene una base util para crecer: frontend Expo/React Native con rutas por pantalla en `app/`, backend Spring Boot modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`, migraciones Flyway en `backend/control-ropa/src/main/resources/db/migration` y permisos centralizados por codigo en `PermissionCode.java`.

La principal alerta enterprise sigue siendo que aun no hay una capa homogenea de UX, validaciones, seguridad declarativa, auditoria funcional y regresion automatizada amplia. La Fase 1G ejecuto la primera corrida QA real: API operativa en flujos principales, pero RC rechazado por bloqueos de frontend web, health check y dataset de perfiles de seguridad/soporte. En validaciones posteriores, los usuarios QA de permisos negativos, reportes y soporte ya iniciaron sesion correctamente, y el healthcheck backend fue validado por runtime real en `http://localhost:8090/api/health` con `HTTP/1.1 200 OK`. En Fase 1K el frontend QA responde en `http://localhost:8081`, las rutas base validadas decodifican UTF-8 sin mojibake y `npm run web` ya no se bloquea por permisos de log/cache. En Fase 1L no quedan bloqueos `SEV-1` ni `SEV-2`; la decision recomendada es `GO PARA RC CANDIDATO APROBABLE`, sin aprobar release final automatico. En Fase 2A se inicia el diseno SaaS multi-compania: la recomendacion arquitectonica es una sola aplicacion y una sola base con `company_id` obligatorio, tenant context backend, QA estricto de aislamiento y consola SaaS privada HPSQ-SOFT separada del ERP operativo de clientes. En Fase 2D se implemento bootstrap minimo `companies` + company default + `branches.company_id`; en Fase 2F se agregaron `user_companies` y sesiones con `active_company_id`/`active_branch_id`; en Fase 2I se ejecuto smoke runtime con usuarios QA completos. En Fase 2J `customers` se convierte en la primera tabla P0 tenant-aware. En Fase 2K `items`/inventario se convierte en la segunda tabla P0 tenant-aware. En Fase 2M `batches` queda tenant-aware para endpoints directos. En Fase 2N se prepara dataset QA Empresa A/B. En Fase 2O se valida runtime A/B: login, tenant current, customers, items, lookup code/QR y batches por folio quedan aislados entre `QA_A` y `QA_B`, y `DEFAULT` sigue operativo. Aun no se debe declarar SaaS real porque faltan proveedores tenant-aware, permisos por company y revision de consumidores legacy en ventas, pagos, live, reservaciones y reportes.

## Hallazgos clave

- Backend modular real por dominio: `auth`, `batch`, `catalog`, `customer`, `customerpackage`, `dashboard`, `item`, `live`, `payment`, `reservation`, `sale`, `shipment`, `transfer`, `security`, `useradmin`.
- Seguridad funcional por token y `AccessService.assertCan`, pero `SecurityConfig.java` usa `.anyRequest().permitAll()`, lo que obliga a revisar permisos endpoint por endpoint.
- Auditoria existe con `SystemMovementAuditInterceptor.java` y tabla `system_movement_audit_log`, pero solo audita operaciones `/api/*` no GET, exitosas y con detalle generico.
- Proveedores ya existen en backend con `SupplierController.java`, `SupplierService.java` y migracion `V37__suppliers_and_batch_quality.sql`.
- Lotes ya guardan proveedor, fecha de recepcion y calidad por `BatchService.java`, pero faltan filtros backend especificos por proveedor, estatus, fecha y calidad.
- UX esta mejorando con componentes reutilizables como `AppButton`, `AppBottomModal`, `AppNoticeDropdown`, `AppScreen`, pero muchas pantallas siguen usando `Alert.alert` directo.
- Hay riesgo recurrente de codificacion de textos; se requiere barrido de mojibake antes de release.
- El repositorio Git ya existe y la Fase 1G se trabaja sobre `feature/fase1g-primera-corrida-qa-real`; queda pendiente limpiar o ignorar `.tmp-pdf-images/` y diffs no rastreados de fases anteriores.
- Primera corrida QA real: venta QA `saleId=1` y pago QA `paymentId=1` creados correctamente en ambiente QA.
- Decision QA actual: `GO PARA RC CANDIDATO APROBABLE`; backend/API queda tecnicamente validado y `KI-002`, `KI-003`, `KI-004`, `KI-005`, `KI-006`, `KI-007` y `KI-008` quedaron resueltos validados. `KI-001` queda abierto como `SEV-3` no bloqueante para RC candidato. Falta ejecutar checklist RC completo con evidencia visual formal antes de aprobar release final.
- Multi-compania actual: ya existe `company_id` en `branches`, `customers` e `items`; la arquitectura operativa sigue siendo mono-company `DEFAULT` hasta completar dataset Empresa A/B y migrar el resto de tablas P0.
- Decision arquitectonica Fase 2A: adoptar una sola base compartida con `company_id`, no base por compania ni esquema por compania para la primera evolucion.
- Riesgo critico Fase 2A: no implementar multi-compania funcional hasta que backend valide tenant por cada endpoint y reporte.
- HPSQ-SOFT debe tener una consola SaaS privada para administrar empresas, planes, soporte, auditoria, salud y branding; esta consola no debe ser visible para usuarios cliente.
- Roles SaaS HPSQ-SOFT deben separarse de roles ERP cliente para evitar administracion global accidental.
- Billing/facturacion automatica no debe implementarse todavia; primero se recomienda control administrativo de planes, limites, suspension y reactivacion.
- Fase 2B convierte el diseno en matrices tecnicas: endpoints P0, tablas P0, acciones HPSQ-SOFT auditables y backlog de implementacion.
- Los modulos de mayor riesgo tenant son pagos/ventas/caja, reportes/dashboard, inventario/items, usuarios/permisos y soporte/logs.
- Fase 2C define el tenant core foundation: `CurrentTenantContext`, auth tenant-aware, enforcement obligatorio, migracion incremental y escenarios de riesgo SaaS.
- La implementacion real no debe iniciar por ventas/pagos/reportes; debe iniciar por contexto tenant, company default, branch validation y auditoria.
- Fase 2D/2F/2I: bootstrap tenant minimo y sesiones tenant-aware implementadas; usuarios QA tenant validados. Se permite avanzar solo a primera P0 de bajo riesgo con rollback y sin tocar ventas/pagos/live/reportes.
- Fase 2J: `customers` queda tenant-aware en endpoints directos. Fase 2K: `items` queda tenant-aware en endpoints directos. Todavia falta dataset Empresa A/B y migrar consumidores legacy antes de declarar aislamiento SaaS real.
- Fase 2L/2M: `batches` queda planificado e implementado como tenant-aware en endpoints directos. La implementacion se mantuvo aislada de ventas/pagos/live/reportes.
- Fase 2N: se crea dataset QA Empresa A/B para ejecutar pruebas negativas reales de customers/items/batches. No se ejecuto SQL ni se modifico codigo productivo.
- Fase 2O: se valida runtime A/B y no se detecta fuga cross-company en endpoints directos de customers/items/batches.

## Madurez ERP estimada

| Area | Madurez |
|---|---:|
| Usuarios y permisos | 72% |
| Clientes | 68% |
| Proveedores | 45% |
| Inventario | 70% |
| Lotes | 66% |
| Recepcion | 50% |
| Ventas | 60% |
| Caja | 55% |
| Pagos | 60% |
| Reportes | 50% |
| Dashboard | 55% |
| Auditoria | 38% |
| Seguridad | 65% |
| Multi-compania / SaaS readiness | 66% |
| QA | 78% |
| UX homogenea | 48% |
| Trazabilidad | 50% |
| Gobernanza ERP | 76% |
| ERP readiness general | 73% |

## Prioridad inmediata

1. Mantener cambios pequenos, seguros y reversibles.
2. Limpiar artefactos Git no rastreados antes de release.
3. Ejecutar checklist RC completo y consolidar evidencia visual formal para frontend web.
4. Cerrar matriz tabla-endpoint-tenant antes de cualquier migracion multi-compania.
5. Crear dataset Empresa A/B para probar aislamiento real en customers/items/batches.
6. Tenantizar proveedores o definirlos formalmente como catalogo global antes de SaaS real.
7. Mantener ventas/pagos/reportes/live fuera de alcance hasta completar QA cross-company.
8. Cerrar matriz de roles SaaS vs roles ERP antes de exponer consola HPSQ-SOFT.
9. Validar matriz endpoint-permiso en Fase 4 sin asumir cobertura.
10. Reforzar auditoria funcional en operaciones sensibles.
11. Homologar UX despues de definir tenant context.

