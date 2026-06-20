# FAST-OWNER-UX-G - Cliente en administracion del Panel Owner

## Resumen ejecutivo

FAST-OWNER-UX-G convierte el contexto de cliente del Panel Owner AppModa en un selector global persistente y compacto. Se elimina la tarjeta repetida `CLIENTE ACTIVO` de las secciones del Owner y se reemplaza por `Cliente en administracion`, visible en el header fijo de `/platform`.

El cambio aclara que el Platform Owner sigue siendo `platform@appmoda.local`; elegir un cliente no cambia sesion, token, `/api/me` ni habilita operacion como tenant.

## Problema detectado

- `Cliente activo` se confundia con el estado `ACTIVE` de la compania.
- El contexto aparecia como tarjeta grande repetida en Sucursales, Usuarios, Modulos, Limites, Tarifas, Uso y Suscripcion.
- `Cambiar cliente activo` no explicaba si cambiaba sesion, impersonaba o solo configuraba.
- El Panel Owner necesitaba patron de consola SaaS: navegacion lateral, contexto global y contenido de seccion.

## Terminos finales

- `Estado ACTIVE`: estado operativo/comercial de una compania.
- `Cliente en administracion`: company/tenant que el Platform Owner esta configurando.
- `Impersonacion`: entrar como usuario del cliente. No se implementa en esta fase.

No se usa `Cliente activo` como termino principal del contexto Owner.

## Ubicacion del selector global

El selector quedo en el header fijo de `/platform`, usando `rightContent` de `AppShellPage`.

Muestra de forma compacta:

- `CLIENTE EN ADMINISTRACION`
- nombre del cliente o `Sin cliente en administracion`
- estado y sucursal principal
- sucursales/usuarios cuando el detalle esta cargado
- boton `Cambiar cliente` / `Elegir cliente`

Se eligio header fijo en lugar de sidebar para evitar hacer crecer demasiado el menu lateral y mantener el contexto visible sin repetirlo en cada seccion.

## Selector de cliente

`Cambiar cliente` abre un modal compacto con lista de companias cliente.

Cada fila muestra:

- nombre
- estado
- sucursal principal
- usuarios
- sucursales
- plan
- accion `Administrar`

El selector incluye el texto:

> Elegir un cliente solo cambia el contexto de administracion del Panel Owner. No cambia tu sesion, no entra como el cliente y no es impersonacion.

Al elegir un cliente:

- se actualiza `selectedCompanyId`.
- se actualiza la URL con `companyId`.
- se mantiene la seccion actual.
- se muestra feedback `Ahora administras {cliente}`.
- se recargan datos de ese cliente desde endpoints `/api/platform/**`.

## Persistencia y fuente de verdad

La fuente persistente es el ID:

- `/platform?section=users&companyId=2`

El estado local conserva solo `selectedCompanyId`. El objeto `selectedCompany` se deriva de la lista actual de companias cargada desde backend. Si el `companyId` de la URL ya no existe o apunta al tenant interno `APPMODA_PLATFORM`, se limpia el contexto y se deja sin cliente en administracion.

No se guarda el objeto completo de la compania en storage.

## Secciones dependientes de cliente

Requieren `Cliente en administracion`:

- Sucursales.
- Usuarios.
- Modulos activos.
- Limites.
- Tarifas por consumo.
- Uso.
- Suscripcion del cliente dentro de Planes / Suscripciones.

Si no hay cliente en administracion, muestran estado vacio claro y acciones:

- `Elegir cliente`.
- `Ir a Clientes / Companias`.

No muestran formularios vacios ni tarjetas grandes de contexto.

## Secciones globales

No requieren cliente:

- Panel Owner / dashboard SaaS.
- Clientes / Companias.
- Catalogo global de planes.
- Precios del plan seleccionado.
- Auditoria global.

`Clientes / Companias` permite elegir contexto mediante accion `Administrar`, no `Seleccionar`.

## Endpoints que usan selectedCompanyId

El ID seleccionado solo se usa con servicios de plataforma:

- `/api/platform/companies/{companyId}`
- `/api/platform/companies/{companyId}/branches`
- `/api/platform/companies/{companyId}/users`
- `/api/platform/companies/{companyId}/settings`
- `/api/platform/companies/{companyId}/subscription`
- `/api/platform/companies/{companyId}/usage-rates`

No se usa selectedCompanyId en endpoints operativos de ventas, inventario, pagos, paquetes, envios, LIVE, apartados o reservas.

## No es impersonacion

Seleccionar cliente:

- no cambia la sesion.
- no cambia token.
- no cambia `/api/me`.
- no permite vender, cobrar, enviar o usar LIVE como ese cliente.
- no da acceso a endpoints tenant normales.

La impersonacion auditada queda como backlog futuro.

## Actualizar y tema

Se mantiene la regla previa:

- `Actualizar` visible solo en LIVE.
- Se retiro el boton visible de refresco en autorizaciones operativas y sesiones del sistema para no duplicar la accion fuera de LIVE.
- Claro/Oscuro vive en layout global/menu lateral.

## Validaciones

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, sin errores. Persisten advertencias preexistentes del repositorio.
- `npx tsc --noEmit`: OK.

Backend no se toca en esta fase.

## Riesgos pendientes

- En mobile, el header fijo puede compactar el selector; se recomienda smoke visual con nombres largos.
- Un selector avanzado con busqueda queda pendiente.
- Impersonacion auditada queda pendiente y no debe confundirse con este contexto.
- Roles y permisos por empresa siguen en backlog `FAST-RBAC-TENANT-A`.

## GO / NO-GO

GO si el selector global conserva contexto por URL, las tarjetas repetidas desaparecen y las validaciones pasan.

NO-GO si vuelve a aparecer `CLIENTE ACTIVO`, si se confunde con impersonacion o si el `companyId` se usa fuera de `/api/platform/**`.
