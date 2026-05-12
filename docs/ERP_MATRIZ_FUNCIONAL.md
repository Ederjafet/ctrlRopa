# ERP - Matriz funcional

| Modulo | Funciones actuales | Brecha ERP |
|---|---|---|
| Proveedores | Crear/listar/editar/desactivar via `/api/suppliers`; unicidad por codigo/nombre en DB y servicio. | Falta busqueda avanzada, reporte de calidad por proveedor y permisos especificos separados de catalogos. |
| Lotes | Crear, recibir, clasificar, conciliar, cancelar. | Falta filtro backend dedicado por proveedor, calidad, fecha, estatus. |
| Inventario | Alta, consulta, lookup por codigo/QR, ubicacion. | Falta trazabilidad completa por ciclo de vida del item. |
| Venta puerta | Agregar prendas y registrar venta pagada. | Debe asegurar recuperacion de captura y validacion accionable completa. |
| Live | Crear/activar/cerrar live y capturar reservas. | Historial debe moverse a reporte/paginacion; UX de seleccion debe ser estable. |
| Reservas | Crear, listar, cancelar, asignar caja. | Cancelacion requiere flujo de solicitud/autorizacion para ERP. |
| Pagos | Registrar y anular pagos; pagos por folio/codigo/QR. | Auditoria financiera debe guardar detalle de metodo/monto/origen. |
| Caja | Crear/cerrar/cancelar cierre, gastos. | Falta matriz de diferencias, arqueo y autorizaciones. |
| Paquetes | Crear, agregar prendas, marcar listo/cancelar. | Falta lenguaje operativo final y seguimiento de preparacion. |
| Envios | Crear, agregar paquetes, despachar, resolver/cancelar/reabrir. | Falta SLA, rutas, evidencia y auditoria de entrega. |
| Transferencias | Crear, agregar items, enviar, recibir, cancelar. | Falta doble control por origen/destino mas fuerte. |
| Consignacion | Crear, entregar, liquidar, cancelar. | Falta conciliacion financiera y reporte de consignatario. |
| Reportes | Diario, depositos, entregas, cancelaciones, live, remisiones, movimientos. | Falta catalogo unico de KPIs y permisos por reporte. |
| Seguridad | Sesiones, bloqueo, password policy, permisos. | `permitAll` en configuracion general requiere endurecimiento o pruebas exhaustivas. |

