# FAST-PLATFORM-A Super Usuario AppModa MVP

## Objetivo de negocio

Habilitar un MVP rapido para vender AppModa a varios clientes sin construir todavia todo el SaaS. La fase agrega un usuario de plataforma capaz de crear empresas cliente, crear su sucursal principal y dar de alta el admin inicial de cada cliente.

## Que se implemento

- Usuario local/dev `platform@appmoda.local`.
- Rol `PLATFORM_OWNER`.
- Permisos `VIEW_PLATFORM`, `MANAGE_COMPANIES` y `MANAGE_TENANT_ADMINS`.
- Tenant interno `AppModa Platform` con sucursal `AppModa HQ`.
- Endpoints `/api/platform/**` protegidos por permisos de plataforma.
- Pantalla frontend `/platform`.
- Menu lateral `Plataforma` visible solo para `PLATFORM_OWNER` o usuarios con `VIEW_PLATFORM`.
- Redireccion post-login de plataforma hacia `/platform`.
- Creacion de empresa cliente con sucursal principal activa.
- Creacion de admin inicial del cliente con rol `ADMIN` existente.

## Usuario platform local/dev

- Email: `platform@appmoda.local`
- Password local/dev: `Platform123!`
- Rol: `PLATFORM_OWNER`
- Estado: `ACTIVE`
- Tenant MVP: `AppModa Platform` / `AppModa HQ`

La solucion usa tenant interno porque el modelo actual exige `users.branch_id`, `branches.company_id`, `user_companies` y `user_branches` para login, sesiones y `/api/me`. Dejar `company_id`/`branch_id` nulos romperia el contrato actual de autenticacion.

## Permisos nuevos

- `VIEW_PLATFORM`: permite ver pantalla y endpoints de plataforma.
- `MANAGE_COMPANIES`: permite crear empresas cliente.
- `MANAGE_TENANT_ADMINS`: permite crear admins iniciales de clientes.

`ADMIN`, `SUPERVISOR`, `SELLER` y `CASHIER` no reciben estos permisos en la migracion.

## Endpoints nuevos

- `GET /api/platform/companies`
  - Lista empresas y su primera sucursal activa.
- `POST /api/platform/companies`
  - Crea empresa y sucursal principal.
  - Habilita canales operativos activos para la sucursal nueva.
- `POST /api/platform/companies/{companyId}/admin-user`
  - Crea admin inicial con rol `ADMIN`.
  - Asocia usuario a `user_companies` y `user_branches` del cliente.

## Flujo de prueba

1. Reset local y levantar backend.
2. Login con `platform@appmoda.local` / `Platform123!`.
3. Confirmar menu `Plataforma`.
4. Entrar a `/platform`.
5. Crear empresa `Cliente Demo AppModa` con sucursal `Sucursal Principal`.
6. Crear admin `admin.cliente.demo@local.test` / `AdminCliente123!`.
7. Cerrar sesion.
8. Login con el admin creado.
9. Confirmar que no ve `Plataforma`.
10. Confirmar que opera en la empresa/sucursal recien creada.

## Aislamiento

El super usuario de plataforma no recibe permisos de venta, pagos, LIVE, prendas, paquetes o envios. Si intenta usar endpoints operativos normales, queda dentro del tenant interno `AppModa Platform`, sin bypass de filtros tenant existentes.

Los admins de cliente quedan asociados a la empresa y sucursal creadas. El modelo vigente mantiene aislamiento por `user_companies`, `user_branches`, sesion activa y guards de tenant existentes.

## Riesgos

- La password seed usa `{noop}` para entorno local/dev, igual que los seeds actuales. En produccion debe reemplazarse por contrasena segura y hash robusto.
- `legalName` se acepta en el contrato frontend pero no se persiste porque el modelo actual de `companies` no tiene columna legal.
- La consola de plataforma no tiene impersonacion ni auditoria avanzada de soporte.
- La pantalla es un MVP operativo, no un dashboard SaaS completo.

## Pendientes

- Impersonacion auditada.
- Suscripciones y planes.
- Bloqueo por falta de pago.
- Dashboard SaaS.
- Endurecer passwords para produccion.
- Datos legales/fiscales de company cuando exista contrato de modelo.
- Auditoria especifica de creacion de tenants y admins si se requiere nivel compliance.
