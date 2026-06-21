# OWNER-COMPANIES-UX-A Clientes / Companias accionables

Fecha: 2026-06-21

Rama:

- `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Problema detectado

La seccion `Clientes / Companias` del Panel Owner funcionaba como listado basico. Mostraba nombre, estado y algunos conteos, pero no ayudaba al Platform Owner a identificar rapidamente que clientes estaban listos, incompletos, sin plan, sin limites o sin modulos configurados.

## Decision

Se redisenio la vista como consola SaaS accionable:

- Resumen superior de clientes.
- Filtros rapidos por estado operativo.
- Tarjetas compactas por cliente.
- Indicador de salud/configuracion.
- Pendientes visibles por cliente.
- Acciones directas: `Administrar`, `Configurar` y `Ver plan`.
- Estado `En administracion` como badge contextual.

No se toco backend. La pantalla reutiliza datos existentes:

- `getPlatformCompanies()`.
- `getPlatformUsageSummary()`.
- `getPlatformDashboardSummary()`.

## Datos mostrados por cliente

Cada cliente muestra:

- Nombre comercial.
- Codigo.
- Estado.
- Sucursal principal.
- Badge `Interna` para `APPMODA_PLATFORM`.
- Plan actual.
- Modelo de cobro.
- Estado de suscripcion.
- Usuarios activos contra limite.
- Sucursales activas contra limite.
- Estado del admin inicial.
- Modulos activos o resumen de modulos.
- Pendientes de configuracion.

## Salud y pendientes

La salud se calcula en frontend combinando datos existentes:

- `Interno`: tenant `APPMODA_PLATFORM`.
- `Suspendido/inactivo`: cliente no `ACTIVE` ni `TRIAL`.
- `Sin plan`: falta plan o modelo de cobro.
- `Incompleto`: faltan sucursales, usuarios, admin, modulos, limites o suscripcion activa.
- `Requiere atencion`: no tiene pendiente critico pero tiene senales como uso bajo o cercania a limites.
- `Listo`: activo y sin pendientes criticos detectados.

Pendientes reutilizados desde `dashboardSummary.installationPendings` cuando estan disponibles:

- Sin plan.
- Sin modelo de cobro.
- Sin sucursal activa.
- Sin admin cliente.
- Sin usuarios operativos.
- Sin modulos activos.
- Sin limites configurados.
- LIVE desactivado.
- Suscripcion no activa.

Para cubrir clientes fuera del limite de resultados del dashboard, la vista infiere pendientes basicos desde `usageSummary` y el listado de companias.

## Acciones

`Administrar`:

- Actualiza `selectedCompanyId`.
- Actualiza la URL `/platform?section=companies&companyId=X`.
- Actualiza el bloque lateral `Cliente en administracion`.
- Muestra feedback: `Ahora administras Cliente X.`
- No cambia sesion, token ni `/api/me`.
- No es impersonacion.

`Configurar`:

- Selecciona explicitamente el cliente.
- Navega a la seccion de configuracion mas util segun pendiente:
  - plan/cobro/suscripcion -> `subscriptions`
  - limites -> `limits`
  - usuarios/admin -> `users`
  - modulos/LIVE -> `modules`
  - sucursal -> `branches`

`Ver plan`:

- Selecciona el cliente.
- Navega a `Planes / Suscripciones`.

## Filtros

Filtros implementados en frontend:

- Todos.
- Activos.
- Sin plan.
- Con pendientes.
- Listos.
- Internos.

Si no hay resultados, se muestra estado vacio claro.

## Seguridad

La pantalla sigue dentro de `/platform`, protegida por los guards del Panel Owner. No se agregaron endpoints ni datos nuevos. Tenant Admin no debe acceder a esta ruta ni a endpoints globales.

## Datos pendientes

Quedan pendientes para fases futuras:

- Detalle completo de modulos por cliente si no aparece en el resumen.
- Estado fino de LIVE por cliente fuera de los pendientes del dashboard.
- Ultimo uso real por cliente con fecha/hora.
- Drill-down de pendientes por cliente.
- Edicion inline de estado comercial.

## Validaciones

Validaciones tecnicas esperadas:

- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

Backend:

- No aplica; no se toco backend.

Validaciones visuales recomendadas:

- Platform Owner entra a `/platform?section=companies`.
- Se ve resumen superior.
- Filtros cambian el listado.
- `AppModa Platform` aparece como interna.
- `En administracion` se muestra como badge contextual.
- `Administrar` cambia `selectedCompanyId` y actualiza el sidebar.
- `Configurar` y `Ver plan` navegan sin romper persistencia.
- Dark mode mantiene legibilidad.

## Riesgos pendientes

- Si faltan datos en `usageSummary`, algunos pendientes se infieren como `Sin configuracion SaaS`.
- El dashboard summary limita listas accionables; por eso la pantalla complementa con inferencia local.
- No hay drill-down dedicado de pendientes; `Configurar` navega a la seccion mas probable.

## Backlog

- OWNER-COMPANIES-UX-B: panel lateral de detalle por cliente.
- OWNER-COMPANIES-UX-C: ultima actividad real y timeline de configuracion.
- FAST-BILLING-A: facturacion real SaaS y estados comerciales.
