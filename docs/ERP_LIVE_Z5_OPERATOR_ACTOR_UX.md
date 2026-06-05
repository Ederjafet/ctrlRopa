# LIVE-Z5 - Actor OPERADOR y UX operacional

Proyecto: control-ropa-app
Rama: feature/live-z5-operator-actor-ux
Fecha: 2026-05-29

## Nota LIVE-Z6A - AppShell

El 2026-06-04 se integro `/live` al `AppShell` del UI Kit interno.

- Se mantiene el modelo de actores LIVE definido en Z5.
- Se mantiene el flujo operador: preparar prenda, prenda al aire, precio, cliente/interesado y reserva.
- Se mantiene la vista vendedor/presentadora y supervisor.
- No se reescribieron reglas operativas profundas.
- No se tocaron backend, AUTH/RBAC, pagos, caja, reportes, billing ni IA.
- Los templates internos quedan como pendiente de migracion gradual para LIVE-Z6B.

## Objetivo

Reducir la confusion visual de `/live` y formalizar una capa frontend de vista LIVE derivada de AUTH real. El actor LIVE no reemplaza roles ni permisos; solo decide la experiencia visual usando `/api/me`, roles reales y permisos efectivos.

Para el usuario operativo, la vista `OPERATOR` mantiene una experiencia clara, tablet-first y enfocada en el flujo real:

1. Iniciar En vivo.
2. Buscar o escanear prenda.
3. Poner prenda al aire.
4. Confirmar precio.
5. Capturar cliente/interesado.
6. Registrar reserva.
7. Dar seguimiento a reservas y estados operativos.
8. Sacar/cambiar prenda al aire o finalizar En vivo.

## Actor model LIVE

Se agrego `services/liveActorResolver.ts` como capa frontend, sin modificar AUTH ni RBAC global.

Fuente de verdad: `/api/me`. La matriz auditada de usuarios, roles, permisos y vistas esperadas queda documentada en `docs/ERP_LIVE_ACTORS_MATRIX.md`.

Actores iniciales:

| Actor | Uso | Vista |
|---|---|---|
| `OPERATOR` | Admin u operador con permisos LIVE operativos. | Consola guiada de reservas y seguimiento. |
| `SELLER` | Vendedor con acceso LIVE. | Vista de apoyo visual centrada en prenda al aire y precio. |
| `SUPERVISOR` | Usuario con rol/permisos de supervision o monitoreo. | Dashboard de monitoreo/control con indicadores reales disponibles, prenda al aire, reservas y eventos. |
| `PRESENTER` | Reservado para fase futura. | No se implemento vista nueva. |
| `NO_ACCESS` | Usuario sin acceso LIVE o sin permisos efectivos. | Bloqueado por guards existentes. |

## Usuario, rol, actor y capacidades

El resolver usa la sesion actual (`UserSession`) y guards existentes:

- `canViewLive`
- `canOperateLive`
- `canSelectLiveCustomer`
- `canCreateLiveCustomer`
- `canSelectLiveItem`
- `canCreateLiveItem`

Capacidades expuestas:

- ver LIVE;
- operar LIVE;
- iniciar/cerrar;
- seleccionar/crear cliente;
- seleccionar/crear prenda;
- marcar producto al aire;
- registrar reserva;
- cambiar estado operativo;
- consultar eventos LIVE.

No se agregaron permisos nuevos. La prioridad de vista queda:

1. `NO_ACCESS` si no hay permiso minimo LIVE.
2. `SUPERVISOR` si el rol real es `SUPERVISOR`.
3. `SELLER` si el rol real es `SELLER` o `QA_TENANT_SELLER`.
4. `OPERATOR` si el usuario es `ADMIN`, `QA_TENANT_ADMIN` u operador permitido.
5. `SUPERVISOR` por permiso de monitoreo/reportes si no cae en actor operativo/apoyo.
6. `NO_ACCESS` conservador si no cae en una regla segura.

Asi se evita convertir `SUPERVISOR` en vendedor por fallback o convertir vendedor en supervisor por accidente.

## Alcance visual aplicado

Para `OPERATOR`, `/live` ahora muestra primero una consola guiada:

- encabezado de actor: `OPERADOR` / `Reservas y seguimiento`;
- estado claro: `EN VIVO / ACTIVO`, `EN VIVO / LISTO` o `NO HAY EN VIVO ACTIVO`;
- boton superior grande `INICIAR EN VIVO`;
- pasos visibles: `1. PRENDA AL AIRE`, `2. PRECIO`, `3. CLIENTE / INTERESADO`, `4. RESERVA`;
- producto al aire oficial desde backend;
- CTA dominante `RESERVAR AHORA`;
- acciones rapidas: `Cliente rapido`, `Producto rapido`, `Cambiar producto`;
- boton inferior `FINALIZAR EN VIVO`;
- siguiente paso sugerido segun datos faltantes;
- ultima reserva reciente si existe.

Correccion de criterio aplicada antes de commit:

- La consola funcional anterior no se elimino.
- La logica existente de cliente, producto, precio, reserva, producto al aire, estados operativos y cierre se reutilizo.
- Se elimino la duplicidad visual que dejaba un bloque nuevo arriba y la consola anterior abajo.
- Ahora existe una sola experiencia visible para `OPERATOR`.
- Los controles funcionales quedaron integrados en:
  - `1. PRENDA AL AIRE`: codigo/QR, agregar prenda, buscar, escanear, crear prenda rapida y producto al aire.
  - `2. PRECIO`: input funcional de precio y verificacion rapida ligado a la prenda al aire.
  - `3. CLIENTE / INTERESADO`: selector existente y cliente rapido existente.
  - `4. RESERVA`: usa `handleCreateReservation`.
  - `RESERVAS RECIENTES`: lista real integrada en el mismo panel principal del operador.
  - `FINALIZAR EN VIVO`: usa `handleCloseLive` y confirmacion existente.

Correccion adicional aplicada:

- Se recuperaron validaciones visibles y especificas antes de reservar:
  - sin LIVE activo: `Primero inicia un en vivo para registrar reservas.`;
  - sin prenda: `Selecciona una prenda antes de reservar.`;
  - precio vacio/invalido: `Confirma un precio valido antes de reservar.`;
  - sin cliente/interesado: `Selecciona o crea un cliente/interesado antes de reservar.`;
- `RESERVAS RECIENTES` queda dentro de la consola principal del operador, debajo de `RESERVAR AHORA`.
- El boton `Cobrar` no se muestra dentro del flujo principal del operador.
- `Vendido operativo` se mantiene como estado operacional y no procesa pagos/caja.

Correccion final antes de commit:

- Se corrigio el boton `INICIAR EN VIVO` en la consola del operador endureciendo `handleStartLiveNow`.
- El inicio reutiliza la logica real existente de `createLive`, `activateLive`, seleccion de live activo, persistencia de live seleccionado y refresco de datos.
- Si ya existe un LIVE `ACTIVE`, el operador lo reutiliza y no crea otro duplicado.
- Al iniciar o reutilizar un LIVE activo, la pantalla refresca estado, producto activo, reservas recientes y eventos LIVE.
- Se aclaro el estado visual del LIVE con los estados `SIN EN VIVO`, `EN VIVO / ACTIVO` y `LIVE CERRADO`.
- El boton `INICIAR EN VIVO` deja de mostrarse como accion principal cuando el LIVE ya esta activo.
- Si existe un LIVE `OPEN`, la vista OPERADOR lo trata como pendiente de iniciar y el boton activa el LIVE existente.
- Se agrego una tarjeta enriquecida de cliente seleccionado dentro del paso `3. CLIENTE / INTERESADO`.
- La tarjeta muestra nombre, telefono, compras pasadas, compras activas, saldo pendiente y etiqueta `Cliente frecuente` si aplica.
- Compras pasadas, compras activas y saldo pendiente se calculan con reservas reales ya cargadas de la sucursal y pagos asociados disponibles en pantalla.
- Si no hay datos reales cargados para el cliente, los valores caen en fallback seguro: 0 compras y $0.00 de saldo pendiente.
- No se inventaron datos demo ni saldos falsos.
- En el paso `2. PRODUCTO` se separo visualmente:
  - `Prenda seleccionada`: la prenda que el operador acaba de buscar/agregar.
  - `PRENDA AL AIRE AHORA`: la prenda oficial marcada como producto activo del LIVE.
- Ajuste UX de `PRENDA AL AIRE`: no se muestra `Prenda seleccionada` si no existe una prenda real preparada.
- Si no hay prenda seleccionada ni prenda al aire, se muestra solo el estado vacio `No hay prenda al aire`.
- Si hay prenda al aire, se muestra principalmente `PRENDA AL AIRE AHORA`.
- Si hay prenda al aire y el operador selecciona otra, se muestra `PRENDA PREPARADA PARA CAMBIO` debajo de la prenda al aire.
- Ajuste final de entrada de prenda: `Codigo o QR de la prenda` dejo de ser el bloque principal visible en la consola del operador.
- La entrada principal de prenda ahora son tres acciones compactas:
  - `Buscar prenda`: abre el selector/busqueda existente.
  - `Escanear QR`: abre el scanner existente.
  - `Crear prenda rapida`: abre el flujo existente de alta rapida.
- Las acciones quedan en fila en desktop/tablet y apiladas en mobile, sin crear flujo paralelo.
- El boton ahora dice `PONER ESTA PRENDA AL AIRE` para evitar ambiguedad.
- La tarjeta de prenda muestra nombre comercial, codigo, talla, color, precio, stock, estado e indicador `Al aire`.
- Cuando no existe foto o dato especifico, se muestra fallback seguro: `Sin foto`, `Sin talla`, `Sin color` y `Stock no definido`.
- Correccion de flujo LIVE real: el orden visual ahora es `Preparar siguiente prenda -> Prenda al aire ahora -> Precio -> Cliente / interesado -> Reserva`.
- `1. PREPARAR SIGUIENTE PRENDA` contiene las acciones compactas `Buscar prenda`, `Escanear QR` y `Crear prenda rapida`, y muestra `PRENDA PREPARADA PARA CAMBIO` solo cuando existe una prenda preparada real.
- `PONER ESTA PRENDA AL AIRE` quedo dentro del bloque de preparacion, no dentro de la prenda actualmente al aire.
- `2. PRENDA AL AIRE AHORA` muestra solamente la prenda activa/oficial o el estado vacio `No hay prenda al aire`.
- La prenda preparada usa estilo neutro y texto `Lista para pasar al aire. Aun no se usa para reservas.`
- La prenda al aire conserva estilo activo/verde y texto `Esta es la prenda que se reservara.`
- El precio queda ligado a la prenda al aire y se confirma antes de capturar cliente/interesado.
- El cliente/interesado se captura despues de confirmar prenda y precio, como corresponde al flujo de live-commerce.
- Correccion incremental QA de precio:
  - el precio principal de `2. PRECIO` corresponde siempre a `PRENDA AL AIRE AHORA`;
  - seleccionar o crear una prenda preparada para cambio ya no modifica el precio principal de reserva;
  - la prenda preparada muestra su precio solo dentro de su tarjeta y no se usa para reservar hasta presionar `PONER ESTA PRENDA AL AIRE`;
  - `RESERVAR AHORA` usa `activeItem` y el precio confirmado de la prenda al aire.
- Se aclaro visualmente:
  - `PRENDA AL AIRE AHORA`: `Esta es la prenda que se reservara.`;
  - `PRENDA PREPARADA PARA CAMBIO`: `Lista para pasar al aire. Aun no se usa para reservas.`
- El selector de prendas muestra disponibilidad operativa:
  - `Libre`;
  - `Reservada sin pago`;
  - `No disponible: vendida`;
  - `No disponible: pago aplicado`;
  - `Disponibilidad no confirmada`.
- Se bloquea poner al aire prendas vendidas, con pago aplicado o con disponibilidad no confirmada.
- Se permiten prendas libres o reservadas sin pago; las reservadas sin pago muestran advertencia operacional.
- Se elimino duplicidad del mensaje de disponibilidad no confirmada: el label queda como `Disponibilidad no confirmada` y el detalle se muestra una sola vez.
- El boton visible de cancelacion en reservas recientes ahora dice `Cancelar apartado`; internamente conserva el estado operativo `CANCELLED` y no toca pagos/caja.
- Se agrego accion `SACAR DEL AIRE` y `CAMBIAR PRENDA` cuando existe prenda al aire.

Correccion de estado posterior al cierre:

- Al cerrar un LIVE, `/live` deja de renderizar `RESERVAR AHORA`, `FINALIZAR EN VIVO`, `PONER PRENDA AL AIRE`, `CAMBIAR PRENDA` y `SACAR DEL AIRE` como acciones operativas.
- La pantalla diferencia explicitamente `SIN EN VIVO`, `EN VIVO / ACTIVO` y `LIVE CERRADO`.
- Si el LIVE queda cerrado seleccionado, se muestra modo resumen/consulta con:
  - `LIVE #id`;
  - estado;
  - sucursal;
  - inicio;
  - cierre;
  - operador;
  - canal;
  - URL;
  - notas;
  - metricas basicas de reservas, vendidos operativos, canceladas y eventos disponibles.
- Canal y URL se muestran como `No capturado` porque el modelo LIVE actual no expone esos campos.
- Se reutiliza el listado existente de en vivos por sucursal (`getLivesByBranch`) para mostrar `En vivos recientes` cuando hay datos cargados.
- `Ver resumen del en vivo` queda visible como accion informativa deshabilitada hasta implementar un resumen detallado formal.
- Se permite `INICIAR NUEVO EN VIVO` desde el modo cerrado sin crear un flujo paralelo.

Correccion de contexto sin LIVE activo:

- Cuando el estado es `SIN EN VIVO`, la pantalla muestra un bloque principal `Ultimo en vivo cerrado`.
- El bloque principal muestra el LIVE cerrado mas reciente o el LIVE cerrado seleccionado por el operador.
- La tarjeta destacada incluye `LIVE #id`, estado, inicio, cierre, duracion, sucursal, operador, canal, URL, notas, reservas, vendidos operativos, canceladas, prendas mostradas y ultima actividad cuando el dato esta disponible.
- Si el dato no existe, se muestra fallback seguro: `No capturado`, `No disponible` o `Pendiente de integrar`.
- `En vivos recientes` queda como bloque secundario y se limita a 3 tarjetas compactas.
- El ultimo cerrado no se repite en la lista compacta.
- Las tarjetas compactas muestran `LIVE #id`, estado, fecha/hora, reservas y vendidos operativos.
- `Ver historial completo` ya no queda como boton muerto: expande/oculta en la misma pantalla todos los lives cerrados ya disponibles en memoria/API, ordenados del mas reciente al mas antiguo.
- El historial completo no crea backend ni ruta nueva; queda como consulta simple del listado ya cargado por `getLivesByBranch`.
- La tarjeta principal cambia titulo segun contexto:
  - `Ultimo en vivo cerrado` cuando muestra automaticamente el live cerrado mas reciente.
  - `En vivo seleccionado` cuando el operador selecciona un live desde `En vivos recientes`.
  - `Detalle del en vivo` cuando el operador selecciona un live desde `Historial completo`.
- El live consultado queda resaltado visualmente con chip `Seleccionado` y borde destacado en recientes/historial.
- Al seleccionar otro live cerrado, sus reservas/eventos expandidos corresponden al live seleccionado.

Se ocultaron para esta vista enfocada:

- spotlight duplicado;
- estado operativo duplicado;
- bloque anterior de operacion de transmision;
- cierre duplicado;
- consola anterior como segundo flujo visible;
- chip visual de `Cobro pendiente`.
- boton `Cobrar` en la lista integrada del operador.

Los componentes no se borraron. Siguen disponibles para vistas no enfocadas o fases futuras.

## Flujo del Operador

Estado sin LIVE activo:

- muestra `NO HAY EN VIVO ACTIVO`;
- muestra `INICIAR EN VIVO`;
- muestra mensaje humano: `Inicia un en vivo para comenzar a registrar prendas y apartados.`;
- no muestra `RESERVAR AHORA`, `FINALIZAR EN VIVO` ni acciones de prenda/reserva;
- muestra el contexto del ultimo LIVE cerrado y hasta 3 en vivos recientes;
- prenda/precio/cliente/reserva quedan bloqueados o guiados por el flujo existente.

Estado con LIVE abierto o activo:

- muestra pasos Preparar siguiente prenda, Prenda al aire ahora, Precio, Cliente/Interesado y Reserva;
- permite seleccionar/escanear producto segun permisos;
- permite marcar producto al aire usando Z2;
- permite confirmar o ajustar el precio que se usara para reservar;
- permite buscar/crear cliente segun permisos despues de confirmar precio;
- permite reservar usando el flujo de Z1;
- permite cambiar estados operativos de Z3 en reservas recientes;
- mantiene eventos de Z4 sin mezclar con auditoria de seguridad.

Estado con LIVE cerrado:

- muestra `LIVE CERRADO`;
- identifica el LIVE cerrado con ficha de resumen;
- muestra reservas/eventos disponibles del LIVE seleccionado;
- permite iniciar un nuevo en vivo;
- no permite crear reservas nuevas ni cambiar producto al aire.

## Frontend modificado

- `app/live.tsx`
  - integra `resolveLiveActorContext`;
  - calcula actor/capacidades del usuario actual;
  - prioriza la consola guiada para `OPERATOR` y `SELLER`;
  - reacomoda controles funcionales existentes dentro de pasos Preparar siguiente prenda, Prenda al aire ahora, Precio, Cliente/Interesado y Reserva;
  - reutiliza handlers existentes de iniciar, producto activo, reserva, estado operativo y cierre;
  - evita renderizar la consola anterior como flujo duplicado para `OPERATOR`/`SELLER`;
  - integra reservas recientes en el panel principal del operador;
  - oculta `Cobrar` del flujo operador para no mezclar pagos/caja en LIVE-Z5;
  - endurece `INICIAR EN VIVO` para reutilizar LIVE activo o crear/activar uno nuevo con el flujo real existente;
  - agrega tarjeta enriquecida de cliente seleccionado con datos reales disponibles y fallback seguro;
  - separa producto seleccionado y producto al aire en tarjetas distintas;
  - mejora el detalle visual de prenda sin hardcodear datos;
  - reordena el flujo principal a preparar siguiente prenda, prenda al aire ahora, precio, cliente/interesado y reserva;
  - calcula disponibilidad de prendas con estado de item, reservas de sucursal y pagos asociados ya consultados;
  - permite limpiar `activeItem` usando el endpoint existente `setLiveActiveItem(liveId, null)`;
  - enriquece las tarjetas de reservas recientes con cliente, telefono, prenda/codigo, precio, estado operativo, canal LIVE, live asociado, fecha, sucursal y usuario registrado cuando esos datos existen;
  - mantiene `Cancelar apartado` como accion operativa y no muestra `Cobrar` en reservas recientes del operador;
  - agrega una tarjeta clara de `PRENDA AL AIRE AHORA` para actores de consulta/apoyo como vendedor sin operacion o presentadora futura, sin acciones de reserva/pago/caja;
  - separa visualmente estados de prenda: al aire en verde, preparada para cambio en ambar y sin prenda al aire en azul/gris suave;
  - aclara que la prenda preparada aun no se usa para reservas y que la prenda al aire es la unica reservable;
  - agrega sincronizacion ligera por polling cada 5 segundos mientras el LIVE seleccionado esta `ACTIVE`;
  - el polling consulta `GET /api/lives/{id}` para refrescar estado del LIVE y `activeItem`, sin consultar pagos;
  - en vista `SUPERVISOR`, el polling tambien refresca reservas y eventos para actualizar indicadores, sin consultar pagos/caja;
  - si el operador cambia la prenda al aire, la vista de vendedor/presentadora/supervisor actualiza prenda y precio en la siguiente consulta;
  - el polling se detiene al desmontar la pantalla o cuando el LIVE deja de estar activo;
  - separa el actor `SUPERVISOR` en una vista propia de monitoreo/control, distinta de operador y vendedor/presentadora;
  - el supervisor ve indicadores reales disponibles, prenda al aire, reservas recientes y eventos recientes;
  - no se muestran metricas demo de espectadores/compradores/ventas si no existen datos reales;
  - la vista supervisor no muestra acciones operativas de reserva/cancelacion como flujo principal;
  - evita que `RESERVAR AHORA` se muestre cuando no hay LIVE activo o cuando el LIVE seleccionado esta cerrado;
  - muestra una tarjeta destacada del ultimo LIVE cerrado y limita en vivos recientes a 3 tarjetas;
  - no reactiva analytics/demo.
- `services/liveActorResolver.ts`
  - nuevo resolver frontend de actor/capacidades LIVE.
- `services/apiError.ts`
  - nueva utilidad reusable para normalizar errores API.
  - distingue 401, 403, 404, 409, 422, 500 y errores de red.
  - extrae `requiredPermission` si el backend lo devuelve o si aparece en el mensaje.
- `components/ui/RestrictedSection.tsx`
  - card reusable para secciones con acceso restringido.
  - muestra titulo, mensaje claro, permiso requerido y recomendacion de solicitar acceso al supervisor.
- `app/reservation-detail.tsx`
  - separa la carga del apartado principal de secciones secundarias como pagos.
  - si `/api/reservations/{id}` responde 200 pero `/api/payments/reservation/{id}` responde 403, se muestra el apartado y solo la seccion de pagos queda restringida.
  - `Apartado no encontrado` queda reservado para 404 real del apartado principal.
  - organiza el detalle en cards: resumen del apartado, cliente, prenda, LIVE, seguimiento operativo, caja y pagos/acceso restringido.
  - reduce espacios en blanco con grid responsive en desktop/tablet y cards apiladas en mobile.
  - carga datos reales disponibles de cliente y prenda; si faltan datos usa fallback seguro como `Sin telefono`, `Sin fecha`, `No capturado`, `No disponible`, `Sin live asociado` o `Sin foto`.
  - mantiene `RestrictedSection` para pagos cuando falta `VIEW_PAYMENTS` y no muestra `Apartado no encontrado` por errores secundarios.
- `locales/es/common.json`
- `locales/en/common.json`
  - textos nuevos para actor OPERADOR y flujo guiado.

## Backend

No se modifico backend.

Se reutiliza lo existente:

- LIVE-Z2 para producto activo oficial;
- LIVE-Z3 para estado operativo persistido de reservas;
- LIVE-Z4 para eventos operativos LIVE;
- AUTH/RBAC existente para sesion y permisos.

## Permisos y guards considerados

No se tocaron:

- AUTH;
- tenant isolation;
- NO_ACCESS;
- seguridad de endpoints;
- permisos productivos.

La vista no sustituye backend security; solo ordena lo que se muestra y bloquea acciones segun capacidades derivadas de permisos reales.

## Manejo general de errores API

Se agrego una base reutilizable para evitar confundir errores de permisos con recursos inexistentes.

Patron recomendado:

- Cargar primero el recurso principal.
- Si el recurso principal responde 404, mostrar estado de no encontrado.
- Cargar secciones secundarias con `Promise.allSettled`.
- Si una seccion secundaria responde 403, renderizar `RestrictedSection` solo dentro de esa seccion.
- No reemplazar toda la pantalla por "no encontrado" cuando el error viene de una llamada secundaria.
- Mostrar permiso requerido cuando exista, por ejemplo `VIEW_PAYMENTS`.

Mensajes esperados:

- 401: `Tu sesion expiro. Inicia sesion nuevamente.`
- 403: `Acceso restringido` y `No tienes permiso para consultar esta informacion.`
- 404: `No se encontro la informacion solicitada.`
- 500: `Ocurrio un error al cargar la informacion.`
- red: `No se pudo conectar con el servidor.`

Caso aplicado:

- `GET /api/reservations/{id}` 200.
- `GET /api/payments/reservation/{id}` 403 por falta de `VIEW_PAYMENTS`.
- Resultado: el detalle de apartado se muestra; la seccion de pagos muestra acceso restringido.
- `Apartado no encontrado` solo se muestra si el apartado principal responde 404.
- Si la seccion de pagos esta restringida, tambien se bloquean acciones dependientes del saldo de pagos para no operar con informacion incompleta.
- Ajuste de llamadas protegidas:
  - `/live` ya no consulta `/api/payments/reservation/{id}` para reservas recientes si la sesion no trae `VIEW_PAYMENTS` en permisos efectivos reales.
  - Se agrego `hasEffectivePermission` para diferenciar permisos efectivos reales de helpers frontend que tratan `ADMIN` como bypass visual.
  - Si el usuario no tiene `VIEW_PAYMENTS`, no se calculan pagos en background y no se generan 403 masivos por reservas recientes.
  - Las prendas reservadas que requieren confirmar si tienen pago quedan como disponibilidad no confirmada cuando no se puede consultar pagos.
- `reservation-detail` muestra `RestrictedSection` para pagos sin llamar al endpoint si ya se sabe que falta `VIEW_PAYMENTS`.
- Si el permiso no se puede determinar y backend responde 403, se mantiene el manejo parcial sin mostrar `Apartado no encontrado`.
- Presentacion de apartado LIVE:
  - `/live` muestra reservas recientes con mas contexto operativo: cliente, telefono, prenda/codigo, precio, estado, canal, live, fecha, sucursal y usuario registrado cuando existen.
  - `reservation-detail` muestra cards de resumen, cliente, prenda, LIVE y seguimiento operativo para evitar una lista vertical con mucho espacio en blanco.
  - la seccion de pagos conserva el comportamiento protegido: si falta `VIEW_PAYMENTS`, solo se renderiza `Acceso restringido` con el permiso requerido.
- Correccion de carga inicial del ultimo LIVE cerrado:
  - cuando `/live` carga sin LIVE activo, se cargan eventos del ultimo LIVE cerrado desde el inicio usando `getLiveEvents`.
  - `Prendas mostradas`, `Ultima actividad` y `Eventos` ya no dependen de presionar `Ver reservas`.
  - `Ultima actividad` usa el ultimo evento del LIVE; si no hay eventos, usa el cierre del LIVE; si tampoco existe, muestra `No disponible`.
  - `Prendas mostradas` cuenta prendas unicas desde `ACTIVE_ITEM_CHANGED` cuando hay entidad, o eventos `ACTIVE_ITEM_CHANGED` cuando no hay estructura suficiente.
  - Si no hay eventos o prendas, se muestra `Sin eventos` / `Sin prendas registradas`, no `Pendiente de integrar`.
- Botones del resumen cerrado:
  - `Ver reservas` expande una lista de reservas del LIVE cerrado y cambia a `Ocultar reservas`.
  - `Ver eventos` expande la bitacora operacional del LIVE y cambia a `Ocultar eventos`.
  - Las secciones expandidas tienen estados vacios claros y no muestran acciones operativas de cambio de estado.
  - `Ver detalle` sigue siendo accion segura de consulta por reserva.

## Pendiente recomendado: solicitud de permisos

Flujo futuro sugerido, no implementado en LIVE-Z5:

1. El usuario detecta un permiso faltante en una seccion restringida.
2. Presiona o consulta una accion informativa de `Solicitar permiso`.
3. Escribe motivo operativo.
4. Supervisor/admin recibe la solicitud.
5. Supervisor/admin aprueba o rechaza.
6. La decision se audita.
7. El usuario recibe notificacion.

En esta fase no se agregaron tablas, endpoints, notificaciones ni asignacion automatica de permisos.

## Pendiente recomendado: LIVE-RT realtime formal

LIVE-Z5 usa polling ligero para sincronizar la prenda al aire sin implementar realtime formal.

Fase futura recomendada `LIVE-RT`:

- usar SSE o WebSocket para publicar eventos operativos LIVE;
- emitir `ACTIVE_ITEM_CHANGED` hacia operador, vendedor, presentadora y supervisor;
- actualizar prenda al aire y precio de forma inmediata;
- reducir o eliminar polling;
- manejar reconexion, backoff y estado offline;
- mantener eventos LIVE separados de security audit.

## Matriz visual por usuarios

| Usuario | Rol | Tenant/empresa | Ruta | Debe poder hacer | No debe poder hacer | Resultado esperado | Resultado observado |
|---|---|---|---|---|---|---|---|
| `qa.admin@local.test` | ADMIN | DEFAULT / QA_CTR | `/live` | Ver vista OPERADOR, iniciar/finalizar, seleccionar cliente/producto, marcar producto al aire, reservar y cambiar estado. | Procesar pago real desde vendido operativo. | Operacion completa si conserva `DO_LIVE_RESERVATION`. | No validado visualmente en navegador; AUTH manual login OK. |
| `qa.vendedor.centro@local.test` | SELLER | DEFAULT / QA_CTR | `/live` | Ver vista operativa si tiene permiso LIVE; reservar segun permisos. | Ver administracion indebida. | Actor `SELLER` operativo si tiene `DO_LIVE_RESERVATION`. | No validado visualmente en navegador. |
| `qa.supervisor.centro@local.test` | SUPERVISOR | DEFAULT / QA_CTR | `/live` | Ver dashboard SUPERVISOR con monitoreo/control, indicadores, prenda al aire, reservas recientes y eventos. | Ver la misma vista que vendedor/presentadora u operar como operador sin permiso explicito. | Actor `SUPERVISOR` separado visualmente de vendedor y operador. | No validado visualmente en navegador. |
| `qa.sinpermisos@local.test` | NO_ACCESS | DEFAULT / QA_CTR-QA_VER | `/login`, `/live` | Quedar bloqueado. | Ver operacion LIVE. | Bloqueado por AUTH/guards. | Validado indirectamente por AUTH-Z PASS. |
| `qa.soporte@local.test` | SUPPORT_TECH | DEFAULT / QA_CTR-QA_VER | `/live` | Entrar solo si tiene permisos LIVE reales. | Saltarse permisos por soporte. | Capacidades segun permisos reales. | No validado visualmente en navegador. |
| `qa.a.admin@local.test` | QA_TENANT_ADMIN | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar solo si permiso LIVE existe. | Ver QA_B o DEFAULT. | Aislado por AUTH-F/Z. | Validado indirectamente por AUTH-Z/F6. |
| `qa.a.vendedor@local.test` | QA_TENANT_SELLER | QA_A / QA_A_CTR | `/live`, datos QA_A | Validar aislamiento QA_A; operar solo si permiso LIVE existe. | Ver QA_B o DEFAULT. | Aislado por AUTH-F/Z. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.admin@local.test` | QA_TENANT_ADMIN | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar solo si permiso LIVE existe. | Ver QA_A o DEFAULT. | Aislado por AUTH-F/Z. | Validado indirectamente por AUTH-Z/F6. |
| `qa.b.vendedor@local.test` | QA_TENANT_SELLER | QA_B / QA_B_CTR | `/live`, datos QA_B | Validar aislamiento QA_B; operar solo si permiso LIVE existe. | Ver QA_A o DEFAULT. | Aislado por AUTH-F/Z. | Validado indirectamente por AUTH-Z/F6. |

## Restricciones respetadas

- No se tocaron pagos reales.
- No se toco caja.
- No se tocaron reportes.
- No se toco billing.
- No se toco IA.
- No se implemento realtime, WebSocket ni SSE.
- No se toco AUTH.
- No se debilito tenant isolation.
- No se modifico NO_ACCESS.
- No se mezclaron eventos LIVE con security audit.
- No se modifico SQL ni migraciones.
- No se cambiaron contratos publicos de API.
- No se borraron componentes existentes.

## Validaciones

- `npm.cmd run lint`: OK sin errores; 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK, incluye `/live`.
- `./mvnw.cmd test`: OK, 73 tests.
- `./mvnw.cmd -q -DskipTests package`: OK.
- AUTH-Z regresivo contra `http://192.168.0.128:8090`: PASS=6 FAIL=0 SKIP=0.
- Smoke manual AUTH: `qa.admin@local.test` login OK, token OK, `/api/security/audit-events/summary` responde 403 esperado por falta de `VIEW_SECURITY_AUDIT`.
- Correccion visual Z5: la consola vieja funcional se reutiliza integrada en el flujo guiado; no queda como segundo bloque visible para OPERADOR.
- Correccion UX final: validaciones visibles recuperadas, reservas recientes integradas y `Cobrar` oculto del flujo operador.
- Correccion inicio LIVE: `INICIAR EN VIVO` reutiliza `handleStartLiveNow`, crea/activa o reutiliza un LIVE activo y refresca datos de pantalla.
- Correccion cliente: el paso `CLIENTE` muestra tarjeta enriquecida con telefono, compras pasadas, compras activas y saldo pendiente con fallback seguro.
- Correccion estado/producto: se aclaro `SIN EN VIVO` / `EN VIVO / ACTIVO` / `LIVE CERRADO`, y se diferencio `Prenda seleccionada` de `PRENDA AL AIRE AHORA`.
- Correccion flujo live-commerce: la pantalla ya no inicia por cliente; inicia por prenda al aire, despues precio, despues cliente/interesado y finalmente reserva.
- Correccion disponibilidad: prendas vendidas o con pago aplicado no se pueden poner al aire; prendas libres o reservadas sin pago si pueden, con advertencia si aplica.
- Correccion errores API: el detalle de apartado distingue 403 de secciones secundarias contra 404 del recurso principal.
- Correccion permisos parciales: si pagos de apartado responde 403 por `VIEW_PAYMENTS`, el apartado sigue visible y solo la seccion de pagos muestra `Acceso restringido`.
- Correccion llamadas innecesarias: `/live` no dispara consultas masivas a `/api/payments/reservation/{id}` cuando el usuario no tiene `VIEW_PAYMENTS`; `reservation-detail` evita la llamada si el permiso faltante ya se conoce.
- Correccion resumen cerrado: eventos/prendas/ultima actividad se cargan al entrar a `/live` y los botones `Ver reservas` / `Ver eventos` muestran secciones expandibles visibles.
- Correccion cierre LIVE: despues de cerrar un en vivo, la pantalla entra en modo `LIVE CERRADO` o `SIN EN VIVO` sin mostrar `RESERVAR AHORA` ni acciones operativas.
- Identificacion LIVE cerrado: se muestra `LIVE #id`, estado, sucursal, inicio, cierre, operador, canal/URL/notas con `No capturado` cuando el modelo no trae esos campos.
- En vivos recientes: se reviso soporte existente y se reutiliza `getLivesByBranch` para mostrar lives recientes disponibles; el resumen detallado queda pendiente.
- En vivos recientes corregido: la lista secundaria se limita a 3, `Ver historial completo` expande/oculta el historial disponible y la tarjeta principal cambia titulo segun contexto (`Ultimo en vivo cerrado`, `En vivo seleccionado` o `Detalle del en vivo`).

## Vista vendedor / presentadora

Para `SELLER` y la futura `PRESENTER`, `/live` no muestra dashboard supervisor ni consola operador. La vista de apoyo muestra:

- estado del LIVE;
- `PRENDA AL AIRE AHORA`;
- precio visible de la prenda al aire;
- codigo, talla, color, stock y estado cuando existen;
- notas basicas del LIVE.

No muestra pagos, caja, reportes, acciones operativas ni metricas supervisor en LIVE-Z5.

## Vista supervisor

Para `SUPERVISOR`, `/live` muestra dashboard de monitoreo/control:

- estado del LIVE;
- sucursal;
- hora inicio/cierre;
- reservas;
- vendidos operativos;
- canceladas;
- eventos;
- prendas mostradas;
- ultima actividad;
- prenda al aire actual;
- reservas recientes con accion segura `Ver detalle`;
- eventos recientes.

No muestra metricas demo de espectadores/compradores/ventas si no existen datos reales. Tampoco muestra la misma vista que vendedor/presentadora ni opera como consola operador en Z5.

## Riesgos

- El actor resolver es frontend/documental; la seguridad real sigue en backend.
- No existe permiso fino `VIEW_LIVE` / `MANAGE_LIVE`; se conserva el uso de `DO_LIVE_RESERVATION` para operar.
- Sin realtime, otros usuarios ven cambios al recargar.
- La vista `PRESENTER` queda pendiente.
- El smoke visual en navegador/tablet sigue pendiente de QA manual.
- El modelo LIVE actual no expone canal ni URL de transmision; por ahora se muestran como `No capturado`.
- El resumen de live cerrado es basico y calculado con reservas/eventos ya cargados; el resumen ejecutivo queda para fase posterior.

## Pendientes

- Smoke visual con `qa.admin@local.test`, `qa.vendedor.centro@local.test` y `qa.supervisor.centro@local.test`.
- Confirmar visualmente que `RESERVAS RECIENTES` no queda flotante en columna secundaria para operador.
- Confirmar visualmente que `Cobrar` no aparece como accion principal en la consola operador.
- Confirmar visualmente que al cerrar un LIVE no aparece `RESERVAR AHORA` y se muestra ficha `LIVE CERRADO`.
- Agregar canal/URL de transmision al modelo LIVE si negocio lo requiere.
- Crear resumen formal de LIVE cerrado con metricas operativas completas si QA lo solicita.
- LIVE-Z6/Z7 Historial de en vivos:
  - listado paginado;
  - filtros por fecha;
  - filtros por estado;
  - filtro por sucursal;
  - busqueda por live ID;
  - resumen por live;
  - ver reservas;
  - ver eventos;
  - canal/URL;
  - operador.
- Confirmar visualmente la nueva vista propia de `SUPERVISOR` con `qa.supervisor.centro@local.test`.
- Definir `VIEW_LIVE`, `OPERATE_LIVE` y `MANAGE_LIVE` en una fase RBAC LIVE posterior.
- Diseñar vista `PRESENTER` sin operar ni administrar.

## Siguiente fase recomendada

LIVE-Z6: definir matriz formal LIVE actor -> permiso -> accion y completar vista Presenter/Assistant, todavia sin realtime.

## Decision

GO tecnico para smoke visual de operador en tablet/mobile/desktop.

NO-GO para realtime o presentadora separada hasta cerrar matriz de actores LIVE.
