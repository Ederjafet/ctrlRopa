# Correccion de clientes y prendas visibles en LIVE

Fecha: 2026-05-18

Rama observada: `develop`

## Objetivo

Corregir la experiencia de seleccion de clientes y prendas en LIVE para que el operador pueda trabajar con datos reales de la sucursal/tenant actual, manteniendo compatibilidad con Empresa A/B y sin tocar backend.

## Archivos revisados

- `app/live.tsx`
- `services/customerService.ts`
- `services/itemService.ts`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/customer/CustomerService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/item/ItemService.java`

## Endpoints involucrados

- `GET /api/customers/branch/{branchId}`
- `GET /api/items/branch/{branchId}`

## Causa raiz: clientes

La carga de datos en LIVE usaba `Promise.allSettled`. Si la consulta de clientes fallaba por token, tenant, branch, red o backend, el frontend convertia el resultado en arreglo vacio y el modal mostraba solamente `No hay clientes activos`.

Eso ocultaba la causa real: el usuario no podia distinguir entre "no existen clientes" y "no se pudieron cargar clientes".

Adicionalmente, el filtro dependia del valor de `customer.status`. Se normalizo el estatus antes de filtrar para evitar diferencias de casing o valores nulos.

## Correccion aplicada: clientes

- Se agrego estado `customerLoadIssue`.
- Si falla la carga de clientes, el modal muestra un mensaje claro de carga.
- El filtro de cliente ahora normaliza estatus y solo excluye `INACTIVE`.
- No se modifico el endpoint ni la logica tenant-aware backend.

## Causa raiz: prendas/items

El filtro de prendas disponibles usaba comparacion exacta:

```ts
item.status === 'AVAILABLE'
```

Si el backend regresaba un estatus con casing diferente, valor nulo temporal, o si el mapeo frontend no traia `status`, LIVE escondia todas las prendas aunque existieran en inventario.

Tambien ocurria el mismo problema de `Promise.allSettled`: una falla de carga se convertia en lista vacia y parecia que no habia prendas.

## Correccion aplicada: prendas/items

- Se agrego estado `itemLoadIssue`.
- Si falla la carga de prendas, el modal muestra un mensaje claro.
- El filtro de prendas normaliza el estatus.
- Si `status` no viene informado, se permite mostrar la prenda como fallback operativo para no bloquear demo/QA.
- No se modifico backend ni consultas tenant-aware.

## Validaciones esperadas runtime

1. Login con usuario QA valido.
2. Abrir Panel.
3. Abrir En vivo.
4. Confirmar `/api/tenant/current` correcto.
5. Abrir `Seleccionar cliente`.
6. Ver clientes activos de la sucursal actual.
7. Abrir busqueda/seleccion de prenda.
8. Ver prendas disponibles de la sucursal actual.
9. Confirmar que Empresa A no ve clientes/prendas Empresa B.
10. Confirmar que no hay errores 401/403/500 inesperados.

## Validaciones tecnicas realizadas

- `rg -n "Ã|Â|�" app services locales`: sin coincidencias.
- `npm run lint`: sin errores; permanecen warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: exitoso.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: exitoso.

## Riesgos pendientes

- El fallback que muestra prendas sin `status` es temporal y debe revisarse cuando todos los endpoints garanticen estatus normalizado.
- LIVE sigue dependiendo del tenant/branch activo de la sesion; si el usuario tiene una sesion vieja, puede requerir logout/login.
- Falta smoke visual runtime con backend activo para capturar evidencia de clientes y prendas reales en el modal.

## Decision

Estado: `GO tecnico` para correccion frontend acotada.

`GO runtime` queda pendiente de evidencia visual con datos QA reales.
