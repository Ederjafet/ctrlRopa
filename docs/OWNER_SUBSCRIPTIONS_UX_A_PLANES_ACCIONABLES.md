# OWNER-SUBSCRIPTIONS-UX-A Planes / Suscripciones accionables

Fecha: 2026-06-21

Rama:

- `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Problema detectado

La seccion `Planes / Suscripciones` mezclaba catalogo global, precios por periodo y suscripcion del cliente en administracion dentro de una composicion plana. No quedaba claro que los planes y precios son globales, mientras que la suscripcion depende del cliente seleccionado.

## Decision

Se redisenio la pantalla en cuatro bloques:

1. Resumen superior.
2. Catalogo global de planes.
3. Precios del plan seleccionado.
4. Suscripcion del cliente en administracion.

No se toco backend. Se reutilizaron endpoints existentes:

- `GET /api/platform/subscription-plans`
- `GET /api/platform/subscription-plans/{planId}/prices`
- `PUT /api/platform/subscription-plans/{planId}/prices`
- `GET /api/platform/companies/{companyId}/subscription`
- `PUT /api/platform/companies/{companyId}/subscription`
- `GET /api/platform/usage-summary`
- `GET /api/platform/dashboard/summary`

## Resumen superior

La pantalla muestra metricas compactas:

- Planes activos.
- Planes sin precios completos.
- Clientes sin plan.
- Suscripciones activas.
- Estado del cliente actual.

`Planes sin precios completos` se calcula en frontend cargando los precios existentes de cada plan y verificando que tenga periodos activos para:

- Mensual.
- Trimestral.
- Semestral.
- Anual.

## Catalogo global de planes

Cada plan muestra:

- Nombre.
- Codigo.
- Estado.
- Usuarios incluidos.
- Sucursales incluidas.
- Modulos incluidos.
- Estado de precios: `Precios completos` o `Faltan precios`.
- Clientes usando el plan.
- Estado visual `Editando precios` si es el plan seleccionado.

Acciones:

- `Editar precios`.
- `Usar en cliente`.

El boton ambiguo `Plan para precios` fue retirado.

## Precios del plan seleccionado

La seccion de precios ahora muestra el contexto:

- `Precios de {plan}`.
- Copy de que son precios globales del plan, no de un cliente.
- Estado `Completo` o `Incompleto`.

Cada periodo se muestra como bloque compacto con:

- Nombre en espanol.
- Precio guardado en moneda.
- Estado `Guardado` o `Pendiente`.
- Input de edicion.

No se muestran codigos `MONTHLY`, `QUARTERLY`, `SEMIANNUAL` o `ANNUAL` como texto principal de UI.

## Suscripcion del cliente en administracion

La seccion del cliente queda separada del catalogo global.

Muestra:

- Cliente en administracion.
- Plan actual.
- Modelo de cobro.
- Periodicidad.
- Estado.
- Proxima fecha/corte si existe.
- Mensaje de que no genera cobro automatico.

Permite configurar:

- Modelo de cobro: Suscripcion, Consumo o Hibrido.
- Plan del cliente.
- Periodicidad.
- Estado.
- Fechas opcionales: inicio, vencimiento y proximo corte.

Regla UX:

- `Consumo` puede guardarse sin plan.
- `Suscripcion` e `Hibrido` requieren plan antes de guardar.

## Seguridad

La vista sigue dentro del Panel Owner `/platform` y mantiene los permisos existentes:

- Catalogo/precios: permisos de planes SaaS.
- Suscripcion del cliente: permisos de suscripciones de compania.
- Tenant Admin no debe acceder al Panel Owner ni al catalogo global SaaS.

## Fuera de alcance

No se implemento:

- Facturacion real.
- Pasarela de pago.
- Recibos.
- Cobro automatico.
- Vencimiento automatico.
- Suspension comercial automatica.
- Ingresos reales.

## Datos pendientes

Quedan pendientes para fases futuras:

- Conteo exacto por `planId` en uso por cliente; actualmente se aproxima por `planName` disponible en `usageSummary`.
- Edicion completa del plan existente.
- Historial de cambios de plan/precio.
- Validacion avanzada de fechas.
- Drill-down de clientes sin plan desde esta pantalla.

## Validaciones

Validaciones tecnicas esperadas:

- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

Backend:

- No aplica; no se toco backend.

## Riesgos pendientes

- El conteo `clientes usando este plan` depende del nombre del plan expuesto por `usageSummary`.
- Las fechas son administrativas; no disparan facturacion ni suspension.
- La pantalla no reemplaza un modulo de billing real.

## Backlog

- OWNER-SUBSCRIPTIONS-UX-B: editar detalles de planes existentes.
- FAST-BILLING-A: facturacion SaaS real.
- FAST-BILLING-B: vencimientos, cortes y recibos.
- PLATFORM-AUDIT-A: auditoria de cambios de plan, precio y suscripcion.
