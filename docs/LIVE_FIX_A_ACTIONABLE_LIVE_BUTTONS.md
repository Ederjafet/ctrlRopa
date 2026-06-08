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
  - explica que debe seleccionarse una prenda distinta a la que esta al aire antes de cambiar.
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
4. Confirmar que aparece un aviso claro y no queda sin respuesta.
5. Preparar una prenda distinta.
6. Presionar `CAMBIAR POR PRENDA PREPARADA`.
7. Confirmar que la prenda preparada pasa al aire como antes.
8. Crear o usar un apartado LIVE pendiente.
9. Presionar `Cerrar como venta LIVE`.
10. Confirmar que aparece una confirmacion visual dentro de la app.
11. Confirmar que el mensaje aclara que no registra pago ni caja.
12. Confirmar y validar que el estado cambia a venta LIVE.
13. Confirmar que la accion inversa dice `Deshacer cierre de venta LIVE`.
14. Confirmar que `Deshacer cierre de venta LIVE` regresa el registro a seguimiento como apartado.
15. Confirmar que `Cancelar apartado` sigue siendo una accion separada.
16. Confirmar que ambos textos de ayuda aclaran que no registran pago ni caja.
17. Repetir con apartados ya cerrados/cancelados/liquidados si estan disponibles.
18. Validar light/dark y mobile/tablet.

## Limitaciones

- Esta fase no implementa cambios backend.
- La confirmacion usa estado local/refrescado ya disponible en `/live`.
- Si la informacion quedo desactualizada, se muestra mensaje para actualizar y reintentar.
- La validacion final de concurrencia sigue dependiendo del backend existente.

## GO/NO-GO

- GO tecnico si lint, TypeScript, export web, Maven test/package y `git diff --check` pasan.
- PENDING_QA hasta que QA ejecute el flujo manual con evidencia.
