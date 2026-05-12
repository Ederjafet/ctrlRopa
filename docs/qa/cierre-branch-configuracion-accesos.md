# Cierre de branch - Configuración y accesos

Usar este checklist antes de pasar a multiempresa.

## Configuración

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Sistema muestra Roles | Se pueden crear/editar roles con permisos existentes | Pendiente QA |
| Sistema muestra Canales operativos | Se puede prender/apagar canal global | Pendiente QA |
| Sistema muestra Logs de soporte | Se ven eventos recientes con usuario, ruta, sucursal y HTTP | Pendiente QA |
| Sucursal configura canales | Solo aparecen canales habilitados por Sistema | Pendiente QA |
| Canal global apagado | No aparece en menu ni se puede operar por backend | Pendiente QA |

## Accesos por rol

| Rol / tramo | Debe ver | No debe ver si no tiene permiso |
| --- | --- | --- |
| Sistema / Soporte | Sistema, roles, canales, logs | Operacion no asignada |
| Administrador | Configuración, dashboard, reportes, operacion autorizada | Canales apagados globalmente |
| Venta puerta | Clientes, inventario permitido, venta puerta, pagos propios | Sistema, roles, canales globales |
| Live | Live, apartados live, pagos relacionados | Venta puerta si no tiene permiso/canal |
| Empaque / envíos | Paquetes, envíos, pendientes | Configuración sensible |
| Caja | Pagos, reembolsos, cierres, reportes autorizados | Sistema |

## Dashboard

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Usuario con una sucursal | Ve una sola vista de dashboard | Pendiente QA |
| Usuario con varias sucursales | Ve selector por sucursal | Pendiente QA |
| Pendientes | Cada pendiente abre la pantalla correcta | Pendiente QA |
| Terminos | No aparece `Refunds`; debe verse `Reembolsos` | Pendiente QA |

## Logs y errores

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Error operativo | Mensaje entendible para usuario | Pendiente QA |
| Error tecnico | Soporte puede rastrear evento en logs | Pendiente QA |
| Historico | No muestra eventos tecnicos duplicados como operacion principal | Pendiente QA |
| Logs de soporte | Permite buscar por ruta, usuario, evento, sucursal o HTTP | Pendiente QA |

## Apariencia

| Caso | Resultado esperado | Estado |
| --- | --- | --- |
| Botones configurados | Venta puerta y acciones respetan apariencia | Pendiente QA |
| Tarjetas | Todas usan componente/diseño consistente | Pendiente QA |
| Calendario | Es usable en movil y web | Pendiente QA |
| Logos | Login e impresion usan los logos configurados | Pendiente QA |

## Aprobacion

El branch se considera cerrado si:

- Los accesos visibles coinciden con permisos/canales.
- Los canales globales bloquean menu y backend.
- Dashboard muestra datos reales por sucursal.
- Logs de soporte permiten rastrear fallas.
- No hay textos tecnicos en pantallas operativas.
- No hay bloqueos criticos en movil.
