# ITEM-DETAIL-UX-A - Detalle de prenda compacto

Fecha: 2026-06-22

## Problema detectado

`/items/[id]` funcionaba como ficha de inventario, pero se leia como una pantalla lineal. Cuando se abria desde un paquete no quedaba suficientemente claro el contexto, el regreso al paquete ni que acciones estaban disponibles por permisos.

## Nueva estructura visual

La pantalla queda organizada como ficha operativa:

1. Cabecera compacta con codigo, estado y boton `Ver permisos`.
2. Accion de regreso contextual: `Volver al paquete` cuando existe `returnTo`.
3. Resumen superior con estado, precio, sucursal, ubicacion, lote y paquete.
4. Columna principal con datos editables de clasificacion, precio, ubicacion y comentarios.
5. Bloque de relacion operativa con paquete, cliente, estado de pago y saldo cuando el contexto lo permite.
6. Columna lateral con origen/lote/proveedor y acciones disponibles.

En escritorio usa dos columnas. En tablet y movil se apila en una sola columna.

## Manejo de returnTo

Si la ruta llega como:

`/items/6?returnTo=/customer-package-detail?id=1`

la pantalla:

- detecta que el contexto es un paquete;
- muestra `Volver al paquete`;
- conserva la ruta exacta recibida en `returnTo`;
- vuelve a `/customer-package-detail?id=1` sin perder query params.

Si no existe `returnTo`, el regreso usa `/items`.

## Datos mostrados

- Codigo de prenda.
- Estado en lenguaje de negocio.
- Precio sugerido.
- Tipo de prenda, marca y talla.
- Sucursal.
- Ubicacion.
- Lote.
- Proveedor si el lote lo expone.
- Estado de lote y fecha de recepcion si estan disponibles.
- Paquete relacionado si la pantalla viene desde detalle de paquete.
- Cliente, estado de pago y saldo del paquete si el usuario puede cargar ese contexto.

No se inventan datos de proveedor, paquete o historial si el backend no los entrega.

## Acciones disponibles

- `Volver al paquete` o `Volver`.
- `Guardar cambios` si la prenda esta disponible y el usuario tiene `MANAGE_INVENTORY`.
- `Ver etiqueta QR`.
- `Ver paquete` si hay contexto y permiso de paquetes.
- `Ver lote` si la prenda tiene lote asignado.

Las acciones que no aplican quedan deshabilitadas con razon visible.

## Permisos considerados

Se agrego `itemDetail` en `services/screenPermissions.ts`.

Acciones declaradas:

- Ver prenda: `VIEW_INVENTORY`.
- Editar prenda: `MANAGE_INVENTORY`.
- Cambiar ubicacion: `MANAGE_INVENTORY`.
- Ver lote: `VIEW_INVENTORY`.
- Ver paquete: `CREATE_CLOSE_CUSTOMER_PACKAGE`.
- Ver apartado: `DO_DOOR_RESERVATION`.

El backend sigue siendo la autoridad final para editar prendas.

## Validaciones realizadas

- `npx.cmd eslint app/items/[id].tsx services/screenPermissions.ts`
- `npx.cmd tsc --noEmit`

Validaciones finales de fase:

- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Fuera de alcance

- No se agrego endpoint nuevo para historial de movimientos de prenda.
- No se implemento carga o ampliacion de imagenes.
- No se cambiaron reglas de negocio de inventario, paquetes o apartados.
- No se cambio backend.
