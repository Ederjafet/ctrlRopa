# FAST-PLATFORM-D - SaaS Owner, suscripciones y consumo

## Resumen ejecutivo

FAST-PLATFORM-D separa el modulo Platform Owner en secciones reales para administrar AppModa como SaaS. `/platform` deja de ser una pantalla unica repetida para todas las opciones del menu y ahora organiza dashboard, clientes, sucursales, usuarios, modulos, limites, planes, tarifas de consumo, uso y auditoria en vistas distintas.

Tambien se agrega la base administrativa para configurar planes de suscripcion, precios por periodo, modelo de cobro por compania y tarifas por consumo. No se implementan pasarela de pago, facturacion real, recibos, impersonacion ni suspension automatica.

## Problema detectado

- `/platform` mantenia doble cabecera contextual: header principal y tarjeta secundaria de alcance SaaS con informacion repetida.
- El menu Platform Owner tenia varias entradas, pero casi todas mostraban la misma pantalla completa.
- No existia una seccion formal para planes, precios por periodo, suscripcion por cliente o tarifas de consumo.
- El Platform Owner necesitaba diferenciar claramente Plataforma SaaS de Operacion tenant.

## Correccion UX

- `/platform` usa una sola cabecera contextual con eyebrow `MODO PLATAFORMA`.
- Se elimina la tarjeta superior duplicada de alcance.
- No se muestra boton `Actualizar` en Plataforma; se mantiene la regla global de que `Actualizar` solo pertenece a LIVE.
- Cada opcion del menu activa una seccion diferente dentro de `/platform`.
- Los formularios se abren desde acciones especificas y no ocupan toda la pantalla por defecto.

## Menu Platform Owner

El menu queda separado asi:

- `PLATAFORMA`: Panel Plataforma, Clientes / Companias, Sucursales, Usuarios.
- `CONFIGURACION CLIENTE`: Modulos activos, Limites por cliente.
- `COBRANZA SAAS`: Planes / Suscripciones, Tarifas por consumo.
- `REPORTES`: Uso por cliente.
- `SEGURIDAD`: Auditoria global.

Tenant Admin y usuarios operativos no reciben estas entradas ni pueden usar `/api/platform/**`.

## Secciones implementadas en /platform

- `dashboard`: resumen SaaS con companias, sucursales, usuarios, modulos, limites y clientes sin plan/modelo.
- `companies`: listado, seleccion y creacion de clientes/companias.
- `branches`: sucursales de la compania seleccionada y alta de sucursal.
- `users`: usuarios de la compania seleccionada, alta de admin y usuarios operativos.
- `modules`: toggles de modulos por compania.
- `limits`: limites por cliente, incluyendo usuarios, sucursales, prendas, lives, envios y paquetes.
- `subscriptions`: catalogo de planes, precios mensual/trimestral/semestral/anual y suscripcion por compania.
- `usageRates`: tarifas por consumo por compania.
- `usage`: resumen basico de uso por cliente.
- `audit`: seccion separada con placeholder de auditoria global pendiente de hardening.

## Planes y suscripciones

Se agrega catalogo de planes SaaS con:

- codigo, nombre, descripcion y estado.
- usuarios y sucursales incluidos.
- flags de inclusion para LIVE, Reportes, Envios y Paquetes.

Cada plan puede tener precios por:

- `MONTHLY`
- `QUARTERLY`
- `SEMIANNUAL`
- `ANNUAL`

Cada compania puede asociarse a:

- plan opcional.
- modelo de cobro: `SUBSCRIPTION`, `USAGE_BASED` o `HYBRID`.
- periodo de cobro.
- estado: `TRIAL`, `ACTIVE`, `PAST_DUE`, `SUSPENDED`, `CANCELLED`.
- fechas de inicio, fin y siguiente cobro.

## Tarifas por consumo

Para avanzar rapido se implementa la opcion simple `company_usage_rates`, con tarifas por compania. Los tipos soportados son:

- `ACTIVE_USER`
- `ACTIVE_BRANCH`
- `LIVE_SESSION`
- `PACKAGE_CREATED`
- `SHIPMENT_CREATED`
- `SALE_CREATED`
- `ITEM_CREATED`
- `PAYMENT_REGISTERED`
- `RESERVATION_CREATED`

Cada tarifa tiene precio unitario, moneda y bandera activa/inactiva.

## Tablas nuevas

Migracion creada:

- `V61__fast_platform_d_saas_billing_base.sql`

Tablas creadas:

- `subscription_plans`
- `subscription_plan_prices`
- `company_subscriptions`
- `company_usage_rates`

Tablas reutilizadas de FAST-PLATFORM-C:

- `company_modules`
- `company_limits`

## Endpoints nuevos

- `GET /api/platform/subscription-plans`
- `POST /api/platform/subscription-plans`
- `PATCH /api/platform/subscription-plans/{planId}`
- `GET /api/platform/subscription-plans/{planId}/prices`
- `PUT /api/platform/subscription-plans/{planId}/prices`
- `GET /api/platform/companies/{companyId}/subscription`
- `PUT /api/platform/companies/{companyId}/subscription`
- `GET /api/platform/companies/{companyId}/usage-rates`
- `PUT /api/platform/companies/{companyId}/usage-rates`
- `GET /api/platform/usage`

Endpoints reutilizados:

- `/api/platform/companies`
- `/api/platform/companies/{companyId}/branches`
- `/api/platform/companies/{companyId}/users`
- `/api/platform/companies/{companyId}/settings`

## Permisos nuevos

- `VIEW_PLATFORM_BILLING`
- `MANAGE_SUBSCRIPTION_PLANS`
- `MANAGE_COMPANY_SUBSCRIPTIONS`
- `MANAGE_USAGE_RATES`
- `VIEW_PLATFORM_USAGE`
- `MANAGE_COMPANY_MODULES`
- `MANAGE_COMPANY_LIMITS`

Todos se asignan a `PLATFORM_OWNER` desde la migracion. Los cambios de modulos y limites pasan a exigir permisos especificos en backend.

## Validaciones realizadas

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK sin errores; permanecen warnings preexistentes del repositorio.
- `npx tsc --noEmit`: OK.
- `./mvnw.cmd -Dtest=PlatformServiceAccessTests test`: OK, 10 tests.
- `./mvnw.cmd test`: OK cargando `.env` local sin imprimir secretos. Flyway valido 61 migraciones y el esquema quedo en version 61. Se observo warning de log local por acceso a `C:/HPSQ-SOFT/control-ropa/logs/backend/control-ropa.log`, sin romper el build.

## Smoke QA recomendado

1. Login como `platform@appmoda.local`.
2. Entrar a `/platform` y confirmar una sola cabecera, sin `Actualizar`.
3. Probar cada seccion del menu Platform Owner y confirmar contenido diferente.
4. Crear o seleccionar compania demo.
5. Crear sucursal y usuario de la compania seleccionada.
6. Activar/desactivar modulos y guardar.
7. Editar limites y guardar.
8. Crear/ver plan, editar precios por periodo y asociarlo a cliente.
9. Configurar tarifas por consumo.
10. Validar que Tenant Admin no ve Plataforma ni cobranza SaaS.
11. Confirmar que LIVE conserva su boton `Actualizar`.

## Riesgos pendientes

- La auditoria global queda como seccion placeholder hasta exponer eventos SaaS consolidados.
- El uso por cliente es resumen operativo basico; no calcula factura final.
- Falta corte de cobranza mensual y calculo automatico de consumo facturable.
- Falta pasarela de pago, facturacion real, recibos y conciliacion.
- Falta suspension automatica por falta de pago.
- Falta impersonacion auditada.
- Falta dashboard SaaS avanzado con metricas financieras.

## Backlog

- Pasarela de pago.
- Facturacion real y recibos.
- Corte de cobranza mensual.
- Calculo automatico de consumo.
- Suspension automatica por falta de pago.
- Impersonacion auditada.
- Dashboard SaaS avanzado.
- Auditoria global de plataforma con eventos persistidos y filtros.

## GO / NO-GO

GO tecnico para continuar instalacion/demo de cliente en rama feature, sujeto a smoke visual y reset local con credenciales MySQL disponibles. NO es GO para cobranza productiva real porque aun no existen pasarela, facturacion, recibos ni suspension automatica.
