# PRODUCT-B3 - Reservation Detail Template QA Report

## Contexto

- Rama: `feature/product-b3-reservation-detail-template`
- Commit base visible: `90f415d Merge branch 'feature/product-b-internal-ui-kit-foundation' into develop`
- Fecha: 2026-06-03 14:07

## Alcance

Migracion visual controlada de `app/reservation-detail.tsx` al UI Kit interno PRODUCT-B.

Ajuste puntual posterior: LIVE marca la prenda al aire como reservada/apartada despues de crear una reserva y bloquea doble reserva de la misma prenda.

Ajuste final antes de cierre: cuando `RESERVAR AHORA` queda bloqueado por prenda ya reservada, LIVE muestra advertencia visible y actualiza el siguiente paso para evitar sensacion de boton muerto.

## Archivos revisados

- `app/live.tsx`
- `app/reservation-detail.tsx`
- `components/templates/DetailTemplate.tsx`
- `components/ui/EntitySummaryCard.tsx`
- `components/ui/RestrictedSection.tsx`
- `services/apiError.ts`
- `services/accessControl.ts`
- `services/customerService.ts`
- `services/itemService.ts`

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

## Cambios aplicados

- `reservation-detail` ahora usa `AppShell`.
- Se aplico `DetailTemplate` como estructura principal.
- Se agrupo la informacion en cards: resumen, cliente, prenda, LIVE/canal, seguimiento operativo, caja y pagos.
- Se mantuvo `RestrictedSection` para falta de `VIEW_PAYMENTS`.
- Se mantuvo el manejo correcto de 403 vs 404.
- Se mantuvo la regla de no llamar pagos si el permiso ya se conoce como ausente.
- Se mantuvieron acciones existentes: volver, menu principal, volver a LIVE, caja, cobrar si hay permiso, cancelar apartado.
- LIVE ahora deriva si el `activeItem` tiene una reserva activa usando reservas reales cargadas.
- Despues de reservar, el `activeItem` se marca localmente como `RESERVED`.
- La tarjeta `PRENDA AL AIRE AHORA` cambia a estado visual reservado y muestra mensaje operativo para cambiar o sacar del aire.
- `RESERVAR AHORA` se bloquea para la misma prenda reservada y la validacion evita crear duplicados.
- Se agregaron textos ES/EN para estado reservado, bloqueo y siguiente paso.
- Se agrego advertencia visible junto al boton bloqueado: la prenda ya tiene reserva activa y debe cambiarse o sacarse del aire.
- El siguiente paso ahora indica: `Cambia o saca la prenda del aire para continuar.`

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK, solo warning CRLF.

## Validaciones no ejecutadas

- QA visual manual con navegador y usuarios QA: no ejecutada en esta pasada; queda pendiente para validacion humana.

## Warnings

- Lint reporta warnings preexistentes en varias pantallas.
- `app/reservation-detail.tsx` conserva warning de BOM detectado por lint.
- Git reporta conversion futura LF/CRLF en `app/reservation-detail.tsx`.

## Validacion funcional esperada

Con `qa.admin@local.test`:
- Abrir reserva existente.
- Ver detalle con cards ordenadas.
- Confirmar cliente, prenda, live, estado y precio.
- Confirmar que volver y menu principal funcionan.
- Desde LIVE, reservar la prenda al aire y confirmar que la tarjeta queda como Reservada/Apartada.
- Intentar reservar la misma prenda sin cambiarla y confirmar que no crea duplicado.
- Confirmar que al quedar bloqueado `RESERVAR AHORA` se ve el mensaje claro junto al boton.
- Cambiar prenda al aire y confirmar que el flujo vuelve a permitir reserva si la nueva prenda esta disponible.

Con usuario sin `VIEW_PAYMENTS`:
- Confirmar seccion de pagos restringida.
- Confirmar que no aparece `Apartado no encontrado` si la reserva existe.
- Confirmar que no hay rafaga de llamadas a `/api/payments/reservation/{id}`.

## GO/NO-GO

GO tecnico para PRODUCT-B3.

GO visual condicionado a validar manualmente desktop/tablet/mobile y permisos de pagos con usuarios QA.
