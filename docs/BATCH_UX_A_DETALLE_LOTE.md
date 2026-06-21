# BATCH-UX-A Detalle de lote claro y profesional

Fecha: 2026-06-21

Rama: `feature/flow-fast-1-prenda-paquete-pagos-saldo`

## Problema detectado

La pantalla `/batch-detail?id=2` mostraba recepcion, clasificacion, cierre y prendas en tarjetas separadas sin jerarquia clara. Era dificil entender rapidamente que lote se estaba consultando, cual era el proveedor, cuantas prendas contenia, que estado tenia cada prenda y que accion correspondia como siguiente paso.

## Nueva estructura

Se rediseño `app/batch-detail.tsx` con una estructura operativa compacta:

- Cabecera principal `Detalle de lote` con lote, sucursal, boton `Volver` y `Ver permisos`.
- Tarjeta superior con folio, estado, proveedor, fechas, calidad y proximo paso.
- Metricas compactas de prendas: total, disponibles, apartadas, vendidas, deshabilitadas y valor estimado.
- Bloque `Proveedor y entrada` con proveedor, sucursal, esperado, recibido, clasificado e items creados.
- Bloque `Acciones del lote` con recepcion, alta de prendas, cierre y cancelacion.
- Clasificacion por tipo de prenda conservando la logica existente.
- Lista de prendas del lote con busqueda, filtros por estado y acceso al detalle de prenda.

## Datos mostrados

La pantalla usa datos existentes:

- Detalle de lote desde `getBatchById`.
- Tipos de prenda desde `getProductTypes`.
- Prendas de la sucursal desde `getItemsByBranch`, filtradas por `batchId` en frontend.

No se inventan metricas. El valor estimado se calcula con los precios de prendas del lote cuando existen; si no hay precios, se muestra `No disponible`.

## Proveedor

Si el lote tiene proveedor, se muestra como `Proveedor asignado` y se puede ir a `Proveedores`.

Si no tiene proveedor, se muestra una alerta suave:

`Este lote no tiene proveedor asignado.`

La accion `Crear proveedor` queda disponible solo si el usuario tiene `MANAGE_CATALOGS`; si no, el boton explica el permiso requerido.

## Acciones disponibles

- Registrar recepcion.
- Guardar clasificacion.
- Alta de prendas del lote.
- Cerrar lote.
- Cancelar lote.
- Ver detalle de prenda.
- Ver o crear proveedor segun estado y permisos.

Las acciones bloqueadas usan `disabledReason` para explicar si falta permiso, recepcion, clasificacion o si el lote esta cancelado.

## Permisos

Se agrego `batchDetail` en `services/screenPermissions.ts`.

Acciones evaluadas:

- Ver lote: `VIEW_INVENTORY`.
- Registrar recepcion: `MANAGE_INVENTORY`.
- Clasificar lote: `MANAGE_INVENTORY`.
- Crear prendas del lote: `MANAGE_INVENTORY`.
- Ver proveedor: `VIEW_INVENTORY`.
- Crear proveedor: `MANAGE_CATALOGS`.
- Cerrar o cancelar lote: `MANAGE_INVENTORY`.

El boton `Ver permisos` usa el patron reusable existente. Los codigos tecnicos siguen dependiendo de `EXPO_PUBLIC_ENABLE_PERMISSION_DIAGNOSTICS` y del perfil autorizado.

## Backend

No se toco backend. El endpoint actual de prendas por sucursal permite resolver el listado filtrando por `batchId`.

## Pendientes

- Agregar endpoint read-only dedicado de prendas por lote si el volumen de inventario por sucursal crece mucho.
- Implementar edicion formal de datos base del lote si negocio la requiere.
- Enriquecer proveedor con contacto/factura cuando el modelo lo exponga.

## Validaciones

- `npx tsc --noEmit`: OK durante implementacion.
- Validaciones finales pendientes al cierre de la fase: `npm run lint`, `npx tsc --noEmit`, `git --no-pager diff --check`.
