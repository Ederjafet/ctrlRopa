# ERP - Resumen ejecutivo

Fecha de analisis inicial: 2026-05-11  
Ultima actualizacion: 2026-05-12  
Alcance: Fase 0 a Fase 1F documentales y Fase 1G con primera corrida QA real controlada.

## Estado general

Estado estimado: MEDIO, con modulos FRAGILES en flujos operativos de alto cambio.

El proyecto ya tiene una base util para crecer: frontend Expo/React Native con rutas por pantalla en `app/`, backend Spring Boot modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`, migraciones Flyway en `backend/control-ropa/src/main/resources/db/migration` y permisos centralizados por codigo en `PermissionCode.java`.

La principal alerta enterprise sigue siendo que aun no hay una capa homogenea de UX, validaciones, seguridad declarativa, auditoria funcional y regresion automatizada amplia. La Fase 1G ejecuto la primera corrida QA real: API operativa en flujos principales, pero RC rechazado por bloqueos de frontend web, health check y dataset de perfiles de seguridad/soporte. En validaciones posteriores, los usuarios QA de permisos negativos, reportes y soporte ya iniciaron sesion correctamente, y el healthcheck backend fue validado por runtime real en `http://localhost:8090/api/health` con `HTTP/1.1 200 OK`. En Fase 1K el frontend QA responde en `http://localhost:8081`, las rutas base validadas decodifican UTF-8 sin mojibake y `npm run web` ya no se bloquea por permisos de log/cache. En Fase 1L no quedan bloqueos `SEV-1` ni `SEV-2`; la decision recomendada es `GO PARA RC CANDIDATO APROBABLE`, sin aprobar release final automatico. En Fase 2A se inicia el diseno SaaS multi-compania: la recomendacion arquitectonica es una sola aplicacion y una sola base con `company_id` obligatorio, tenant context backend, QA estricto de aislamiento y consola SaaS privada HPSQ-SOFT separada del ERP operativo de clientes.

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
- Multi-compania actual: no existe `company_id`; la arquitectura actual es mono-compania/multi-sucursal con `branch_id` como eje operativo.
- Decision arquitectonica Fase 2A: adoptar una sola base compartida con `company_id`, no base por compania ni esquema por compania para la primera evolucion.
- Riesgo critico Fase 2A: no implementar multi-compania funcional hasta que backend valide tenant por cada endpoint y reporte.
- HPSQ-SOFT debe tener una consola SaaS privada para administrar empresas, planes, soporte, auditoria, salud y branding; esta consola no debe ser visible para usuarios cliente.
- Roles SaaS HPSQ-SOFT deben separarse de roles ERP cliente para evitar administracion global accidental.
- Billing/facturacion automatica no debe implementarse todavia; primero se recomienda control administrativo de planes, limites, suspension y reactivacion.

## Madurez ERP estimada

| Area | Madurez |
|---|---:|
| Usuarios y permisos | 72% |
| Clientes | 60% |
| Proveedores | 45% |
| Inventario | 65% |
| Lotes | 55% |
| Recepcion | 50% |
| Ventas | 60% |
| Caja | 55% |
| Pagos | 60% |
| Reportes | 50% |
| Dashboard | 55% |
| Auditoria | 38% |
| Seguridad | 65% |
| Multi-compania / SaaS readiness | 22% |
| QA | 74% |
| UX homogenea | 48% |
| Trazabilidad | 50% |
| Gobernanza ERP | 76% |
| ERP readiness general | 68% |

## Prioridad inmediata

1. Mantener cambios pequenos, seguros y reversibles.
2. Limpiar artefactos Git no rastreados antes de release.
3. Ejecutar checklist RC completo y consolidar evidencia visual formal para frontend web.
4. Cerrar matriz tabla-endpoint-tenant antes de cualquier migracion multi-compania.
5. Cerrar matriz de roles SaaS vs roles ERP antes de exponer consola HPSQ-SOFT.
6. Validar matriz endpoint-permiso en Fase 4 sin asumir cobertura.
7. Reforzar auditoria funcional en operaciones sensibles.
8. Homologar UX despues de definir tenant context.

