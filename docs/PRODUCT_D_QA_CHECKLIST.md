# PRODUCT-D - Checklist QA operativo por roles

## A. Login / logout

- [ ] Iniciar sesion con `qa.admin@local.test`.
- [ ] Iniciar sesion con `qa.vendedor.centro@local.test`.
- [ ] Iniciar sesion con `qa.supervisor.centro@local.test`.
- [ ] Iniciar sesion con `qa.sinpermisos@local.test`.
- [ ] Confirmar logout visible en Sidebar/drawer.
- [ ] Confirmar que logout limpia sesion y vuelve a login.
- [ ] Confirmar que backend caido muestra mensaje de conexion y no "sesion iniciada en otro equipo".
- [ ] Confirmar que single session real muestra mensaje de sesion reemplazada solo cuando corresponde.

## B. Navegacion

- [ ] Desktop: Sidebar fijo visible y sin duplicidad de usuario con TopBar.
- [ ] Tablet: drawer abre/cierra, contenido no queda comprimido.
- [ ] Mobile: menu oculto por defecto, boton menu visible, overlay cierra.
- [ ] Logout accesible en drawer mobile.
- [ ] ADMIN ve Inicio, LIVE, Clientes, Reservas, Usuarios, Sistema, Reportes, Configuracion y UI Kit.
- [ ] VENDEDOR solo ve rutas permitidas por permisos reales.
- [ ] SUPERVISOR ve rutas permitidas y no cae en vista vendedor.
- [ ] SIN PERMISOS no ve navegacion util.

## C. Visual / tema

- [ ] Light mode legible en `/`, `/live`, `/ui-kit`, `/customers`, `/reservations`, `/users`, `/system`, `/reports`.
- [ ] Dark mode legible en las mismas rutas.
- [ ] No hay textos invisibles en labels, captions, inputs, helper texts o disabled.
- [ ] Presets visuales cambian la app real, no solo UI Kit.
- [ ] Editor controlado permite aplicar cambios locales y restaurar plantilla.
- [ ] Prenda reservada se ve rojo premium (`danger/dangerSoft`), no ambar dominante.
- [ ] Botones primary/secondary/neutral/danger/disabled mantienen jerarquia.
- [ ] Sidebar footer se mantiene como zona principal de usuario en desktop.

## D. LIVE

- [ ] ADMIN ve vista operador.
- [ ] ADMIN puede iniciar/operar LIVE segun capacidades reales.
- [ ] Preparar siguiente prenda no cambia precio principal.
- [ ] Prenda al aire define precio LIVE/reserva.
- [ ] Reservar prenda al aire crea reserva y la marca reservada.
- [ ] Doble reserva queda bloqueada con mensaje claro.
- [ ] Vendido operativo dice que no confirma pago.
- [ ] Solicitudes de autorizacion no simulan backend.
- [ ] VENDEDOR ve vista apoyo/presentador si tiene `canViewLive`.
- [ ] VENDEDOR no ve consola operador si no tiene capacidad.
- [ ] SUPERVISOR ve dashboard/monitoreo y no cae en vendedor.
- [ ] SIN PERMISOS queda bloqueado.
- [ ] No hay rafagas de pagos si falta `VIEW_PAYMENTS`.

## E. Pantallas principales

- [ ] `/` muestra dashboard/resumen con AppShell.
- [ ] `/customers` respeta `VIEW_CUSTOMERS`.
- [ ] `/reservations` respeta permisos y mantiene estados.
- [ ] `/users` respeta `MANAGE_USERS`/admin.
- [ ] `/system` respeta permisos sistema/admin.
- [ ] `/reports` respeta `VIEW_REPORTS`/admin.
- [ ] `/ui-kit` solo admin; muestra presets y editor controlado.
- [ ] `/reservation-detail?id=<id valido>` mantiene DetailTemplate.
- [ ] Detalle de reserva no muestra 404 cuando el problema es permiso.
- [ ] Secciones de pagos permanecen restringidas sin `VIEW_PAYMENTS`.

## F. Responsive

- [ ] Desktop 1366px o mas: sidebar fijo, contenido centrado, sin duplicidad.
- [ ] Tablet 768-1199px: drawer, cards legibles, sin overflow.
- [ ] Mobile 360-430px: contenido apilado, botones touch-friendly.
- [ ] AnyDesk/pantalla remota: sidebar no domina el contenido.
- [ ] LIVE mantiene jerarquia: preparar, prenda al aire, precio/cliente, reserva, recientes.

## G. Evidencia minima

- [ ] Screenshot o nota por usuario en `/live`.
- [ ] Screenshot o nota admin en `/ui-kit` con preset cambiado.
- [ ] Screenshot o nota admin en dark mode.
- [ ] Screenshot o nota vendedor/supervisor con rutas visibles.
- [ ] Screenshot o nota `qa.sinpermisos` bloqueado.
- [ ] Registro de validaciones tecnicas.
