# PRODUCT-B3 - Reservation Detail Template

## Objetivo

Aplicar el UI Kit interno de PRODUCT-B a una pantalla funcional segura: `app/reservation-detail.tsx`.

La meta de esta fase es validar `AppShell` y `DetailTemplate` en una pantalla real de detalle de apartado, sin cambiar backend, contratos de API, AUTH/RBAC, pagos reales, caja, reportes, billing ni IA. El ajuste posterior sobre LIVE-Z5 fue puntual y limitado al estado visual/funcional de la prenda al aire ya reservada.

## Ajuste puntual 2026-06-04

Antes de cerrar PRODUCT-B3 se aplico un ajuste funcional/UX en LIVE para evitar doble reserva visual de la prenda al aire:

- Cuando se crea una reserva sobre la prenda al aire, la prenda cambia localmente a estado `RESERVED`.
- La tarjeta `PRENDA AL AIRE AHORA` deja de verse como disponible y pasa a estilo ambar/reservado.
- Se mantiene el chip `Al aire`, pero se agrega estado `Reservada`.
- Se muestra el mensaje operativo: la prenda ya fue reservada y debe cambiarse o sacarse del aire para continuar.
- `RESERVAR AHORA` queda bloqueado para esa misma prenda mientras exista una reserva activa.
- Cuando `RESERVAR AHORA` esta bloqueado por prenda ya reservada, se muestra una advertencia visible junto al boton para que no parezca una accion muerta.
- El siguiente paso cambia a: `Cambia o saca la prenda del aire para continuar.`
- Antes de crear reserva, LIVE valida si el `activeItem` ya tiene una reserva activa y evita duplicados.
- La regla usa reservas reales cargadas en `branchReservations` y `recentReservations`; no se agrego backend ni endpoint nuevo.

## Alcance aplicado

- `reservation-detail` ahora usa `AppShell` como layout principal.
- La pantalla usa `DetailTemplate` para separar header, informacion primaria, informacion secundaria y acciones.
- La informacion se agrupo en secciones:
  - Resumen del apartado.
  - Cliente.
  - Prenda.
  - LIVE / canal.
  - Seguimiento operativo.
  - Caja.
  - Pagos o acceso restringido.
- Se mantuvieron `RestrictedSection`, `normalizeApiError`, `isNotFoundError` y la regla de no confundir 403 con 404.
- Se mantuvo la proteccion de pagos: si el usuario no tiene `VIEW_PAYMENTS`, no se consulta `/api/payments/reservation/{id}` y se muestra acceso restringido.
- Se mantuvieron las acciones existentes de caja, cancelar apartado, volver y navegar al menu principal.

## Componentes PRODUCT-B usados

- `components/layout/AppShell.tsx`
- `components/templates/DetailTemplate.tsx`
- `components/ui/EntitySummaryCard.tsx`
- `components/ui/SectionHeader.tsx`
- `components/ui/StatusBadge.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/RestrictedSection.tsx`

## Comportamiento visual

Desktop:
- La pantalla entra dentro del shell administrativo.
- `DetailTemplate` distribuye la informacion en columnas responsivas.
- Las cards reducen el espacio en blanco y mejoran jerarquia.

Tablet/mobile:
- El shell conserva su comportamiento responsive.
- Las columnas del detalle pueden apilarse por ancho disponible.
- No se agrego navegacion nueva ni se migro LIVE.

## Permisos y pagos

PRODUCT-B3 no modifica permisos ni backend.

Reglas conservadas:
- `404` del apartado principal muestra estado de no encontrado.
- `403` en pagos no tumba toda la pantalla.
- Sin `VIEW_PAYMENTS`, la seccion de pagos muestra `RestrictedSection`.
- Sin `VIEW_PAYMENTS`, no hay rafaga de llamadas a pagos.
- Si el usuario tiene `VIEW_PAYMENTS`, se mantiene la carga de pagos existente.

## Archivos modificados

- `app/reservation-detail.tsx`
- `app/live.tsx`
- `locales/es/common.json`
- `locales/en/common.json`

## Archivos creados

- `docs/PRODUCT_B3_RESERVATION_DETAIL_TEMPLATE.md`
- `qa-reports/PRODUCT-B3-reservation-detail-template-report-20260603-140748.md`
- `git-diffs/20260603-PRODUCT-B3-reservation-detail-template.diff`
- `git-diffs/20260603-PRODUCT-B3-reservation-detail-template-stat.txt`

## Pantallas no tocadas

- Pantallas de pagos.
- Pantallas de caja.
- Reportes.
- AUTH/RBAC.
- Backend.

## Validaciones

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK, solo warning CRLF.

## Riesgos

- La pantalla ya usa layout nuevo, por lo que requiere QA visual en desktop/tablet/mobile.
- Algunos datos de cliente/prenda/live dependen de campos disponibles actualmente; si no existen, se muestran fallbacks seguros.
- La seccion de pagos mantiene comportamiento existente y no cambia logica financiera.
- Si una reserva se cancela operativamente, el criterio para volver a permitir reserva de esa misma prenda queda sujeto a validacion de estado real y QA operacional.

## GO/NO-GO

GO tecnico:
- `reservation-detail` ya valida el uso de `DetailTemplate` en una pantalla real sin tocar backend ni LIVE-Z5.
- LIVE evita que la prenda al aire reservada siga pareciendo disponible o reservable.
- LIVE muestra feedback claro cuando el boton de reserva queda bloqueado por prenda ya apartada.

GO visual condicionado:
- Requiere validacion manual con reserva existente y usuario sin `VIEW_PAYMENTS`.

## Siguiente fase recomendada

PRODUCT-B4:
- Aplicar `DetailTemplate` a otra pantalla de detalle segura o evolucionar `reservation-detail` con datos reales adicionales de cliente/prenda/live si ya existen servicios disponibles.
- Mantener LIVE-Z5 fuera de migracion hasta completar al menos dos pantallas funcionales con templates.
