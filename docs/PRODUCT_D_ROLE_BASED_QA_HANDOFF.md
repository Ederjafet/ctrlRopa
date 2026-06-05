# PRODUCT-D - Handoff QA operativo por roles

## Proposito

PRODUCT-D deja preparada una corrida formal de QA operativo por roles para validar rutas, permisos, vistas, tema claro/oscuro, presets visuales, editor controlado y responsive.

## Alcance

Validar:

- autenticacion y logout;
- navegacion AppShell;
- rutas principales autenticadas;
- vistas LIVE por capacidades;
- tema claro/oscuro;
- presets visuales PRODUCT-C1;
- editor controlado PRODUCT-C2;
- responsive desktop/tablet/mobile;
- bloqueo de usuario sin permisos.

Fuera de alcance:

- cambios backend;
- cambios AUTH/RBAC;
- pagos/caja reales;
- reportes backend;
- billing;
- IA;
- reglas operativas LIVE nuevas.

## Usuarios QA

- `qa.admin@local.test`
- `qa.vendedor.centro@local.test`
- `qa.supervisor.centro@local.test`
- `qa.sinpermisos@local.test`

Las contrasenas no se documentan aqui para evitar duplicarlas en evidencia publica del repositorio. Usar credenciales internas QA vigentes.

## Rutas minimas

- `/`
- `/live`
- `/ui-kit`
- `/customers`
- `/reservations`
- `/users`
- `/system`
- `/reports`
- `/appearance`
- `/reservation-detail?id=<id valido>`

## Criterios de aprobacion

GO si:

- cada usuario ve solo rutas/acciones esperadas;
- LIVE resuelve la vista correcta por capacidades;
- `qa.sinpermisos` queda bloqueado;
- light/dark son legibles;
- presets y editor local no rompen pantallas;
- no hay overflow responsive grave;
- validaciones tecnicas pasan.

NO-GO si:

- usuario sin permiso accede a rutas sensibles;
- vendedor opera como admin sin capacidad real;
- supervisor cae en vista vendedor;
- UI Kit/editor quedan visibles para no admin;
- texto critico queda invisible;
- detalle de reserva confunde 403 con 404;
- pagos se consultan sin `VIEW_PAYMENTS`;
- validaciones tecnicas fallan por cambios de esta fase.

## Evidencia esperada en PRODUCT-D2

Para una corrida visual/manual real:

- capturas por rol en `/live`;
- capturas admin en `/ui-kit` con preset y editor;
- capturas light/dark;
- notas por ruta restringida;
- CSV smoke actualizado con resultado PASS/FAIL;
- hallazgos priorizados.

## Entregables de esta fase

- `docs/PRODUCT_D_ROLE_BASED_QA_MATRIX.md`
- `docs/PRODUCT_D_QA_CHECKLIST.md`
- `docs/PRODUCT_D_ROLE_BASED_QA_HANDOFF.md`
- reporte QA en `qa-reports/`
- CSV smoke en `qa-reports/`
- diff/stat en `git-diffs/`
