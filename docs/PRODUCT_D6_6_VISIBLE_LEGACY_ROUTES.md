# PRODUCT-D6.6 - Migracion de rutas operativas visibles restantes

Fecha: 2026-06-06

## Objetivo

Migrar rutas legacy visibles y operativas a `AppShellPage` sin tocar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, permisos ni reglas de negocio.

## Inventario revisado

Se tomo como base el inventario de PRODUCT-D6.5:

- Rutas top-level auditadas por D6.5: 68
- Rutas legacy top-level antes de D6.5: 46
- Rutas migradas en D6.5: 2
- Rutas legacy top-level restantes despues de D6.5: 44

En D6.6 se revalido el grupo visible/operativo con `rg` sobre las rutas priorizadas y se confirmo que las rutas migradas en esta fase ya no usan `AppScreen`, `AppBackButton` ni `Menu principal`.

## Rutas migradas

| Ruta | Archivo | Active route | Cambio aplicado |
| --- | --- | --- | --- |
| `/customers` | `app/customers.tsx` | `customers` | Estado de carga migrado a `AppShellPage`; vista principal ya usaba `AppShell` |
| `/customers-create` | `app/customers-create.tsx` | `customers` | `AppScreen` y `AppBackButton` reemplazados por `AppShellPage` y accion contextual |
| `/customers/[id]` | `app/customers/[id].tsx` | `customers` | Detalle/edicion de cliente migrado a `AppShellPage` |
| `/customer-addresses-create` | `app/customer-addresses-create.tsx` | `customers` | Alta de direccion migrada a `AppShellPage` |
| `/customer-addresses/[id]` | `app/customer-addresses/[id].tsx` | `customers` | Edicion de direccion migrada como ruta relacionada visible |
| `/reservations` | `app/reservations.tsx` | `reservations` | Estado de carga migrado a `AppShellPage`; vista principal ya usaba `AppShell` |
| `/users` | `app/users.tsx` | `users` | Estado de carga migrado a `AppShellPage`; vista principal ya usaba `AppShell` |
| `/items/[id]` | `app/items/[id].tsx` | `items` | Detalle de prenda migrado a `AppShellPage` |
| `/batch-form` | `app/batch-form.tsx` | `batches` | Alta de lote migrada a `AppShellPage` |
| `/batch-detail` | `app/batch-detail.tsx` | `batches` | Detalle de lote migrado a `AppShellPage` |
| `/customer-orders` | `app/customer-orders.tsx` | `customers` | Pedidos por cliente migrados a `AppShellPage` |
| `/customer-order-detail` | `app/customer-order-detail.tsx` | `customers` | Detalle de pedido migrado a `AppShellPage` |
| `/customer-packages` | `app/customer-packages.tsx` | `customers` | Paquetes por cliente migrados a `AppShellPage` |
| `/customer-package-detail` | `app/customer-package-detail.tsx` | `customers` | Detalle de paquete migrado a `AppShellPage` |

## Patrones legacy removidos

- `AppScreen` en las rutas migradas.
- `AppBackButton` como barra superior legacy en las rutas migradas.
- Navegacion duplicada tipo `Menu principal` en las rutas migradas.
- Estados de carga sin sidebar en `customers`, `reservations` y `users`.

## Rutas no migradas en esta fase

| Ruta | Motivo |
| --- | --- |
| `/reservation-detail` | Ya usa `AppShell` y mantiene un `AppBackButton` contextual sin `Menu principal`; se deja para una limpieza menor posterior para reducir riesgo en pagos/permisos del detalle |
| `login`, `access-denied`, `change-password`, `modal` | Auth/especiales excluidas por alcance |
| `cash-*`, `payments` | Caja/pagos excluidos por alcance |
| `shipments`, `returns`, `refunds`, `transfers`, `consignments` y detalles/forms | Dominios amplios sugeridos para D6.7/D6.8 |
| `catalog*`, `branches*`, `channels`, `incidents`, `system-logs` | Catalogos/administracion extendida y observabilidad requieren fase propia |

## Estado posterior de auditoria

- Rutas top-level auditadas: 68
- Rutas legacy top-level despues de D6.6: 33
- Rutas TSX totales auditadas recursivamente: 73
- Rutas legacy TSX recursivas despues de D6.6: 34

## i18n

No se agregaron claves nuevas en esta fase. La migracion se concentro en layout/AppShell y mantuvo el copy funcional existente para evitar cambios de comportamiento en flujos amplios. Queda pendiente una fase de i18n profundo por dominio para textos internos de clientes, pedidos, paquetes y lotes.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/customers`, `/customers-create` y `/customers/<id valido>`.
3. Abrir `/reservations` y `/reservation-detail?id=<id valido>`.
4. Abrir `/users`.
5. Abrir `/items/<id valido>`.
6. Abrir `/batch-form` y `/batch-detail?id=<id valido>`.
7. Abrir `/customer-orders`, `/customer-order-detail?id=<id valido>`, `/customer-packages` y `/customer-package-detail?id=<id valido>`.
8. Confirmar AppShell/sidebar/drawer, active state correcto y ausencia de `Menu principal` legacy en las rutas migradas.
9. Validar light/dark, presets visuales y responsive desktop/tablet/mobile.

## Riesgos pendientes

- Algunas rutas migradas conservan textos hardcodeados heredados dentro del contenido funcional; se documenta para D6.7 de i18n por dominio.
- `reservation-detail` conserva un boton contextual de regreso ya dentro de AppShell.
- Las rutas de pagos/caja y dominios operativos amplios siguen fuera de alcance.

## GO/NO-GO

GO tecnico condicionado a validaciones automaticas completas y a corrida visual manual de las rutas migradas. GO visual final depende de validar que los flujos de formularios/detalles mantengan navegacion y acciones correctas.
