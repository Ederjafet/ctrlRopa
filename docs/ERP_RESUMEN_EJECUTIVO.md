# ERP - Resumen ejecutivo

Fecha de analisis: 2026-05-11  
Alcance: Fase 0, solo analisis y documentacion. No se modifico codigo, logica ni base de datos.

## Estado general

Estado estimado: MEDIO, con modulos FRAGILES en flujos operativos de alto cambio.

El proyecto ya tiene una base util para crecer: frontend Expo/React Native con rutas por pantalla en `app/`, backend Spring Boot modular en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`, migraciones Flyway en `backend/control-ropa/src/main/resources/db/migration` y permisos centralizados por codigo en `PermissionCode.java`.

La principal alerta enterprise es que aun no hay una capa homogenea de UX, validaciones, seguridad declarativa, auditoria funcional y regresion automatizada. Hay funcionalidades reales, pero todavia dependen de validaciones repetidas por pantalla/servicio y de convenciones no siempre aplicadas igual.

## Hallazgos clave

- Backend modular real por dominio: `auth`, `batch`, `catalog`, `customer`, `customerpackage`, `dashboard`, `item`, `live`, `payment`, `reservation`, `sale`, `shipment`, `transfer`, `security`, `useradmin`.
- Seguridad funcional por token y `AccessService.assertCan`, pero `SecurityConfig.java` usa `.anyRequest().permitAll()`, lo que obliga a revisar permisos endpoint por endpoint.
- Auditoria existe con `SystemMovementAuditInterceptor.java` y tabla `system_movement_audit_log`, pero solo audita operaciones `/api/*` no GET, exitosas y con detalle generico.
- Proveedores ya existen en backend con `SupplierController.java`, `SupplierService.java` y migracion `V37__suppliers_and_batch_quality.sql`.
- Lotes ya guardan proveedor, fecha de recepcion y calidad por `BatchService.java`, pero faltan filtros backend especificos por proveedor, estatus, fecha y calidad.
- UX esta mejorando con componentes reutilizables como `AppButton`, `AppBottomModal`, `AppNoticeDropdown`, `AppScreen`, pero muchas pantallas siguen usando `Alert.alert` directo.
- Hay problemas reales de codificacion en textos: ejemplos visibles en `services/apiClient.ts`, `components/ui/AppNoticeDropdown.tsx`, `SupplierService.java` y `BatchService.java` con cadenas como `sesiÃ³n`, `acciÃ³n`, `cÃ³digo`, `recepciÃ³n`.
- El directorio actual no parece estar dentro de un repo Git inicializado: `git status` respondio `fatal: not a git repository`. Esto es riesgo fuerte para control de cambios y releases.

## Madurez ERP estimada

| Area | Madurez |
|---|---:|
| Usuarios y permisos | 70% |
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
| Auditoria | 35% |
| Seguridad | 65% |
| QA | 35% |
| UX homogenea | 40% |
| Trazabilidad | 35% |
| ERP readiness general | 52% |

## Prioridad inmediata

1. Congelar crecimiento funcional no critico.
2. Homologar validaciones y notificaciones.
3. Cerrar matriz de permisos por endpoint.
4. Definir regresion minima por flujo critico.
5. Reforzar auditoria funcional en operaciones sensibles.
6. Corregir codificacion de textos de forma controlada en una fase posterior.

