# PRODUCT-D6.5 - Auditoria automatica y migracion final de pantallas legacy

Fecha: 2026-06-06

## Objetivo

Auditar automaticamente rutas `app/*.tsx`, detectar patrones legacy y migrar rutas seguras a `AppShellPage` sin cambiar backend, AUTH/RBAC funcional, pagos, caja, reportes backend, billing, IA, endpoints, reglas LIVE ni contratos API.

## Auditoria automatica

Comandos usados:

- `rg --files app -g "*.tsx"`
- `rg "AppScreen|AppBackButton|Menu principal|Menú principal|build.*Nav|navigationItems" app components -g "*.tsx" -g "*.ts"`
- conteo PowerShell de rutas top-level `app/*.tsx` con patrones legacy.

Resultado:

- Rutas top-level auditadas: 68
- Rutas con patron legacy antes de D6.5: 46
- Rutas migradas en D6.5: 2
- Rutas con patron legacy despues de D6.5: 44

## Patrones legacy encontrados

- Import o uso de `AppScreen`.
- Import o uso de `AppBackButton`.
- Texto `Menu principal`.
- Pantallas sin `AppShell` / `AppShellPage`.
- Rutas hijas con navegacion contextual antigua.

## Rutas migradas

| Ruta | Archivo | Active route | Motivo |
| --- | --- | --- | --- |
| `/system-security` | `app/system-security.tsx` | `system-security` | Observada por QA con layout legacy y ya existe en navegacion de Seguridad |
| `/system-sessions` | `app/system-sessions.tsx` | `system-sessions` | Observada por QA con layout legacy y ya existe en navegacion de Seguridad |

Cambios aplicados:

- Se reemplazo `AppScreen` por `AppShellPage`.
- Se retiro `AppBackButton` como barra superior legacy.
- Se eliminaron titulos locales duplicados.
- Se conectaron titulos, subtitulos, labels, botones y mensajes principales a i18n ES/EN.
- Se conservaron servicios, formularios, switches, validaciones, acciones y permisos.

## Rutas legacy restantes

Rutas detectadas con patrones legacy despues de D6.5:

- `access-denied.tsx`
- `batch-detail.tsx`
- `batch-form.tsx`
- `branches-form.tsx`
- `branches.tsx`
- `cash-closure-detail.tsx`
- `cash-closures.tsx`
- `catalog-form.tsx`
- `catalog-list.tsx`
- `catalogs.tsx`
- `change-password.tsx`
- `channels.tsx`
- `consignee-form.tsx`
- `consignees.tsx`
- `consignment-detail.tsx`
- `consignments.tsx`
- `customer-addresses-create.tsx`
- `customer-order-detail.tsx`
- `customer-orders.tsx`
- `customer-package-detail.tsx`
- `customer-packages.tsx`
- `customers-create.tsx`
- `customers.tsx`
- `dashboard.tsx`
- `incident-detail.tsx`
- `incidents.tsx`
- `login.tsx`
- `modal.tsx`
- `movement-history.tsx`
- `payments.tsx`
- `refund-create.tsx`
- `refund-detail.tsx`
- `refunds.tsx`
- `reservation-detail.tsx`
- `reservations.tsx`
- `return-create.tsx`
- `return-detail.tsx`
- `returns.tsx`
- `shipment-detail.tsx`
- `shipments.tsx`
- `system-logs.tsx`
- `transfer-detail.tsx`
- `transfers.tsx`
- `users.tsx`

## Rutas no migradas y motivo

| Grupo | Rutas | Motivo |
| --- | --- | --- |
| Auth / sistema base | `login`, `access-denied`, `change-password`, `modal`, `(tabs)` | Pantallas especiales; requieren criterio UX propio |
| Caja / pagos | `cash-*`, `payments` | Caja y pagos estan explicitamente fuera de alcance |
| Rutas hijas de inventario | `batch-form`, `batch-detail`, `items/[id]` | Requieren fase dedicada para navegacion contextual |
| Clientes / paquetes / pedidos | `customers-create`, `customers/[id]`, `customer-*` | Dominio funcional amplio; no migrar sin QA de flujo |
| Consignaciones / envios / devoluciones / reembolsos / transferencias | `consignments`, `shipments`, `returns`, `refunds`, `transfers` y detalles/forms | Flujos operativos adicionales no incluidos en D6.5 |
| Catalogos / sucursales / canales | `catalog*`, `branches*`, `channels` | Admin catalogos legacy; requiere fase de catalogos |
| Observabilidad no navegada | `system-logs` | No esta en menu principal; documentada para fase posterior |
| Pantallas ya AppShell con loading legacy | `customers`, `reservations`, `users`, `reservation-detail` | Usan AppShell en vista principal; los patrones restantes estan en estados de carga o navegacion contextual |

## i18n agregado

Se agregaron claves:

- `securitySettings.*`
- `securitySessions.*`

No se traducen codigos tecnicos, datos retornados por backend ni identificadores internos.

## Validacion manual esperada

1. Entrar con `qa.admin@local.test`.
2. Abrir `/system-security`.
3. Confirmar AppShell/sidebar/drawer y active state `Seguridad dev`.
4. Confirmar que no aparece `Menu principal` ni barra superior `Volver`.
5. Cambiar Espanol/English y confirmar textos principales.
6. Validar light/dark y presets.
7. Abrir `/system-sessions`.
8. Confirmar AppShell/sidebar/drawer y active state `Sesiones y bloqueos`.
9. Confirmar acciones de recarga/cierre/desbloqueo sin cambios funcionales.
10. Validar mobile/drawer.

## Riesgos pendientes

- La auditoria confirma que aun existen rutas legacy fuera del menu principal o fuera de este alcance.
- Caja/pagos requieren una fase separada por sensibilidad funcional.
- Flujos de envios, devoluciones, reembolsos, transferencias, consignaciones y catalogos requieren priorizacion de negocio antes de migracion visual.

## GO/NO-GO

GO tecnico condicionado a validaciones automaticas completas y a corrida visual manual de `/system-security` y `/system-sessions`.
