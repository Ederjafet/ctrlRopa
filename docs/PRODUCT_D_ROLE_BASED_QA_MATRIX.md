# PRODUCT-D - Matriz QA operativo por roles

## Objetivo

Documentar la validacion operativa por usuario QA, rol, rutas, permisos, vistas LIVE, tema claro/oscuro, presets visuales y responsive. Esta fase no cambia AUTH/RBAC ni reglas funcionales.

## Fuente de verdad

La seguridad real sigue el flujo:

```text
AUTH real -> permisos reales -> capacidades -> vista/acciones permitidas
```

Los perfiles Operador, Vendedor/Presentadora y Supervisor son vistas de experiencia derivadas de capacidades, no roles paralelos de seguridad.

## Usuarios QA base

| Usuario QA | Rol real esperado | Vista esperada | Rutas permitidas | Rutas restringidas | Acciones permitidas | Acciones bloqueadas | Tema claro/oscuro | Presets visuales | Resultado esperado | Evidencia requerida |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `qa.admin@local.test` | ADMIN o equivalente tenant admin | Home ejecutivo, LIVE operador, administracion | `/`, `/live`, `/customers`, `/reservations`, `/users`, `/system`, `/reports`, `/ui-kit`, `/appearance`, `/reservation-detail?id=<id valido>` | Ninguna principal esperada si conserva permisos admin | Navegar, operar LIVE, ver UI Kit, cambiar tema, cambiar preset local, usar editor controlado local | Solo acciones bloqueadas por estado operativo o backend no implementado | Debe poder alternar claro/oscuro | Debe poder seleccionar preset y aplicar overrides locales en `/ui-kit` | Acceso completo sin duplicidad visual ni texto invisible | Screenshot o nota por ruta, preset y tema |
| `qa.vendedor.centro@local.test` | SELLER o QA_TENANT_SELLER | Vista apoyo/presentador LIVE si tiene canal LIVE | `/`, `/live` si `canViewLive`, rutas que sus permisos reales expongan | `/users`, `/system`, `/reports`, `/ui-kit` salvo permisos/admin | Ver apoyo LIVE, consultar informacion permitida, navegar rutas permitidas | No debe administrar, operar como admin, editar UI Kit ni ver acciones no permitidas | Debe conservar legibilidad claro/oscuro | No debe usar editor visual si UI Kit esta restringido | No escala privilegios; LIVE no muestra consola admin | Evidencia de sidebar y vista LIVE |
| `qa.supervisor.centro@local.test` | SUPERVISOR | Vista supervision LIVE | `/`, `/live`, reportes/dashboard si permisos reales lo permiten | UI Kit y administracion si no es admin | Ver monitoreo, indicadores y eventos segun capacidades | No debe caer en vendedor, no debe operar si falta capacidad | Debe conservar legibilidad claro/oscuro | No debe usar editor visual si UI Kit esta restringido | Supervisor ve dashboard/control, no vendedor por fallback | Evidencia de vista LIVE supervisor |
| `qa.sinpermisos@local.test` | NO_ACCESS o sin permisos efectivos | Acceso restringido | Login y pantalla bloqueada/acceso restringido | Navegacion util y rutas operativas | Cerrar sesion si llega al shell | Operar LIVE, ver rutas protegidas, usar UI Kit | Mensajes legibles en claro/oscuro | No debe ver selector/editor visual | Bloqueado sin navegacion util | Evidencia de bloqueo y ausencia de acciones |

## Rutas principales

| Ruta | Existe | Usuarios que deben verla | Usuarios que no deben verla | Comportamiento esperado | Riesgo | Evidencia manual esperada |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Si, `app/index.tsx` | Usuarios autenticados con acceso minimo | Sin sesion | Dashboard/resumen con AppShell, tema/preset aplicado | Datos vacios o permisos limitados deben verse claros | Screenshot light/dark |
| `/live` | Si, `app/live.tsx` | Admin, vendedor/supervisor con capacidades LIVE | NO_ACCESS o sin canal/permisos LIVE | Vista por capacidad: operador, soporte o supervisor | Caer en vista incorrecta o mostrar acciones no permitidas | Evidencia por usuario QA |
| `/ui-kit` | Si, `app/ui-kit.tsx` | Admin | Vendedor, supervisor no admin, sin permisos | Catalogo UI, presets y editor controlado | Exponer editor visual a no admin | Screenshot admin y bloqueo no admin |
| `/customers` | Si, `app/customers.tsx` | Usuarios con `VIEW_CUSTOMERS` o admin | Usuarios sin permiso | Listado premium, sin datos fake | Navegacion visible sin permiso | Evidencia sidebar/listado |
| `/reservations` | Si, `app/reservations.tsx` | Usuarios con reserva puerta o LIVE, admin | Usuarios sin permiso | Lista de reservas, estados consistentes | Acciones visibles sin capacidad | Evidencia filtros/lista |
| `/users` | Si, `app/users.tsx` | Admin o `MANAGE_USERS` | Vendedor/supervisor sin permiso, NO_ACCESS | Administracion de usuarios visual premium | Exponer usuarios sin permiso | Evidencia admin y bloqueo |
| `/system` | Si, `app/system.tsx` | Admin o permisos sistema | Usuarios sin permisos sistema | Hub de sistema | Exponer configuracion delicada | Evidencia admin/bloqueo |
| `/reports` | Si, `app/reports.tsx` | Admin o `VIEW_REPORTS` | Usuarios sin reportes | Hub de reportes visual | Reportes visibles sin permiso | Evidencia admin/supervisor si aplica |
| `/appearance` | Si, `app/appearance.tsx` | Admin desde navegacion | No admin | Configuracion visual legacy/appearance si aplica | Duplicidad con editor `/ui-kit` | Validar que no rompe tema |
| `/reservation-detail?id=<id valido>` | Si, `app/reservation-detail.tsx` | Usuarios con acceso a reserva/detalle | Sin permiso o id no valido | DetailTemplate, 403 vs 404 correcto, pagos restringidos si falta permiso | Mostrar 404 cuando es 403 o pagos sin permiso | Evidencia desde reserva real |

## Capacidades LIVE esperadas

| Vista | Condicion de entrada | Acciones esperadas | Acciones bloqueadas |
| --- | --- | --- | --- |
| Operador | `canOperateLive` y no vendedor/supervisor | Preparar, poner al aire, reservar, marcar pendiente/vendido operativo segun capacidades | Doble reserva, acciones sin permiso, pagos sin `VIEW_PAYMENTS` |
| Vendedor/Presentador | `canViewLive` sin capacidad admin/supervisor | Ver prenda al aire y apoyo | Consola operador, dashboard supervisor, acciones administrativas |
| Supervisor | rol `SUPERVISOR` o dashboard/reportes segun resolver | Ver monitoreo/control | No debe caer en vendedor por fallback |
| NO_ACCESS | sin `canViewLive` o sin permisos efectivos | Acceso restringido | Toda operacion LIVE |

## Presets y tema

Validar para admin:

- `retailPremium`;
- `darkConsole`;
- `blueCorporate`;
- `boutique`;
- `classicErp`;
- overrides locales PRODUCT-C2;
- restaurar plantilla.

Validar en light/dark que no haya:

- texto invisible;
- botones sin jerarquia;
- prenda reservada ambar dominante;
- usuario duplicado entre TopBar y Sidebar.
