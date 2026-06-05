# LIVE-Z9C - Estados accionables de apartados LIVE

## Objetivo

Evitar acciones visibles en `Apartados recientes` que no produzcan un cambio operativo perceptible para el usuario.

LIVE-Z9A y LIVE-Z9B aclararon el lenguaje de las acciones. LIVE-Z9C ajusta la disponibilidad de botones segun el estado actual del apartado y reemplaza mensajes genericos por confirmaciones especificas.

## Regla de UX

En la lista de apartados recientes, las acciones deben depender del estado actual:

| Estado actual | Acciones visibles esperadas |
| --- | --- |
| Apartado | Ver detalle, Cerrar como venta LIVE, Cancelar apartado |
| Venta LIVE | Ver detalle, Volver a apartado, Cancelar apartado si sigue permitido |
| Cancelado operativo | Ver detalle, Volver a apartado solo si la capacidad actual permite reactivarlo |
| Apartado en seguimiento | Ver detalle, Volver a apartado si la capacidad actual lo permite |

`Mantener apartado` no se muestra cuando el registro ya esta en estado visible `Apartado`, porque para la operacion real parece una accion sin efecto.

## Mensajes especificos

Se reemplaza el mensaje generico `Estado actualizado` por confirmaciones segun accion:

- Cerrar como venta LIVE:
  - Titulo: `Venta LIVE registrada`
  - Mensaje: `El apartado quedo cerrado como venta dentro del en vivo. No se registro pago ni caja.`
- Volver a apartado:
  - Titulo: `Apartado reactivado`
  - Mensaje: `El registro volvio a estado Apartado para seguimiento. No se registro pago ni caja.`
- Cancelar apartado:
  - Titulo: `Apartado cancelado`
  - Mensaje: `El apartado fue cancelado operativamente. No se registro pago ni caja.`
- Sin cambios:
  - Titulo: `Sin cambios`
  - Mensaje: `Este registro ya estaba como Apartado.`

## Alcance tecnico

- No se modifica backend.
- No se modifican permisos ni capacidades.
- No se crean endpoints.
- No se cambia la logica de reserva/apartado.
- El ajuste se limita al renderizado frontend, mensajes y documentacion.

## Validacion manual esperada

1. Entrar a `/live` con un usuario con capacidad operativa.
2. Crear o ubicar un apartado reciente en estado `Apartado`.
3. Confirmar que no aparece `Mantener apartado`.
4. Confirmar que si aparecen `Ver detalle`, `Cerrar como venta LIVE` y `Cancelar apartado` cuando las capacidades lo permiten.
5. Cerrar un apartado como venta LIVE.
6. Confirmar mensaje `Venta LIVE registrada`.
7. Confirmar que aparece `Volver a apartado` si la capacidad actual permite regresar estado.
8. Volver a apartado y confirmar mensaje `Apartado reactivado`.
9. Cancelar apartado y confirmar mensaje `Apartado cancelado`.

## GO/NO-GO

GO si pasan validaciones tecnicas y en manual no aparece ninguna accion sin efecto perceptible en `Apartados recientes`.

## Continuidad LIVE-Z9D

LIVE-Z9D corrige el flujo de `Prenda preparada para cambio`: `Cambiar por prenda preparada` ya no abre el selector cuando existe una preparada visible, se agrega `Quitar prenda preparada` y se muestra aviso si se intenta preparar la misma prenda que ya esta al aire.
