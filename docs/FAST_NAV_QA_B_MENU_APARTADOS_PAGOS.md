# FAST-NAV-QA-B Menu operativo: apartados y pagos

## Resumen

Se ajusto el menu operativo para evitar duplicidad entre `Apartados` y `Apartado puerta`, y se habilito una entrada clara de `Pagos` para usuarios con permiso de consulta.

## Problema detectado

- `Apartado puerta` aparecia como opcion principal del menu lateral, aunque el flujo funcional debe vivir dentro de `Apartados`.
- No existia una entrada visible de `Pagos` en el sidebar operativo, pese a que pagos, abonos y saldo a favor son operaciones criticas.

## Decision aplicada

- `Apartado puerta` sale del menu lateral principal.
- `/door-reservation` se conserva como ruta interna.
- El acceso operativo queda en `Apartados -> Nuevo apartado`.
- Al entrar a `/door-reservation`, el sidebar resalta `Apartados`.
- Se agrega seccion `Finanzas` con la opcion `Pagos`.

## Nuevo apartado

La pantalla `/door-reservation` queda con titulo visible:

- `Nuevo apartado`
- `Crea un apartado de mostrador con una o varias prendas.`

La ruta sigue funcionando para compatibilidad con flujos existentes, incluyendo alta rapida de prendas y regreso desde `/items-create`.
Cuando el canal `DOOR_RESERVATION` aparece como metadata en pantallas operativas, se muestra como `Apartado mostrador` para no reintroducir el nombre de menu retirado.

## Pagos

La opcion de menu usa la ruta:

- `/payments`

La pantalla ya existe, usa `AppShellPage` y mantiene guard frontend por permiso:

- `VIEW_PAYMENTS`

Registrar pagos sigue separado del acceso de lectura y requiere:

- `REGISTER_PAYMENTS`

## Usuario sin permiso

Si el usuario no tiene `VIEW_PAYMENTS`:

- no ve la opcion `Pagos` en el menu;
- si intenta entrar directo a `/payments`, la pantalla mantiene su validacion y redirige a acceso denegado.

## Backend

No se tocaron endpoints, migraciones ni servicios backend en esta fase. Los permisos de dinero ya existen en backend y la pantalla `/payments` ya consume esos guards.

## Validaciones

Validaciones tecnicas ejecutadas al cierre:

- `git --no-pager diff --check`
- `npm run lint`
- `npx tsc --noEmit`

## Smoke QA recomendado

1. Login con usuario admin que tenga `VIEW_PAYMENTS`.
2. Confirmar que el menu muestra `Finanzas -> Pagos`.
3. Confirmar que no aparece `Apartado puerta` como item principal.
4. Entrar a `Apartados` y usar `Nuevo apartado`.
5. Confirmar que `/door-reservation` abre y resalta `Apartados`.
6. Login con usuario sin `VIEW_PAYMENTS`.
7. Confirmar que `Pagos` no aparece y `/payments` bloquea acceso directo.
8. Confirmar que `Actualizar` solo aparece en LIVE.

## Riesgos pendientes

- Hardening completo de permisos de pagos debe seguir validandose por rol real antes de instalacion productiva.
- El backend conserva el canal operativo `DOOR_RESERVATION`; esta fase solo corrige navegacion principal y UX, no elimina el canal.
