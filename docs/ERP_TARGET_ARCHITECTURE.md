# ERP - Target architecture

Fecha: 2026-05-12

## Vision

Arquitectura objetivo para convertir el sistema en ERP estable, auditable, modular y operable en web/mobile.

## Frontend

- Expo React Native con rutas por modulo en `app/`.
- Componentes UI homologados en `components/ui`.
- Servicios API por dominio en `services`.
- Patrones obligatorios: pantalla, estado de carga, estado vacio, error amigable, validacion accionable y rollback de captura.
- Separacion futura entre contenedores de pantalla, hooks de datos y componentes presentacionales.

## Backend

- Spring Boot modular por dominio.
- Servicios con reglas de negocio claras.
- Controladores delgados.
- DTOs por contrato de API.
- Validaciones backend obligatorias para toda regla critica.
- Errores normalizados por `ApiExceptionHandler`.

## Auth

- Sesiones API con token.
- Expiracion y renovacion controlada.
- Login/logout auditables.
- Password policy configurable.
- Bloqueos y desbloqueos con trazabilidad.

## Permisos

- `PermissionCode.java` como catalogo tecnico.
- Matriz endpoint-permiso documentada.
- Validacion backend obligatoria.
- Frontend solo oculta/guia; backend siempre decide.
- Perfil operativo, administrador y tecnico separados.

## Auditoria

- Eventos tecnicos en `system_movement_audit_log`.
- Eventos de negocio futuros: venta registrada, pago anulado, lote recibido, paquete cerrado, usuario modificado.
- Auditoria de intentos fallidos en acciones sensibles.
- Retencion y consulta por perfil tecnico/admin.

## QA

- Regresion por modulo.
- Smoke test por release.
- Datos QA estables.
- Matriz de pruebas por flujo critico.
- Evidencia web/mobile para pantallas operativas.

## Mobile

- API base configurable por ambiente.
- Mensajes amigables para errores de red, 401, 403 y 500.
- Pantallas compactas, botones visibles, modales usables.
- Validar flujos de mostrador/celular antes de release.

## API

- Contratos estables.
- Versionado futuro si crece integracion externa.
- Errores JSON normalizados.
- No exponer detalle tecnico a usuario operativo.
- Observabilidad de latencia por endpoint.

## Modulos ERP

- Maestros: sucursales, catalogos, proveedores, usuarios.
- Operacion: clientes, inventario, lotes, ventas, reservas, pagos.
- Logistica: paquetes, envios, transferencias.
- Finanzas: caja, reembolsos, saldos.
- Control: reportes, auditoria, seguridad.

## Integracion futura

- Facturacion.
- Contabilidad.
- Compras.
- BI.
- Notificaciones.
- Integraciones de paqueteria.

## Trazabilidad

- Toda accion critica debe responder: quien, cuando, desde que sucursal, que cambio, a que entidad afecto y resultado.

## Observabilidad

- Logs rotativos backend.
- Logs frontend para QA/soporte, no para usuarios operativos.
- Correlacion futura por request id.
- Alertas por error 500, fallos de login, permisos denegados y migraciones.

## Releases

- Ramas `main`, `develop`, `feature/*`.
- Checklist release obligatorio.
- Versionado por fase.
- Rollback definido por artefacto y datos.
- No liberar con deuda desconocida en flujos criticos.

