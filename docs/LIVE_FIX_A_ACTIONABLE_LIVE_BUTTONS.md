# LIVE-FIX-A - Acciones LIVE sin respuesta y validaciones accionables

## Resumen

QA reporto dos acciones visibles en `/live` que podian percibirse como botones sin respuesta:

- `CAMBIAR POR PRENDA PREPARADA` en `PRENDA AL AIRE AHORA` cuando aun no existe prenda preparada.
- `Cerrar como venta LIVE` cuando la accion no puede continuar por estado, permiso o informacion desactualizada.

Esta fase corrige el feedback de frontend sin tocar backend, endpoints, pagos, caja ni reglas profundas de LIVE.

## Cambios aplicados

- `Cambiar por prenda preparada` ya no queda bloqueado silenciosamente por falta de prenda preparada.
- Si no hay prenda preparada, el boton muestra un aviso accionable:
  - indica que falta una prenda preparada;
  - explica que debe seleccionarse, escanearse o crearse una prenda distinta a la que esta al aire antes de cambiar;
  - permite abrir `Buscar prenda`, `Escanear QR`, `Crear prenda rapida` o cerrar el aviso.
- `Cerrar como venta LIVE` deja de depender del `Alert` nativo para la confirmacion principal.
- Se agrego confirmacion visual dentro de la app con `AppBottomModal`.
- Antes de confirmar venta LIVE se validan estados locales seguros:
  - sin LIVE abierto seleccionado;
  - apartado ya no disponible en la vista;
  - apartado ya liquidado;
  - apartado ya cerrado como venta LIVE;
  - apartado cancelado.
- En esos casos se muestra `LiveNoticeModal` con mensaje claro y no se ejecuta actualizacion silenciosa.

## Complemento de microcopy

QA detecto que, despues de cerrar un apartado como venta LIVE, la accion inversa `Volver a apartado` podia confundirse con `Cancelar apartado`.

Se separo el microcopy:

- `Deshacer cierre de venta LIVE`: revierte el cierre operativo de venta LIVE y regresa el registro a seguimiento como apartado.
- `Cancelar apartado`: cancela el apartado operativo de la prenda.

Textos objetivo:

- `Cerrar como venta LIVE`: cierra el apartado como venta operativa dentro del LIVE, sin pago ni caja.
- `Deshacer cierre de venta LIVE`: regresa el registro a seguimiento como apartado, sin pago ni caja.
- `Cancelar apartado`: cancela el apartado de la prenda, sin pago ni caja.

No se cambiaron estados funcionales ni llamadas backend; solo se ajustaron claves y textos visibles.

## Complemento de guardia por pago registrado

QA detecto que un apartado LIVE puede tener pago registrado y que las acciones `Deshacer cierre de venta LIVE` y `Cancelar apartado` no deben ejecutarse libremente si existe dinero aplicado.

Auditoria tecnica:

- `Reservation` no expone campos embebidos como `paidAmount`, `totalPaid`, `hasPayment` o `paymentStatus`.
- `/live` ya carga pagos con `getPaymentsByReservation(reservation.id)` desde `services/paymentService.ts`.
- Los campos disponibles del pago son `amount`, `receivedAmount`, `status` y `reservationId`.
- `/live` ya calcula `paidByReservationId` ignorando pagos anulados.

Cambios aplicados:

- En los apartados recientes se muestra informacion de pago cuando el usuario puede consultarla:
  - `Pago registrado`;
  - `Saldo pendiente`;
  - `Estado de pago`.
- Si el usuario no puede consultar pagos, se muestra `No disponible`; no se asume que el apartado no tiene pago.
- `Deshacer cierre de venta LIVE` queda bloqueado si `paidByReservationId[reservation.id] > 0`.
- `Cancelar apartado` queda bloqueado si `paidByReservationId[reservation.id] > 0`.
- Si el estado de pago no se puede confirmar por permisos/datos no disponibles, las acciones sensibles tambien se bloquean preventivamente.
- El mensaje indica que la reversa de apartados con pago requiere autorizacion de supervisor y que esa autorizacion aun no esta disponible en este flujo.
- No se invento autorizacion, no se creo backend, no se tocaron pagos ni caja.

Jerarquia visual:

- `Ver detalle`: accion neutral/informativa.
- `Cerrar como venta LIVE`: accion principal/confirmacion operativa.
- `Deshacer cierre de venta LIVE`: accion warning/reversa operativa.
- `Cancelar apartado`: accion danger/destructiva.

Se agrego una variante `warning` minima en `AppButton` porque la variante `operation` podia resolverse al mismo color que `primary` en el tema base y en presets. La nueva variante usa `theme.colors.warning` y evita hardcodear colores.

## Complemento actores vs permisos

QA pregunto por que `qa.vendedor.centro@local.test` no puede buscar, escanear, crear, poner al aire o cambiar prenda.

Decision mantenida:

- La UI depende de permisos/capacidades efectivas, no solo del actor visual.
- El actor clasifica la experiencia como operador, vendedor, supervisor o admin.
- Las acciones de controlar prenda al aire siguen bloqueadas si no existe capacidad real.
- No se cambio RBAC, no se agregaron permisos y no se habilito ninguna accion por actor.

Estado actual:

- El vendedor con `DO_LIVE_RESERVATION` puede apoyar el seguimiento del LIVE y registrar apartados segun sus permisos reales.
- Buscar/preparar/poner prenda al aire depende de capacidades de inventario/control LIVE existentes.
- Crear prenda depende de permisos de inventario existentes.
- Si una accion no esta permitida, debe mostrarse bloqueada o con mensaje de permisos; no debe quedar muda.

Pendiente futuro:

- `LIVE-ROLE-A`: evaluar capacidades del vendedor para preparar prendas sin controlar la prenda al aire, con permiso granular, contrato y QA especificos.

## Reglas mantenidas

- No se registra pago ni movimiento de caja al cerrar como venta LIVE.
- No se modifican permisos ni capacidades.
- No se crean endpoints.
- No se modifica backend.
- No se cambian filtros de disponibilidad ni reglas de apartados.
- No se toca el flujo de vendedor/supervisor/no access.

## i18n

Se agregaron claves nuevas en:

- `locales/es/common.json`
- `locales/en/common.json`
- `locales/pt-BR/common.json`
- `locales/fr/common.json`
- `locales/ja/common.json`
- `locales/zh/common.json`
- `locales/ko/common.json`

Las claves cubren:

- falta de prenda preparada;
- confirmacion de venta LIVE sin pago/caja;
- bloqueo de venta LIVE por estados no validos;
- apartado no disponible en la vista actual.

## Validacion manual esperada

1. Entrar a `/live` como admin u operador.
2. Tener una prenda al aire sin prenda preparada.
3. Presionar `CAMBIAR POR PRENDA PREPARADA`.
4. Confirmar que aparece el aviso con acciones `Buscar prenda`, `Escanear QR`, `Crear prenda rapida` y `Cerrar`.
5. Presionar `Buscar prenda` desde el aviso y confirmar que abre el selector.
6. Seleccionar una prenda distinta a la que esta al aire y confirmar que queda preparada para cambio.
7. Presionar `CAMBIAR POR PRENDA PREPARADA` y confirmar que la prenda preparada pasa al aire como antes.
8. Repetir el aviso y presionar `Crear prenda rapida`; confirmar que abre `/items-create?returnTo=/live`.
9. Repetir el aviso y presionar `Escanear QR`; confirmar que abre el flujo real de QR o muestra mensaje claro si no esta disponible en el dispositivo.
10. Confirmar que ningun boton del aviso queda sin respuesta.
11. Crear o usar un apartado LIVE pendiente.
12. Presionar `Cerrar como venta LIVE`.
13. Confirmar que aparece una confirmacion visual dentro de la app.
14. Confirmar que el mensaje aclara que no registra pago ni caja.
15. Confirmar y validar que el estado cambia a venta LIVE.
16. Confirmar que la accion inversa dice `Deshacer cierre de venta LIVE`.
17. Confirmar que `Deshacer cierre de venta LIVE` regresa el registro a seguimiento como apartado.
18. Confirmar que `Cancelar apartado` sigue siendo una accion separada.
19. Confirmar que ambos textos de ayuda aclaran que no registran pago ni caja.
20. Con un apartado sin pago, confirmar que `Deshacer cierre de venta LIVE` y `Cancelar apartado` operan segun el estado permitido.
21. Con un apartado con pago, confirmar que `Pago registrado` se muestra si el dato esta disponible.
22. Con un apartado con pago, presionar `Deshacer cierre de venta LIVE` y confirmar que se bloquea con autorizacion requerida.
23. Con un apartado con pago, presionar `Cancelar apartado` y confirmar que se bloquea con autorizacion requerida.
24. Confirmar que no se ejecuta reversa/cancelacion silenciosa.
25. Si el usuario no puede ver pagos, confirmar que el estado aparece como `No disponible` y las acciones sensibles no asumen ausencia de pago.
26. Confirmar que `Cerrar como venta LIVE` se ve como accion principal y `Deshacer cierre de venta LIVE` como accion warning/reversa.
27. Validar con vendedor centro que acciones no permitidas no quedan mudas ni se habilitan sin permiso real.
28. Repetir con apartados ya cerrados/cancelados/liquidados si estan disponibles.
29. Validar light/dark y mobile/tablet.

## Limitaciones

- Esta fase no implementa cambios backend.
- La confirmacion usa estado local/refrescado ya disponible en `/live`.
- Si la informacion quedo desactualizada, se muestra mensaje para actualizar y reintentar.
- La validacion final de concurrencia sigue dependiendo del backend existente.
- No existe en esta fase un flujo real de autorizacion de supervisor para reversas de apartados con pago; por seguridad se bloquea y se documenta como pendiente de producto/backend.

## GO/NO-GO

- GO tecnico si lint, TypeScript, export web, Maven test/package y `git diff --check` pasan.
- PENDING_QA hasta que QA ejecute el flujo manual con evidencia.
