# PRODUCT-UX-B2 - Permisos directos legibles sin mezcla de idioma

## Problema

QA confirmó que la sección `Permisos directos adicionales` podía mezclar etiquetas en español con nombres crudos en inglés devueltos por el catálogo backend.

Ejemplos detectados:

- `Approve Refund`
- `Cancel Consignments`
- `Cancel Refund`
- `Cancel Transfers`
- `Manage Branding`
- `Manage Customer Packages`
- `Process Refund`
- `Receive Transfers`
- `Request Refund`
- `Send Transfers`
- `Settle Consignments`
- `View Deposit Reports`

## Decisión UX

La UI debe usar el mapper visible de permisos como fuente de etiqueta principal:

- En español, mostrar etiquetas en español.
- En inglés, mostrar etiquetas en inglés.
- En pt-BR/fr/ja/zh/ko, usar etiqueta básica legible cuando no exista traducción nativa completa.
- Ocultar `Código interno` por defecto.
- Mostrar códigos solo al abrir `Ver detalles técnicos`.

## Cambios realizados

- `services/permissionDependencies.ts` ahora soporta etiquetas por idioma para permisos visibles.
- `app/users-form.tsx` usa el idioma activo al mostrar `Permisos directos adicionales`.
- `app/system-roles.tsx` usa el idioma activo al mostrar permisos de rol.
- `components/ui/RestrictedSection.tsx` usa el idioma activo para el permiso requerido.
- `systemRoles.showTechnicalDetails` y `systemRoles.hideTechnicalDetails` quedaron agregados a todos los locales.

## Traducciones ES agregadas/corregidas

| Código | Etiqueta ES |
| --- | --- |
| `APPROVE_REFUND` | Aprobar devolución |
| `CANCEL_CONSIGNMENTS` | Cancelar consignaciones |
| `CANCEL_REFUND` | Cancelar devolución |
| `CANCEL_TRANSFERS` | Cancelar transferencias |
| `MANAGE_BRANDING` | Administrar apariencia y marca |
| `MANAGE_CUSTOMER_PACKAGES` | Administrar paquetes de cliente |
| `PROCESS_REFUND` | Procesar devolución |
| `RECEIVE_TRANSFERS` | Recibir transferencias |
| `REQUEST_REFUND` | Solicitar devolución |
| `SEND_TRANSFERS` | Enviar transferencias |
| `SETTLE_CONSIGNMENTS` | Liquidar consignaciones |
| `VIEW_DEPOSIT_REPORTS` | Ver reporte de depósitos |

También se normalizaron alias/códigos relacionados como `EXECUTE_REFUND`, `MANAGE_CHANNELS`, `MANAGE_CASH_CUTS`, `ADMIN_ROLES`, `ADMIN_SECURITY`, `ADMIN_SHIPMENTS`, `ADMIN_TRANSFERS`, `ADMIN_USERS` y permisos LIVE futuros propuestos.

## Qué no cambió

- No se modificó backend.
- No se modificó RBAC.
- No se crearon permisos reales.
- No se cambiaron roles ni asignaciones.
- No se habilitaron capacidades nuevas.

## QA requerido

1. Entrar como `qa.admin@local.test`.
2. Abrir editar/crear usuario.
3. Revisar `Permisos directos adicionales`.
4. Confirmar que en español no aparecen permisos mezclados en inglés.
5. Confirmar que no se ven códigos internos por defecto.
6. Abrir `Ver detalles técnicos` y confirmar que ahí sí aparece el código interno.
7. Cambiar a inglés y confirmar etiquetas principales en inglés.
8. Confirmar que RBAC no cambió y que solo se pueden asignar permisos existentes devueltos por backend.

## Nota i18n

pt-BR, fr, ja, zh y ko conservan textos básicos para el toggle técnico. Las etiquetas de permisos usan fallback inglés legible si no existe mapa nativo completo. Requieren revisión humana/nativa futura para una localización comercial perfecta.

## GO/NO-GO

GO para presentación legible y defensa contra nombres crudos del catálogo.

NO-GO para crear permisos, modificar RBAC, tocar backend o habilitar capacidades no existentes.
