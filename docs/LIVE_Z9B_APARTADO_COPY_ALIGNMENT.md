# LIVE-Z9B - Unificacion de terminos: Apartado, venta LIVE y cambio de prenda

## Objetivo

LIVE-Z9B alinea el lenguaje visible de `/live` para usar `Apartado` como termino operativo principal. `Reserva` queda como termino tecnico interno cuando esta ligado a entidades, servicios o rutas existentes.

La fase tambien corrige un estado frontend: apartar la prenda al aire ya no limpia la prenda preparada para cambio.

## Decision de lenguaje

- Apartado: prenda separada para un cliente/interesado durante el LIVE.
- Reserva: termino tecnico interno del sistema.
- Venta LIVE: cierre operativo del apartado dentro del LIVE.
- Pago/caja: flujo separado; no se confirma desde LIVE.

## Cambios visibles

| Antes | Ahora |
| --- | --- |
| Reservas recientes | Apartados recientes |
| Ultima reserva | Ultimo apartado |
| Reservar ahora | Apartar ahora |
| Precio confirmado para reserva | Precio confirmado para apartado |
| Esta prenda ya tiene una reserva activa | Esta prenda ya tiene un apartado activo |
| Marcar vendido operativo / Confirmar venta LIVE | Cerrar como venta LIVE |
| Marcar pendiente | Mantener apartado |
| Sacar del aire | Retirar prenda del aire |
| Cambiar prenda | Cambiar por prenda preparada |

## Ayudas operativas

- `Cerrar como venta LIVE`: cierra el apartado como venta dentro del LIVE; no registra pago ni caja.
- `Mantener apartado`: deja el apartado activo para seguimiento; no confirma venta, pago ni caja.
- `Cancelar apartado`: cancela el apartado operativo de la prenda; no registra pago ni caja.
- `Retirar prenda del aire`: quita la prenda actual del LIVE; el en vivo sigue activo y queda sin prenda al aire.
- `Cambiar por prenda preparada`: reemplaza la prenda actual por la prenda preparada.
- `Finalizar en vivo`: cierra la sesion completa del LIVE.

## Correccion de flujo

Escenario corregido:

1. Hay una prenda al aire.
2. Hay una prenda preparada para cambio.
3. El operador aparta la prenda al aire.

Resultado esperado:

- la prenda al aire queda apartada/reservada;
- `Apartar ahora` queda bloqueado para esa prenda;
- la prenda preparada sigue visible;
- el operador puede usar `Cambiar por prenda preparada`.

Implementacion frontend:

- antes se limpiaba `selectedItem` despues de crear el apartado;
- ahora solo se limpia si `selectedItem` era la misma prenda apartada;
- si `selectedItem` representa la prenda preparada, se conserva.

## Continuidad LIVE-Z9C

LIVE-Z9C refina `Apartados recientes` para que las acciones visibles dependan del estado actual. `Mantener apartado` deja de mostrarse cuando el registro ya esta en estado visible `Apartado`, porque no genera un cambio operativo perceptible para la persona usuaria.

## Sin cambios funcionales backend

No se modifico:

- backend;
- endpoints;
- contratos de API;
- AUTH/RBAC;
- permisos/capacidades;
- pagos/caja/reportes/billing/IA;
- reglas operativas de reserva/apartado;
- persistencia.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/live`.
3. Confirmar que el flujo usa `Apartado` de forma consistente.
4. Preparar una prenda para cambio.
5. Poner otra prenda al aire.
6. Apartar la prenda al aire.
7. Confirmar que la prenda al aire queda apartada/reservada.
8. Confirmar que la prenda preparada sigue visible.
9. Usar `Cambiar por prenda preparada`.
10. Confirmar que la prenda preparada pasa al aire.
11. Validar vendedor/supervisor y light/dark.
