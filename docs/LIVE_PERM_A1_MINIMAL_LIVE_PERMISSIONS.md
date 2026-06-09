# LIVE-PERM-A1 - Permisos LIVE minimos reales

Fecha: 2026-06-09

Rama: `feature/live-perm-a1-minimal-live-permissions`

Commit base de aprobacion: `0809994 LIVE-PERM-A0 documenta handoff arquitectonico`

## Resumen ejecutivo

LIVE-PERM-A1 implementa el MVP aprobado de permisos LIVE reales para separar visualizacion, operacion, preparacion de prenda y control de la prenda al aire.

La fase crea solo cinco permisos autorizados:

- `VIEW_LIVE`
- `OPERATE_LIVE`
- `PREPARE_LIVE_ITEM`
- `CHANGE_LIVE_ACTIVE_ITEM`
- `REMOVE_LIVE_ACTIVE_ITEM`

No se implementan autorizaciones de precio, autorizaciones operativas complejas, pagos, caja, devoluciones, reversas con pago, endpoints nuevos ni migraciones fuera del catalogo minimo aprobado.

## Problema

Antes de esta fase, `DO_LIVE_RESERVATION` concentraba demasiadas capacidades LIVE. Ese permiso permitia apartar en LIVE y tambien funcionaba como permiso operativo legacy para ver/operar sesion y manejar prendas al aire.

Esto dificultaba separar escenarios como:

- usuario que solo puede ver LIVE;
- usuario que puede operar la sesion;
- usuario que puede preparar una prenda;
- usuario que puede cambiar la prenda al aire;
- usuario que puede retirar la prenda del aire.

## Permisos creados

| Permiso | Uso previsto | Alcance de A1 |
| --- | --- | --- |
| `VIEW_LIVE` | Ver estado, eventos e historial LIVE. | Catalogo backend, UI legible y menu operativo. |
| `OPERATE_LIVE` | Operar flujo LIVE basico. | Catalogo backend, capacidades frontend y compatibilidad con menu. |
| `PREPARE_LIVE_ITEM` | Preparar una prenda para el flujo LIVE. | Catalogo backend y capacidades frontend. |
| `CHANGE_LIVE_ACTIVE_ITEM` | Poner o cambiar la prenda al aire. | Catalogo backend, enforcement minimo backend y capacidades frontend. |
| `REMOVE_LIVE_ACTIVE_ITEM` | Retirar la prenda al aire. | Catalogo backend, enforcement minimo backend y capacidades frontend. |

## Permisos no creados

Estos permisos siguen como futuros/propuestos. No se crean ni se hacen asignables en esta fase:

- `CHANGE_LIVE_PRICE`
- `REQUEST_LIVE_PRICE_CHANGE`
- `APPROVE_LIVE_PRICE_CHANGE`
- `APPLY_APPROVED_LIVE_PRICE_CHANGE`
- `VIEW_LIVE_PRICE_AUTHORIZATIONS`
- `REQUEST_LIVE_OPERATION_AUTHORIZATION`
- `APPROVE_LIVE_OPERATION_AUTHORIZATION`
- `VIEW_LIVE_OPERATION_AUTHORIZATIONS`
- `APPLY_LIVE_OPERATION_AUTHORIZATION`
- `CLOSE_LIVE_OPERATIONAL_SALE`
- `UNDO_LIVE_OPERATIONAL_SALE`
- `RELEASE_RESERVED_ITEM`
- `CANCEL_RESERVATION_WITH_PAYMENT`
- `REASSIGN_RESERVATION`
- `EDIT_LOCKED_ITEM`
- `VIEW_PAYMENT_STATUS`

## Migracion

Se agrega `backend/control-ropa/src/main/resources/db/migration/V50__live_minimal_permissions.sql`.

La migracion:

- inserta de forma idempotente los cinco permisos aprobados;
- asigna a `ADMIN` los cinco permisos;
- asigna a `SUPERVISOR` los cinco permisos;
- asigna a `SELLER` `VIEW_LIVE`, `OPERATE_LIVE`, `PREPARE_LIVE_ITEM` y `CHANGE_LIVE_ACTIVE_ITEM`;
- no asigna `REMOVE_LIVE_ACTIVE_ITEM` a `SELLER`;
- no modifica pagos, caja, devoluciones, precio, autorizaciones ni permisos fuera de alcance.

`DO_LIVE_RESERVATION` se conserva como permiso legacy para apartados LIVE y compatibilidad durante la transicion.

## Backend

Cambios principales:

- `PermissionCode.java` declara los cinco permisos nuevos.
- `LiveService` separa enforcement minimo para:
  - ver LIVE;
  - operar sesion LIVE;
  - cambiar prenda al aire;
  - retirar prenda al aire.
- `LiveService` mantiene fallback compatible con `DO_LIVE_RESERVATION`.
- `OperationMenuService` permite mostrar el modulo LIVE con `VIEW_LIVE`, `OPERATE_LIVE` o `DO_LIVE_RESERVATION`.

No se crean endpoints nuevos.

## Frontend

Cambios principales:

- `services/liveCapabilities.ts` reconoce los permisos minimos nuevos.
- `DO_LIVE_RESERVATION` queda acotado a apartados LIVE y compatibilidad legacy.
- Preparar prenda usa `PREPARE_LIVE_ITEM` cuando existe.
- Cambiar prenda al aire usa `CHANGE_LIVE_ACTIVE_ITEM` cuando existe.
- Retirar prenda al aire usa `REMOVE_LIVE_ACTIVE_ITEM` cuando existe.
- `services/permissionDependencies.ts` agrega etiqueta visible para `VIEW_LIVE` y dependencias sugeridas entre permisos LIVE minimos.

No se hardcodean permisos nuevos en pantallas; las pantallas siguen consumiendo capacidades resueltas.

## Compatibilidad

Para no romper ambientes con roles legacy:

- `DO_LIVE_RESERVATION` sigue habilitando operacion LIVE donde antes lo hacia.
- Los apartados LIVE siguen dependiendo de `DO_LIVE_RESERVATION`.
- La separacion fina queda disponible para roles actualizados por V50.

## Postcheck A1

La validacion final antes de merge confirma que `OPERATE_LIVE` no debe ampliar acciones sensibles fuera del MVP. Por eso las capacidades frontend relacionadas con apartado, cambio de estado operativo, cancelacion, cambio de precio LIVE y alta de cliente dentro del flujo LIVE siguen atadas a `DO_LIVE_RESERVATION` y a sus permisos existentes.

`OPERATE_LIVE` queda limitado al alcance aprobado de operacion de sesion y flujo LIVE minimo. Precio, pagos, caja, reversas y autorizaciones siguen fuera de alcance.

## Fuera de alcance

Queda fuera de A1:

- cambio de precio LIVE;
- solicitud/aprobacion de autorizaciones;
- cancelacion o reversa de apartados con pago;
- caja;
- pagos;
- devoluciones;
- permisos sensibles no aprobados;
- migraciones de datos ajenos;
- cambios de endpoints.

## Riesgos

| Riesgo | Mitigacion |
| --- | --- |
| Roles con permisos legacy pueden seguir operando por `DO_LIVE_RESERVATION`. | Se conserva como compatibilidad temporal y se documenta migracion gradual. |
| UI y backend pueden divergir si roles productivos no se actualizan. | V50 asigna roles base conocidos; QA debe revisar roles reales antes de release. |
| `SELLER` recibe capacidad de preparar/cambiar prenda segun aprobacion A1. | No recibe `REMOVE_LIVE_ACTIVE_ITEM`; acciones sensibles quedan fuera. |
| Permisos sensibles futuros podrian confundirse con implementados. | Documento lista explicitamente permisos no creados. |

## QA requerido

QA debe validar:

1. Admin ve y opera LIVE.
2. Supervisor ve y opera flujo minimo aprobado.
3. Vendedor puede ver, preparar y cambiar prenda si su rol recibio permisos A1.
4. Vendedor no puede retirar prenda del aire si no tiene `REMOVE_LIVE_ACTIVE_ITEM`.
5. Usuario sin permisos no accede a LIVE.
6. `DO_LIVE_RESERVATION` sigue permitiendo apartar en LIVE.
7. Precio, pagos, caja y autorizaciones no muestran funciones nuevas.

Sin evidencia visual real, el estado funcional queda `PENDING_QA_VISUAL`.

## Resultado

Resultado esperado de la fase: `GO_TECNICO` si pasan pruebas backend/frontend y `PENDING_QA_VISUAL` hasta ejecutar QA real.
