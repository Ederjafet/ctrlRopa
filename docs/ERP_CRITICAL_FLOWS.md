# ERP - Flujos criticos

Fecha: 2026-05-12  
Fase: 1F - hardening QA y release governance

## Objetivo

Clasificar los flujos que deben validarse antes de un release candidate y definir cuales bloquean release.

## Matriz de flujos

| Flujo | Criticidad | Impacto operativo | Dependencia | QA obligatorio | Bloquea release |
|---|---|---|---|---|---|
| Login/auth | CRITICA | Sin login nadie opera; con auth rota hay acceso indebido. | Backend, token, usuarios, permisos. | Si, siempre. | Si |
| Ventas | CRITICA | Afecta dinero, inventario, cliente y reportes. | Clientes, inventario, pagos, permisos. | Si, siempre. | Si |
| Pagos | CRITICA | Afecta caja, saldos y conciliacion. | Metodos de pago, ventas/reservas/paquetes, permisos. | Si, siempre. | Si |
| Caja | CRITICA | Cierre incorrecto afecta operacion financiera. | Pagos, ventas, reportes. | Si antes de release financiero. | Si si hay cambio relacionado. |
| Live | ALTA | Reservas pueden quedar mal asociadas o perderse. | Clientes, prendas, pagos, permisos. | Si. | Si si falla captura/cierre. |
| Lotes | ALTA | Origen de inventario, recepcion y calidad. | Proveedores, inventario, usuarios. | Si. | Si si afecta recepcion/inventario. |
| Inventario | CRITICA | Prenda mal ubicada/vendida/reservada afecta todo el ERP. | Lotes, catalogos, ventas, reservas. | Si, siempre. | Si |
| Reservaciones | ALTA | Prendas apartadas incorrectamente impactan venta y cliente. | Clientes, inventario, live/puerta, pagos. | Si. | Si si reserva/cancelacion falla. |
| Envios | ALTA | Paquetes pueden entregarse mal o quedar sin seguimiento. | Paquetes, clientes, direccion, pagos. | Si si hay flujo logistico en release. | Si si impide despacho/entrega. |
| Reportes | MEDIA/ALTA | Decisiones operativas y caja con datos incorrectos. | Ventas, pagos, live, envios. | Si para reportes principales. | Si hay error 500 o datos financieros incorrectos. |
| Permisos | CRITICA | Acceso indebido o bloqueo de usuario operativo. | Auth, roles, permisos backend. | Si, siempre. | Si |
| Auditoria | ALTA | Sin trazabilidad no hay control ERP ante incidentes. | Backend, interceptores, usuario/token. | Si en acciones sensibles. | Si si release toca acciones auditables. |

## Regla de prioridad

Un release candidate debe validar primero:

1. Login/auth.
2. Permisos.
3. Ventas.
4. Pagos/caja.
5. Inventario/lotes.
6. Live/reservaciones.
7. Paquetes/envios.
8. Reportes/auditoria.

## Pendiente de validar

- Cobertura real de auditoria por accion sensible.
- Pruebas automatizadas futuras por flujo critico.
