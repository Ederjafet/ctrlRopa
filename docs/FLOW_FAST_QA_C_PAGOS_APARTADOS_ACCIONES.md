# FLOW-FAST-QA-C - Limpieza UX de Pagos y acciones de paquete en Apartados

## Resumen ejecutivo

Se corrigieron dos hallazgos visuales del QA operativo:

- `/payments` ya no muestra el boton generico `Menu principal`; el AppShell/sidebar queda como navegacion principal.
- `/reservations` ya no muestra `Crear / agregar paquete`; la accion principal ahora depende del estado real del apartado y de paquetes abiertos del cliente.

No se toco backend.

## Problema en Pagos

La pantalla `/payments` tenia un boton grande de retorno a menu principal. En desktop esto duplicaba la navegacion lateral y no representaba una accion financiera real.

### Correccion aplicada

- Se retiro `AppBackButton` de `/payments`.
- Se retiro la construccion de `fallbackRoute` usada solo por ese boton.
- La pantalla mantiene header, resumen, filtros, listado/pendientes y AppShell.
- `Pagos` sigue siendo la opcion activa del sidebar.
- No se agrego `Actualizar`.

## Problema en Apartados

La lista de `/reservations` mostraba `Crear / agregar paquete`, texto ambiguo y largo para el operador.

### Nueva regla de labels

- Apartado ya incluido en paquete: `Ver paquete`.
- Apartado con cliente formal y paquete abierto del cliente: `Agregar a paquete`.
- Apartado con cliente formal y sin paquete abierto del cliente: `Crear paquete`.
- Apartado con alias/interesado sin cliente formal: `Vincular cliente`.
- Apartado no elegible por estado o permisos: accion deshabilitada con explicacion existente.

## Como se decide Crear vs Agregar

La pantalla carga paquetes por cliente para los apartados activos:

- Los paquetes `OPEN` se usan para decidir si el cliente tiene paquete agregable.
- Los paquetes activos historicos (`OPEN`, `READY`, `SHIPPED`) se siguen usando para detectar si un apartado ya pertenece a un paquete.
- El modal de paquete preselecciona el paquete abierto cuando existe.
- Si no hay paquete abierto, el modal inicia como creacion de paquete nuevo.

## Cambios en el modal de paquete

- El titulo cambia a `Agregar a paquete` cuando hay paquetes abiertos del mismo cliente.
- El titulo cambia a `Crear paquete` cuando no hay paquetes abiertos.
- El copy explica si se agregara a paquete existente o si se creara uno nuevo.
- Dentro de `Mas`, si el apartado ya esta en paquete, se muestra `Ver paquete` y no se duplica una accion para crear/agregar.

## Apartados individuales

Se mantiene la decision de negocio de conservar apartados como registros individuales para historial. El modal de paquete permite incluir otros apartados elegibles del mismo cliente cuando se crea o se agrega a paquete.

## Validaciones esperadas

- `/payments` no muestra `Menu principal`.
- `/payments` mantiene AppShell/sidebar y no muestra `Actualizar`.
- `/reservations` no muestra `Crear / agregar paquete`.
- Apartado sin paquete y sin paquete abierto del cliente muestra `Crear paquete`.
- Apartado sin paquete y con paquete abierto del cliente muestra `Agregar a paquete`.
- Apartado en paquete muestra `Ver paquete`.
- Alias/interesado sin cliente formal orienta a vincular cliente.
- `Apartado puerta` no vuelve al menu.
- `Actualizar` sigue limitado a LIVE.

## Riesgos pendientes

- La union de paquetes y movimiento de prendas entre paquetes queda fuera de esta fase.
- La autorizacion excepcional para paquetes cross-customer queda pendiente y no debe habilitarse sin auditoria.
- Si el backend cambia estados de paquete agregable, se debe alinear `isCustomerPackageOpen`.

## Resultado

GO para revision visual enfocada en `/payments` y `/reservations`.
