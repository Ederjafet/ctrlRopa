# FAST-PLATFORM-C - Instalacion cliente, tenant SaaS y modulos AppModa

Fecha: 2026-06-19

## Resumen ejecutivo

FAST-PLATFORM-C refuerza el MVP de plataforma para preparar instalaciones de nuevos clientes AppModa. Se mantiene el aislamiento tenant corregido en FAST-PLATFORM-B y se agrega una base SaaS minima: modulos activos por compania, limites de usuarios/sucursales y una UX de Plataforma mas clara para crear y administrar clientes.

## Problema corregido

El flujo FAST-PLATFORM-A/B ya permitia crear companias, sucursales y usuarios, pero faltaba una configuracion visible por cliente para controlar que modulos aparecen en la operacion tenant y cuantos usuarios/sucursales puede crear el equipo de plataforma.

Tambien se mejoro la claridad del menu de Platform Owner para separar Plataforma de la operacion normal de tienda.

## Aislamiento multitenant

- `/api/users` sigue filtrado por la compania activa del usuario tenant.
- El frontend no oculta como unica defensa: el backend valida tenant en listado, detalle, alta, edicion y desactivacion de usuarios.
- `PLATFORM_OWNER` conserva endpoints propios en `/api/platform/**`.
- `TENANT_ADMIN`, supervisor, vendedor y cajero no deben usar `/api/platform/**`.
- Los modulos operativos del menu dependen de la sesion y de `company_modules`.

## Modelo SaaS agregado

Migracion:

- `V60__fast_platform_c_tenant_saas_settings.sql`

Tablas:

- `company_modules`: modulo habilitado/deshabilitado por compania.
- `company_limits`: limites configurables por compania.

Modulos base:

- `INVENTORY`
- `DOOR_SALES`
- `RESERVATIONS`
- `CUSTOMER_PACKAGES`
- `SHIPMENTS`
- `PAYMENTS`
- `LIVE`
- `REPORTS`
- `MULTI_BRANCH`
- `CASH_CLOSURES`
- `CONSIGNMENTS`
- `RETURNS_REFUNDS`

Limites MVP:

- `max_users`
- `max_branches`

Valor vacio significa sin limite.

## Endpoints nuevos

- `GET /api/platform/companies/{companyId}/settings`
- `PATCH /api/platform/companies/{companyId}/settings`

El `PATCH` permite actualizar modulos y limites de usuarios/sucursales del cliente seleccionado.

## Reglas implementadas

- Crear sucursal desde plataforma valida `max_branches` si existe.
- Crear usuario/admin tenant desde plataforma valida `max_users` si existe.
- El login y `/api/me` devuelven `enabledModules`.
- El menu operativo tenant oculta modulos deshabilitados.
- Si una sesion antigua no trae modulos, el frontend conserva fallback permisivo para no romper clientes antes de migrar.
- `PLATFORM_OWNER` ve un menu SaaS separado y no el menu operativo normal.

## UX Plataforma

La pantalla `/platform` ahora concentra:

- Selector de cliente inmediatamente arriba.
- Acciones rapidas: crear cliente, admin inicial, sucursales, usuarios, modulos y limites.
- Panel activo para evitar que todos los formularios queden abiertos a la vez.
- Vista de resumen con alcance de Plataforma.
- Panel de modulos y limites por cliente.

## Permisos agregados

- `MANAGE_PLATFORM_BRANCHES`
- `MANAGE_PLATFORM_USERS`
- `MANAGE_COMPANY_BRANCHES`
- `MANAGE_COMPANY_USERS`

En esta fase se agregan como vocabulario RBAC SaaS. Los endpoints existentes conservan checks principales `VIEW_PLATFORM`, `MANAGE_COMPANIES` y `MANAGE_TENANT_ADMINS`.

## Flujo de prueba recomendado

1. Login como `platform@appmoda.local`.
2. Entrar a Plataforma.
3. Seleccionar una compania cliente.
4. Abrir `Modulos y limites`.
5. Desactivar `LIVE` o `CUSTOMER_PACKAGES`.
6. Guardar.
7. Login como admin de ese cliente.
8. Confirmar que el menu no muestra el modulo desactivado.
9. Configurar `max_users` o `max_branches`.
10. Intentar crear usuarios/sucursales por encima del limite desde Plataforma y confirmar bloqueo backend.
11. Confirmar que `/users` de tenant admin solo muestra usuarios de su compania.

## Validaciones ejecutadas

- `npx tsc --noEmit`
- `npm run lint` paso con warnings preexistentes del proyecto.
- `./mvnw.cmd test` directo fallo por entorno sin password de MySQL (`using password: NO`).
- `./mvnw.cmd test` con carga local de `.env` paso; Flyway valido 60 migraciones.
- `git --no-pager diff --check`

## Riesgos pendientes

- Falta hardening tenant completo modulo por modulo para todos los endpoints P0.
- No hay impersonacion auditada.
- No hay suscripciones/cobro SaaS.
- No hay bloqueo comercial por falta de pago.
- No hay dashboard SaaS real de uso por cliente.
- No hay auditoria global dedicada para cambios de modulos/limites.

## Siguiente fase recomendada

FAST-PLATFORM-D debe enfocarse en hardening tenant por modulo P0 y pruebas negativas por company para clientes, prendas, apartados, pagos, paquetes, envios, LIVE y reportes.
