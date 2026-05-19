# ERP LIVE-O - Operator Console

Fecha: 2026-05-19

## Objetivo

Convertir `En vivo` en una consola de operador para live-commerce, no en un formulario administrativo.

## Cambios aplicados

- Se agrega bloque `Consola del operador`.
- La captura de reserva queda presentada como tarea operacional:
  - cliente,
  - prenda,
  - precio,
  - accion principal `Reservar ahora`.
- En tablet, esta columna sigue siendo prioritaria.
- Se reduce el protagonismo de textos explicativos largos.

## Roles

### Presentadora

- Muestra prendas.
- Mantiene ritmo comercial.
- No debe operar el sistema completo.

### Operador

- Cambia producto actual.
- Registra cliente/prenda/precio.
- Atiende pedidos por chat.
- Crea reserva.
- Manda a cobro cuando aplica.

## Pendiente

- Convertir el selector de prenda actual en una accion visual dedicada.
- Migrar mas bloques a `LiveActionCard` y `LiveCompactCard`.
- Validar ergonomia tactil en tablet fisica.
