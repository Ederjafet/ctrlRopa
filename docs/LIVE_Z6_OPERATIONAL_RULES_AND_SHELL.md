# LIVE-Z6A - AppShell y layout operacional

## Objetivo

Integrar `/live` al layout profesional del producto usando `AppShell`, sidebar, TopBar y navegacion lateral responsive, sin cambiar reglas operativas profundas ni backend.

Esta fase es visual/estructural. Mantiene el comportamiento heredado de LIVE-Z5 y PRODUCT-B3.

## Alcance aplicado

- `/live` ahora usa `AppShell`.
- El header aislado anterior de LIVE se retiro y el titulo/subtitulo pasan a `TopBar`.
- La navegacion lateral usa las mismas secciones base de Home:
  - Inicio.
  - LIVE.
  - Clientes.
  - Reservas.
  - Usuarios.
  - Sistema.
  - Reportes.
  - Configuracion.
  - UI Kit solo para ADMIN.
- El sidebar respeta permisos reales del frontend mediante `canViewLive`, `canAccess`, `canAccessByPermission` e `isAdmin`.
- Desktop grande usa sidebar fijo por comportamiento de `AppShell`.
- Tablet/mobile usan drawer y logout heredado de `AppShell`.
- Los modales de LIVE se mantienen fuera del shell para no romper QR, seleccion de cliente, seleccion de prenda y confirmaciones.

## Operador

Se conserva la logica y flujo existente:

1. Preparar siguiente prenda.
2. Prenda al aire ahora.
3. Precio.
4. Cliente / Interesado.
5. Reserva.

Se conserva:

- preparar prenda;
- escanear QR;
- crear prenda rapida;
- poner/sacar/cambiar prenda al aire;
- precio ligado a prenda al aire;
- reservar usando `activeItem`;
- bloqueo de doble reserva de la misma prenda;
- mensaje visible cuando la prenda al aire ya esta reservada;
- reservas recientes;
- ver detalle;
- estados operativos existentes;
- finalizar live.

## Supervisor

La vista supervisor mantiene su dashboard de monitoreo/control dentro del nuevo shell.

Se conserva:

- indicadores reales disponibles;
- estado del live;
- prenda al aire;
- reservas recientes;
- eventos recientes;
- sin metricas demo nuevas.

## Vendedor / Presentadora

La vista de apoyo se conserva dentro del shell:

- estado del live;
- prenda al aire;
- precio;
- codigo/talla/color;
- sin consola operador ni dashboard supervisor.

## NO_ACCESS

El guard existente se mantiene. Usuarios sin acceso LIVE siguen redirigidos a `/access-denied`; no se renderiza consola ni dashboard.

## Decision sobre templates

No se forzo `OperationalTemplate` ni `MonitoringTemplate` en esta fase.

Motivo:
- `/live` ya contiene layouts internos por actor (`LiveDesktopLayout`, `LiveTabletLayout`, `LiveMobileLayout`) y componentes LIVE especializados.
- Forzar templates en Z6A implicaria reestructurar demasiada UI y elevaria riesgo sobre reglas operativas.

Decision:
- Z6A aplica `AppShell`.
- Z6B puede evaluar migracion gradual de bloques internos a templates especificos.

## Restricciones cumplidas

- No se toco backend.
- No se tocaron AUTH/RBAC backend.
- No se tocaron pagos reales, caja, reportes financieros, billing ni IA.
- No se cambiaron contratos de API.
- No se implemento WebSocket ni SSE.
- No se agregaron datos fake.

## Validaciones

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.

## Pendiente LIVE-Z6B

- Revisar si `OperationalTemplate` puede envolver bloques del operador sin romper flujo.
- Definir realtime formal (`LIVE-RT`) con SSE o WebSocket.
- QA visual manual multiusuario en desktop/tablet/mobile.

## LIVE-Z6B - Capacidades y reglas operativas

### Decision

Z6B formaliza la regla:

`AUTH real -> capacidades LIVE -> vista/acciones permitidas`.

Los actores de negocio no son permisos paralelos. Operador, Vendedor/Presentadora, Supervisor y NO_ACCESS son experiencias visuales derivadas de capacidades calculadas desde `/api/me`, rol real, permisos reales y helpers existentes de `accessControl`.

### Implementacion

- Se creo `services/liveCapabilities.ts`.
- `services/liveActorResolver.ts` consume capacidades y conserva aliases legacy para no romper vistas existentes.
- `services/livePermissionGuards.ts` delega la resolucion LIVE al resolver central de capacidades.
- `/live` controla acciones sensibles con capacidades especificas:
  - `canStartLive`
  - `canCloseLive`
  - `canPrepareItem`
  - `canSetActiveItem`
  - `canClearActiveItem`
  - `canCreateReservation`
  - `canCancelReservation`
  - `canMarkPending`
  - `canMarkOperationalSold`
  - `canChangeLivePrice`
  - `canViewPayments`
  - `canAccessCashbox`

### Cancelar apartado

- La accion `Cancelar apartado` abre un modal de motivo.
- Motivos disponibles:
  - Cliente desistio.
  - Error de captura.
  - Duplicado.
  - Sin inventario.
  - Otro.
- El motivo se envia al servicio existente de estado operacional.
- No se tocan pagos, caja ni devoluciones.
- Nota libre para `Otro` queda pendiente para LIVE-Z7.

### Vendido operativo

- El texto visible se aclaro a `Marcar vendido operativo`.
- La accion pide confirmacion.
- La UI aclara que vendido operativo no confirma pago; la venta final requiere cobro/caja.

### Liberacion segura

- No se libera prenda automaticamente si hay duda.
- La capacidad `canReleaseReservedItem` requiere permiso de cancelacion, inventario y `VIEW_PAYMENTS`.
- Si no se puede confirmar pago aplicado, no se habilita liberacion automatica.
- Queda pendiente para LIVE-Z7 una regla/endpoints formales de liberacion segura si se requiere.

### Precio LIVE vs precio base

- El precio de `/live` se presenta como precio confirmado para la reserva.
- Si se edita, aplica al en vivo/reserva actual.
- No modifica precio base de la prenda.
- Si el usuario no tiene capacidad para cambiar precio LIVE, el campo queda solo lectura.
- Permiso granular `CHANGE_LIVE_PRICE` queda pendiente.

### Gaps de permisos granulares

Se documentan como pendientes:

- `VIEW_LIVE`
- `START_LIVE`
- `CLOSE_LIVE`
- `SET_LIVE_ACTIVE_ITEM`
- `CLEAR_LIVE_ACTIVE_ITEM`
- `CHANGE_LIVE_PRICE`
- `RELEASE_LIVE_RESERVED_ITEM`
- `VIEW_LIVE_DASHBOARD`

Detalle completo: `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`.

## LIVE-Z6C - Pulido visual de consola LIVE

### Objetivo

Pulir `/live` para que se sienta como consola operativa profesional, no como formulario largo, sin cambiar backend, permisos, capacidades ni reglas funcionales de Z6A/Z6B.

### Cambios visuales aplicados

- Se suavizo el contenedor general del Operador:
  - fondo neutro;
  - borde normal del tema;
  - sin borde naranja dominante alrededor de toda la consola.
- Se compacto el header interno de LIVE:
  - actor/vista;
  - tipo de trabajo;
  - estado;
  - live seleccionado;
  - sucursal;
  - ultima reserva si existe.
- Se reordeno visualmente la consola del Operador:
  1. Prenda al aire ahora.
  2. Preparar siguiente prenda.
  3. Precio.
  4. Cliente / Interesado.
  5. Reserva.
- Precio, cliente y reserva ahora se agrupan en un grid flexible para reducir altura en desktop/tablet y apilar en mobile.
- La card de prenda reservada ya no repite el mismo mensaje dentro de la tarjeta.
- La alerta de prenda reservada se concentra en el panel de reserva y en la card activa sin duplicar texto.
- El boton `RESERVAR AHORA` baja jerarquia visual cuando la prenda ya tiene reserva activa, pero conserva `disabledReason` para feedback.
- Las reservas recientes se compactaron quitando una card anidada dentro de cada fila.
- Se redujeron alturas/paddings de tarjetas, chips, placeholders y acciones de prenda.

### No se cambio

- `services/liveCapabilities.ts`.
- `services/liveActorResolver.ts`.
- AUTH/RBAC/backend.
- Reglas de permisos.
- Reglas de cancelacion con motivo.
- Reglas de vendido operativo.
- Precio LIVE vs precio base.
- Bloqueo de doble reserva.
- Llamadas a pagos/caja.
- Vistas Supervisor, Vendedor/Presentadora y NO_ACCESS, salvo impacto visual indirecto controlado.

### Pendiente LIVE-Z7

- Revisión visual fina con screenshots por desktop/tablet/mobile.
- Migrar bloques internos a templates especificos si se decide reducir aun mas JSX en `/live`.
- Definir reglas/endpoint formal de liberacion segura de prenda.
- Realtime formal (`LIVE-RT`) con SSE/WebSocket.

### Correccion posterior de jerarquia

Despues de QA visual se corrigio el alcance del grid interno:

- `Prenda al aire ahora` vuelve a ocupar un bloque protagonista de ancho completo.
- `Preparar siguiente prenda` queda debajo como bloque secundario.
- El grid visual aplica solo a `Precio` + `Cliente / Interesado`.
- `Reserva` vuelve a quedar debajo del bloque Precio/Cliente.
- Se evita presentar prenda al aire, prenda preparada, precio y cliente como columnas equivalentes.
- El precio queda visualmente ligado a la prenda al aire y no a la prenda preparada.

## LIVE-Z6C2 - Premium LIVE Console polish

### Objetivo

Convertir `/live` en una consola operativa mas premium, limpia y tablet-friendly sin cambiar backend, permisos, capacidades ni reglas profundas.

### Ajustes visuales aplicados

- Se reordeno la consola Operador al flujo pedido para Z6C2:
  1. Preparar siguiente prenda.
  2. Prenda al aire ahora.
  3. Precio + Cliente / Interesado.
  4. Reserva.
  5. Reservas recientes.
  6. Finalizar en vivo.
- `Preparar siguiente prenda` queda primero como panel operativo de preparacion.
- `Prenda al aire ahora` queda despues, pero con mayor presencia visual mediante card protagonista, padding y sombra suave.
- `Precio` y `Cliente / Interesado` quedan como bloque compartido, para reforzar que ambos dependen de la prenda al aire y no de la prenda preparada.
- `RESERVAR AHORA` se movio dentro del panel `Reserva`, con motivo visible cuando la accion esta bloqueada por prenda ya reservada, falta de permisos o datos pendientes.
- Las cards principales recibieron sombras suaves y menor ruido de bordes para reducir el aspecto de formulario largo.
- Las reservas recientes mantienen distribucion compacta y acciones por capacidades.

### Conexion vs sesion reemplazada

- Se corrigio el manejo frontend cuando `/api/me` o una solicitud falla por conexion/backend apagado.
- Un error de red ya no limpia la sesion local ni muestra el mensaje de sesion iniciada en otro equipo.
- El mensaje de red queda:
  - `No se pudo conectar con el servidor. Revisa tu conexion o intenta nuevamente.`
- El mensaje de sesion en otro equipo queda reservado para respuestas 401 con texto de sesion revocada/reemplazada.

### No se cambio

- No se modifico backend.
- No se modifico AUTH/RBAC backend.
- No se modificaron capacidades LIVE ni permisos.
- No se tocaron pagos, caja, reportes financieros, billing ni IA.
- No se cambio contrato de API.
- No se implemento WebSocket ni SSE.
- No se cambio la logica de reserva, bloqueo de doble reserva, vendido operativo, cancelacion con motivo ni precio LIVE.

### Pendientes LIVE-Z7

- QA visual con screenshots reales en desktop, tablet y mobile.
- Validar manualmente backend detenido contra pantalla protegida y refresh de `/live`.
- Evaluar componentes internos especificos para `LiveConsolePanel` si se decide reducir JSX de `/live`.

## Ajuste AppShell/Header contextual

### Objetivo

Evitar que el header de contenido repita de forma pobre el mismo nombre del menu cuando el sidebar fijo ya indica la seccion activa en desktop.

### Cambios aplicados

- `AppShell` ahora acepta `contextTitle` y `contextSubtitle`.
- En desktop con sidebar fijo, `TopBar` usa el contexto si existe.
- En tablet/mobile con drawer, `TopBar` conserva `title` y `subtitle` para que la seccion siga siendo clara cuando el menu esta oculto.
- `Inicio` usa en desktop:
  - `Resumen operativo`.
  - Sucursal/fecha si existe o texto contextual de actividad y accesos.
- `LIVE` usa en desktop:
  - `Operacion LIVE`.
  - Live, sucursal y ultima reserva si existen, o `Sin transmision activa`.
- El header interno de Operador deja de repetir la linea Live/Sucursal/Ultima reserva en desktop para reducir duplicidad visual.
- `/ui-kit` usa en desktop:
  - `Catalogo UI`.
  - `Componentes, tokens y templates internos`.

### No se cambio

- No se oculto el sidebar en desktop.
- No se tocaron reglas funcionales LIVE.
- No se modificaron capacidades, permisos, AUTH/RBAC backend ni pagos/caja/reportes/billing/IA.

## Design system aplicado a LIVE

### Objetivo

Hacer que `/live` consuma el sistema visual de PRODUCT-B de forma real, con tema claro/oscuro y jerarquia consistente de botones, estados y cards.

### Cambios aplicados

- `AppButton` ahora soporta una jerarquia visual explicita:
  - `primary`
  - `secondary`
  - `neutral`
  - `danger`
  - estado bloqueado con tokens propios
- LIVE dejo de usar variantes legacy `operation`/`cancel` en su flujo visual principal y alterno.
- Acciones principales usan `primary`:
  - iniciar live;
  - poner prenda al aire;
  - seleccionar cliente;
  - reservar;
  - vendido operativo.
- Acciones de soporte usan `neutral` o `secondary` segun peso:
  - buscar/escaneo/preparacion;
  - sacar del aire;
  - volver a reservado;
  - botones bloqueados.
- Acciones destructivas usan `danger`:
  - cancelar apartado;
  - finalizar en vivo.
- Las cards de prenda al aire, prenda preparada y prenda reservada reemplazan colores hardcodeados por tokens del tema:
  - `warningBackground`;
  - `warning`;
  - `successBackground`;
  - `infoCardBackground`;
  - `infoCardBorder`.
- `RESERVAR AHORA` bloqueado mantiene feedback visible y usa estilo bloqueado consistente.

### Tema claro/oscuro

- `AppThemeContext` ahora expone:
  - `themeMode`;
  - `setThemeMode`;
  - `toggleThemeMode`.
- La preferencia claro/oscuro se guarda localmente en el dispositivo con AsyncStorage.
- El toggle visible vive en `TopBar`.
- El cambio afecta `AppShell`, `Sidebar`, `TopBar`, Home, UI Kit, LIVE, reservation-detail y componentes base que consumen `useAppTheme`.
- No se creo endpoint nuevo ni se toco backend de apariencia.

### UI Kit

- `/ui-kit` muestra el tema activo y permite alternar claro/oscuro.
- `/ui-kit` ahora incluye preview de variantes de boton:
  - Primary.
  - Secondary.
  - Neutral.
  - Danger.
  - Disabled.

### No se cambio

- No se modifico backend.
- No se modifico AUTH/RBAC backend.
- No se tocaron pagos, caja, reportes financieros, billing ni IA.
- No se alteraron reglas Z6A/Z6B/Z6C, capacidades ni permisos LIVE.

### Ajuste visual puntual de prenda reservada

- La card `Prenda al aire ahora` reservada deja de usar fondo ambar dominante en toda la superficie.
- El estado reservado usa fondo `surface`, borde/acento lateral ambar y una alerta compacta.
- Se conservan los chips `Al aire` y `Reservada`.
- El mensaje `Esta prenda ya fue reservada. Cambia o sacala del aire para continuar.` se muestra una sola vez.
- La prenda disponible conserva acento verde sutil.
- La prenda vendida/no reservable usa acento danger sutil cuando esta en la card activa.
- Dark mode hereda tokens del tema; no se agregan amarillos fuertes hardcodeados.

### Transicion a LIVE-Z7

- LIVE-Z7 continua con el principio `AUTH real -> permisos reales -> capacidades LIVE -> vista/acciones permitidas`.
- `canChangeLivePrice` se endurece de forma conservadora y ya no depende solo de operar LIVE.
- Si el usuario no puede cambiar precio LIVE, la consola muestra precio solo lectura y `Solicitar autorizacion`.
- La solicitud de autorizacion no simula aprobacion real; queda pendiente mensajeria interna para LIVE-Z8.
- Si el precio LIVE difiere del precio sugerido/base, se solicita confirmacion antes de crear la reserva.
- La liberacion segura de prenda queda pendiente porque requiere confirmar pagos y un endpoint especifico.

### Continuidad a LIVE-Z8

- LIVE-Z8 agrega `AuthorizationRequestPanel` como UI reutilizable para acciones bloqueadas por capacidades.
- La vista Supervisor/Admin muestra `Solicitudes pendientes` con EmptyState real mientras no exista backend.
- No se simulan aprobaciones ni se ejecutan acciones despues de solicitar autorizacion.
- Persistencia, inbox supervisor y auditoria operacional quedan para LIVE-Z9.

## GO/NO-GO

GO tecnico para LIVE-Z6A, Z6B, Z6C y Z6C2.

GO visual condicionado a QA manual con usuarios:

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

## LIVE-Z8B / PRODUCT-B4 - Dark theme premium

Fecha: 2026-06-04

### Ajuste visual

- Se reforzo dark mode para que LIVE herede tokens semanticos reales y no colores hardcodeados.
- El bloque `3. PRECIO` queda legible en modo oscuro sin seleccionar texto.
- Inputs, helper texts, captions, disabled states, badges y alertas usan tokens del tema.
- Las alertas warning en dark mode se suavizan para verse premium y no como bloques ambar dominantes.
- La prenda reservada conserva acento warning sin saturar toda la card.
- `AppShell`, `TopBar`, `Sidebar`, Home, UI Kit y `reservation-detail` mantienen el mismo lenguaje visual claro/oscuro.

### No se cambio

- No se tocaron backend, AUTH/RBAC, pagos, caja, reportes, billing ni IA.
- No se cambiaron capacidades LIVE ni reglas operativas Z6/Z7/Z8.
# Nota LIVE-Z9B - Lenguaje de apartados

LIVE-Z9B alinea el copy visible de `/live` para usar `Apartado` como termino operativo principal. `Reserva` queda como termino tecnico interno cuando aplique.

Tambien corrige que, despues de apartar la prenda al aire, la prenda preparada para cambio permanezca visible y pueda usarse con `Cambiar por prenda preparada`.

No se cambiaron backend, permisos, capacidades ni contratos de API.
