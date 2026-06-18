# AUTH-A - RBAC en login

Fecha: 2026-05-22  
Rama: `feature/auth-a-rbac-single-session`

## Objetivo

Evitar que un usuario autenticado por credenciales cree una sesion valida si no tiene autorizacion operativa minima.

## Validaciones aplicadas

El login en `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/auth/AuthService.java` ahora valida, antes de crear `user_api_sessions`:

- `users.status = ACTIVE`.
- El usuario no tiene rol `NO_ACCESS`.
- El usuario tiene al menos un permiso efectivo.
- El usuario tiene company activa mediante `user_companies.status = ACTIVE`.
- El usuario tiene branch activa.
- El usuario tiene asignacion en `user_branches` para la branch resuelta.

Los permisos efectivos se calculan desde:

- `user_roles` -> `role_permissions` -> `permissions`.
- `user_permissions` -> `permissions`.

## Comportamiento esperado

| Caso | Resultado |
|---|---|
| Usuario `INACTIVE` | Login rechazado |
| Rol `NO_ACCESS` | Login rechazado |
| Cero permisos efectivos | Login rechazado |
| Sin company activa | Login rechazado |
| Sin branch activa/asignada | Login rechazado |
| Credenciales validas y permisos validos | Login crea nueva sesion |

## Mensaje operativo

Para usuarios sin permisos se devuelve un error claro:

`No tienes permisos asignados para acceder al sistema`

## Riesgos

- Usuarios QA o reales con dataset incompleto dejaran de entrar hasta corregir `user_companies`, `user_branches`, roles y permisos.
- El rechazo ocurre despues de validar credenciales, por lo que QA debe distinguir credenciales invalidas de permisos incompletos.
- AUTH-A no agrega permisos nuevos de negocio. En particular, no se encontro permiso persistido especifico para alta de clientes; el flujo actual debe documentarse como cubierto por acceso general a clientes/tenant hasta definir `CREATE_CUSTOMER` o equivalente.

## Rollback

Revertir los cambios de `AuthService.java` y volver a permitir creacion de sesion tras credenciales validas. No hubo migracion Flyway.
