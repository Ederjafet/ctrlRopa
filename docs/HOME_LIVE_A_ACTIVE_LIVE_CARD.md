# HOME-LIVE-A - Card de LIVE activo en inicio

Fecha: 2026-06-10

## Alcance

Se agrego un card superior en la pantalla de inicio operativa para mostrar un resumen corto del LIVE activo cuando el usuario tiene acceso LIVE. El contenido existente del home se conserva debajo del card mediante `DashboardTemplate.summary`.

## Implementacion

- Pantalla tocada: `app/index.tsx`.
- Textos i18n: `locales/es/common.json` y `locales/en/common.json`.
- Backend: no tocado.
- Endpoints nuevos: ninguno.
- Mutaciones reales: ninguna.

## Fuentes de datos

El card usa llamadas read-only existentes:

- `getLivesByBranch(branchId)` para localizar el LIVE con `status === ACTIVE`.
- `getReservationsByBranch(branchId)` para contar reservas activas y vendidos operativos del LIVE, solo si el dato responde.
- `getLiveEvents(liveId)` para tomar la ultima actividad disponible, solo si el dato responde.

No se inventan metricas. Si reservas o eventos no responden, el card conserva el resumen seguro del LIVE activo y marca datos parciales.

## Datos mostrados

- Estado del LIVE activo.
- Nombre/notas del LIVE o identificador `LIVE #id`.
- Prenda al aire si existe `activeItemId`.
- Reservas activas del LIVE si el endpoint de reservas responde.
- Vendidos operativos si el endpoint de reservas responde.
- Ultima actividad si hay evento o fecha disponible.
- Boton `Ir a LIVE`.

No se muestra precio LIVE en el card.

## Comportamiento por rol

| Rol / usuario | Resultado esperado |
| --- | --- |
| Admin con acceso LIVE | Ve el card si hay LIVE activo y puede navegar a `/live`. |
| Supervisor con acceso LIVE | Ve el card si sus capacidades permiten `canViewLive`; el boton solo navega a `/live`. |
| Vendedor con acceso LIVE | Ve el card si tiene visibilidad LIVE; el boton solo navega a `/live`. |
| Usuario sin permisos LIVE | No ve el card ni boton LIVE en este bloque. |

La visibilidad se apoya en `canViewLive(session)`, que reutiliza las capacidades existentes basadas en `VIEW_LIVE`, `OPERATE_LIVE`, `DO_LIVE_RESERVATION` y reglas actuales del proyecto.

## Estados

- Loading: muestra card breve mientras se consulta el LIVE activo.
- Error al listar LIVE: muestra aviso no bloqueante con boton a `/live`.
- Sin LIVE activo: no muestra card para mantener el home limpio.
- Error en reservas/eventos: muestra datos disponibles y nota de datos parciales.

## Pendientes

- QA visual real por rol con navegador/screenshot.
- Confirmar en dataset real que el conteo de reservas activas y vendidos operativos coincide con la operacion esperada por branch.

## Restricciones respetadas

- No se tocaron pagos, caja, precio LIVE, devoluciones, autorizaciones, RBAC ni permisos.
- No se cambio venta financiera.
- No se cambio inventario/reservas.
- No se crearon endpoints ni migraciones.
