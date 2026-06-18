# LIVE-Z0 - Auditoria tecnica y ordenamiento del modulo En vivo

Proyecto: control-ropa-app  
Rama revisada: feature/live-z0-audit  
Fecha: 2026-05-28  
Alcance: diagnostico tecnico, inventario y propuesta de ordenamiento. No implementa funcionalidad nueva.

## 1. Estado inicial del repositorio

Comandos solicitados:

```bash
git status
```

Resultado: rama `feature/live-z0-audit`, working tree limpio.

```bash
git branch --show-current
```

Resultado: `feature/live-z0-audit`.

```bash
git log --oneline -5
```

Resultado:

```text
b8a741a Docs consolida cierre AUTH y entrega QA
f8187ae AUTH-Z cierra validacion integral de seguridad
58e9094 AUTH-J5 agrega export de auditoria
43e0224 AUTH-J4 agrega alertas de auditoria
41ba654 AUTH-J3 agrega dashboard de auditoria
```

## 2. Resumen ejecutivo

El modulo En vivo ya tiene una base operativa real: crea transmisiones, las activa/cierra, lista clientes y prendas tenant-aware, registra reservas LIVE, muestra reservas recientes y permite continuar hacia cobro. Tambien tiene una capa visual avanzada con layouts separados para desktop/tablet/mobile, product spotlight, consola de operador, activity feed, widgets configurables, preferencias locales y microcopy trabajado.

El estado actual es hibrido. La operacion minima se puede reutilizar, pero la experiencia avanzada mezcla datos reales con datos demo/locales. Antes de realtime, IA o integraciones externas, conviene ordenar el modulo en capas: flujo core, modos de experiencia, widgets, configuracion y servicios.

Hallazgo principal: el backend tiene tabla `lives` real y `reservations.live_id`, pero no tiene aun producto activo oficial, eventos LIVE, actividad social real, analiticos reales ni sincronizacion multiusuario. El frontend compensa con estado local, seleccion actual y datos demo/hibridos.

## 3. Mapa del flujo actual de En vivo

1. Usuario entra a `/live`.
2. Frontend obtiene sesion y valida `canViewLive`.
3. Carga en paralelo:
   - `/api/lives/branch/{branchId}`
   - `/api/items/branch/{branchId}` si tiene permiso de inventario
   - `/api/customers/branch/{branchId}` si tiene permiso de clientes
   - `/api/reservations/branch/{branchId}`
4. Selecciona una transmision activa/abierta o recupera `selected_live_{branchId}_{userId}` desde AsyncStorage.
5. Operador puede crear transmision con notas, activar o cerrar.
6. Operador selecciona cliente existente o navega a alta rapida de cliente.
7. Operador selecciona prenda por modal, codigo o QR; tambien puede navegar a alta rapida de prenda.
8. Operador registra reserva LIVE con `liveId`, `itemId`, `customerId`, `branchId`, `salesChannelId`, precio y usuario.
9. Backend valida sucursal, item, cliente, canal LIVE, live abierto/activo y disponibilidad del item.
10. Reserva se guarda, item pasa a `RESERVED`, se liga a customer order abierto y se refresca lista.
11. UI muestra reservas recientes, estado pagado/no pagado usando pagos por reserva.
12. Usuario puede abrir detalle de reserva o ir a `/payments?reservationId=...&returnTo=/live`.

## 4. Mapa del flujo minimo recomendado para primer cliente

1. Abrir En vivo.
2. Seleccionar o crear transmision de la sucursal activa.
3. Activar transmision.
4. Seleccionar producto/prenda real.
5. Mostrar producto activo real en pantalla.
6. Seleccionar cliente existente o crear cliente rapido.
7. Registrar apartado operativo.
8. Ver reservas del En vivo actual.
9. Cambiar producto activo.
10. Cerrar transmision.

Para Z1, el minimo debe evitar depender de activity feed demo, metricas demo y roles visuales. La prioridad debe ser transmision, producto activo, cliente, prenda, reserva y estado.

## 5. Inventario y clasificacion

| Archivo/componente/endpoint/modelo | Estado actual | Usa backend | Sirve para flujo minimo | Accion recomendada | Riesgo |
|---|---|---:|---:|---|---|
| `app/live.tsx` | Hibrido | Parcial | Si | Refactorizar en capas sin cambiar comportamiento | Alto: archivo concentra UI, estado, permisos, demo data y side effects |
| `components/live/LiveDesktopLayout.tsx` | Real visual | No | Despues | Reutilizar como layout, desacoplar de orden fijo de children | Medio: depende de posicion de children |
| `components/live/LiveTabletLayout.tsx` | Real visual | No | Si | Reutilizar para consola operativa tablet | Medio: compact mode oculta columna izquierda completa |
| `components/live/LiveMobileLayout.tsx` | Real visual | No | Si | Reutilizar para stack minimo | Bajo: simple y estable |
| `components/live/LiveCommerceCards.tsx` | Real reusable | No | Si | Reutilizar como design system LIVE | Bajo: componentes presentacionales |
| `services/liveService.ts` | Real | Si | Si | Reutilizar; corregir i18n de labels en frontend despues | Medio: `getLiveStatusLabel` retorna texto ES hardcoded |
| `services/reservationService.ts` | Real | Si | Si | Reutilizar | Medio: sirve a otros flujos; no tocar sin pruebas |
| `services/liveLayoutPreferences.ts` | Real local | No | Si | Reutilizar como flag local temporal | Medio: solo local, no company/user backend |
| `services/liveAnalyticsPreference.ts` | Parcial/legado | No | No | Revisar y consolidar con `liveLayoutPreferences` | Bajo: posible duplicidad |
| `services/liveWorkflowStorage.ts` | Real local | No | Si | Reutilizar temporalmente para live seleccionado | Medio: no sincroniza multiusuario |
| `services/livePermissionGuards.ts` | Parcial | No | Si | Refactorizar nombre/alcance en Z1/Z2 | Medio: mezcla LIVE con sistema/usuarios |
| `app/system.tsx` seccion Experiencia En vivo | Real local | No | Despues | Mantener como configuracion local | Medio: preferencias no son tenant/company backend |
| `app/users.tsx` import de `canManageUsers` desde LIVE guards | Hibrido | No | No | Mover helper a accessControl en fase separada | Bajo/medio: acoplamiento conceptual |
| Product spotlight en `app/live.tsx` | Hibrido | Parcial | Si | Mantener solo con producto real/fallback claro | Medio: mezcla producto seleccionado, ultima reserva y metricas demo |
| Vista para presentadora | Hibrido | Parcial | Despues | Apagar por modo minimo o mantener compacta | Medio: audiencia es demo si analytics visible |
| Estado operativo | Real parcial | Parcial | Si | Reutilizar | Bajo: depende de selectedLive |
| Roles del equipo | Mock/informativo | No | No | Apagar por defecto en modo minimo | Bajo: genera ruido visual |
| Streaming metrics | Demo | No | No | Apagar por defecto en modo minimo | Medio: puede confundirse con analitica real |
| Activity feed | Hibrido | Parcial | Despues | Mover a avanzado hasta tener eventos reales | Alto: mezcla reservas reales con comentarios/viewers demo |
| Comentarios overlay | Demo | No | No | Apagar por defecto | Medio: simula interaccion no integrada |
| Productos destacados demo | Demo | No | No | Apagar por defecto | Medio: datos hardcodeados aunque localizados |
| Alta rapida cliente desde LIVE | Real navegacional | Si | Si | Reutilizar | Medio: requiere retorno limpio y validacion de permisos |
| Alta rapida prenda desde LIVE | Real navegacional | Si | Despues | Mantener terciario | Medio: puede distraer del flujo operativo |
| QR scanner en LIVE | Real frontend | Parcial | Si | Reutilizar | Medio: busca solo en lista cargada localmente |
| `/api/lives/branch/{branchId}` | Parcial | Si | Si | Revisar en Z1 por permiso/tenant estricto | Alto: lectura no valida explicitamente permiso ni tenant en `LiveService` |
| `/api/lives/{id}` | Parcial | Si | Despues | Revisar en Z1 por tenant estricto | Alto: findById usa repository directo |
| `POST /api/lives/branch/{branchId}` | Real | Si | Si | Reutilizar | Medio: valida `DO_LIVE_RESERVATION` y canal/sucursal |
| `PATCH /api/lives/{id}/activate` | Real | Si | Si | Reutilizar | Medio: valida permiso sobre branch del live |
| `PATCH /api/lives/{id}/close` | Real | Si | Si | Reutilizar | Medio: valida permiso sobre branch del live |
| `lives` tabla | Real basica | Si | Si | Reutilizar | Medio: no tiene company_id directo ni producto activo |
| `reservations.live_id` | Real | Si | Si | Reutilizar | Bajo: liga reserva a transmision |
| `ReservationService.create` | Real | Si | Si | Reutilizar | Bajo/medio: valida branch, item, customer, live y canal |
| `ReservationService.findByBranch/findById` | Real | Si | Si | Reutilizar | Bajo: usa `TenantAccessGuard` |
| `ItemService` lookup/list | Real | Si | Si | Reutilizar | Bajo: usa company/branch tenant-aware |
| `CustomerService` list/create/update | Real | Si | Si | Reutilizar | Bajo: AUTH-F ya agrego permisos finos |
| Pagos por reserva en LIVE | Real derivado | Si | Despues | Mantener solo como lectura secundaria | Medio: no tocar pagos reales en LIVE-Z |
| `report-live` / reportes LIVE | Real/reporte | Si | No | No tocar en LIVE-Z0/Z1 | Alto: fuera de alcance |

## 6. Datos reales, demo e hibridos

Datos reales ya usados:

- Transmisiones: `getLivesByBranch`, `createLive`, `activateLive`, `closeLive`.
- Clientes: `getCustomersByBranch`.
- Prendas: `getItemsByBranch`.
- Reservas: `getReservationsByBranch`, `createReservation`.
- Pagos por reserva: `getPaymentsByReservation`.
- Sesion, branch, permisos y canales: `getSession`.

Datos locales o persistencia local:

- Live seleccionado: `selected_live_{branchId}_{userId}` en AsyncStorage.
- Preferencias de widgets: `live_layout_preferences:user:{userId}` o device fallback.
- Toggle visual de metricas: estado local `showDemoMetrics`.

Datos demo/hibridos:

- Viewers, peak viewers, engagement, comentarios, reacciones y productos destacados.
- Comentarios overlay como "Carla".
- Activity feed combina reservas reales con eventos demo de comentario/viewer/producto.
- Audiencia de presentadora depende de metricas demo.

## 7. Huecos tecnicos para flujo minimo real

1. No existe producto activo oficial en backend.
2. No existe tabla/evento LIVE para `PRODUCT_PINNED`, `COMMENT_RECEIVED`, `VIEWER_JOINED`, etc.
3. No existe sincronizacion multiusuario; cada equipo conserva seleccion local.
4. No existe separacion backend de permisos `VIEW_LIVE`, `MANAGE_LIVE`, `OPERATE_LIVE`.
5. `LiveService.findByBranch` y `findById` deben revisarse para tenant/permiso explicito.
6. Activity feed y analytics no deben presentarse como datos reales.
7. Roles presentadora/operador/supervisor son experiencia visual, no perfiles operativos backend.
8. Alta rapida de cliente/prenda depende de navegacion externa, no de modal LIVE transaccional.
9. `app/live.tsx` esta demasiado cargado para seguir agregando realtime encima.

## 8. Que ya se puede reutilizar

- Tabla `lives` y estados `OPEN`, `ACTIVE`, `CLOSED`.
- `reservations.live_id`.
- Validacion de reserva LIVE en `ReservationService.create`.
- Carga tenant-aware de clientes/prendas/reservas.
- Layouts responsive separados.
- Cards LIVE reutilizables.
- Preferencias locales de widgets como mecanismo temporal.
- Flujo reserva -> detalle/cobro como navegacion ya probada.
- Guard frontend actual como primera barrera visual, manteniendo backend como fuente de seguridad.

## 9. Que debe apagarse temporalmente por modo minimo

Recomendacion para modo `liveMode = "minimum"` o `operatorCore`:

- Roles del equipo.
- Analytics demo.
- Activity feed demo/hibrido.
- Comentarios overlay.
- Productos destacados demo.
- Vista presentadora si muestra audiencia demo.
- Barras/graficas demo.

Estos widgets pueden seguir existiendo para demo comercial, pero deben quedar claramente bajo modo avanzado/demo para no confundir operacion real.

## 10. Que NO se debe tocar en LIVE-Z1

- Pagos reales y calculos financieros.
- Reportes.
- Billing.
- IA/vector DB.
- AUTH, sesion unica, NO_ACCESS y auditoria.
- Tenant isolation ya endurecido.
- Migraciones grandes.
- Integraciones Facebook/TikTok/Instagram/YouTube.
- WebSockets/realtime real.
- Eliminacion de componentes existentes.

## 11. Riesgos si se implementa realtime antes de ordenar

1. Realtime propagaria estado local ambiguo como si fuera fuente oficial.
2. Producto activo podria divergir entre operador, presentadora y supervisor.
3. Activity feed mezclaria eventos reales con demo, degradando confianza.
4. Permisos de vista/operacion seguirian acoplados a `DO_LIVE_RESERVATION`.
5. Sin modelo de eventos, no habria replay, auditoria funcional ni reporte final confiable.
6. El archivo `app/live.tsx` creceria mas y seria dificil probar regresiones.
7. Cualquier WebSocket heredaria huecos de tenant/branch si no se define contrato primero.

## 12. Propuesta de estructura objetivo

```text
components/live/
  core/
    LiveOperationShell.tsx
    LiveStatusPanel.tsx
    LiveProductSelector.tsx
    LiveCustomerSelector.tsx
    LiveReservationComposer.tsx
    LiveRecentReservations.tsx
  modes/
    LiveMinimumMode.tsx
    LiveDemoMode.tsx
    LivePresenterMode.tsx
    LiveSupervisorMode.tsx
  widgets/
    LiveProductSpotlight.tsx
    LivePresenterView.tsx
    LiveActivityFeed.tsx
    LiveAnalyticsPanel.tsx
    LiveTeamRolesHint.tsx
  config/
    liveWidgetConfig.ts
    liveModeConfig.ts
  services/
    liveStateMapper.ts
    livePermissionModel.ts
```

Servicios frontend sugeridos:

```text
services/liveService.ts              # API lives
services/liveReservationFlow.ts      # composicion de reserva LIVE
services/liveLayoutPreferences.ts    # preferencias locales actuales
services/liveModePreferences.ts      # modo minimo/demo/avanzado, local primero
services/livePermissionModel.ts      # separar presentadora/operador/supervisor
```

Backend futuro recomendado:

```text
live_sessions / lives                # mantener base existente
live_active_product                  # producto activo oficial o columnas en lives
live_events                          # bitacora/eventos operativos
live_participants                    # futuro si integra plataformas
live_metrics_snapshots               # futuro, no para Z1
```

## 13. Recomendacion concreta para LIVE-Z1

LIVE-Z1 debe ser "core operational cleanup", no realtime.

Objetivo recomendado:

1. Extraer de `app/live.tsx` el flujo minimo en componentes core.
2. Definir un modo minimo que apague widgets demo/avanzados.
3. Mantener datos reales actuales: lives, customers, items, reservations.
4. Separar `activeProduct` como estado frontend unico derivado de `selectedItem`, sin fallback demo.
5. Preparar contrato tecnico para producto activo backend, sin implementarlo aun si no se autoriza.
6. Revisar `LiveService.findByBranch/findById` por tenant/permiso como fix de seguridad acotado antes de multiusuario.
7. Documentar roles reales como capacidades, no como tarjetas visuales.

Entregable Z1 sugerido:

- `LiveMinimumMode` operativo.
- `LiveReservationComposer` reusable.
- `LiveProductSpotlight` sin datos demo.
- `LiveRecentReservations` real.
- Widgets demo apagables por modo.
- Documento `ERP_LIVE_Z1_CORE_OPERATIONAL_CLEANUP.md`.

## 14. Validaciones de Z0

Esta fase no debe cambiar funcionalidad. Las validaciones tecnicas se ejecutan para confirmar que el diagnostico/documentacion no deja el repo en mal estado.

Resultado:

| Comando | Resultado |
|---|---|
| `npm.cmd run lint` | OK, 0 errores. Se mantienen 60 warnings preexistentes del repo. |
| `npm run typecheck` | No existe script `typecheck` en `package.json`. |
| `npx.cmd tsc --noEmit` | OK. |
| `npm run test` | No existe script `test` en `package.json`. |
| `npm run build` | No existe script `build` en `package.json`. |
| `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` | OK. Export incluyo `/live`. |
| `backend/control-ropa/.\\mvnw.cmd test` | OK. 67 tests, 0 failures, 0 errors, 0 skipped. |
| `backend/control-ropa/.\\mvnw.cmd -q -DskipTests package` | OK. |
| `git diff --check` | OK. |

Notas:

- No se ejecuto smoke manual de navegador porque Z0 es auditoria/documentacion.
- No se modifico backend funcional, frontend funcional, SQL ni migraciones.
- No se hizo commit.

## 15. Decision Z0

Diagnostico: LIVE esta listo para ordenamiento operacional, no para realtime.  
Decision recomendada: GO para LIVE-Z1 con alcance de limpieza core y seguridad LIVE, NO-GO para realtime/integraciones hasta cerrar producto activo oficial y eventos LIVE.
