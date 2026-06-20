# FAST-OWNER-UX-E - Reestructura del Panel Owner AppModa

## Resumen ejecutivo

FAST-OWNER-UX-E corrige la duplicidad de navegacion dentro de `/platform`. El menu lateral queda como navegacion principal del Platform Owner y se elimina la fila horizontal que repetia las mismas opciones dentro del contenido.

Tambien se reorganiza el flujo visual del Panel Owner para que cada seccion tenga un proposito claro: dashboard SaaS, clientes, sucursales, usuarios, modulos, limites, planes, tarifas, uso y auditoria.

## Problema detectado

- El menu lateral ya contenia todas las secciones del Owner.
- Dentro de `/platform` aparecia una segunda barra horizontal con las mismas opciones.
- Esa duplicidad hacia parecer que existian dos formas equivalentes de navegar y confundia el flujo.
- Varias secciones dependientes de cliente mostraban demasiado selector de companias dentro del contenido.

## Navegacion duplicada eliminada

Se elimino de `/platform` la fila horizontal con:

- Panel Plataforma
- Clientes / Companias
- Sucursales
- Usuarios
- Modulos activos
- Limites por cliente
- Planes / Suscripciones
- Tarifas por consumo
- Uso por cliente
- Auditoria global

En desktop la navegacion principal queda solamente en el menu lateral.

## Nueva estructura del Panel Owner

La cabecera general queda como:

- `MODO PLATAFORMA`
- `Panel Owner AppModa`
- `Administracion SaaS multiempresa`
- metadata: administra clientes, sucursales, usuarios, modulos, limites, suscripciones y consumo; no opera ventas, inventario, pagos ni LIVE mezclando clientes.

El contenido principal ahora muestra solo:

- titulo de la seccion actual.
- subtitulo de la seccion.
- contexto de compania seleccionada cuando aplica.
- acciones propias.
- listados/formularios propios.

## Flujo por seccion

### Panel Owner

Global. Muestra dashboard SaaS AppModa con metricas principales:

- clientes activos.
- clientes suspendidos/inactivos.
- planes activos.
- clientes sin plan.
- clientes con modelo consumo.
- clientes con suscripcion activa.

Acciones compactas:

- Ver clientes.
- Revisar suscripciones.

### Clientes / Companias

Global. Es el punto principal para:

- listar companias.
- crear compania.
- seleccionar compania.
- ver modelo, plan, usuarios, sucursales y modulos clave.

El formulario de creacion queda oculto hasta presionar `Crear compania`.

### Sucursales

Depende de compania seleccionada.

- Muestra `Administrando: {companyName}`.
- Si no hay compania valida, pide ir a `Clientes / Companias`.
- Muestra sucursales de la compania seleccionada.
- El formulario de nueva sucursal aparece solo al solicitarlo.

### Usuarios

Depende de compania seleccionada.

- Muestra contexto del cliente.
- Permite abrir `Crear admin` o `Nuevo usuario`.
- Lista usuarios solo de la compania seleccionada.
- No mezcla usuarios de otros tenants.

### Modulos activos

Depende de compania seleccionada.

- Muestra toggles por modulo.
- Se limita a activar/desactivar funcionalidades del cliente.
- No mezcla limites ni suscripciones.

### Limites por cliente

Depende de compania seleccionada.

- Muestra usuarios actuales/maximo.
- Muestra sucursales actuales/maximo.
- Permite editar usuarios, sucursales, prendas, LIVE, envios y paquetes por mes.
- No mezcla modulos ni planes.

### Planes / Suscripciones

Global y dependiente de cliente.

- Catalogo de planes.
- Precios por periodo.
- Contexto de cliente seleccionado.
- Suscripcion del cliente seleccionado.

No mezcla tarifas por consumo; solo define plan, periodo, estado y modelo de cobro.

### Tarifas por consumo

Depende de compania seleccionada.

- Muestra costos unitarios por evento de uso.
- Permite activar/desactivar cada tarifa.
- No genera factura ni cobro real.

### Uso por cliente

Global con contexto de seleccion.

- Muestra resumen basico de uso SaaS.
- Permite seleccionar compania desde el listado de uso.
- No configura planes ni tarifas.

### Auditoria global

Global. Queda como seccion separada con placeholder claro:

- `Auditoria global pendiente de hardening`.

No repite el Panel Owner ni las metricas del dashboard.

## Secciones globales

- Panel Owner.
- Clientes / Companias.
- Planes / Suscripciones, en su catalogo y precios.
- Uso por cliente, como reporte general.
- Auditoria global.

## Secciones dependientes de compania seleccionada

- Sucursales.
- Usuarios.
- Modulos activos.
- Limites por cliente.
- Suscripcion del cliente dentro de Planes / Suscripciones.
- Tarifas por consumo.
- Uso por cliente cuando se revisa una compania especifica.

## Validaciones realizadas

- `npx tsc --noEmit`: OK.
- `git --no-pager diff --check`: OK.
- `npm run lint`: OK sin errores; permanecen warnings preexistentes del repositorio.

No se toco backend, por lo que no aplica `./mvnw.cmd test`.

## Riesgos pendientes

- En mobile/tablet angosto se mantiene la navegacion del AppShell; si el menu lateral no resulta ideal, queda pendiente evaluar un selector compacto sin duplicar navegacion.
- Auditoria global continua como placeholder hasta exponer eventos SaaS auditados.
- Planes y consumo son configuracion administrativa; no hay pasarela, factura ni corte de cobranza real.

## GO / NO-GO

GO para revision visual del cliente: se elimino la navegacion duplicada, el flujo queda mas claro y no se agrego `Actualizar` fuera de LIVE.
