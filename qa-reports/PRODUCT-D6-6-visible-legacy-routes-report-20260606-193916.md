# PRODUCT-D6.6 - Migracion de rutas operativas visibles restantes

Fecha: 2026-06-06 19:39:16

## Objetivo

Migrar rutas legacy visibles y operativas restantes a `AppShellPage` sin cambiar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, permisos ni reglas de negocio.

## Alcance ejecutado

Se reviso el inventario PRODUCT-D6.5 y se priorizaron rutas visibles de:

- clientes;
- apartados/reservas;
- usuarios;
- inventario/lotes;
- pedidos de cliente;
- paquetes de cliente.

## Rutas migradas

| Ruta | Archivo | Resultado |
| --- | --- | --- |
| `/customers` | `app/customers.tsx` | Estado de carga bajo AppShellPage |
| `/customers-create` | `app/customers-create.tsx` | Migrada a AppShellPage |
| `/customers/[id]` | `app/customers/[id].tsx` | Migrada a AppShellPage |
| `/customer-addresses-create` | `app/customer-addresses-create.tsx` | Migrada a AppShellPage |
| `/customer-addresses/[id]` | `app/customer-addresses/[id].tsx` | Migrada a AppShellPage |
| `/reservations` | `app/reservations.tsx` | Estado de carga bajo AppShellPage |
| `/users` | `app/users.tsx` | Estado de carga bajo AppShellPage |
| `/items/[id]` | `app/items/[id].tsx` | Migrada a AppShellPage |
| `/batch-form` | `app/batch-form.tsx` | Migrada a AppShellPage |
| `/batch-detail` | `app/batch-detail.tsx` | Migrada a AppShellPage |
| `/customer-orders` | `app/customer-orders.tsx` | Migrada a AppShellPage |
| `/customer-order-detail` | `app/customer-order-detail.tsx` | Migrada a AppShellPage |
| `/customer-packages` | `app/customer-packages.tsx` | Migrada a AppShellPage |
| `/customer-package-detail` | `app/customer-package-detail.tsx` | Migrada a AppShellPage |

## Rutas no migradas

- `/reservation-detail`: ya usa `AppShell`; conserva un boton contextual de regreso dentro del shell sin `Menu principal`. Se deja para limpieza menor posterior por riesgo de tocar pagos/permisos.
- Auth/especiales: `login`, `access-denied`, `change-password`, `modal`.
- Caja/pagos: `cash-*`, `payments`.
- Dominios amplios: envios, devoluciones, reembolsos, transferencias, consignaciones, catalogos, sucursales, canales, incidencias y observabilidad.

## Patrones legacy removidos

- `AppScreen` en rutas migradas.
- `AppBackButton` en rutas migradas.
- Navegacion duplicada tipo `Menu principal` en rutas migradas.
- Estados de carga sin AppShell en rutas principales de clientes, apartados y usuarios.

## ActiveRoute

- Clientes, direcciones, pedidos y paquetes: `customers`.
- Apartados/reservas: `reservations`.
- Usuarios: `users`.
- Detalle de prenda: `items`.
- Lotes: `batches`.

## i18n

No se agregaron claves nuevas. La fase se enfoco en migracion visual segura; los textos internos heredados de rutas amplias se mantienen y quedan como pendiente de i18n profundo por dominio.

## Validaciones tecnicas

Resultado final:

- `npm.cmd run lint`: OK, 0 errores, 53 warnings heredados/estructurales.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK, 73 rutas exportadas.
- `./mvnw.cmd test`: OK, 73 tests, 0 fallas.
- `./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK.

## Hallazgos

- El conteo de rutas legacy top-level baja a 33 despues de D6.6.
- El conteo recursivo total queda en 34 rutas TSX con patron legacy, incluyendo rutas excluidas por alcance.
- Persisten warnings historicos de lint en hooks/BOM/tipos, sin errores.

## Riesgos

- Requiere corrida manual con IDs validos para detalle de cliente, detalle de prenda, lote, pedido y paquete.
- Los textos hardcodeados internos de flujos amplios pueden requerir PRODUCT-D6.7 de i18n por dominio.
- Caja/pagos quedan fuera de alcance.

## GO/NO-GO

GO tecnico. GO visual pendiente de corrida manual en navegador/AnyDesk.
