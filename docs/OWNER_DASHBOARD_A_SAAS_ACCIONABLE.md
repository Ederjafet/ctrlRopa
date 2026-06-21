# OWNER-DASHBOARD-A Dashboard SaaS accionable

Fecha: 2026-06-21

Rama:

- `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Problema detectado

El Dashboard SaaS del Panel Owner mostraba conteos basicos, pero no ayudaba al Platform Owner a decidir que atender hoy. La vista no tenia pendientes por cliente, actividad diaria, alertas operativas ni accesos rapidos orientados a administracion SaaS.

## Decision

Se enriquecio el Dashboard SaaS como vista global de plataforma:

- No depende de `selectedCompanyId`.
- No filtra por el cliente en administracion.
- No cambia el cliente en administracion al entrar al dashboard.
- Solo cambia `selectedCompanyId` cuando el usuario pulsa una accion explicita como `Configurar` o `Revisar` sobre un cliente.

## Endpoint agregado

Se creo endpoint read-only:

```text
GET /api/platform/dashboard/summary
```

Permiso:

- `VIEW_PLATFORM`

Proteccion:

- Reutiliza `PlatformService.assertCanViewPlatform()`.
- Tenant Admin no debe poder acceder al endpoint global.
- No devuelve informacion sensible innecesaria; entrega conteos y resumenes operativos.

## Metricas agregadas

Resumen SaaS:

- Clientes activos.
- Clientes trial.
- Clientes suspendidos/inactivos.
- Clientes sin plan o modelo de cobro.
- Clientes con suscripcion activa.
- Clientes con modelo de consumo.
- Usuarios activos globales.
- Sucursales activas globales.
- Planes activos.
- Clientes con uso hoy.
- Ingreso mensual estimado si existen suscripciones activas con precio configurado.

Actividad de hoy:

- Prendas creadas hoy.
- Apartados creados hoy.
- Paquetes creados hoy.
- Pagos registrados hoy.
- Monto abonado hoy.
- Envios creados hoy.
- LIVE creados hoy.
- Reservas LIVE creadas hoy.

Pendientes criticos:

- Sin plan.
- Sin modelo de cobro.
- Sin sucursal activa.
- Sin admin cliente.
- Sin usuarios operativos.
- Sin modulos activos.
- Sin limites configurados.
- LIVE desactivado.
- Suscripcion no activa.

Clientes que requieren atencion:

- Estado.
- Plan/modelo.
- Usuarios activos contra limite.
- Sucursales activas contra limite.
- Modulos activos resumidos.
- Uso hoy.
- Pendientes de configuracion.

Alertas operativas:

- Paquetes listos para envio.
- Envios abiertos o en ruta.
- Apartados activos con mas de 7 dias sin paquete.
- Autorizaciones LIVE pendientes.
- Clientes cerca de limites configurados.

## Diseno frontend

Se rediseño `Dashboard SaaS AppModa` en `app/platform.tsx` con bloques compactos:

1. Resumen SaaS.
2. Pendientes criticos.
3. Actividad de hoy.
4. Clientes que requieren atencion.
5. Alertas operativas.
6. Acciones rapidas.

Las acciones rapidas no duplican el menu lateral; son atajos concretos:

- Crear cliente.
- Configurar planes.
- Revisar limites.
- Ver uso global.

## Acciones disponibles

- `Configurar` en pendientes: selecciona explicitamente el cliente y navega a la seccion Platform sugerida.
- `Revisar` en clientes de atencion: selecciona explicitamente el cliente y abre Clientes / Companias.
- `Revisar` en alertas: navega a secciones globales Platform como Uso, Limites o Auditoria.

No se navega a rutas tenant operativas desde el dashboard global para evitar confundirlo con impersonacion.

## Metricas pendientes por falta de dato consolidado

- Ingreso real cobrado por SaaS.
- Facturacion real por periodo.
- Vencimientos automaticos y morosidad real.
- Usuarios activos por sesion/auditoria de uso fino.
- Tendencia mensual.
- Uso detallado por periodo y por modulo.
- Alertas avanzadas de saldo a favor y paquetes con saldo pendiente por cliente.

## Validaciones

Validaciones tecnicas esperadas:

- `./mvnw.cmd test`
- `npm run lint`
- `npx tsc --noEmit`
- `git --no-pager diff --check`

Validaciones manuales recomendadas:

- Platform Owner entra a `/platform?section=dashboard`.
- Dashboard se entiende como global.
- Cliente en administracion no parece filtro.
- Tenant Admin no accede a endpoint global.
- Dark mode mantiene legibilidad.

## Riesgos pendientes

- Las alertas operativas son de conteo global y no reemplazan reportes detallados por cliente.
- El ingreso mensual estimado depende de suscripciones activas y precios configurados; si falta dato, la UI muestra `Pendiente`.
- El dashboard no implementa facturacion real ni cobranza automatica.
- Las acciones globales no deben evolucionar a operacion tenant sin una fase de impersonacion auditada.

## Backlog

- Ingresos reales SaaS.
- Facturacion real y cortes por periodo.
- Vencimientos y suspension automatica.
- Uso detallado por periodo.
- Alertas avanzadas con drill-down.
- Grafica de tendencia mensual.
- Vista historica por cliente.

## Nota OWNER-LICENSE-B

El dashboard global ahora distingue licencia perpetua y hosting anual:

- `Licencias perpetuas` cuenta clientes con licencia `PERPETUAL` activa.
- `Cobros unicos` muestra montos de licencia perpetua como pago unico, no como MRR.
- `Hosting AppModa` identifica clientes donde AppModa hospeda infraestructura.
- Servicios anuales vencidos o proximos a vencer aparecen como alerta comercial.

Los clientes con licencia perpetua activa ya no deben aparecer como `sin plan`.
