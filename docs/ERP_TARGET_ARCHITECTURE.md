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
- Contexto futuro multi-compania: `activeCompanyId`, `activeBranchId`, companias permitidas y modo soporte.

## Permisos

- `PermissionCode.java` como catalogo tecnico.
- Matriz endpoint-permiso documentada.
- Validacion backend obligatoria.
- Frontend solo oculta/guia; backend siempre decide.
- Perfil operativo, administrador y tecnico separados.
- Roles/permisos por compania para ERP cliente.
- Roles SaaS HPSQ-SOFT separados de roles ERP cliente.
- Permisos `SAAS_*` exclusivos para consola privada HPSQ-SOFT.

## Auditoria

- Eventos tecnicos en `system_movement_audit_log`.
- Eventos de negocio futuros: venta registrada, pago anulado, lote recibido, paquete cerrado, usuario modificado.
- Auditoria de intentos fallidos en acciones sensibles.
- Retencion y consulta por perfil tecnico/admin.
- Auditoria SaaS para alta/suspension/reactivacion de empresas, cambios de plan, acceso soporte y consulta de logs.
- Auditoria tenant-aware con `company_id`, `branch_id`, actor, motivo y resultado.

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
- Tenant isolation obligatorio por backend.
- Ningun endpoint debe confiar en `companyId` o `branchId` recibido sin validarlo contra sesion.

## Modulos ERP

- Maestros: sucursales, catalogos, proveedores, usuarios.
- Operacion: clientes, inventario, lotes, ventas, reservas, pagos.
- Logistica: paquetes, envios, transferencias.
- Finanzas: caja, reembolsos, saldos.
- Control: reportes, auditoria, seguridad.

## Plataforma SaaS HPSQ-SOFT

- Consola privada HPSQ-SOFT separada del ERP cliente.
- Administracion de empresas.
- Planes, suscripciones, limites y estado.
- Modulos habilitados por empresa.
- Branding por empresa.
- Soporte delegado con motivo, ticket, caducidad y auditoria.
- Salud por empresa y metricas de uso.
- Bitacora global.

No debe operar ventas/pagos directamente salvo herramienta futura formal y auditada.

## Integracion futura

- Facturacion.
- Contabilidad.
- Compras.
- BI.
- Notificaciones.
- Integraciones de paqueteria.

## Trazabilidad

- Toda accion critica debe responder: quien, cuando, desde que sucursal, que cambio, a que entidad afecto y resultado.
- En SaaS tambien debe responder: que usuario HPSQ-SOFT, sobre que compania, con que motivo, bajo que rol y con que resultado.

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
- No liberar multi-compania sin QA cross-company.
- No liberar consola SaaS sin pruebas negativas de cliente y auditoria.

