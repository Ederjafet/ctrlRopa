# ERP - Matriz de validaciones

## Validaciones backend observadas

| Flujo | Archivo | Validaciones reales |
|---|---|---|
| Proveedores | `SupplierService.java` | Codigo/nombre obligatorios, duplicado por codigo/nombre, desactivar, permisos. |
| Lotes | `BatchService.java` | Cantidad esperada > 0, proveedor activo obligatorio, recepcion >= 0, calidad 1-5, no conciliar sin clasificacion igual a recibido, motivo de cancelacion. |
| Pagos | `PaymentService.java` | PENDIENTE DE VALIDAR detalle completo; se observo permiso `REGISTER_PAYMENTS` y `VOID_PAYMENT`. |
| Venta | `SaleService.java` | PENDIENTE DE VALIDAR detalle completo; se observo permiso `DO_DOOR_SALE` y `CANCEL_SALE`. |
| Reservas | `ReservationService.java` | PENDIENTE DE VALIDAR detalle completo; se observo validacion por canal Live/Puerta. |
| Seguridad | `AccessService.java` | Usuario activo, permiso efectivo, canal habilitado por sucursal. |

## Validaciones frontend observadas

Hay validaciones locales con `Alert.alert` en muchas pantallas:

- `app/batch-detail.tsx`
- `app/batch-form.tsx`
- `app/door-sale.tsx`
- `app/live.tsx`
- `app/payments.tsx`
- `app/customer-package-detail.tsx`
- `app/cash-closure-detail.tsx`
- `app/transfer-detail.tsx`

## Brechas

- Validaciones visuales no estan homologadas: `Alert.alert`, `AppBottomModal` y `AppNoticeDropdown` conviven.
- Algunas validaciones son solo frontend y deben existir tambien en backend. PENDIENTE DE VALIDAR caso por caso.
- Algunas validaciones backend regresan mensajes con codificacion rota, afectando UX.
- Falta una matriz de "accion bloqueada -> motivo -> boton para corregir".

## Reglas ERP objetivo

- Toda accion primaria debe validar precondiciones antes de llamar API.
- Toda precondicion debe existir tambien en backend.
- Todo error operativo debe mostrarse con alerta accionable, no con pantalla roja ni texto tecnico.
- Todo modal de validacion debe conservar los datos capturados.

## Reglas de presentación Fase 1A

| Caso | Presentación estándar | Acción esperada |
|---|---|---|
| Falta cliente | `AppBottomModal` accionable | Botón para seleccionar cliente o usar genérico si aplica. |
| Falta prenda | `AppBottomModal` accionable | Botones para código, QR, búsqueda o alta rápida según pantalla. |
| Falta precio | `AppBottomModal` accionable | Botón para capturar precio y conservar selección actual. |
| Falta método de pago | `AppBottomModal` accionable | Botón para seleccionar método. |
| Operación exitosa | `AppNoticeDropdown` | Aviso visible y plegable, con opción de cerrar. |
| Acción destructiva | `AppBottomModal` de confirmación | Confirmar o cancelar. |
| Error 400 | Mensaje amigable | Indicar revisar información capturada. |
| Error 401 | Mensaje amigable | Enviar a inicio de sesión si aplica. |
| Error 403 | Acceso denegado amigable | Indicar falta de permiso/canal sin stack trace ni URL técnica. |
| Error 409 | Mensaje de estado actual | Explicar que la acción no procede por el estado del recurso. |
| Error 500 | Mensaje de servidor | Pedir intentar más tarde y revisar logs técnicos. |

## Criterio temporal

No se reemplazan todos los `Alert.alert` en Fase 1A. La homologación completa queda para Fase 2 y Fase 3. En esta fase solo se corrigen textos rotos y mensajes técnicos evidentes.
