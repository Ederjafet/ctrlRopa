# OWNER-AUDIT-UX-A Auditoria global accionable

Fecha: 2026-06-21

## Objetivo

Redisenar `Auditoria global` del Panel Owner para dejar de mostrar un placeholder y convertirla en una vista SaaS util para revisar cambios globales de plataforma.

## Problema detectado

La seccion `/platform?section=audit` mostraba una tarjeta vacia con mensaje de hardening pendiente. No permitia revisar eventos, filtrar, entender actor/fecha ni distinguir auditoria global de cliente en administracion.

## Endpoint agregado

Se agrego el endpoint read-only:

`GET /api/platform/audit-events`

Proteccion:

- `PlatformService.findAuditEvents()` exige `VIEW_PLATFORM`.
- Tenant admin no debe consumir este endpoint.
- No se agregaron migraciones ni datos fake.

Fuente de datos:

- `system_movement_audit_log`
- Solo eventos con `request_path` iniciado en `/api/platform`
- Solo registros ya persistidos por la auditoria existente de movimientos del sistema.

## Eventos que se muestran hoy

La vista traduce rutas del Panel Owner a eventos de negocio:

- `COMPANY_CREATED`
- `COMPANY_UPDATED`
- `BRANCH_CREATED`
- `BRANCH_UPDATED`
- `TENANT_ADMIN_CREATED`
- `TENANT_USER_CREATED`
- `TENANT_USER_UPDATED`
- `SUBSCRIPTION_PLAN_CREATED`
- `SUBSCRIPTION_PLAN_UPDATED`
- `PLAN_PRICES_UPDATED`
- `SUBSCRIPTION_ASSIGNED`
- `COMPANY_SETTINGS_UPDATED`
- `USAGE_RATES_UPDATED`
- `PLATFORM_CHANGE_RECORDED`

Cada evento muestra:

- fecha/hora;
- actor si la bitacora lo tiene;
- categoria;
- cliente afectado cuando puede inferirse desde la ruta;
- resumen en lenguaje de negocio;
- detalle tecnico minimo.

## Cambios visuales

`app/platform.tsx` reemplaza el placeholder por:

- cabecera global de auditoria;
- resumen superior;
- filtros por texto, categoria y fecha;
- timeline/listado de eventos;
- panel de detalle;
- estado vacio util cuando no hay eventos;
- bloque de cobertura actual de auditoria.

La pantalla aclara que es global y no depende de `selectedCompanyId`.

## Filtros

Filtros disponibles:

- texto libre;
- categoria: clientes, suscripciones, precios, modulos/limites, usuarios y plataforma;
- fecha: todo, hoy, 7 dias, 30 dias.

Los filtros son frontend sobre la respuesta limitada del endpoint.

## Limitaciones actuales

El log actual no guarda payload ni diff de campos. Por eso:

- no hay before/after detallado;
- la creacion de compania desde `POST /api/platform/companies` no conserva el ID creado en la respuesta;
- la severidad real no existe aun;
- no hay export CSV especifico para auditoria SaaS;
- no existe auditoria tenant especifica separada.

## Backlog

- before/after rico por entidad SaaS.
- Payload auditado y sanitizado.
- Severidad real por tipo de evento.
- Export CSV.
- Retencion/paginacion avanzada.
- Auditoria tenant especifica separada.
- Enlace directo desde evento a entidad configurada.

## Validaciones esperadas

- `./mvnw.cmd test`
- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

## Decision

GO si las validaciones pasan y la pantalla deja de ser placeholder sin inventar eventos.
