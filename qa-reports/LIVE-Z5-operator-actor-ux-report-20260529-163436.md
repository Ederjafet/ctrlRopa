# LIVE-Z5 - Operator actor UX report

Rama: `feature/live-z5-operator-actor-ux`
Commit base: `69fab53 Merge branch 'feature/live-z4-event-log' into develop`
Fecha: 2026-05-29

## Alcance

Se implemento una capa frontend de actor/capacidades LIVE y una vista inicial enfocada en `OPERADOR`/`SELLER` para que `/live` sea mas guiado, tactil y operacional.

No se implemento realtime. No se toco backend.

## Archivos modificados

- `app/live.tsx`
- `app/reservation-detail.tsx`
- `locales/es/common.json`
- `locales/en/common.json`

## Archivos creados

- `services/liveActorResolver.ts`
- `services/apiError.ts`
- `components/ui/RestrictedSection.tsx`
- `docs/ERP_LIVE_Z5_OPERATOR_ACTOR_UX.md`
- `qa-reports/LIVE-Z5-operator-actor-ux-report-20260529-163436.md`
- `qa-reports/LIVE-Z5-operator-actor-ux-smoke-20260529-163436.csv`

## Archivos revisados pero no modificados

- `docs/ERP_LIVE_Z0_AUDIT.md`
- `docs/ERP_LIVE_Z1_MINIMAL_OPERATIONAL_FLOW.md`
- `docs/ERP_LIVE_Z2_ACTIVE_PRODUCT_STATE.md`
- `docs/ERP_LIVE_Z3_OPERATIONAL_RESERVATION_STATUS.md`
- `docs/ERP_LIVE_Z4_EVENT_LOG.md`
- `services/liveService.ts`
- `services/reservationService.ts`
- `services/livePermissionGuards.ts`
- `services/liveLayoutPreferences.ts`
- `components/live/LiveCommerceCards.tsx`
- `components/live/LiveDesktopLayout.tsx`
- `components/live/LiveTabletLayout.tsx`
- `components/live/LiveMobileLayout.tsx`
- `services/sessionStorage.ts`
- `services/accessControl.ts`
- `package.json`

## Modulos no tocados por restriccion

- Backend Java.
- SQL y migraciones.
- AUTH, RBAC backend, NO_ACCESS y tenant isolation.
- Pagos reales, caja, ventas financieras y reportes.
- Billing.
- IA.
- Security audit.
- Realtime, WebSocket y SSE.

## Cambios implementados

- Nuevo `resolveLiveActorContext(session)` con actores `OPERATOR`, `SELLER`, `SUPERVISOR`, `PRESENTER` futuro y `NO_ACCESS`.
- Se audito `/api/me` para usuarios QA obligatorios y se creo `docs/ERP_LIVE_ACTORS_MATRIX.md`.
- Actor LIVE queda documentado como experiencia visual derivada de AUTH real; no reemplaza roles, no inventa permisos y no modifica RBAC.
- La prioridad se corrigio para evitar fallbacks ambiguos: `NO_ACCESS`, `SUPERVISOR`, `SELLER` apoyo, `OPERATOR`, supervisor por monitoreo/reportes y bloqueo seguro.
- Correccion visual aplicada: se elimino la duplicidad entre el nuevo bloque superior y la consola funcional anterior.
- La consola vieja funcional se reutilizo; no se borro su logica.
- Los controles existentes quedaron reacomodados dentro de una sola consola visible para `OPERADOR`.
- Se recuperaron validaciones visibles y especificas antes de reservar.
- `RESERVAS RECIENTES` quedo integrado dentro del panel principal del operador, debajo del flujo de reserva.
- Se oculto `Cobrar` del flujo LIVE operador; pagos/caja no forman parte de LIVE-Z5.
- Se corrigio `INICIAR EN VIVO` para reutilizar la logica real existente de crear/activar/reutilizar LIVE activo.
- Al iniciar o reutilizar un LIVE activo se refrescan estado, producto activo, reservas recientes y eventos LIVE.
- Se aclaro el estado visual `SIN EN VIVO` / `EN VIVO / ACTIVO` / `LIVE CERRADO`.
- El boton `INICIAR EN VIVO` ya no queda visible como accion principal cuando el LIVE esta activo.
- Se agrego tarjeta enriquecida del cliente seleccionado en el paso `CLIENTE / INTERESADO`.
- Compras pasadas, compras activas y saldo pendiente usan reservas/pagos reales ya cargados; si no existen datos, muestran fallback seguro 0 / $0.00.
- Se diferencio `Prenda seleccionada` de `PRENDA AL AIRE AHORA`.
- Se corrigio la UX de `PRENDA AL AIRE`: no se muestra `Prenda seleccionada` cuando no hay una prenda real preparada.
- Si no hay prenda seleccionada ni al aire, se muestra solo `No hay prenda al aire`.
- Si hay prenda al aire, la tarjeta principal es `PRENDA AL AIRE AHORA`.
- Si el operador prepara otra prenda mientras hay una al aire, aparece `PRENDA PREPARADA PARA CAMBIO`.
- Se reacomodo la entrada de acciones de prenda.
- `Codigo o QR de la prenda` dejo de ser el bloque principal visible de `PRENDA AL AIRE`.
- Se priorizaron tres acciones compactas: `Buscar prenda`, `Escanear QR` y `Crear prenda rapida`.
- Estas acciones reutilizan la logica existente de selector, scanner y alta rapida.
- Se mejoro la tarjeta de prenda con nombre comercial, codigo, talla, color, precio, stock, estado e indicador `Al aire`.
- Los datos inexistentes de prenda usan fallback seguro, no datos demo.
- Se reordeno el flujo visual a `Preparar siguiente prenda -> Prenda al aire ahora -> Precio -> Cliente / interesado -> Reserva`.
- `PONER ESTA PRENDA AL AIRE` quedo dentro del bloque `PREPARAR SIGUIENTE PRENDA`.
- La prenda preparada ya no aparece dentro de la tarjeta principal de `PRENDA AL AIRE AHORA`.
- `PRENDA AL AIRE AHORA` quedo como bloque separado, activo/verde y como unica prenda reservable.
- El precio quedo ligado a la prenda al aire y se confirma antes de capturar cliente/interesado.
- El cliente/interesado se captura despues de confirmar la prenda al aire y el precio.
- Las validaciones de reservar se actualizaron con este orden: LIVE activo, prenda al aire, precio valido, cliente/interesado.
- Ajuste QA de regla de precio:
  - el precio principal ahora corresponde siempre a `PRENDA AL AIRE AHORA`;
  - la prenda preparada para cambio no modifica el precio de reserva hasta ponerse al aire;
  - `RESERVAR AHORA` usa la prenda al aire y no la prenda preparada;
  - la tarjeta de prenda al aire aclara `Esta es la prenda que se reservara`;
  - la tarjeta preparada aclara `Lista para pasar al aire. Aun no se usa para reservas`.
- El selector de prendas muestra disponibilidad operativa y motivo cuando no puede ponerse al aire.
- Se bloquean prendas vendidas, con pago aplicado o con disponibilidad no confirmada.
- Se permiten prendas libres o reservadas sin pago; las reservadas sin pago muestran advertencia.
- `Cancelar operativo` se cambio a `Cancelar apartado` como label visible, sin cambiar estado backend ni pagos.
- Se elimino el mensaje duplicado de disponibilidad no confirmada; se muestra label + detalle una sola vez.
- Se agrego accion para `SACAR DEL AIRE` o `CAMBIAR PRENDA` usando el endpoint existente de producto activo.
- Se corrigio el comportamiento posterior al cierre del LIVE:
  - `RESERVAR AHORA` ya no se muestra cuando no hay LIVE activo o cuando el LIVE seleccionado esta cerrado;
  - `FINALIZAR EN VIVO`, `PONER PRENDA AL AIRE`, `CAMBIAR PRENDA` y `SACAR DEL AIRE` quedan fuera del modo cerrado;
  - se diferencia `SIN EN VIVO`, `EN VIVO / ACTIVO` y `LIVE CERRADO`;
  - el LIVE cerrado se identifica con `LIVE #id`, estado, sucursal, inicio, cierre, operador, canal, URL y notas;
  - canal y URL muestran `No capturado` cuando el modelo no trae esos datos;
  - se reutiliza `getLivesByBranch` para mostrar `En vivos recientes` si hay datos cargados;
  - `Ver resumen del en vivo` queda como accion informativa deshabilitada hasta implementar resumen formal.
- Se mejoro el contexto de `SIN EN VIVO`:
  - se agrego tarjeta destacada `Ultimo en vivo cerrado`;
  - la tarjeta muestra duracion, reservas, vendidos operativos, canceladas, prendas mostradas y ultima actividad cuando estan disponibles;
  - los datos faltantes muestran `No capturado`, `No disponible` o `Pendiente de integrar`;
  - `En vivos recientes` se limita a 3 tarjetas compactas;
  - el ultimo cerrado no se repite en la lista secundaria;
  - `Ver historial completo` expande/oculta el historial completo disponible en memoria/API.
- Se corrigio el contexto de consulta de lives cerrados:
  - la tarjeta principal conserva `Ultimo en vivo cerrado` solo cuando muestra automaticamente el ultimo cerrado;
  - al seleccionar un live desde `En vivos recientes`, el titulo cambia a `En vivo seleccionado`;
  - al seleccionar un live desde `Historial completo`, el titulo cambia a `Detalle del en vivo`;
  - el live consultado queda resaltado con chip `Seleccionado` y borde destacado;
  - reservas y eventos expandidos siguen correspondiendo al live seleccionado.
- Se creo `services/apiError.ts` como utilidad reusable para normalizar errores API.
- Se distingue 401, 403, 404, 409, 422, 500 y errores de red con mensajes de usuario consistentes.
- Se creo `components/ui/RestrictedSection.tsx` para mostrar secciones parciales con acceso restringido.
- Se corrigio `app/reservation-detail.tsx` para no confundir 403 de pagos con 404 del apartado.
- Si el apartado principal existe pero pagos responde 403 por `VIEW_PAYMENTS`, se muestra el apartado y solo la seccion de pagos queda restringida.
- `Apartado no encontrado` queda reservado para un 404 real de `/api/reservations/{id}`.
- Se enriquecieron las tarjetas de `Reservas recientes` en `/live` con cliente, telefono, prenda/codigo, precio, estado operativo, canal LIVE, live asociado, fecha, sucursal y usuario registrado cuando esos datos existen.
- Se mejoro `reservation-detail` con cards de resumen del apartado, cliente, prenda, LIVE, seguimiento operativo, caja y pagos/acceso restringido.
- Se redujo espacio en blanco en el detalle usando grid responsive en desktop/tablet y cards apiladas en mobile.
- Se mantiene `RestrictedSection` para pagos cuando falta `VIEW_PAYMENTS` y no se muestra `Apartado no encontrado` por errores secundarios.
- Se agrego vista de apoyo separada para vendedor/presentadora con `PRENDA AL AIRE AHORA`, precio visible y estado LIVE, sin dashboard supervisor ni consola operador.
- `PRENDA AL AIRE AHORA` mantiene estilo verde/activo y texto que indica que es la prenda que se muestra y se reservara.
- `PRENDA PREPARADA PARA CAMBIO` ahora usa estilo ambar/no activo, chip `Preparada` y texto que aclara que aun no se usa para reservas.
- El estado `Sin prenda al aire` usa estilo azul/gris suave y guia al usuario indicando que el operador debe poner una prenda al aire.
- Se agrego sincronizacion ligera por polling cada 5 segundos para refrescar el LIVE activo y su `activeItem` en vistas de operador/vendedor/presentadora/supervisor.
- La prenda al aire y el precio visible se actualizan desde `GET /api/lives/{id}` cuando el operador cambia la prenda.
- El polling se detiene o evita cuando no hay LIVE activo, cuando el LIVE esta cerrado o al desmontar la pantalla.
- No se implemento realtime formal; `LIVE-RT` queda documentado como pendiente futuro con SSE/WebSocket.
- Se separo el actor `SUPERVISOR` de vendedor/presentadora.
- `qa.supervisor.centro@local.test` resuelve por rol real `SUPERVISOR` a dashboard `SUPERVISOR / Monitoreo y control`.
- Supervisor ahora ve monitoreo/control con indicadores reales disponibles, prenda al aire, reservas recientes y eventos recientes.
- No se muestran metricas demo de espectadores/compradores/ventas si no existen datos reales; quedan como pendiente/no disponible.
- La vista supervisor no muestra acciones operativas de reserva/cancelacion como flujo principal.
- Si la seccion de pagos esta restringida, se bloquean acciones dependientes del saldo de pagos para no operar con informacion incompleta.
- Se evitaron llamadas innecesarias a endpoints protegidos de pagos:
  - se agrego `hasEffectivePermission` para validar permisos efectivos reales sin bypass visual por `ADMIN`;
  - `/live` ya no llama `/api/payments/reservation/{id}` para reservas recientes si el usuario no tiene `VIEW_PAYMENTS`;
  - `reservation-detail` muestra `RestrictedSection` sin llamar pagos si ya se sabe que falta `VIEW_PAYMENTS`;
  - si backend responde 403 por un caso no detectable antes, se mantiene el manejo parcial y no se muestra `Apartado no encontrado`;
  - no se modificaron permisos, AUTH ni backend.
- Se corrigio la carga inicial del resumen del ultimo LIVE cerrado:
  - al entrar a `/live` sin LIVE activo se cargan eventos del ultimo LIVE cerrado desde el inicio;
  - `Prendas mostradas`, `Ultima actividad` y `Eventos` ya no dependen de presionar `Ver reservas`;
  - `Ultima actividad` usa ultimo evento o cierre del LIVE como fallback;
  - `Prendas mostradas` se calcula con eventos `ACTIVE_ITEM_CHANGED` sin inventar datos;
  - si no hay datos reales, se muestra `Sin eventos`, `Sin prendas registradas` o `No disponible`.
- Se definio la funcion de los botones del resumen cerrado:
  - `Ver reservas` expande/oculta reservas del LIVE cerrado;
  - `Ver eventos` expande/oculta bitacora operacional con textos amigables;
  - no se muestran acciones operativas de estado en modo cerrado.
- `/live` ahora prioriza una unica vista `OPERADOR` para usuarios operativos:
  - boton grande `INICIAR EN VIVO`;
  - estado `EN VIVO / ACTIVO`, `EN VIVO / LISTO` o `NO HAY EN VIVO ACTIVO`;
  - paso `PRENDA AL AIRE` con codigo/QR, selector, escaneo, prenda seleccionada, producto al aire y acciones de cambio;
  - paso `PRECIO` con precio sugerido de la prenda al aire y precio confirmado para reserva;
  - paso `CLIENTE / INTERESADO` con selector y cliente rapido existentes;
  - tarjeta de cliente seleccionado con nombre, telefono, compras pasadas, compras activas, saldo pendiente y etiqueta de cliente frecuente si aplica;
  - paso `RESERVA` con validaciones y CTA real;
  - CTA `RESERVAR AHORA` usando la funcion real de reserva y mostrando que falta si no hay datos completos;
  - `RESERVAS RECIENTES` con acciones operativas reales;
  - boton `FINALIZAR EN VIVO`.
- Para la vista enfocada se ocultan bloques duplicados de spotlight/status/operacion/cierre y la consola anterior como segundo flujo.
- Se conserva el flujo existente de cliente, prenda, producto activo, reserva, estado operativo y eventos LIVE.

## Comandos ejecutados

Inicio:

- `git status`
- `git branch --show-current`
- `git log --oneline -5`

Frontend:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`

Backend:

- `./mvnw.cmd test`
- `./mvnw.cmd -q -DskipTests package`

AUTH regresivo:

- `API_BASE_URL=http://192.168.0.128:8090 bash docs/qa/99-auth-z-final-security-smoke.sh`
- Smoke manual: login `qa.admin@local.test` y consulta `/api/security/audit-events/summary`.

Git:

- `git diff --stat`
- `git diff --name-only`
- `git diff --check`

## Validaciones OK

- `npm.cmd run lint`: OK, 0 errores.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `./mvnw.cmd test`: OK, 73 tests.
- `./mvnw.cmd -q -DskipTests package`: OK.
- Cierre LIVE visual: pendiente de QA manual; el codigo ya evita mostrar `RESERVAR AHORA` en `SIN EN VIVO`/`LIVE CERRADO`.
- En vivos recientes: soporte revisado y reutilizado desde `getLivesByBranch`; pendiente confirmacion visual con datos QA.
- Limite recientes: el render muestra maximo 3 en vivos recientes y separa el ultimo cerrado como tarjeta principal.
- AUTH-Z: PASS=6 FAIL=0 SKIP=0.
- Smoke manual AUTH: login OK, token OK, summary 403 esperado para admin sin `VIEW_SECURITY_AUDIT`.

## Validaciones fallidas

Ninguna validacion automatica obligatoria fallo.

## Validaciones no ejecutadas

- `npm run typecheck`: no existe script en `package.json`.
- `npm run test`: no existe script en `package.json`.
- `npm run build`: no existe script en `package.json`.
- Smoke visual en navegador/tablet/mobile: pendiente QA manual.
- Validacion visual cierre LIVE: pendiente QA manual con `qa.admin@local.test`.

## Warnings

Warnings preexistentes:

- `npm.cmd run lint`: 60 warnings del repo, sin errores. No quedaron warnings nuevos en `app/live.tsx`.
- Maven: warnings/logs preexistentes de Mockito dynamic agent, MySQL 5.7 y logs DEBUG/INFO de Spring.
- Git: warnings CRLF del entorno Windows al consultar diff.

## AUTH regresivo

Resultado:

- AUTH-F6: PASS=20 FAIL=0 SKIP=5
- AUTH-H: PASS=9 FAIL=0 SKIP=0
- AUTH-I2: PASS=10 FAIL=0 SKIP=0
- AUTH-J2: PASS=9 FAIL=0 SKIP=0
- AUTH-J4: PASS=13 FAIL=0 SKIP=0
- AUTH-J5: PASS=13 FAIL=0 SKIP=0
- AUTH-Z: PASS=6 FAIL=0 SKIP=0

Reportes generados por AUTH-Z:

- `qa-reports/AUTH-Z-final-security-report-20260529-163346.md`
- `qa-reports/AUTH-Z-final-security-report-20260529-163346.csv`

## Matriz visual por usuarios/roles

## Auditoria `/api/me` para derivacion LIVE

| Usuario | Resultado AUTH real | Vista LIVE esperada | Observacion |
|---|---|---|---|
| `qa.admin@local.test` | Login OK; `/api/me` devuelve rol `ADMIN`, empresa `DEFAULT`, sucursal `QA_CTR`, permisos LIVE/inventario/clientes/reportes operativos. | `OPERATOR_VIEW` | Consola operativa. |
| `qa.vendedor.centro@local.test` | Login OK; `/api/me` devuelve rol `SELLER`, empresa `DEFAULT`, sucursal `QA_CTR`, permisos `DO_LIVE_RESERVATION`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `REGISTER_PAYMENTS`. | `SELLER_PRESENTER_VIEW` | Apoyo visual; no dashboard supervisor. |
| `qa.supervisor.centro@local.test` | Login OK; `/api/me` devuelve rol `SUPERVISOR`, empresa `DEFAULT`, sucursal `QA_CTR`, permisos de operacion/supervision incluyendo `DO_LIVE_RESERVATION`, `VIEW_REPORTS`, `VIEW_CUSTOMERS`, `VIEW_INVENTORY`. | `SUPERVISOR_VIEW` | Dashboard monitoreo/control; no vista vendedor. |
| `qa.sinpermisos@local.test` | Login respondio `403 Forbidden`; no se obtuvo `/api/me`. | `NO_ACCESS_VIEW` / bloqueo AUTH | No se infieren permisos. |

| Usuario | Rol | Tenant/empresa | Ruta | Que debe poder hacer | Que NO debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Vista OPERADOR; iniciar/finalizar; cliente enriquecido; producto; producto al aire; reserva; validaciones visibles; reservas recientes integradas; estado operativo. | Procesar pago real desde vendido operativo; mostrar `Cobrar` como accion principal. | Operador completo si tiene permiso LIVE. | No validado visualmente; login AUTH manual OK. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Vista de apoyo vendedor/presentadora con estado LIVE, prenda al aire y precio visible. | Dashboard supervisor, consola operador, pagos/caja/reportes. | Actor SELLER separado como apoyo visual. | No validado visualmente. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Ver dashboard `SUPERVISOR / Monitoreo y control`, indicadores reales disponibles, prenda al aire, reservas recientes y eventos. | Ver la misma vista que vendedor/presentadora u operar como operador sin permiso explicito. | Actor SUPERVISOR separado de vendedor y operador. | No validado visualmente. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Bloqueado. | Ver LIVE. | Bloqueado por AUTH. | Validado indirectamente por AUTH-Z. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Acceso solo si permisos LIVE reales. | Saltar permisos. | Capacidades reales. | No validado visualmente. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live` | Aislamiento QA_A. | Ver QA_B/DEFAULT. | Sin cruce tenant. | Validado indirectamente por AUTH-Z/F6. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live` | Aislamiento QA_A. | Ver QA_B/DEFAULT. | Sin cruce tenant. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live` | Aislamiento QA_B. | Ver QA_A/DEFAULT. | Sin cruce tenant. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live` | Aislamiento QA_B. | Ver QA_A/DEFAULT. | Sin cruce tenant. | Validado indirectamente por AUTH-Z/F6. |

## Git status final

```text
On branch feature/live-z5-operator-actor-ux
Changes not staged for commit:
  modified: app/live.tsx
  modified: app/reservation-detail.tsx
  modified: locales/en/common.json
  modified: locales/es/common.json
  modified: services/accessControl.ts

Untracked files:
  components/ui/RestrictedSection.tsx
  docs/ERP_LIVE_ACTORS_MATRIX.md
  docs/ERP_LIVE_Z5_OPERATOR_ACTOR_UX.md
  services/apiError.ts
  services/liveActorResolver.ts

no changes added to commit
```

## Git diff

```text
app/live.tsx               | 3097 +++++++++++++++++++++++++++++++++++++++++---
app/reservation-detail.tsx |  496 +++++--
locales/en/common.json     |  173 ++-
locales/es/common.json     |  173 ++-
services/accessControl.ts  |   13 +
5 files changed, 3644 insertions(+), 308 deletions(-)
```

`git diff --name-only`:

```text
app/live.tsx
app/reservation-detail.tsx
locales/en/common.json
locales/es/common.json
services/accessControl.ts
```

`git diff --check`: OK, solo warnings CRLF del entorno Windows.

Evidencia generada:

- `git-diffs/20260529-LIVE-Z5-operator-actor-ux.diff`
- `git-diffs/20260529-LIVE-Z5-operator-actor-ux-stat.txt`
- `docs/ERP_LIVE_ACTORS_MATRIX.md`

## Restricciones confirmadas

- AUTH: no tocado.
- Tenant isolation: no tocado.
- NO_ACCESS: no tocado.
- Pagos reales: no tocados.
- Caja: no tocada.
- Reportes: no tocados.
- Billing: no tocado.
- IA: no tocada.
- Realtime/WebSocket/SSE: no implementado.
- Security audit: no tocado.
- SQL/migraciones: no tocadas.
- Contratos publicos de API: no cambiados.

## GO / NO-GO

GO tecnico para smoke visual de LIVE-Z5 corregido.

GO visual esperado: una sola consola visible para `OPERADOR`, sin bloque superior duplicado, sin `Consola del operador` como segundo flujo debajo, con validaciones claras y reservas recientes integradas.

GO visual actualizado: `INICIAR EN VIVO` debe cambiar a `EN VIVO / ACTIVO`, no debe seguir como accion principal si ya esta activo, el primer paso debe ser `PREPARAR SIGUIENTE PRENDA`, el segundo `PRENDA AL AIRE AHORA`, el tercero `PRECIO`, el cuarto `CLIENTE / INTERESADO`, y el quinto `RESERVA`. El selector debe mostrar disponibilidad y bloquear prendas vendidas/con pago.

GO visual precio actualizado: `3. PRECIO` debe seguir mostrando el precio de la prenda al aire aunque el operador prepare otra prenda; la prenda preparada solo debe afectar precio/reserva despues de ponerse al aire. El boton visible de cancelacion debe decir `Cancelar apartado`.

GO visual cierre actualizado: despues de finalizar un LIVE, la pantalla debe mostrar `LIVE CERRADO` o `SIN EN VIVO`, identificar `LIVE #id`, mostrar canal/URL como `No capturado` si no existen y no debe mostrar `RESERVAR AHORA` ni acciones operativas.

GO visual recientes actualizado: en `SIN EN VIVO`, debe verse el bloque principal del live cerrado consultado, maximo 3 tarjetas en `En vivos recientes`, `Ver historial completo` debe expandir/ocultar el historial disponible y el titulo debe cambiar entre `Ultimo en vivo cerrado`, `En vivo seleccionado` y `Detalle del en vivo` segun contexto.

GO funcional actualizado para detalle de apartado: un 403 en una seccion secundaria debe mostrarse como `Acceso restringido` con permiso requerido, sin reemplazar el apartado por `Apartado no encontrado`.

GO funcional actualizado para pagos protegidos: usuarios sin `VIEW_PAYMENTS` no deben generar consultas masivas a `/api/payments/reservation/{id}` al entrar a `/live`; si el detalle ya conoce que falta el permiso, debe mostrar seccion restringida sin llamar pagos.

GO funcional actualizado para resumen cerrado: la tarjeta `Ultimo en vivo cerrado` debe mostrar prendas/eventos/ultima actividad desde la carga inicial y los botones deben expandir secciones visibles.

GO visual actualizado para reservas/detalle: `Reservas recientes` debe verse mas informativo sin mostrar `Cobrar`; `Ver detalle` debe abrir una pantalla en cards con resumen, cliente, prenda, LIVE, seguimiento operativo y pagos restringidos si falta `VIEW_PAYMENTS`.

GO visual actualizado para actores/prendas: vendedor/presentadora/supervisor deben ver claramente la `PRENDA AL AIRE AHORA`; la preparada debe verse ambar/no activa y no confundirse con la prenda reservable.

GO funcional actualizado para sincronizacion ligera: en prueba multiusuario, la vista vendedor/presentadora debe reflejar la nueva prenda al aire y precio en maximo 5-10 segundos sin refrescar manualmente; NO-GO para realtime formal hasta LIVE-RT.

GO visual actualizado para supervisor: `qa.supervisor.centro@local.test` debe ver `SUPERVISOR / Monitoreo y control`, indicadores, prenda al aire, reservas y eventos, sin compartir accidentalmente la misma vista de vendedor/presentadora.

NO-GO para realtime, vista presentadora separada, resumen ejecutivo cerrado, canal/URL formal o RBAC LIVE fino hasta cerrar la matriz de actores/capacidades.

## Siguiente fase recomendada

LIVE-Z6: vista Supervisor/Consulta y matriz formal actor LIVE -> permiso -> accion.
