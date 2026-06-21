# FLOW-FAST-QA-A - Cierre QA alias-cliente-paquete-pagos-envios

## Resumen ejecutivo

Se corrigieron hallazgos de QA del flujo operativo LIVE -> alias/interesado -> cliente formal -> apartado -> paquete -> pago -> envio. El foco fue cerrar botones muertos, ambiguedades de cliente/alias, busquedas sucias de prendas libres, permisos de dinero y bloqueo de envio desde paquetes con saldo.

## Hallazgos QA corregidos

- `Vincular cliente` en LIVE ya no precarga el alias en el buscador.
- LIVE bloquea la combinacion ambigua de cliente formal + alias/interesado.
- `Convertir alias en cliente formal` funciona desde LIVE y desde Apartados con confirmacion explicita.
- Usuarios sin permiso para crear clientes reciben mensaje claro.
- El detalle del apartado conserva trazabilidad visual cuando el cliente formal viene de alias.
- La busqueda de prendas libres en detalle de paquete solo muestra `AVAILABLE`.
- `Cerrar preparacion` se renombro a `Marcar listo para envio`.
- Backend bloquea marcar paquete como listo si tiene saldo pendiente.
- `/shipment-detail` usa `AppShellPage` y recupera menu lateral.
- Alta rapida desde `Apartado puerta` conserva el cliente seleccionado al volver.

## Alias, cliente formal y permisos

Reglas aplicadas:

- El alias solo se muestra como contexto, nunca como busqueda automatica.
- Convertir alias requiere permiso `CREATE_CUSTOMER`.
- La conversion crea un cliente formal y vincula el apartado al cliente creado.
- No se crean clientes fake automaticamente.
- Si se selecciona cliente formal en LIVE, el campo alias queda deshabilitado.
- Backend rechaza reservas con `customerId` e `interestedAlias` al mismo tiempo.

`Editar alias` queda deshabilitado con explicacion porque requiere endpoint auditado para no perder trazabilidad.

## Apartados y paquetes

Se conserva la decision de mostrar apartados individuales para historial. La accion principal se aclara como `Crear / agregar paquete` y el modal mantiene dos caminos seguros:

- Crear paquete nuevo para cliente formal.
- Agregar a paquete activo del mismo cliente.

Alias/interesado sin cliente formal no puede crear paquete. Debe vincularse o convertirse antes.

## Pagos y permisos

Se confirmo enforcement backend existente:

- Ver pagos: `VIEW_PAYMENTS`.
- Registrar pagos/abonos: `REGISTER_PAYMENTS`.
- Aplicar saldo a favor: `APPLY_CUSTOMER_BALANCE`.

La pantalla `payments` ya usa `AppShellPage` y muestra saldo a favor disponible. La aplicacion directa de saldo a apartado/paquete sigue deshabilitada cuando falta trazabilidad especifica.

## Prendas libres a paquete

La busqueda de detalle de paquete ahora excluye por defecto:

- `RESERVED`
- `SOLD`
- `DISABLED`
- prendas ya asociadas al paquete

Backend ya valida que una prenda libre solo pueda agregarse si sigue `AVAILABLE`; al agregarla crea la reserva interna y bloquea contra doble venta.

## Envio

El envio queda limitado a paquetes. El detalle de envio ahora vive dentro del shell normal de la app.

Reglas reforzadas:

- Paquete con saldo pendiente no puede marcarse listo para envio.
- Paquetes vacios no pueden marcarse listos.
- En envios solo se agregan paquetes `READY`.
- Apartados sueltos no son elegibles para envio.

## Decisiones de negocio

- Apartados siguen como registros individuales, con accion clara hacia paquete.
- `Apartado puerta` se mantiene por compatibilidad; el boton `Nuevo apartado` en Apartados sigue apuntando a ese flujo.
- `Crear / agregar paquete` abre el mismo modal para evitar elegir mal entre paquete nuevo y activo.
- `Cerrar preparacion` se reemplaza por `Marcar listo para envio`.
- Paquetes cross-customer no se implementan sin autorizacion/auditoria.

## Backlog

- `FLOW-PACKAGE-MERGE-A`: unir paquetes y mover prendas entre paquetes.
- `FLOW-PACKAGE-AUTH-A`: autorizacion auditada para casos excepcionales cross-customer.
- Endpoint auditado para editar alias historico.
- Aplicacion trazable de saldo a favor a paquete/apartado.
- Hardening adicional de pagos con mas pruebas negativas por rol.
- Flujo avanzado de envios con autorizaciones para saldo pendiente.

## Smoke QA recomendado

1. Crear apartado LIVE con alias y confirmar que `Vincular cliente` abre con busqueda vacia.
2. Convertir alias en cliente desde LIVE.
3. Convertir alias en cliente desde Apartados.
4. Intentar cliente + alias en LIVE y confirmar bloqueo.
5. Crear paquete con cliente formal y agregar prendas libres disponibles.
6. Confirmar que reservadas/vendidas no aparecen como libres.
7. Registrar abono en paquete y confirmar saldo.
8. Intentar marcar listo con saldo pendiente y confirmar bloqueo backend/UI.
9. Liquidar paquete, marcar listo y agregar a envio.
10. Abrir `/shipment-detail` y confirmar menu lateral.

## Riesgos

- Algunos textos heredados siguen con encoding mixto en pantallas antiguas.
- El rol usado en QA debe cerrar sesion y entrar de nuevo despues de cambios de permisos.
- La creacion de cliente desde alias usa telefono opcional; si no se captura, se guarda `Sin telefono` para cumplir contrato actual.

## Validaciones realizadas

- `npm run lint`: OK, con 52 warnings preexistentes.
- `npx tsc --noEmit`: OK.
- `git --no-pager diff --check`: OK.
- `./mvnw.cmd test`: compila y ejecuta suites iniciales, pero el contexto Spring falla por entorno local sin `.env` de DB: `Access denied for user 'root'@'localhost' (using password: NO)`.
- `./mvnw.cmd -Dtest=PaymentServiceAccessTests test`: OK, 9 tests.
- `./mvnw.cmd -Dtest=CustomerPackageServiceTests test`: OK, 5 tests.
- `./mvnw.cmd -Dtest=ReservationServiceTests test`: Maven finaliza success, pero Surefire no pudo escribir el reporte de esa clase y reporto 0 tests en este entorno.

## GO/NO-GO

`GO_INSTALACION_CLIENTE` condicionado a smoke visual manual con datos reales de la tienda y roles definitivos.
