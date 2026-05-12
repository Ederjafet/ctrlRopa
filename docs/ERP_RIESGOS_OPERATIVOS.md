# ERP - Riesgos operativos

## Riesgos principales

| Riesgo | Impacto | Evidencia |
|---|---|---|
| Venta sin validacion clara | Alto | `app/door-sale.tsx` es flujo de caja critico. |
| Lote recibido con mala captura | Alto | `BatchService.java` exige cantidad/calidad, pero UX debe guiar mejor. |
| Permisos incompletos | Alto | `SecurityConfig.java` usa `permitAll`; validacion dispersa. |
| Historiales inmanejables | Medio | Live historico en `app/live.tsx` puede crecer. |
| Logs tecnicos a usuarios operativos | Medio | `app/system-logs.tsx` visible en sistema segun permisos actuales. |
| Codificacion rota | Medio | Mensajes con `Ã` en frontend/backend. |
| Cancelaciones sin autorizacion | Alto | Existen cancelaciones, pero flujo solicitud/aprobacion esta PENDIENTE DE VALIDAR. |

## Acciones que deberian auditarse

- Login fallido/bloqueo/desbloqueo.
- Crear/editar/desactivar proveedor.
- Crear/recibir/conciliar/cancelar lote.
- Alta/modificacion de prenda.
- Venta, cancelacion de venta, reserva, cancelacion de reserva.
- Pago/anulacion/aplicacion de saldo.
- Cierre/cancelacion de caja.
- Preparacion/cancelacion de paquete.
- Envio/despacho/resolucion/reapertura.
- Cambios de permisos, roles, usuarios y configuracion de seguridad.

