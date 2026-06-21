# PERM-UX-D - Patron final de permisos en cabecera y modal unificada

## Problema detectado

`/payments` ya tenia modal de permisos, pero aun mostraba una tarjeta grande de capacidades dentro del cuerpo principal. La pantalla financiera quedaba cargada antes de mostrar resumen, filtros y pendientes.

## Decision UX

El contenido principal de la pantalla debe enfocarse en la operacion. Los permisos viven en:

- Boton compacto `Ver permisos` en la cabecera.
- Modal unificada con capacidades y diagnostico tecnico integrado por accion.

## Cambios aplicados en `/payments`

- Se retiro `ScreenCapabilitySummary` del cuerpo de `/payments`.
- El boton `Ver permisos` se movio a `rightContent` de `AppShellPage`.
- La pantalla ahora inicia con resumen financiero, filtros y pendientes/listado.
- `ScreenPermissionModal` se redisenio como una sola lista de acciones.

## Modal unificada

La modal muestra una sola seccion: `Acciones y permisos`.

Cada fila muestra:

- Estado: `Permitido` o `Bloqueado`.
- Accion de negocio.
- Mensaje de negocio.
- Permiso tecnico requerido, solo si `showTechnicalDetails` es verdadero.

Ya no hay dos bloques grandes separados de negocio y diagnostico.

## Control tecnico

La visibilidad tecnica sigue controlada por:

- `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS`.
- `canViewScreenPermissionDiagnostics()`.

Con diagnostico apagado:

- La modal muestra solo lenguaje de negocio.
- No muestra codigos como `REGISTER_PAYMENTS`.

Con diagnostico activo y perfil autorizado:

- La modal muestra el permiso requerido integrado en cada fila.

## Usuarios

Usuario normal con acceso:

- Ve `Ver permisos`.
- Ve capacidades de negocio.
- No ve codigos tecnicos si no esta autorizado o la bandera esta apagada.

Admin, QA o Platform Owner:

- Ve codigos tecnicos solo con la bandera activa.

Vendedor/caja:

- No ve codigos tecnicos.
- Si no tiene `VIEW_PAYMENTS`, no accede a `/payments`.

## Hints de acciones bloqueadas

`PermissionBlockedHint` sigue funcionando fuera de la modal. Los botones `Cobrar`, `Registrar pago` y `Aplicar saldo a favor` siguen mostrando explicacion cuando falta permiso.

## Como replicar el patron

1. Definir acciones en `services/screenPermissions.ts`.
2. Calcular `getScreenPermissionSummary(screenKey, session, language)`.
3. Agregar `AppButton title="Ver permisos"` en `rightContent` o cabecera equivalente.
4. Renderizar `ScreenPermissionModal`.
5. Pasar `showTechnicalDetails={canViewScreenPermissionDiagnostics(session)}`.

## Backlog

- `customer-package-detail`
- `reservation-detail`
- `shipment-detail`
- `users`
- `system-roles`
- `appearance`
- `platform`
