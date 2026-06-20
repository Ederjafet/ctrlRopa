# FAST-PLATFORM-B Multiempresa, sucursales, usuarios y aislamiento tenant

## Problema detectado

Durante el smoke visual de FAST-PLATFORM-A se detecto un bug critico: un admin de cliente podia entrar a `/users` y ver usuarios de otras companias. Esto rompe el contrato minimo multiempresa porque la separacion no puede depender solo del menu o del frontend.

## Riesgo de seguridad

La visibilidad cross-company en usuarios implica riesgo de fuga de datos entre clientes, administracion indebida de cuentas y posible desactivacion o edicion de usuarios de otra empresa. La correccion se aplico en backend como barrera obligatoria.

## Correccion backend aplicada

- `/api/users` ahora resuelve el tenant actual con `TenantResolver`.
- El listado y busqueda de usuarios filtran por `branches.company_id = currentTenant.companyId`.
- El detalle de usuario valida que el usuario pertenezca a la empresa activa.
- Crear usuario valida que la sucursal principal y sucursales asignadas pertenezcan a la empresa activa.
- Editar, desactivar, cambiar roles y cambiar permisos validan que el usuario objetivo pertenezca a la empresa activa.
- Al crear/editar usuario se mantiene `user_companies` y `user_branches` para el tenant correcto.
- `/api/branches` normal queda limitado a sucursales de la empresa activa.
- La administracion global de sucursales se movio a endpoints `/api/platform/**`.

## Correccion frontend aplicada

- El usuario `PLATFORM_OWNER` ve un menu separado `PLATAFORMA` con `Panel Plataforma`.
- El `PLATFORM_OWNER` ya no ve el menu operativo normal como si fuera usuario de tienda.
- `/platform` muestra un bloque de contexto: `Modo Plataforma AppModa`.
- `/platform` permite seleccionar compania cliente y administrar sus sucursales y usuarios.
- `/users` muestra el contexto de empresa/sucursal activa y explica que el alcance es tenant.

## Modelo resultante

### Platform Owner

- Usa `platform@appmoda.local`.
- Opera en el tenant interno `AppModa Platform` / `AppModa HQ`.
- Puede listar empresas, crear empresas, crear sucursales por compania y crear usuarios/admins por compania desde `/platform`.
- No usa los endpoints normales de usuarios para operar tenants de clientes.

### Tenant Admin

- No ve menu Plataforma.
- No puede acceder a `/api/platform/**`.
- Puede administrar usuarios solo dentro de su propia empresa.
- No puede crear usuarios en sucursales de otra empresa.

### Usuarios operativos

- Mantienen sus permisos actuales.
- No ven Plataforma.
- Quedan limitados por tenant activo y permisos existentes.

## Endpoints nuevos o ampliados

- `GET /api/platform/companies/{companyId}`
- `PATCH /api/platform/companies/{companyId}`
- `GET /api/platform/companies/{companyId}/branches`
- `POST /api/platform/companies/{companyId}/branches`
- `PATCH /api/platform/companies/{companyId}/branches/{branchId}`
- `GET /api/platform/companies/{companyId}/users`
- `POST /api/platform/companies/{companyId}/users`
- `PATCH /api/platform/companies/{companyId}/users/{userId}`
- Se mantiene `POST /api/platform/companies/{companyId}/admin-user`.

## Permisos

No se creo migracion nueva. FAST-PLATFORM-B reutiliza:

- `VIEW_PLATFORM` para lectura de Plataforma.
- `MANAGE_COMPANIES` para companias y sucursales desde Plataforma.
- `MANAGE_TENANT_ADMINS` para crear/editar usuarios tenant desde Plataforma.
- `MANAGE_USERS` y `MANAGE_ROLES` siguen aplicando en endpoints tenant normales, ahora con filtro por company activa.

## Flujo de prueba esperado

1. Login como `platform@appmoda.local`.
2. Confirmar que solo ve seccion `PLATAFORMA`.
3. Entrar a `/platform`.
4. Crear o seleccionar `Marla Boutique`.
5. Crear sucursal `Sucursal Centro`.
6. Crear admin `m.quintero@gmail.com`.
7. Crear usuario vendedor/cajero para la misma compania.
8. Login como `m.quintero@gmail.com`.
9. Confirmar que no ve Plataforma.
10. Entrar a `/users`.
11. Confirmar que solo aparecen usuarios de Marla Boutique.
12. Intentar `/platform` por URL y esperar bloqueo/403.

## Evidencia esperada

- Tenant admin de compania A no lista usuarios de compania B.
- Tenant admin de compania A no edita/desactiva usuarios de compania B.
- Tenant admin no puede crear usuario en branch de compania B.
- Platform owner lista companias y usuarios por compania desde endpoints de Plataforma.
- Usuario normal sin `VIEW_PLATFORM` recibe rechazo en `/api/platform/**`.

## Riesgos pendientes

- Esta fase corrige obligatorio `/users` y `/branches`; otros modulos deben completar hardening tenant antes de declarar SaaS productivo completo.
- El usuario de plataforma local/dev sigue usando password seed y hash dev.
- Falta auditoria especifica de acciones SaaS.
- Falta impersonacion auditada.
- Falta modelo comercial de suscripciones y bloqueo por falta de pago.

## Backlog

- FAST-TENANT-HARDENING: revisar customers, items, reservations, customer packages, payments, sales, shipments y lives por consultas cross-company.
- Impersonacion auditada con motivo, caducidad y bitacora.
- Suscripciones, planes y limites por cliente.
- Bloqueo por falta de pago.
- Dashboard SaaS.
- Endurecer passwords productivos y eliminar seeds dev en ambientes reales.

## Validaciones

- Pruebas enfocadas agregadas para aislamiento de `/users`.
- Pruebas enfocadas agregadas para permisos de Plataforma.
- Validaciones finales esperadas: `./mvnw.cmd test`, `npm run lint`, `npx tsc --noEmit`, `git diff --check`.

## Decision

`GO_TECNICO_FAST_PLATFORM_B` para nueva revision visual si las validaciones completas pasan.
