# FAST-OWNER-UX-I - Plataforma global vs cliente en administracion

## Resumen ejecutivo

FAST-OWNER-UX-I separa el Panel Owner AppModa en dos conceptos visibles:

- `Plataforma global`: vistas y configuraciones generales de AppModa SaaS.
- `Cliente en administracion`: tenant especifico que el Platform Owner configura.

El dashboard SaaS queda marcado como vista global y deja claro que sus metricas no dependen del cliente seleccionado. El bloque `Cliente en administracion` se mantiene en el menu lateral, pero ahora aparece despues del grupo global y antes de las secciones de configuracion del cliente.

## Problema detectado

En `/platform?section=dashboard`, el dashboard mostraba metricas globales mientras el sidebar mostraba `Cliente en administracion: Marla Boutique`. Visualmente podia interpretarse que el dashboard estaba filtrado por Marla Boutique o que el Owner estaba impersonando ese cliente.

## Nueva estructura del menu lateral

### Plataforma global

- Dashboard SaaS.
- Clientes / Companias.
- Planes / Suscripciones.
- Auditoria global.

Estas secciones no dependen del cliente en administracion.

### Cliente en administracion

Bloque compacto entre la zona global y la configuracion del cliente.

Muestra:

- cliente elegido o `Sin cliente seleccionado`.
- estado y sucursal principal.
- conteo de sucursales y usuarios.
- ayuda: `Se usa en sucursales, usuarios, modulos y limites.`
- accion `Elegir` / `Cambiar`.

### Configuracion del cliente

- Sucursales.
- Usuarios.
- Modulos activos.
- Limites.
- Tarifas por consumo.
- Uso del cliente.

Estas secciones usan `selectedCompanyId`.

## Dashboard SaaS global

El dashboard ahora indica:

> Vista global de plataforma. Estas metricas no dependen del cliente en administracion.

Metricas como clientes activos, clientes sin plan o suscripciones activas se leen como datos globales de AppModa, no como datos del cliente seleccionado.

## Planes / Suscripciones

La seccion queda como mixta:

- `Catalogo global de planes`: planes disponibles para todos los clientes.
- `Precios por periodo`: precios globales del plan seleccionado.
- `Suscripcion del cliente en administracion`: configuracion dependiente del cliente seleccionado.

Si no hay cliente, la parte de suscripcion muestra estado vacio claro.

## Secciones dependientes

Sucursales, Usuarios, Modulos, Limites, Tarifas y Uso muestran una linea compacta:

`Cliente en administracion: {cliente} - {estado} - {sucursal}`

No se reintroducen tarjetas grandes repetidas.

## Persistencia conservada

Se mantiene lo implementado en FAST-OWNER-UX-H:

- `selectedCompanyId` como fuente de verdad.
- URL con `companyId`, por ejemplo `/platform?section=users&companyId=2`.
- respaldo local `appmoda.platform.selectedCompanyId`.
- revalidacion contra companias frescas del backend.
- limpieza al logout.

## No es impersonacion

Elegir un cliente:

- no cambia la sesion.
- no cambia token.
- no cambia `/api/me`.
- no afecta metricas globales.
- no permite ventas, inventario, pagos, LIVE, apartados, paquetes o envios como ese cliente.
- solo define contexto para endpoints `/api/platform/**`.

## Validaciones

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK, sin errores. Persisten advertencias preexistentes del repositorio.
- `npx tsc --noEmit`: OK.

Backend no se toca en esta fase.

## Riesgos pendientes

- La consola Owner aun no tiene modo soporte/impersonacion auditada.
- La auditoria global sigue pendiente de endpoint endurecido.
- En mobile conviene smoke visual del drawer para confirmar que la separacion global/cliente se lee bien.

## GO / NO-GO

GO si el dashboard se entiende como global, el cliente en administracion no parece filtro del dashboard, la navegacion separa global vs cliente, `selectedCompanyId` se conserva y las validaciones pasan.

NO-GO si el dashboard parece pertenecer a un cliente, se pierde el cliente al cambiar seccion, regresa `Actualizar` fuera de LIVE o se usa `selectedCompanyId` en endpoints tenant normales.
