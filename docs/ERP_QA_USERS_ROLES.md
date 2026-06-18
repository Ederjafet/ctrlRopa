# ERP - Usuarios QA por rol

Fecha: 2026-05-12  
Fase: 1D - datos QA y evidencia

## Objetivo

Definir perfiles QA minimos para validar menus, permisos, acciones permitidas, acciones bloqueadas y regresion operacional.

## Convencion

Password sugerido para usuarios creados por scripts QA: `Qa12345!`.  
Los usuarios son ficticios y solo deben existir en DEV/QA/STAGING controlado.
Si fallan los usuarios `qa.sinpermisos@local.test`, `qa.reportes@local.test` o `qa.soporte@local.test`, ejecutar en QA `docs/qa/05-fix-usuarios-qa-login.sql` despues de respaldo para resetear password, estado, bloqueo temporal, rol y sucursal.

## Perfiles minimos

| Perfil | Usuario sugerido | Permisos esperados | Pantallas visibles | Acciones permitidas | Acciones bloqueadas | Flujos que prueba |
|---|---|---|---|---|---|---|
| Administrador | `qa.admin@local.test` | Todos los permisos disponibles. | Configuracion, usuarios, roles, catalogos, operacion, reportes. | Administrar usuarios, catalogos, sucursales y operar QA. | Ninguna critica, salvo restricciones futuras de superadmin. | Login, dashboard, permisos, catalogos, smoke general. |
| Vendedor/caja | `qa.vendedor.centro@local.test`, `qa.caja.centro@local.test` | `VIEW_CUSTOMERS`, `VIEW_INVENTORY`, `DO_DOOR_SALE`, `DO_DOOR_RESERVATION`, `DO_LIVE_RESERVATION`, `REGISTER_PAYMENTS` segun perfil. | Clientes, venta puerta, apartados, live, pagos. | Vender, reservar, cobrar segun rol. | Crear usuarios, cambiar roles, cambiar seguridad. | Ventas, pagos, reservas, live. |
| Inventario | `qa.inventario.centro@local.test` | `VIEW_INVENTORY`, `MANAGE_INVENTORY`, transferencias segun alcance. | Inventario, lotes, recepcion, transferencias. | Crear/editar prendas QA, recibir lotes, clasificar. | Cobrar, administrar seguridad, reportes financieros si no tiene permiso. | Inventario, lotes, recepcion. |
| Logistica/envios | `qa.logistica.centro@local.test`, `qa.mensajero.centro@local.test` | `MANAGE_SHIPMENTS`, `MANAGE_INCIDENTS`, permisos de transferencia si aplica. | Paquetes, envios, incidencias. | Preparar/gestionar envios segun rol. | Cobros, roles, seguridad, recepcion de lotes si no tiene permiso. | Paquetes, envios, incidencias. |
| Reportes | `qa.reportes@local.test` | `VIEW_REPORTS`. | Dashboard y reportes permitidos. | Consultar reportes. | Registrar ventas, pagos, cambiar datos maestros. | Reportes, historico, dashboard. |
| Usuario sin permisos | `qa.sinpermisos@local.test` | Ningun permiso efectivo. | Solo acceso basico o mensaje de acceso denegado. | Login y visualizacion minima permitida. | Todo flujo operativo/administrativo. | Acceso denegado 403 amigable. |
| Soporte tecnico | `qa.soporte@local.test` | Perfil tecnico/admin: logs, sesiones, incidentes, reportes tecnicos segun permisos actuales. | Logs, seguridad, incidentes, reportes de soporte. | Revisar logs y apoyar incidentes. | Operacion financiera si no esta autorizada. | Incidentes, logs, respuesta a fallas. |

## Validacion por perfil

1. Iniciar sesion.
2. Capturar menu visible.
3. Ejecutar una accion permitida.
4. Intentar una accion bloqueada.
5. Registrar evidencia en `docs/ERP_QA_EVIDENCE_TEMPLATE.md`.
6. Registrar resultado en `docs/ERP_QA_EXECUTION_LOG.md`.

## Reglas de aceptacion

- Un usuario sin permiso no debe ver ni ejecutar acciones criticas.
- Si una ruta queda visible por error, el backend debe bloquear con 403 amigable.
- Los usuarios operativos no deben ver logs tecnicos.
- El administrador debe poder validar catalogos y usuarios sin errores tecnicos.

## Pendiente de validar

- `GET /api/system/logs` no tiene permiso especifico documentado; debe validarse contra implementacion real en Fase 4.
- Algunos permisos esperados son preliminares y dependen de `AccessService.assertCan` en servicios.
