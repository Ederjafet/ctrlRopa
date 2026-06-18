# ERP LIVE Architecture Metrics Engagement

Fecha: 2026-05-18  
Rama: `feature/live-b-arquitectura-metricas-engagement`  
Tipo: diseno producto/arquitectura, sin implementacion runtime

## 1. Objetivo LIVE-B

LIVE-B define la arquitectura futura para que LIVE evolucione de captura operativa de reservas a un modulo medible, auditable y preparado para engagement.

Objetivos:

- Estructurar el futuro flujo LIVE sin modificar el flujo actual.
- Definir metricas operativas y de engagement.
- Definir tracking de eventos internos.
- Preparar integracion futura con Facebook/Meta Live sin implementarla.
- Mantener aislamiento multi-tenant: toda metrica futura debe pertenecer a una `company_id`.

Fuera de alcance:

- No Java.
- No frontend funcional.
- No migraciones.
- No integracion Facebook real.
- No ventas, pagos, reportes ni reservaciones.

## 2. Estado Actual LIVE

Pantallas actuales:

- `app/live.tsx`: captura operativa de live, seleccion de live abierto, seleccion de cliente/prenda, creacion de reserva, cierre de live.
- `app/report-live.tsx`: reporte actual de control live.
- `app/(tabs)/index.tsx`: acceso a `Live` y `Historial de lives`.

Servicios frontend:

- `services/liveService.ts`
  - `getLivesByBranch(branchId)` -> `GET /api/lives/branch/{branchId}`
  - `getLiveById(id)` -> `GET /api/lives/{id}`
  - `createLive(branchId, payload)` -> `POST /api/lives/branch/{branchId}`
  - `activateLive(id)` -> `PATCH /api/lives/{id}/activate`
  - `closeLive(id)` -> `PATCH /api/lives/{id}/close`
- `services/liveWorkflowStorage.ts`: guarda live seleccionado por `branchId/userId`.

Backend actual:

- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/Live.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveStatus.java`

Estados actuales reales:

- `OPEN`
- `ACTIVE`
- `CLOSED`

Relaciones operativas actuales:

- `Live` pertenece a `Branch`.
- `Reservation` puede referenciar `Live` mediante `live_id`.
- `app/live.tsx` carga `customers`, `items`, `reservations` y `payments` para operar reserva/cobro.
- `customers`, `items` y `batches` ya son tenant-aware en endpoints directos; LIVE todavia no debe considerarse SaaS completo hasta tenantizar sus endpoints y consumidores.

I18N actual:

- LIVE-A agrego `services/i18n.ts`, `locales/es/common.json`, `locales/en/common.json`.
- `app/live.tsx` ya usa traducciones para textos principales.

Riesgos actuales:

- `LiveRepository.findById` y `findByBranchId...` todavia no estan documentados como tenant-aware.
- No existe tabla de eventos LIVE.
- No existe agregacion de metricas.
- No existe integracion Facebook.
- No existe dashboard LIVE analytics.
- Reportes LIVE actuales no deben asumirse tenant-aware para SaaS completo hasta revision dedicada.

## 3. Lifecycle LIVE Propuesto

Estados futuros propuestos:

| Estado | Proposito | Quien puede cambiarlo | Acciones permitidas | Acciones bloqueadas | Eventos generados |
|---|---|---|---|---|---|
| DRAFT | Live preparado pero no publicado | Admin, encargado LIVE | editar notas, asignar productos sugeridos, cancelar | recibir reservas, sincronizar Facebook | `LIVE_CREATED` |
| SCHEDULED | Live programado con fecha/hora | Admin, encargado LIVE | editar agenda, notificar, cancelar | capturar reservas si no esta activo | `LIVE_SCHEDULED` |
| OPEN | Live abierto para operar en ERP | Vendedor LIVE autorizado | seleccionar cliente/prenda, crear reservas | metricas Facebook si no hay conexion | `LIVE_STARTED` si se abre desde schedule |
| ACTIVE | Live transmitiendose/operando | Vendedor LIVE autorizado | crear reservas, registrar eventos, destacar productos | edicion estructural riesgosa | `LIVE_STARTED`, `PRODUCT_PINNED`, `RESERVATION_CREATED` |
| PAUSED | Live pausado temporalmente | Vendedor LIVE, admin | reanudar, cerrar, registrar notas | nuevas reservas si politica lo bloquea | `LIVE_PAUSED`, `LIVE_RESUMED` |
| CLOSED | Live terminado | Vendedor LIVE, admin | ver resumen, reportes, auditoria | nuevas reservas/eventos operativos | `LIVE_CLOSED` |
| CANCELLED | Live cancelado | Admin, encargado autorizado | ver motivo, auditoria | reservas, sincronizacion, reactivacion directa | `LIVE_CANCELLED` |

Regla de producto: `CLOSED` y `CANCELLED` deben ser terminales salvo proceso administrativo auditado.

## 4. Arquitectura Recomendada

Componentes futuros:

- LIVE Metrics Service: consulta y expone metricas por `company_id`, `branch_id`, `live_id`.
- LIVE Events Table futura: almacena eventos internos y externos normalizados.
- LIVE Engagement Aggregator: consolida eventos crudos en contadores por minuto/live/producto.
- Facebook Integration Adapter: encapsula Graph API, tokens, rate limit y errores.
- Cache temporal: mantiene viewers/comentarios recientes sin sobrecargar API externa.
- Dashboard LIVE: vista operativa para productor/vendedor y resumen post-live.

Flujo recomendado:

1. Evento operativo ocurre en ERP o Facebook.
2. Adapter/servicio normaliza evento.
3. Evento se guarda tenant-aware.
4. Aggregator actualiza metricas.
5. Dashboard LIVE consulta metricas agregadas.
6. Auditoria registra acciones sensibles.

No implementar hasta fases futuras:

- Webhooks Facebook.
- Polling Graph API.
- Persistencia de tokens.
- UI de comentarios.
- Dashboard analytics.

## 5. Metricas Futuras

Metricas por live:

- Viewers actuales.
- Viewers pico.
- Comentarios totales.
- Reacciones totales.
- Engagement rate.
- Productos mostrados.
- Productos clicados.
- Apartados generados.
- Intencion de venta.
- Conversion futura.
- Duracion live.
- Actividad por minuto.

Metricas por producto:

- Veces destacado.
- Clicks.
- Comentarios asociados.
- Reservas generadas.
- Conversion a venta futura.

Metricas por operador:

- Reservas capturadas.
- Tiempo de respuesta a comentarios.
- Acciones de moderacion.
- Productos destacados.

## 6. Multi-Tenant

Reglas obligatorias:

- Toda metrica debe incluir `company_id`.
- Todo live futuro debe pertenecer directamente a `company_id`, no solo a branch.
- Toda consulta debe filtrar por `CurrentTenantContext.companyId`.
- `branch_id` debe validarse contra `company_id`.
- Tokens Facebook deben ser por company, nunca globales.
- Empresa A no puede ver metricas, lives, comentarios, viewers o tokens de Empresa B.
- Soporte HPSQ-SOFT solo puede acceder con rol y auditoria explicita.

## 7. UX Propuesta

Panel productor/vendedor:

- Estado LIVE visible.
- Contador viewers.
- Comentarios recientes.
- Reacciones/engagement.
- Productos destacados.
- Boton para destacar producto.
- Timeline de eventos.
- Alertas de sincronizacion.
- Estado de conexion Facebook.

Resumen post-live:

- Duracion.
- Reservas generadas.
- Productos con mas interes.
- Comentarios/reacciones.
- Errores de sincronizacion.
- Acciones del operador.

I18N:

- Todos los textos nuevos deben agregarse a `locales/es/common.json` y `locales/en/common.json`.
- No crear literales nuevos en pantallas LIVE futuras.

## 8. QA Futuro

Pruebas recomendadas:

- Simular live sin Facebook.
- Simular eventos manuales internos.
- Validar metricas por company.
- Validar usuario sin permiso no ve metricas.
- Validar live cerrado no recibe operaciones.
- Validar i18n ES/EN.
- Validar que eventos duplicados no inflan metricas.
- Validar que eventos de Empresa B no aparecen en Empresa A.

## 9. Riesgos Criticos

- Dependencia de Facebook API.
- Rate limits.
- Tokens vencidos.
- Datos inconsistentes entre Facebook y ERP.
- Metricas cross-company.
- Eventos duplicados.
- Permisos excesivos.
- Privacidad de usuarios.
- Datos sensibles en logs.

## 10. Roadmap Recomendado

- LIVE-C: normalizar estados y UX.
- LIVE-D: tabla/eventos internos LIVE.
- LIVE-E: metricas internas sin Facebook.
- LIVE-F: integracion Facebook diseno tecnico final.
- LIVE-G: integracion Facebook runtime.
- LIVE-H: dashboard LIVE analytics.

## Decision

GO documental para preparar arquitectura LIVE metrics/engagement. NO-GO para implementar Facebook o tocar ventas/pagos/reservaciones hasta completar fases de eventos internos y QA tenant-aware.
