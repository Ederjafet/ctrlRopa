# PRODUCT-UX-B2 - Permisos directos legibles sin mezcla de idioma

## Problema

QA confirmo que la seccion `Permisos directos adicionales` podia mezclar etiquetas en espanol con nombres crudos en ingles devueltos por el catalogo backend.

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

## Decision UX

La UI debe usar el mapper visible de permisos como fuente de etiqueta principal:

- En espanol, mostrar etiquetas en espanol.
- En ingles, mostrar etiquetas en ingles.
- En pt-BR/fr/ja/zh/ko, usar etiqueta basica legible cuando no exista traduccion nativa completa.
- Ocultar `Codigo interno` por defecto.
- Mostrar codigos solo al abrir `Ver detalles tecnicos`.

## Cambios realizados

- `services/permissionDependencies.ts` ahora soporta etiquetas por idioma para permisos visibles.
- `app/users-form.tsx` usa el idioma activo al mostrar `Permisos directos adicionales`.
- `app/system-roles.tsx` usa el idioma activo al mostrar permisos de rol.
- `components/ui/RestrictedSection.tsx` usa el idioma activo para el permiso requerido.
- `systemRoles.showTechnicalDetails` y `systemRoles.hideTechnicalDetails` quedaron agregados a todos los locales.

## Traducciones ES agregadas/corregidas

| Codigo | Etiqueta ES |
| --- | --- |
| `APPROVE_REFUND` | Aprobar devolucion |
| `CANCEL_CONSIGNMENTS` | Cancelar consignaciones |
| `CANCEL_REFUND` | Cancelar devolucion |
| `CANCEL_TRANSFERS` | Cancelar transferencias |
| `MANAGE_BRANDING` | Administrar apariencia y marca |
| `MANAGE_CUSTOMER_PACKAGES` | Administrar paquetes de cliente |
| `PROCESS_REFUND` | Procesar devolucion |
| `RECEIVE_TRANSFERS` | Recibir transferencias |
| `REQUEST_REFUND` | Solicitar devolucion |
| `SEND_TRANSFERS` | Enviar transferencias |
| `SETTLE_CONSIGNMENTS` | Liquidar consignaciones |
| `VIEW_DEPOSIT_REPORTS` | Ver reporte de depositos |

Tambien se normalizaron alias/codigos relacionados como `EXECUTE_REFUND`, `MANAGE_CHANNELS`, `MANAGE_CASH_CUTS`, `ADMIN_ROLES`, `ADMIN_SECURITY`, `ADMIN_SHIPMENTS`, `ADMIN_TRANSFERS`, `ADMIN_USERS` y permisos LIVE futuros propuestos.

## Que no cambio

- No se modifico backend.
- No se modifico RBAC.
- No se crearon permisos reales.
- No se cambiaron roles ni asignaciones.
- No se habilitaron capacidades nuevas.

## QA requerido

1. Entrar como `qa.admin@local.test`.
2. Abrir editar/crear usuario.
3. Revisar `Permisos directos adicionales`.
4. Confirmar que en espanol no aparecen permisos mezclados en ingles.
5. Confirmar que no se ven codigos internos por defecto.
6. Abrir `Ver detalles tecnicos` y confirmar que ahi si aparece el codigo interno.
7. Cambiar a ingles y confirmar etiquetas principales en ingles.
8. Confirmar que RBAC no cambio y que solo se pueden asignar permisos existentes devueltos por backend.

## Nota i18n

pt-BR, fr, ja, zh y ko conservan textos basicos para el toggle tecnico. Las etiquetas de permisos usan fallback ingles legible si no existe mapa nativo completo. Requieren revision humana/nativa futura para una localizacion comercial perfecta.

## GO/NO-GO

GO para presentacion legible y defensa contra nombres crudos del catalogo.

NO-GO para crear permisos, modificar RBAC, tocar backend o habilitar capacidades no existentes.
