# FAST-SIDEBAR-UX-K - Layout global del sidebar

## Resumen ejecutivo

Se corrigio la estructura global del menu lateral para evitar que el bloque inferior del usuario tape opciones de navegacion. El ajuste aplica al sidebar compartido por Platform Owner, Admin Cliente y roles operativos.

No se toco backend.

## Problema detectado

En usuarios tenant/admin, el bloque inferior con datos del usuario, `Oscuro` y `Cerrar sesion` podia verse encima de opciones del menu lateral. Esto hacia que opciones inferiores quedaran parcialmente ocultas o visualmente mezcladas con el footer.

## Causa encontrada

El sidebar tenia un `ScrollView` para la navegacion, pero el contenedor padre no cerraba de forma suficientemente estricta el alto y el overflow del layout en web. Con menus largos, el area central podia crecer o quedar mal acotada, y el panel de sesion terminaba invadiendo visualmente el area de navegacion.

## Estructura final

El sidebar queda organizado como columna estable:

1. Header fijo arriba:
   - Logo `Ctrl Ropa`.
   - Texto de ayuda de operacion/control.

2. Navegacion central:
   - `ScrollView` con `flex: 1`.
   - `minHeight: 0`.
   - `paddingBottom` suficiente.
   - Persistencia de scroll Owner conservada si recibe `scrollStorageKey`.

3. Footer fijo inferior:
   - Rol.
   - Nombre.
   - Correo.
   - Botones compactos `Oscuro/Claro` y `Cerrar sesion`.

## Como se evita el solapamiento

- `AppShell.fixedSidebar` y el contenedor mobile usan `overflow: hidden`.
- `Sidebar` usa `height: 100%`, `maxHeight: 100%`, `minHeight: 0` y `overflow: hidden`.
- La navegacion central puede encogerse y scrollear.
- El footer usa `flexShrink: 0`, por lo que no flota sobre el menu.
- El footer ya no depende del scroll de navegacion.

## Footer de usuario

El footer se compacto:

- Los botones se agruparon en una fila.
- Iconos pasan a 16 px.
- Altura minima baja a 36 px.
- Textos usan `numberOfLines={1}` para evitar crecimiento vertical inesperado.

## Oscuro / Claro

El control sigue en el sidebar global.

No se duplico en el cuerpo de pantallas.

## Platform Owner

Se conserva:

- `Cliente en administracion`.
- `selectedCompanyId`.
- Rutas `/platform?section=...&companyId=...`.
- Persistencia de scroll del sidebar Owner con `appmoda.owner.sidebarScrollY`.

## Admin Cliente y roles operativos

El mismo layout protege el menu tenant:

- El footer no debe tapar `En vivo`, `Venta puerta`, `Apartados`, `Paquetes`, `Envios` ni opciones inferiores.
- El menu central queda scrolleable si el alto disponible es reducido.

## Actualizar solo LIVE

No se agrego `Actualizar` al sidebar ni a pantallas no LIVE.

## Validaciones realizadas

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, con 52 warnings preexistentes del repositorio.
- `npx tsc --noEmit`: OK.
- Busqueda de `Actualizar`: no se agrego boton visible fuera de LIVE.

## Riesgos pendientes

- El smoke visual debe validar alturas pequenas de ventana, porque el problema original dependia del espacio vertical disponible.
- Si en una fase futura se agregan mas acciones al footer, debe mantenerse `flexShrink: 0` y no usar posicion absoluta sobre la navegacion.

## Smoke visual recomendado

1. Entrar como Admin Cliente.
2. Confirmar que el footer no tapa opciones del menu.
3. Confirmar que `Oscuro/Claro` y `Cerrar sesion` quedan compactos.
4. Entrar como Platform Owner.
5. Confirmar que `Cliente en administracion` y opciones inferiores siguen navegables.
6. Ir a LIVE y confirmar que `Actualizar` sigue visible solo ahi.

## GO / NO-GO

GO tecnico si lint, TypeScript y `diff --check` pasan.
