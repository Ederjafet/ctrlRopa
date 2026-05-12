# ERP - Estado actual

## Arquitectura actual

Frontend:

- Expo Router / React Native Web.
- Rutas principales en `app/`.
- Servicios HTTP en `services/`.
- Componentes UI compartidos en `components/ui/`.
- API base configurada en `constants/api.ts`.

Backend:

- Spring Boot 4.0.2, Java 21.
- Paquetes por dominio en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa`.
- Persistencia JPA/JdbcTemplate.
- Migraciones Flyway en `backend/control-ropa/src/main/resources/db/migration`.
- MySQL configurado en `application.properties`.

## Modulos existentes reales

- Acceso y sesion: `auth`, `security`, `useradmin`.
- Catalogos: `catalog`, `branch`, `appearance`.
- Operacion: `live`, `reservation`, `sale`, `payment`, `customerpackage`, `shipment`, `transfer`, `consignment`.
- Inventario: `item`, `batch`, `inventory`.
- Clientes: `customer`, `order`, `balance`.
- Finanzas: `cash`, `refund`, `returns`, `report`.
- Soporte: `system`, `audit`, `incident`, `health`.

## Fortalezas reales

- Separacion backend por dominio razonable.
- Migraciones Flyway ya gobiernan el esquema.
- Permisos con constantes en `PermissionCode.java`.
- Validaciones backend importantes en servicios como `BatchService`, `SaleService`, `PaymentService`, `ReservationService`.
- Componentes UI reutilizables ya iniciados: `AppButton`, `AppCard`, `AppBottomModal`, `AppNoticeDropdown`, `AppResponsiveGrid`.
- Logs backend rotativos configurados en `application.properties`.

## Fragilidades reales

- `SecurityConfig.java` permite todas las rutas y delega seguridad a filtro/token y servicios.
- UX de errores no es uniforme: muchas pantallas usan `Alert.alert`, otras usan `AppBottomModal` y pocas `AppNoticeDropdown`.
- Mensajes con acentos rotos en frontend y backend.
- No hay evidencia de suite robusta de pruebas end-to-end o regresion funcional.
- Muchas pantallas concentran logica de carga, permisos, validacion y render en un solo archivo.
- El workspace actual no reporta repositorio Git, riesgo alto para releases.

## Estado por capa

| Capa | Estado | Comentario |
|---|---|---|
| Frontend | MEDIO | Funcional, pero UX y validaciones no homologadas. |
| Backend | MEDIO | Modular, pero seguridad y auditoria requieren endurecimiento. |
| Base de datos | MEDIO | Buen uso de Flyway, faltan indices/filtros para consultas ERP. |
| QA | FRAGIL | PENDIENTE DE VALIDAR pruebas automatizadas completas. |
| Operacion | MEDIO | Flujos existen, pero hay riesgos por mensajes/acciones inconsistentes. |

