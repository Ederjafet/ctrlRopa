# ERP - Resumen ejecutivo

Fecha de analisis inicial: 2026-05-11  
Ultima actualizacion: 2026-05-12  
Alcance: Fase 0 a Fase 1F documentales y Fase 1G con primera corrida QA real controlada.

## Estado general

Estado estimado: MEDIO, con modulos FRAGILES en flujos operativos de alto cambio.

El proyecto ya tiene una base util para crecer: frontend Expo/React Native con rutas por pantalla en `app/`, backend Spring Boot modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`, migraciones Flyway en `backend/control-ropa/src/main/resources/db/migration` y permisos centralizados por codigo en `PermissionCode.java`.

La principal alerta enterprise sigue siendo que aun no hay una capa homogenea de UX, validaciones, seguridad declarativa, auditoria funcional y regresion automatizada amplia. La Fase 1G ejecuto la primera corrida QA real: API operativa en flujos principales, pero RC rechazado por bloqueos de frontend web, health check y dataset de perfiles de seguridad/soporte. En validacion posterior de Fase 1H, los usuarios QA de permisos negativos, reportes y soporte ya iniciaron sesion correctamente; el RC sigue no aprobado por frontend web sin evidencia y `/api/health` con respuesta runtime `404`.

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
- Decision QA actual: `RC RECHAZADO`; `KI-004` y `KI-005` quedaron resueltos validados, pero siguen bloqueando `KI-003` y `KI-006`.

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
| QA | 68% |
| UX homogenea | 45% |
| Trazabilidad | 50% |
| Gobernanza ERP | 73% |
| ERP readiness general | 64% |

## Prioridad inmediata

1. Mantener cambios pequenos, seguros y reversibles.
2. Limpiar artefactos Git no rastreados antes de release.
3. Desbloquear `KI-003` y `KI-006`; repetir smoke tecnico/visual/seguridad.
4. Validar matriz endpoint-permiso en Fase 4 sin asumir cobertura.
5. Reforzar auditoria funcional en operaciones sensibles.
6. Homologar UX en fases 2 y 3.

