# LIVE-Z8 - Solicitudes de autorizacion y mensajeria operativa

## Objetivo

Crear una base controlada para solicitudes de autorizacion operativa dentro de LIVE, sin saltarse RBAC y sin simular aprobaciones reales.

Regla central:

AUTH real -> permisos reales -> capacidades LIVE -> acciones permitidas.

Una solicitud de autorizacion no concede permiso ni ejecuta la accion.

## Auditoria de soporte existente

### Frontend

Existe:

- `services/liveCapabilities.ts` para resolver capacidades LIVE.
- `services/liveActorResolver.ts` para resolver vista/experiencia desde capacidades.
- `app/live.tsx` con modal local de solicitud de autorizacion introducido en LIVE-Z7 para precio LIVE.
- Componentes premium: `AppButton`, `StatusBadge`, `EmptyState`, `LiveCompactCard`.

No existe:

- servicio frontend persistente para solicitudes de autorizacion;
- inbox de supervisor con datos reales;
- aprobacion/rechazo persistente.

### Backend

Existe:

- Eventos LIVE (`LiveEvent`, `LiveEventService`, `LiveEventType`).
- Auditoria de seguridad (`security_audit_events`) para eventos de seguridad, no workflow operacional.
- Estado operativo de reservas.

No existe:

- tabla/endpoint de solicitudes de autorizacion LIVE;
- evento formal `LIVE_AUTHORIZATION_REQUESTED`;
- endpoint para aprobar/rechazar solicitudes;
- permiso granular `REQUEST_LIVE_AUTHORIZATION`.

Decision Z8:

- No crear backend grande.
- No mezclar solicitudes operativas con `security_audit_events`.
- Preparar UI honesta y documentar contrato futuro.

## Mapa de acciones que pueden requerir autorizacion

| Accion | Capacidad requerida | Vista donde aparece | UX Z8 | Datos que tendria una solicitud real | Backend actual |
|---|---|---|---|---|---|
| Cambiar precio LIVE | `canChangeLivePrice` | Operador | Precio solo lectura + `Solicitar autorizacion` | liveId, activeItemId, precio actual, precio solicitado, motivo, comentario, solicitante | No existe endpoint |
| Liberar prenda | `canReleaseReservedItem` | Operador/Supervisor futuro | Documentado; no se muestra accion directa sin contexto seguro | reservationId, itemId, validacion pagos, motivo, solicitante | No existe endpoint seguro |
| Cancelar apartado | `canCancelReservation` | Reservas recientes | Si falta permiso, panel contextual de solicitud; no cancela | reservationId, liveId, motivo, comentario, solicitante | Cancelacion existe, solicitud no |
| Finalizar live | `canCloseLive` | Operador / panel cierre | Si falta permiso, panel contextual de solicitud; no cierra | liveId, motivo, comentario, solicitante | Cierre existe, solicitud no |
| Marcar vendido operativo | `canMarkOperationalSold` | Reservas recientes | Documentado como candidato; no se satura UI en Z8 | reservationId, motivo, solicitante | Estado operativo existe, solicitud no |
| Iniciar live | `canStartLive` | Operador | Documentado como candidato | branchId, notas, motivo, solicitante | Inicio existe, solicitud no |

## Implementacion UI Z8

Se crea:

- `components/live/AuthorizationRequestPanel.tsx`

El componente recibe:

- `actionLabel`
- `requiredCapability`
- `reason`
- `entityContext`
- `pendingBackendLabel`
- `requestLabel`
- `onRequestAuthorization`

Usa:

- `AppButton`
- `StatusBadge`
- `AppText`
- tokens de `AppThemeContext`

Se aplica en:

- Precio LIVE sin capacidad de cambio.
- Cancelacion de apartado bloqueada por falta de capacidad.
- Finalizar live bloqueado por falta de capacidad.

## Modal de solicitud

El modal muestra:

- accion solicitada;
- motivo requerido;
- motivos:
  - Promocion en vivo
  - Ajuste por defecto
  - Cliente frecuente
  - Autorizacion verbal
  - Otro

Al confirmar:

- no se ejecuta la accion;
- no se guarda aprobacion falsa;
- se muestra aviso:
  - `La solicitud de autorizacion todavia requiere integracion backend.`

## Supervisor/Admin

La vista Supervisor agrega seccion:

`Solicitudes pendientes`

Como no hay backend:

- muestra `EmptyState`;
- no muestra datos demo;
- no muestra botones de aprobar/rechazar reales;
- aclara que la aprobacion queda pendiente de backend.

## Gaps backend

Pendiente para LIVE-Z9:

- Tabla `live_authorization_requests`.
- Endpoint `POST /api/lives/{id}/authorization-requests`.
- Endpoint de supervisor para listar pendientes.
- Endpoint para aprobar/rechazar.
- Evento operativo `LIVE_AUTHORIZATION_REQUESTED`.
- Evento `LIVE_AUTHORIZATION_APPROVED` / `LIVE_AUTHORIZATION_REJECTED`.
- Permiso granular `REQUEST_LIVE_AUTHORIZATION`.
- Permiso granular para aprobar solicitudes, por ejemplo `APPROVE_LIVE_AUTHORIZATION`.

## Riesgos

- Sin backend, la solicitud no puede verse en otro dispositivo.
- Sin aprobacion persistente, no debe desbloquear acciones.
- Mostrar demasiados paneles puede saturar la consola; Z8 solo aplica donde hay contexto claro.

## GO / NO-GO

GO:

- UI reutilizable para acciones bloqueadas.
- Mensajes honestos.
- Seccion supervisor sin datos fake.
- Documentacion clara de contrato futuro.

NO-GO:

- Simular aprobaciones.
- Ejecutar acciones despues de solicitar.
- Guardar datos locales como si fueran auditoria real.
- Crear permisos backend sin fase formal.

## Siguiente fase recomendada

LIVE-Z9:

- Persistencia backend de solicitudes.
- Inbox supervisor real.
- Auditoria operacional de solicitudes.
- Flujo aprobar/rechazar sin romper RBAC.
