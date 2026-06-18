# ERP - Revision de guards de permisos

Fecha: 2026-05-21  
Fase: LIVE-X

## Hallazgos

### Frontend

- El menu principal ya filtra muchos modulos con `services/accessControl.ts`.
- Algunas pantallas seguian permitiendo navegacion directa si el usuario conocia la URL.
- `app/live.tsx` tenia guard de ruta basado en `LIVE + DO_LIVE_RESERVATION`, por lo que no diferenciaba presentadora, operador y supervisor.
- `app/system.tsx` no tenia guard directo antes de renderizar.
- `app/users.tsx` dependia principalmente del error backend al cargar datos.

### Backend

- `LiveService.create`, `activate` y `close` validan `DO_LIVE_RESERVATION` + canal `LIVE`.
- `ReservationService.create` valida permisos por canal antes de crear reserva.
- `CustomerService` valida tenant/company/branch, pero no permiso funcional `VIEW_CUSTOMERS` o permiso de creacion.
- `ItemService` valida tenant/company/branch, pero no permiso funcional `VIEW_INVENTORY` o `MANAGE_INVENTORY` en todos los metodos de lectura/creacion.
- `LiveService.findByBranch` y `findById` no hacen `assertCan`; permiten lectura si el endpoint fue alcanzado con sesion valida.

## Cambios aplicados

- Se creo `services/livePermissionGuards.ts`.
- `app/live.tsx` usa helpers:
  - `canViewLive`
  - `canOperateLive`
  - `canCreateLiveCustomer`
  - `canCreateLiveItem`
  - `canViewLiveAnalytics`
- `app/system.tsx` redirige a `/access-denied` si el usuario no puede configurar Sistema.
- `app/users.tsx` redirige a `/access-denied` si el usuario no puede administrar usuarios.

## Riesgo pendiente

NO-GO de seguridad para produccion SaaS completa hasta agregar validaciones backend consistentes en endpoints de lectura/alta de customers/items/live listados.

## Recomendacion

Crear una fase AUTH-A para formalizar permisos backend sin inventar permisos al vuelo ni romper dataset QA.
