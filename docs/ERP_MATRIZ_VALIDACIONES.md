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

