# LIVE-Z10A - Auditoria y decision de autorizacion de cambio de precio

## Objetivo

Auditar el flujo de autorizacion de cambio de precio LIVE y dejar una decision segura para QA y operacion:

- completar un MVP solo si ya existia soporte backend real;
- o deshabilitar el flujo simulado si no existe backend resoluble.

## Hallazgo

No existe flujo real de autorizacion de precio LIVE.

Se reviso:

- `app/live.tsx`;
- `components/live/AuthorizationRequestPanel.tsx`;
- `services/liveService.ts`;
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveController.java`;
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/live/LiveService.java`.

El backend LIVE expone operaciones para consultar, crear, activar, cerrar, cambiar prenda activa y leer eventos:

- `GET /api/lives/branch/{branchId}`;
- `GET /api/lives/{id}`;
- `POST /api/lives/branch/{branchId}`;
- `PATCH /api/lives/{id}/activate`;
- `PATCH /api/lives/{id}/close`;
- `GET /api/lives/{id}/active-item`;
- `PATCH /api/lives/{id}/active-item`;
- `GET /api/lives/{id}/events`.

No se encontro endpoint, DTO, entidad, cola, estado, aprobador o servicio para:

- crear una solicitud de autorizacion;
- aprobar/rechazar una solicitud;
- consultar solicitudes pendientes;
- aplicar una autorizacion de cambio de precio.

## Decision aplicada

Se aplico la opcion B: no simular autorizaciones.

La UI ya no abre un modal local de motivos ni muestra `Solicitud pendiente` para cambio de precio. En su lugar, la pantalla informa claramente que la autorizacion de cambio de precio aun no esta disponible.

Mensaje ES principal:

> La autorizacion de cambio de precio aun no esta disponible. Manten el precio sugerido o solicita apoyo fuera del sistema.

## Regla de negocio preservada

- Un usuario sin capacidad `canChangeLivePrice` no puede editar el precio LIVE.
- La UI no concede cambio libre de precio por rol visual.
- La UI no simula que una autorizacion fue enviada.
- No se tocaron pagos, caja, reportes, billing, IA ni backend.

## Cambios realizados

- `app/live.tsx`
  - Se elimino el estado local `authorizationRequestContext`.
  - Se elimino el modal de motivos de autorizacion que producia `Solicitud pendiente`.
  - El panel de precio sin permiso queda como aviso honesto de no disponibilidad.
  - El panel de cancelacion sin permiso tambien deja de ofrecer una solicitud no resoluble.

- `components/live/AuthorizationRequestPanel.tsx`
  - El boton de solicitud ahora es opcional.
  - Si no hay `requestLabel` y `onRequestAuthorization`, el panel renderiza solo el aviso.

- Locales `es/en/pt-BR/fr/ja/zh/ko`
  - Se agregaron mensajes de autorizacion no disponible.
  - Se ajusto la ayuda de cambio de precio para no prometer un flujo interno.

## Pendiente para una fase futura

Para habilitar autorizacion real se requiere una fase backend completa:

- entidad/tabla de solicitudes;
- endpoint para crear solicitud;
- endpoint para aprobar/rechazar;
- permisos de aprobador;
- cola visible para supervisor/admin;
- auditoria de quien pidio, quien resolvio y que precio se autorizo;
- aplicacion segura de la autorizacion al apartado LIVE.

## Validacion manual esperada

1. Entrar a `/live` con usuario vendedor u operador sin `canChangeLivePrice`.
2. Poner una prenda al aire.
3. Confirmar que el precio aparece de solo lectura.
4. Confirmar que no aparece un modal para enviar solicitud de autorizacion.
5. Confirmar que no aparece `Solicitud pendiente`.
6. Confirmar mensaje: autorizacion de cambio de precio no disponible.
7. Confirmar que admin/operador con permiso puede mantener su flujo normal.
8. Validar light/dark y mobile/tablet.

## GO/NO-GO

GO tecnico para esta fase: la UI ya no comunica un flujo operativo inexistente.

NO-GO para autorizacion real de precio hasta implementar backend y aprobacion supervisor/admin.
