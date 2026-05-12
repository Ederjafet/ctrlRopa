# ERP - Objetivo final

## Vision objetivo

Convertir el sistema de control de ropa/lavanderia en un ERP operativo modular, auditable, seguro y mantenible.

## Principios

- Cada proceso debe tener entrada, validacion, accion, resultado, auditoria y regresion.
- Cada permiso debe estar documentado en frontend, backend y QA.
- Cada pantalla operativa debe compartir patrones visuales y de error.
- Cada endpoint sensible debe validar usuario, permiso, sucursal/canal y estado del recurso.
- Cada cambio funcional debe actualizar documentacion viva.

## Arquitectura objetivo

- Frontend con componentes de formulario, modal, notificacion, selector, lista y detalle homologados.
- Backend con seguridad declarativa por endpoint o convencion centralizada verificable.
- Dominio separado por modulos ERP: maestros, inventario, ventas, caja, logistica, auditoria, seguridad.
- Base de datos con llaves, indices, estados y bitacoras suficientes para reportes y auditoria.
- QA con matriz de regresion por flujo critico y datos semilla controlados.

## Flujos ERP objetivo

- Cliente -> Reserva/Venta -> Pago -> Pedido -> Paquete -> Envio/Entrega.
- Proveedor -> Lote -> Recepcion -> Clasificacion -> Item -> Venta/Reserva.
- Caja -> Pagos/Gastos -> Cierre -> Reportes.
- Usuario/Rol -> Permisos -> Canales/Sucursales -> Acceso controlado.
- Accion sensible -> Auditoria -> Reporte -> Soporte.

## Criterio de producto profesional

Un modulo estara listo para crecer cuando tenga:

- Endpoints documentados.
- Permisos documentados.
- Validaciones frontend/backend alineadas.
- UX homologada.
- Auditoria definida.
- Pruebas de regresion.
- Datos semilla o fixtures.
- Riesgos conocidos.

