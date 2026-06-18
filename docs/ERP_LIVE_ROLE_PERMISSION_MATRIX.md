# ERP LIVE - Matriz de permisos por rol

Fecha: 2026-05-21  
Fase: LIVE-X role permissions operator/presenter  
Alcance: En vivo, navegacion frontend y revision backend. No se tocaron pagos, ventas, reportes, SQL ni migraciones.

## Objetivo

Diferenciar la experiencia de En vivo por permisos reales, evitando que presentadora, operador y supervisor vean exactamente la misma consola.

## Permisos existentes usados

| Capacidad | Permiso/canal existente |
|---|---|
| Ver En vivo | Canal `LIVE` y rol/permisos LIVE compatibles |
| Operar En vivo | Canal `LIVE` + `DO_LIVE_RESERVATION` |
| Seleccionar cliente | `DO_LIVE_RESERVATION` + `VIEW_CUSTOMERS` |
| Seleccionar/agregar prenda existente | `DO_LIVE_RESERVATION` + `VIEW_INVENTORY` |
| Crear prenda rapida | `DO_LIVE_RESERVATION` + `MANAGE_INVENTORY` |
| Ver analiticos | `VIEW_REPORTS`, `MANAGE_USERS`, `ADMIN` o `QA_TENANT_ADMIN` |
| Configurar Sistema | `MANAGE_ROLES`, `MANAGE_BRANCH_CHANNELS`, `MANAGE_SECURITY_SETTINGS`, `ADMIN` o `QA_TENANT_ADMIN` |
| Administrar usuarios | `MANAGE_USERS` |

## Matriz operativa

| Rol operativo | Puede ver En vivo | Puede operar | Cliente | Prenda | Analiticos | Sistema/usuarios |
|---|---|---|---|---|---|---|
| Presentadora | Si | No, salvo que tenga `DO_LIVE_RESERVATION` | Solo lectura si no tiene permisos | Solo lectura si no tiene permisos | No por defecto | No |
| Operador | Si | Si | Seleccionar y alta rapida si tiene permisos | Seleccionar/agregar; crear solo con `MANAGE_INVENTORY` | No por defecto | No |
| Supervisor/Admin | Si | Si | Si | Si | Si | Si segun permisos |
| Usuario sin permisos | No | No | No | No | No | No |

## Decision

El frontend usa `services/livePermissionGuards.ts` como capa clara de permisos para LIVE. Backend sigue siendo la autoridad final para operaciones criticas; donde falten validaciones backend se documenta como riesgo.
