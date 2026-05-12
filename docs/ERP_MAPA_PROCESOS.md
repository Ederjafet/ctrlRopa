# ERP - Mapa de procesos

## Procesos operativos reales

### Alta de inventario por lote

1. Crear lote en `app/batch-form.tsx`.
2. Guardar con `POST /api/batches/branch/{branchId}`.
3. Recibir lote en `app/batch-detail.tsx`.
4. Guardar recepcion con `PATCH /api/batches/{id}/receive`.
5. Clasificar por tipo con `PUT /api/batches/{id}/classification`.
6. Crear prendas desde `app/items-create.tsx`.
7. Conciliar con `PATCH /api/batches/{id}/reconcile`.

Riesgo: proveedor/calidad existen, pero faltan filtros y reporte consolidado. PENDIENTE DE VALIDAR que todas las pantallas muestren "Pendiente por recibir".

### Venta puerta

1. Seleccionar cliente o generico en `app/door-sale.tsx`.
2. Agregar prenda por codigo, QR, busqueda o alta rapida.
3. Capturar precio.
4. Seleccionar metodo de pago.
5. Registrar venta con `POST /api/sales`.

Riesgo: flujo critico de caja; debe conservar informacion capturada ante errores. Validaciones accionables se iniciaron, pero falta homologar en todo el sistema.

### Live y reservas

1. Crear/activar live en `app/live.tsx` con `POST /api/lives/branch/{branchId}` o `PATCH /api/lives/{id}/activate`.
2. Agregar cliente/prenda/precio.
3. Crear reserva con `POST /api/reservations`.
4. Cerrar live con `PATCH /api/lives/{id}/close`.

Riesgo: historial de lives puede crecer; debe moverse a reportes o consulta paginada. PENDIENTE DE VALIDAR paginacion backend.

### Pago y saldo

1. Consultar deuda en `app/payments.tsx`.
2. Registrar pago con `POST /api/payments`, `/item-code/{code}`, `/qr/{qrCode}` o `/package-folio/{folio}`.
3. Aplicar saldo con `POST /api/balance/apply-to-order`.

Riesgo: operacion financiera debe auditar detalle funcional, no solo HTTP.

### Paquetes y envios

1. Crear paquete en `app/customer-packages.tsx`.
2. Agregar prendas en `app/customer-package-detail.tsx`.
3. Marcar listo con `PATCH /api/customer-packages/{id}/ready`.
4. Crear envio en `app/shipments.tsx`.
5. Agregar paquete y despachar con `PATCH /api/shipments/{id}/dispatch`.

Riesgo: "Marcar listo" debe explicar "cerrar preparacion". Ya hay mejora parcial, pero falta medir UX real.

### Caja

1. Crear cierre en `app/cash-closures.tsx`.
2. Registrar gastos.
3. Guardar efectivo entregado.
4. Cerrar con `PATCH /api/cash-closures/{id}/close`.

Riesgo: debe bloquear cierres duplicados y auditar diferencias. PENDIENTE DE VALIDAR validacion de corte por sucursal/fecha en todas las rutas.

