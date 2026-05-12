# Configuración y accesos

Este documento cierra la regla actual antes de evolucionar a multiempresa.

## Jerarquia actual

La aplicacion decide que se puede ver y operar con esta jerarquia:

| Nivel | Responsable | Controla |
| --- | --- | --- |
| Sistema / Soporte | Administrador tecnico | Roles, permisos asignables, canales operativos globales y logs |
| Sucursal | Administrador operativo | Canales activos por sucursal y usuarios de su operacion |
| Rol | Administrador autorizado | Permisos existentes asignados al rol |
| Usuario | Administrador autorizado | Sucursal principal, sucursales asignadas y roles |

Los permisos no se crean desde la app. Solo se asignan permisos existentes.

## Regla de visibilidad

Un acceso aparece en el menu cuando cumple lo necesario:

```text
permiso del usuario
+ canal disponible globalmente, si aplica
+ canal activo en la sucursal, si aplica
```

Ejemplo:

`Venta puerta` requiere:

- Permiso `DO_DOOR_SALE`.
- Canal `DOOR_SALE` habilitado por Sistema.
- Canal `DOOR_SALE` activo en la sucursal del usuario.

Si falla cualquiera de esas condiciones, el acceso no debe aparecer y el backend debe rechazar la operacion.

## Canales

Los canales tienen dos capas:

| Capa | Pantalla | Resultado |
| --- | --- | --- |
| Global | Sistema > Canales operativos | Define si el canal existe para la operacion |
| Sucursal | Canales / sucursales | Define si una sucursal lo usa |

Una sucursal no puede habilitar un canal apagado globalmente.

## Sistema y soporte

El area Sistema contiene configuraciónes sensibles:

- Roles.
- Canales operativos.
- Logs de soporte.

Soporte puede revisar la bitacora tecnica sin exponer errores crudos al usuario operativo.

## Dashboard

`Mi dashboard` debe mostrar datos reales por sucursal asignada:

- Ventas y caja.
- Actividad del dia.
- Inventario.
- Pendientes accionables.

Cuando un usuario tiene varias sucursales, el dashboard se segmenta por sucursal.

## Preparación para multiempresa

El siguiente nivel sera agregar `Empresa` por encima de `Sucursal`:

```text
Sistema global > Empresa > Sucursal > Usuario/Rol > Canal/Permiso
```

Antes de agregar `company_id`, toda nueva funcionalidad debe respetar estas reglas de acceso para que el aislamiento multiempresa sea mas directo.
