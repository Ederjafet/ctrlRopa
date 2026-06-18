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
- Falta una matriz completa de "accion bloqueada -> motivo -> boton para corregir".

## Reglas ERP objetivo

- Toda accion primaria debe validar precondiciones antes de llamar API.
- Toda precondicion debe existir tambien en backend.
- Todo error operativo debe mostrarse con alerta accionable, no con pantalla roja ni texto tecnico.
- Todo modal de validacion debe conservar los datos capturados.

## Reglas de presentacion Fase 1A/1B

| Caso | Presentacion estandar | Accion esperada |
|---|---|---|
| Falta cliente | `AppBottomModal` accionable | Boton para seleccionar cliente o usar generico si aplica. |
| Falta prenda | `AppBottomModal` accionable | Botones para codigo, QR, busqueda o alta rapida segun pantalla. |
| Falta precio | `AppBottomModal` accionable | Boton para capturar precio y conservar seleccion actual. |
| Falta metodo de pago | `AppBottomModal` accionable | Boton para seleccionar metodo. |
| Operacion exitosa | `AppNoticeDropdown` | Aviso visible y plegable, con opcion de cerrar. |
| Accion destructiva | `AppBottomModal` de confirmacion | Confirmar o cancelar. |
| Error 400 | Mensaje amigable | Indicar revisar informacion capturada. |
| Error 401 | Mensaje amigable | Enviar a inicio de sesion si aplica. |
| Error 403 | Acceso denegado amigable | Indicar falta de permiso/canal sin stack trace ni URL tecnica. |
| Error 409 | Mensaje de estado actual | Explicar que la accion no procede por el estado del recurso. |
| Error 500 | Mensaje de servidor | Pedir intentar mas tarde y revisar logs tecnicos. |

## Criterio temporal

No se reemplazan todos los `Alert.alert` en Fase 1A/1B. La homologacion completa queda para Fase 2 y Fase 3. En estas fases solo se corrigen textos, gobernanza y mensajes tecnicos evidentes.

