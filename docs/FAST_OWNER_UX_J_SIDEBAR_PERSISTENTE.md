# FAST-OWNER-UX-J - Sidebar persistente del Panel Owner

## Resumen ejecutivo

Se corrigio el comportamiento del menu lateral del Panel Owner AppModa para que no regrese al inicio cuando el Platform Owner selecciona secciones ubicadas en la parte baja, como `Tarifas por consumo`, `Uso del cliente` o `Auditoria global`.

La correccion es frontend-only y no toca backend.

## Problema detectado

El sidebar del Owner usaba un `ScrollView` propio, pero no guardaba su posicion. Al navegar por query params de `/platform`, el layout podia refrescar/remontar el menu y el `ScrollView` volvia a `y = 0`.

Impacto:

- El usuario bajaba al final del menu.
- Al hacer clic en una seccion inferior, el contenido cambiaba correctamente.
- El menu lateral regresaba arriba, cerca de `Dashboard SaaS`.
- La navegacion se sentia incomoda para administrar varias secciones seguidas.

## Causa encontrada

La causa operativa fue la falta de persistencia del offset del `ScrollView` del sidebar. La navegacion de `/platform` cambia `section` y puede sincronizar `companyId`; si el sidebar se re-renderiza/remonta, no existia un mecanismo para restaurar el scroll anterior.

## Solucion aplicada

Se agrego una persistencia opcional de scroll al componente `Sidebar`.

Cambios principales:

- `Sidebar` acepta `scrollStorageKey`.
- El `ScrollView` guarda su posicion en `AsyncStorage`.
- La posicion se persiste al terminar scroll y justo antes de navegar.
- Al montar nuevamente, el sidebar restaura el offset guardado.
- `AppShell` y `AppShellPage` solo transportan la prop.
- `/platform` activa la persistencia con la llave `appmoda.owner.sidebarScrollY`.
- `clearSession()` limpia la llave al cerrar sesion.

La persistencia queda limitada al Panel Owner. El menu normal de usuarios tenant no cambia.

## Como se conserva el scroll

Llave usada:

```text
appmoda.owner.sidebarScrollY
```

Eventos usados:

- `onScroll` actualiza la posicion actual en memoria.
- `onScrollEndDrag` y `onMomentumScrollEnd` guardan la posicion.
- Al presionar una opcion de menu, se guarda la posicion antes de llamar a `onNavigate`.
- Al montar el sidebar, se restaura la posicion guardada.

## Comportamiento esperado

Flujo:

1. El Platform Owner baja hasta `Auditoria global`.
2. Hace clic.
3. El contenido cambia a auditoria.
4. El sidebar permanece cerca de esa zona.
5. `Auditoria global` queda resaltado.

Aplica tambien para:

- `Tarifas por consumo`
- `Uso del cliente`
- `Limites`
- `Modulos activos`
- `Usuarios`
- `Sucursales`

## SelectedCompanyId

No se cambio la fuente de verdad del cliente en administracion.

Se mantiene:

- `selectedCompanyId`
- query param `companyId`
- respaldo `appmoda.platform.selectedCompanyId`
- revalidacion con companias frescas
- limpieza al logout

## Actualizar solo LIVE

No se agrego `Actualizar` en Platform Owner ni en otras pantallas.

La regla sigue siendo:

```text
Actualizar solo debe aparecer en LIVE.
```

## Validaciones realizadas

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, con 52 warnings preexistentes del repositorio.
- `npx tsc --noEmit`: OK.
- Busqueda de `Actualizar`: no se agrego boton visible fuera de LIVE.

## Riesgos pendientes

- En mobile el menu se muestra como drawer; la persistencia tambien aplica si recibe la misma llave, pero el smoke visual principal debe hacerse en desktop porque ahi se observo el problema.
- Si se entra directo por URL a una seccion inferior sin scroll previo guardado, el sidebar puede iniciar arriba. El problema reportado era el salto despues de navegar desde una opcion inferior ya visible.

## Smoke visual recomendado

1. Login como `platform@appmoda.local`.
2. Entrar a `/platform?section=dashboard`.
3. Bajar en el menu hasta `Auditoria global`.
4. Clic en `Auditoria global`.
5. Confirmar que el menu no vuelve arriba.
6. Cambiar entre `Uso del cliente`, `Tarifas por consumo` y `Auditoria global`.
7. Confirmar que el item activo queda resaltado.
8. Confirmar que `Cliente en administracion` conserva el cliente seleccionado.
9. Confirmar que `Actualizar` solo aparece en LIVE.

## GO / NO-GO

GO tecnico si lint, TypeScript y `diff --check` pasan.
