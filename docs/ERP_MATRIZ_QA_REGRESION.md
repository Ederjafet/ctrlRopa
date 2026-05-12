# ERP - Matriz QA y regresion

## Regresion minima obligatoria

| Flujo | Casos minimos |
|---|---|
| Login | Login valido, login invalido, usuario bloqueado, cambio obligatorio de contrasena, logout. |
| Permisos | Usuario sin permiso no ve modulo; si accede por URL recibe alerta amigable; backend responde 403. |
| Proveedores | Crear, duplicado por codigo, duplicado por nombre, editar, desactivar, usar proveedor inactivo en lote. |
| Lotes | Crear con proveedor, recibir con calidad 1-5, bloquear sin calidad, clasificar, conciliar, cancelar con motivo. |
| Venta puerta | Sin cliente, sin prenda, sin precio, sin metodo, venta correcta, error backend sin perder captura. |
| Live | Crear live, seleccionar live, crear reserva, cerrar live, ver historial sin saturar pantalla. |
| Pagos | Pago por reserva, pedido, item code, QR, paquete, anular pago. |
| Caja | Crear cierre, registrar gasto, cerrar, impedir duplicado por sucursal/fecha. |
| Paquetes | Crear, agregar item por codigo/QR/busqueda, marcar listo, cancelar con motivo. |
| Envios | Crear, agregar paquete, despachar, resolver entrega, cancelar/reabrir. |
| Reportes | Filtrar por sucursal/fecha, sin permisos, datos vacios. |

## Automatizacion actual

- Frontend: `npm run lint` existe en `package.json`.
- Backend: Maven con dependencias test; PENDIENTE DE VALIDAR cobertura real.
- E2E: PENDIENTE DE VALIDAR.

## Riesgos QA

- Muchas pantallas tienen validaciones locales diferentes.
- Hay flujos financieros sin evidencia de pruebas automatizadas.
- Cambios UX recientes pueden romper mobile/web de forma diferente.

