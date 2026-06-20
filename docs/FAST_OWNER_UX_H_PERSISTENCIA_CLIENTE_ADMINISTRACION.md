# FAST-OWNER-UX-H - Persistencia y diseno compacto del cliente en administracion

## Resumen ejecutivo

FAST-OWNER-UX-H corrige la persistencia y el diseno del contexto `Cliente en administracion` del Panel Owner AppModa.

El selector global ahora vive en el menu lateral mediante el layout compartido, conserva el cliente al cambiar de seccion, se restaura al refrescar la pantalla y evita textos truncados como `Sin cliente en...` o `Configura un tena...`.

## Problema detectado

- El menu lateral podia volver a `Sin cliente...` al cambiar entre secciones porque las rutas del sidebar no incluian `companyId`.
- El bloque visual era demasiado angosto para textos largos como `CLIENTE EN ADMINISTRACION`.
- El boton `Elegir cliente` ocupaba demasiado espacio para un control global.
- El estado vacio no explicaba con claridad que faltaba elegir un cliente para configurar.

## Persistencia aplicada

La fuente de verdad sigue siendo `selectedCompanyId`.

Se usa una estrategia combinada:

- Query param visible: `/platform?section=users&companyId=2`.
- AsyncStorage solo con ID: `appmoda.platform.selectedCompanyId`.

No se guarda el objeto completo de compania.

## Cambio de seccion

Al navegar por el menu lateral:

- `Panel Owner`
- `Clientes / Companias`
- `Sucursales`
- `Usuarios`
- `Modulos activos`
- `Limites por cliente`
- `Planes / Suscripciones`
- `Tarifas por consumo`
- `Uso por cliente`
- `Auditoria global`

`/platform` restaura el `selectedCompanyId` desde la URL o desde `AsyncStorage` y vuelve a sincronizar la URL con `companyId` cuando hace falta.

## Refresco y revalidacion

Al cargar `/platform`:

1. Se obtiene la lista fresca de companias desde backend.
2. Se toma `companyId` de la URL o `appmoda.platform.selectedCompanyId`.
3. Se valida que exista y que no sea el tenant interno `APPMODA_PLATFORM`.
4. Si no es valido, se limpia el storage, se quita `companyId` de la URL y se muestra estado sin cliente.
5. Si es valido, se carga el detalle mediante endpoints `/api/platform/**`.

## Limpieza al logout

`clearSession()` ahora elimina tambien:

- `appmoda.platform.selectedCompanyId`

Asi el contexto Owner no queda pegado para otro usuario despues de cerrar sesion.

## Diseno compacto

El bloque se movio al menu lateral usando `sidebarContext`.

Estado con cliente:

- `Cliente en administracion`
- `Marla Boutique`
- `ACTIVE - Tuxtla Gutierrez`
- `1 sucursal - 1 usuario`
- boton `Cambiar`

Estado sin cliente:

- `Cliente en administracion`
- `Sin cliente seleccionado`
- `Elige un cliente para configurar.`
- boton `Elegir`

El boton queda compacto y el bloque no usa textos largos truncados.

## Selector de cliente

`Elegir` o `Cambiar` abre un modal compacto.

Cada cliente muestra:

- nombre
- estado
- sucursal principal
- usuarios activos
- sucursales
- plan
- accion `Administrar`

El selector conserva el texto de seguridad:

> Elegir un cliente solo cambia el contexto de administracion del Panel Owner. No cambia tu sesion, no entra como el cliente y no es impersonacion.

## No es impersonacion

Seleccionar cliente:

- no cambia la sesion.
- no cambia token.
- no modifica `/api/me`.
- no permite operar ventas, inventario, pagos, LIVE, apartados, paquetes o envios como ese cliente.
- solo define que tenant se configura desde `/api/platform/**`.

## Validaciones

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, sin errores. Persisten advertencias preexistentes del repositorio.
- `npx tsc --noEmit`: OK.

Backend no se toca en esta fase.

## Riesgos pendientes

- En pantallas muy angostas, conviene smoke visual real del drawer mobile con nombres largos.
- La busqueda dentro del selector de cliente queda como mejora futura.
- Impersonacion auditada sigue fuera de alcance.

## GO / NO-GO

GO si el cliente se conserva al navegar/refrescar, el bloque lateral no se corta, `Actualizar` sigue solo en LIVE y las validaciones pasan.

NO-GO si se pierde `selectedCompanyId`, aparece `Cliente activo`, el selector se confunde con impersonacion o se usa `companyId` en endpoints operativos no plataforma.
