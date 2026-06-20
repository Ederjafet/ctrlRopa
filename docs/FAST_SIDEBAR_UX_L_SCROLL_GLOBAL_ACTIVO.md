# FAST-SIDEBAR-UX-L - Scroll global estable y opcion activa visible

## Resumen ejecutivo

Se corrigio el comportamiento global del menu lateral para que, al cambiar de ruta, el sidebar no vuelva siempre al inicio y deje visible la opcion activa correspondiente a la pantalla actual.

El cambio aplica a:

- Platform Owner.
- Admin Cliente.
- Supervisor.
- Vendedor.
- Caja.

No se toco backend.

## Problema detectado

Aunque FAST-OWNER-UX-J estabilizo el scroll del Panel Owner y FAST-SIDEBAR-UX-K corrigio el solapamiento del footer, rutas normales como `/items-create` seguian mostrando el sidebar desde arriba despues de navegar.

Ejemplo observado:

- Ruta: `/items-create`.
- Pantalla: `Alta de prendas`.
- El menu se mostraba arriba en `Inicio` / `Operacion`.
- La opcion activa `Alta de prendas` quedaba mas abajo, fuera de vista.

## Causa real

La causa no era solo el Panel Owner.

El `Sidebar` se puede montar de nuevo al cambiar pantallas de Expo Router. Antes de esta fase:

- Solo `/platform` pasaba una llave de persistencia.
- El sidebar global tenant no persistia scroll por usuario.
- El sidebar marcaba el item activo, pero no media su posicion ni hacia scroll hacia el.
- Si la ruta activa estaba en secciones inferiores, el usuario quedaba viendo el inicio del menu.

## Solucion aplicada

Se aplico una solucion combinada:

1. Persistencia global de scroll por usuario.
2. Medicion de posiciones de items.
3. Scroll automatico al item activo cuando queda fuera de vista.

## Como se detecta la opcion activa

Se conserva la logica existente del `Sidebar`:

- `activeRoute` directo.
- `item.key`.
- `item.route`.
- `activeFor`.
- Rutas normalizadas sin `/`.

Ejemplos:

- `/items-create` usa `activeRoute="items-create"` y activa `Alta de prendas`.
- `/shipments` activa `Envios`.
- `/customer-packages` activa `Paquetes`.
- `/platform?section=usageRates` activa `Tarifas por consumo`.
- `/platform?section=audit` activa `Auditoria global`.

## Como se mantiene visible

`Sidebar` ahora:

- mide la altura visible del `ScrollView`;
- registra la posicion de cada grupo de navegacion;
- registra la posicion y altura de cada item;
- calcula si el item activo esta fuera del area visible;
- ejecuta `scrollTo` solo si hace falta;
- guarda el nuevo offset en `AsyncStorage`.

La opcion activa tiene prioridad sobre restaurar exactamente el ultimo scroll cuando quedaria fuera de vista.

## Persistencia global

`AppShell` ahora usa una llave por usuario cuando no se provee una llave especifica:

```text
appmoda.sidebar.scroll.<userId>
```

El Panel Owner conserva su llave explicita:

```text
appmoda.owner.sidebarScrollY
```

Al cerrar sesion, `clearSession()` limpia:

- `appmoda.platform.selectedCompanyId`
- `appmoda.owner.sidebarScrollY`
- `appmoda.sidebar.scroll.*`

## Rutas cubiertas

Smoke recomendado:

- `/items-create`
- `/shipments`
- `/customer-packages`
- `/reservations`
- `/live`
- `/platform?section=usageRates&companyId=2`
- `/platform?section=audit&companyId=2`

## Footer y layout

Se conserva la estructura de FAST-SIDEBAR-UX-K:

- header/logo arriba;
- navegacion central scrolleable;
- footer de usuario abajo sin tapar opciones;
- `Oscuro/Claro` y `Cerrar sesion` compactos.

## Actualizar solo LIVE

No se agrego `Actualizar` al sidebar ni a pantallas no LIVE.

## Validaciones realizadas

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, con 52 warnings preexistentes del repositorio.
- `npx tsc --noEmit`: OK.
- Busqueda de `Actualizar`: no se agrego boton visible fuera de LIVE.

## Riesgos pendientes

- El ajuste depende de mediciones `onLayout`; si una plataforma cambia timing de layout, el doble intento diferido mantiene la opcion activa visible.
- Si una pantalla no declara `activeRoute` ni tiene `activeFor` en el menu, el sidebar no tendra item activo al cual desplazarse. Debe documentarse por pantalla nueva.

## GO / NO-GO

GO tecnico si lint, TypeScript y `diff --check` pasan.
