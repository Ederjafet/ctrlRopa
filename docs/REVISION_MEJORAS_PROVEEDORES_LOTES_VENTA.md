# Revision de mejoras: proveedores, lotes y venta puerta

Fecha de revision: 2026-05-11

## Alcance revisado

Se revisaron los cambios recientes relacionados con proveedores, lotes, recepcion de lote, venta puerta y validaciónes accionables. La revision incluyo frontend, servicios TypeScript, backend Spring Boot y migraciones Flyway.

## Archivos afectados o relacionados

Frontend:
- `app/batch-form.tsx`
- `app/batch-detail.tsx`
- `app/batches.tsx`
- `app/door-sale.tsx`
- `app/door-reservation.tsx`
- `app/(tabs)/index.tsx`
- `app/catalogs.tsx`
- `app/catalog-list.tsx`
- `app/catalog-form.tsx`
- `components/ui/AppButton.tsx`
- `services/adminCatalogService.ts`
- `services/batchService.ts`
- `services/supplierService.ts`

Backend:
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/catalog/Supplier.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/catalog/SupplierController.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/catalog/SupplierRepository.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/catalog/SupplierService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/Batch.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchService.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/BatchResponse.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/CreateBatchRequest.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/batch/ReceiveBatchRequest.java`
- `backend/control-ropa/src/main/java/com/hpsqsoft/ctrlropa/dashboard/UserDashboardService.java`
- Servicios de reportes, especialmente `DailyStoreReportService`, `MovementHistoryService` y reportes de inventario, porque aun no exponen proveedor/calidad.

Base de datos:
- `suppliers`
- `batches`
- `batch_classification_details`
- `items`
- `sales`
- `payments`
- Migracion: `V37__suppliers_and_batch_quality.sql`

## Que esta bien

- El catalogo de proveedores existe en frontend y backend.
- La tabla `suppliers` tiene `code` y `name` unicos, lo cual evita duplicados basicos.
- Los lotes ya tienen `supplier_id`, `received_at`, `quality_score` y `quality_notes`.
- La respuesta de lote ya devuelve proveedor, fecha de recepcion y calidad.
- El texto operativo de `ANNOUNCED` se cambio a `Pendiente por recibir` en `services/batchService.ts`.
- Venta puerta ya no bloquea silenciosamente al registrar venta; usa modal accionable para prenda, metodo de pago y precio.
- El boton base `AppButton` ya muestra una alerta cuando esta bloqueado, evitando que parezca inerte.

## Riesgos detectados

Prioridad alta:
- Los endpoints de proveedores no validan permiso en el service/controller. Siguen el patron de otros catálogos, pero para este modulo deberia exigirse `MANAGE_CATALOGS`.
- La recepcion de lote permite guardar sin calidad y sin notas de calidad. Si la calidad sera usada para evaluar proveedores, debe ser obligatoria al recibir.
- La migracion `V37` usa `ALTER TABLE ... ADD COLUMN` sin `IF NOT EXISTS`; si una BD parcial ya tiene alguna columna, puede fallar al aplicar.
- Los reportes aun no incluyen proveedor ni calidad, por lo que el dato se guarda pero no se explota operativamente.

Prioridad media:
- El filtro de lotes solo filtra por texto y estatus. No hay filtro dedicado por proveedor, fecha de recepcion o calidad.
- `received_at` se actualiza cada vez que se edita recepcion. Si se desea conservar primera recepcion y ultima edicion por separado, falta `received_updated_at`.
- En lote, `quality_score` es campo numerico libre en frontend. Funciona, pero no guia bien al usuario operativo.
- En `batch-form.tsx`, proveedor es opcional. Si el objetivo es controlar origen y calidad, deberia ser obligatorio para lotes nuevos.
- `supplierService.ts` lista proveedores activos en frontend, pero el backend devuelve todos. Es aceptable para catalogo, pero para seleccion operativa conviene endpoint o filtro backend.

Prioridad baja:
- Hay textos con acentos corruptos heredados en varias pantallas (`Método`, `código`, etc.). No rompe funcionalidad, pero afecta UX.
- `Apartado puerta` y `Apartados / Reservas` se estaban confundiendo. Ya se mejoro en menu como `Crear apartado` y `Consultar apartados`, pero conviene revisar titulos internos y reportes.

## Propuesta de mejora por modulo

### Proveedores

Prioridad alta:
- Agregar validación de permisos `MANAGE_CATALOGS` en `SupplierService`.
- Normalizar `code` a mayusculas y trim antes de guardar.
- Validar duplicado por `code` y `name` ignorando mayusculas/minusculas.

Prioridad media:
- Agregar búsqueda y edicion/desactivacion ya se cubre por el modulo generico de catálogos; validar que se vea correctamente en `Catálogos`.
- Mejorar mensaje de proveedor inactivo: no permitir elegir inactivos en lote.
- Agregar proveedor en reportes de lotes/inventario.

### Lotes

Prioridad alta:
- Hacer proveedor obligatorio al crear lote, o al menos configurable. Recomendacion: obligatorio para lotes nuevos.
- Hacer calidad obligatoria al recibir lote.
- Validar `quality_score` en frontend y backend entre 1 y 5.

Prioridad media:
- Agregar filtros en `app/batches.tsx`: proveedor, fecha de recepcion y calidad.
- Mostrar calidad como selector visual 1-5, no input libre.
- Mantener `Pendiente por recibir` en dashboard, lista, detalle y cualquier reporte.

### Recepcion de lote

Prioridad alta:
- Requerir cantidad recibida, calidad y nota de calidad minima si calidad es baja.
- Evitar recibir lote con cantidad cero sin nota explicativa.

Prioridad media:
- Cambiar calidad a botones 1, 2, 3, 4, 5 con etiquetas operativas.
- Separar `Notas de recepcion` de `Notas de calidad` con ayuda clara.

### Venta puerta

Prioridad alta:
- Mantener modal accionable al faltar prenda, metodo de pago o precio.
- Evitar que el usuario pierda carrito/precios al corregir errores.

Prioridad media:
- Agrupar acciones de prenda en una sola tarjeta, con jerarquia: código/QR primero, búsqueda y alta rapida despues.
- Mostrar resumen compacto del carrito antes del boton registrar.
- Si solo hay un metodo de pago activo y es efectivo, considerar preseleccionarlo para mostrador.

### Seguridad y permisos

Prioridad alta:
- Proteger proveedores con `MANAGE_CATALOGS`.
- Mantener recepcion/calidad de lote bajo `MANAGE_INVENTORY`.
- Mantener venta puerta bajo `DO_DOOR_SALE`.

Prioridad media:
- Revisar catálogos genericos: varios controllers existentes tampoco validan permisos en backend. Esto excede proveedores, pero es deuda de seguridad.

### Base de datos

Prioridad alta:
- Agregar indice por `batches(received_at)` y `batches(quality_score)` si se implementan filtros dedicados.
- Considerar indice compuesto `batches(branch_id, status, supplier_id)`.

Prioridad media:
- Si proveedor sera obligatorio solo a futuro, no hacer `supplier_id NOT NULL` aun para no romper datos existentes.
- Si calidad sera obligatoria a futuro, aplicar regla en servicio sin cambiar columna a `NOT NULL` hasta limpiar historicos.

## Cambios sugeridos antes de tocar código funcional

1. Fase 1, segura y pequena:
   - Proteger `SupplierService` con `MANAGE_CATALOGS`.
   - Normalizar proveedor.
   - Hacer proveedor obligatorio al crear lote desde frontend/backend.
   - Hacer calidad obligatoria al recibir lote.
   - Cambiar calidad a selector 1-5 en frontend.

2. Fase 2:
   - Filtros de lotes por proveedor, fecha y calidad.
   - Indices nuevos para esos filtros.
   - Mejorar mensajes de recepcion cuando cantidad es cero o calidad baja.

3. Fase 3:
   - Incluir proveedor/calidad en reportes.
   - Revisar todos los catálogos para permisos backend consistentes.

