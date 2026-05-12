# Reporte de incidencias por rol - 2026-05-06

## Hallazgos corregidos

| Pantalla | Rol/flujo observado | Causa encontrada | Correccion aplicada |
| --- | --- | --- | --- |
| Inventario | Boton Disponible mostraba error interno | La carga de inventario no capturaba errores del API; cualquier 500 quedaba como modal generico | Se agrego manejo controlado con mensaje en pantalla y alerta de Inventario |
| Inventario / Venta puerta / Live | Listas quedaban vacias al fallar una sola consulta | Las pantallas cargaban items, clientes, pagos o lives con `Promise.all`; si una consulta fallaba, se descartaba todo | Se separo la carga con `Promise.allSettled` para conservar los datos que si respondan |
| Alta masiva de prendas | Catálogos fallaba y despues los selectores no mostraban tallas | Catálogos y lotes estaban acoplados en una sola carga | Se permite cargar catálogos aunque falle lotes, y viceversa; el error queda visible como mensaje controlado |
| Catálogos base | `Catálogos` podia regresar 500 y dejar vacios tipo, marca, talla y ubicacion | El bootstrap fallaba completo si una tabla auxiliar no respondia o tenia diferencia de ambiente | El backend ahora carga cada catalogo con tolerancia: registra warning en log y devuelve el resto de catálogos disponibles |
| Pagos / Cobros | Toast de `Uncaught (in promise)` | La carga inicial de metodos, pendientes y detalle no tenia `catch` global | Se agrego captura de error inicial con alerta de Pagos |
| Live | Al agregar reserva decia que faltaba `liveId` aunque el live estaba abierto | La app no enviaba `liveId` en la creacion de reserva LIVE | Se agrego `liveId: selectedLive.id` al payload de reserva |
| Lotes | Crear lote mostraba permiso denegado despues de llenar el formulario | La pantalla permitia entrar aunque el rol no tuviera `MANAGE_INVENTORY` | Se oculta Nuevo lote si el rol no administra inventario y el formulario muestra acceso restringido |
| Lotes detalle | Recibir/crear lote podia terminar en error al volver al detalle | La carga de detalle mezclaba lote y tipos de prenda; si catálogos fallaba, parecia que fallo lote | Se desacoplo lote de tipos de prenda y se deshabilitan acciones de lote sin `MANAGE_INVENTORY` |
| Apartado puerta | Supervisor veia error interno y listas vacias | Seguía usando carga acoplada de prendas, clientes y pagos | Se aplico el mismo manejo parcial usado en venta puerta |
| Sucursales | La etiqueta Activa parecia deshabilitada | El color verde usaba fondo muy tenue y texto tenue | Se cambio a pill verde solida con texto blanco |
| Sistema | La descripcion sensible se veia igual que los botones | Se usaba una tarjeta accionable visualmente similar | Se cambio a `AppInfoCard`, diferenciada por la configuración de tarjetas informativas |

## Pendientes de validación QA

- Probar Inventario con usuario de inventario y vendedor: los filtros no deben disparar errores ni vaciar datos ya cargados.
- Probar Venta puerta con vendedor Veracruz: el selector de clientes debe mostrar clientes activos de la sucursal aunque falle la carga de prendas.
- Probar Live con live abierto: la reserva debe crearse sin pedir `liveId`.
- Probar Lotes con rol sin `MANAGE_INVENTORY`: no debe mostrarse el boton `+ Nuevo lote`.
- Revisar logs de soporte si aparece otro `INTERNAL_SERVER_ERROR`; ahora la app debe conservar mas contexto en pantalla.
