# RC-UX-PERM-A - Mensajes de permisos y confirmacion de prendas

Fecha: 2026-06-22

## Hallazgo

Despues de `SEC-RBAC-AUDIT-A`, el vendedor ya no podia crear prendas desde `Alta rapida de prenda` ni guardar entrando directo a `/items-create`. La proteccion backend por `MANAGE_INVENTORY` ya era correcta, pero la pantalla no explicaba con suficiente claridad por que el guardado estaba bloqueado.

Tambien se valido que el admin cliente podia crear y editar prendas, pero la confirmacion de edicion era demasiado generica.

## Correccion en `/items-create`

- La pantalla muestra un aviso visible: `No puedes crear o modificar prendas`.
- El aviso explica que falta `MANAGE_INVENTORY` y que debe solicitarse a un administrador.
- El formulario queda en modo no editable cuando falta permiso.
- El boton final cambia a `Sin permiso para guardar`.
- El submit verifica `MANAGE_INVENTORY` antes de validar campos del formulario, para que el primer mensaje sea el bloqueo real de permiso.
- Si por manipulacion o carrera el submit llega al backend, el 403 sigue mostrandose con mensaje accionable.

## Confirmacion de creacion

Cuando se crea una prenda individual se muestra:

- `Prenda creada correctamente.`

Para altas multiples se conserva el mensaje con cantidad creada.

## Confirmacion de edicion

En `app/items/[id].tsx`, al guardar cambios exitosamente se muestra:

- alerta `Inventario`;
- banda visible dentro de la pantalla: `Prenda actualizada correctamente.`

## Seguridad

- No se cambio RBAC backend.
- No se otorgo `MANAGE_INVENTORY` al vendedor.
- `ItemService` sigue siendo la autoridad final para bloquear escritura de inventario.
- `Ver permisos` sigue usando `itemsCreate` y muestra `MANAGE_INVENTORY` como permiso requerido.

## Validaciones

- `npm run lint`
- `npx tsc --noEmit`
- `git diff --check`

## Decision

GO UX/RBAC frontend: el vendedor recibe una razon clara, no puede guardar, y el admin cliente recibe confirmacion visible al crear o editar prendas.
