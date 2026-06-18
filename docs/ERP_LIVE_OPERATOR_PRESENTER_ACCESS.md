# ERP LIVE - Acceso operador y presentadora

Fecha: 2026-05-21

## Objetivo UX

Separar la consola segun responsabilidad:

- Presentadora: vista limpia para vender, ver producto y reservas recientes.
- Operador: captura cliente, prenda, precio y reserva.
- Supervisor/Admin: ve analiticos, preferencias y administracion.

## Cambios aplicados

- En vivo ya no usa solo `DO_LIVE_RESERVATION` para decidir toda la experiencia.
- Las acciones de cliente/prenda se muestran segun permisos especificos.
- Analiticos y actividad se ocultan si el usuario no tiene permiso de supervision.
- `Crear cliente rapido` y `Crear prenda rapida` se ocultan si el usuario no tiene permiso suficiente.
- `Sistema` y `Usuarios` tienen guard frontend contra navegacion directa.

## Experiencia esperada QA

| Usuario | Esperado |
|---|---|
| `qa.a.admin@local.test` | Operador/Supervisor: consola completa, analiticos si tiene permisos, Sistema/Usuarios si su rol los incluye |
| `qa.a.vendedor@local.test` | Operacion limitada segun permisos del rol `QA_TENANT_SELLER`; no debe ver administracion si no tiene permisos |
| `qa.sinpermisos@local.test` | Debe ir a `access-denied` al intentar entrar a En vivo, Sistema o Usuarios |

## Pendiente

Confirmar en runtime el contenido exacto de `effectivePermissions` para `QA_TENANT_ADMIN` y `QA_TENANT_SELLER`.
