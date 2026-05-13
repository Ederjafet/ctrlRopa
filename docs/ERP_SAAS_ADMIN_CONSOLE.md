# ERP - Consola SaaS administrativa HPSQ-SOFT

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania y SaaS admin  
Tipo: propuesta funcional/arquitectonica, sin implementacion

## Objetivo

Disenar un area privada exclusiva para HPSQ-SOFT que permita administrar la plataforma SaaS, empresas cliente, planes, soporte, auditoria, salud operacional y configuracion global sin entrar al ERP operativo del cliente como usuario normal.

Esta consola no debe ser visible para clientes.

## Separacion obligatoria

| Area | Usuarios | Proposito | Visible para clientes |
|---|---|---|---|
| ERP operativo | Usuarios de compania | Operar ventas, pagos, inventario, lotes, reportes | Si |
| Consola SaaS HPSQ-SOFT | Personal HPSQ-SOFT | Administrar plataforma, empresas, planes, soporte y auditoria | No |
| Soporte delegado | HPSQ-SOFT autorizado | Diagnostico limitado sobre una empresa | No como menu cliente |

## Principios

1. La consola SaaS usa roles SaaS, no roles ERP cliente.
2. Toda accion HPSQ-SOFT debe quedar auditada.
3. HPSQ-SOFT no debe modificar ventas/pagos directamente salvo herramienta formal y auditada.
4. No se borran datos productivos desde la consola sin proceso formal.
5. Soporte debe operar con minimo privilegio, motivo, ticket y caducidad.
6. Los clientes nunca deben ver rutas, menus ni datos de la consola SaaS.

## Modulos propuestos

### Dashboard global HPSQ-SOFT

Objetivo:

- Ver estado general de la plataforma.
- Empresas activas, suspendidas, en trial y en implementacion.
- Alertas de salud backend/frontend.
- Uso por empresa: usuarios, sucursales, almacenamiento, transacciones.
- Incidencias abiertas.
- Suscripciones por vencer.

No debe mostrar detalle sensible de ventas/pagos por default.

### Empresas/clientes

Funciones:

- Alta de empresa.
- Edicion de empresa.
- Activar empresa.
- Suspender empresa.
- Reactivar empresa.
- Cancelar empresa.
- Consultar historial de estado.
- Administrar datos comerciales basicos.

Datos:

- Nombre legal.
- Nombre comercial.
- RFC/tax id.
- Contacto principal.
- Correo de facturacion.
- Telefono.
- Zona horaria.
- Estado.
- Plan actual.
- Fecha de alta.

Acciones peligrosas:

- Suspender.
- Cancelar.
- Cambiar plan a menor capacidad.
- Reset de configuracion.

Todas requieren confirmacion, motivo y auditoria.

### Planes y suscripciones

Funciones:

- Asignar plan.
- Cambiar plan.
- Periodo de prueba.
- Gracia de pago.
- Suspension por falta de pago.
- Reactivacion.
- Ver vencimientos.
- Ver historial de suscripcion.

Limites por plan:

- Usuarios.
- Sucursales.
- Almacenamiento.
- Modulos habilitados.
- Volumen operativo futuro.

### Administracion de modulos por empresa

Permite habilitar/deshabilitar modulos contratados:

- Ventas.
- Pagos.
- Live/reservas.
- Lotes/inventario.
- Paquetes/envios.
- Reportes.
- Auditoria avanzada.
- Branding.

Regla: backend debe validar modulo habilitado; no basta ocultar menu.

### Configuracion global por empresa

Incluye:

- Zona horaria.
- Formato de moneda.
- Branding.
- Modulos habilitados.
- Parametros generales.
- Politicas de acceso por plan.

Debe vivir en `tenant_settings` o tablas especificas por dominio.

### Usuarios administradores de empresa

Funciones:

- Crear primer administrador de empresa.
- Reset controlado de acceso.
- Desbloquear usuario administrador.
- Cambiar correo de contacto administrativo.
- Ver estado de usuarios administradores.

Restricciones:

- No administrar usuarios operativos del cliente salvo flujo de soporte.
- No conocer contrasenas.
- Reset siempre auditado.

### Monitoreo de salud por empresa

Vistas:

- Ultimo login.
- Ultima actividad.
- Errores recientes filtrados por compania.
- Estado de suscripcion.
- Uso de limites.
- Cola de procesos futuros.
- Indicadores de integridad.

No debe exponer logs globales sin filtro.

### Metricas de uso

Metricas:

- Usuarios activos.
- Sucursales activas.
- Transacciones por dia.
- Ventas registradas.
- Pagos registrados.
- Items inventario.
- Lotes creados.
- Reportes consultados.
- Almacenamiento futuro.

Uso:

- Facturacion futura.
- Capacidad.
- Soporte.
- Deteccion de abuso.

### Bitacora global

Eventos:

- Alta/edicion/suspension/reactivacion de empresa.
- Cambios de plan.
- Cambios de limites.
- Reset de acceso.
- Acceso soporte.
- Consulta de logs.
- Cambios de branding.
- Cambios de modulos.

Filtros:

- Empresa.
- Usuario HPSQ-SOFT.
- Tipo de accion.
- Fecha.
- Resultado.

### Auditoria de soporte

Debe mostrar:

- Quien accedio.
- A que empresa.
- Motivo.
- Ticket.
- Hora inicio/fin.
- Acciones realizadas.
- Datos consultados.
- Resultado.

### Incidencias por cliente

Funciones:

- Registrar incidencia.
- Asociar empresa.
- Asociar modulo.
- Prioridad.
- Estado.
- Responsable HPSQ-SOFT.
- Evidencia.
- Seguimiento.

No reemplaza un sistema helpdesk externo, pero prepara trazabilidad minima.

### Estado de pagos/suscripcion

Funciones:

- Ver estado comercial.
- Fecha de vencimiento.
- Periodo de gracia.
- Historial.
- Bloqueo por falta de pago.
- Reactivacion.

No implementar facturacion fiscal automatica en esta fase.

### Branding por empresa

Configuracion:

- Nombre comercial.
- Logo.
- Color primario.
- Color secundario.
- Texto de bienvenida.

Validaciones:

- Tamano maximo de logo.
- Formatos permitidos.
- Contraste minimo.
- Fallback seguro.

### Herramientas de soporte

Permitidas:

- Ver estado de empresa.
- Desbloquear usuario.
- Reiniciar configuracion segura.
- Consultar logs filtrados.
- Ver salud tecnica.
- Abrir sesion soporte con motivo.

Prohibidas por defecto:

- Modificar ventas.
- Modificar pagos.
- Borrar clientes.
- Borrar inventario.
- Editar saldos.
- Cancelar operaciones sin solicitud formal.

## Rutas conceptuales futuras

No implementar todavia. Referencia de diseno:

- `/saas-admin`
- `/saas-admin/companies`
- `/saas-admin/companies/{companyId}`
- `/saas-admin/subscriptions`
- `/saas-admin/support`
- `/saas-admin/audit`
- `/saas-admin/health`
- `/saas-admin/incidents`

## Seguridad minima requerida antes de implementar

- Roles SaaS separados.
- Middleware/guard de rutas SaaS.
- Backend valida permiso SaaS.
- Auditoria de acciones SaaS.
- Bloqueo de rutas SaaS a usuarios cliente.
- Pruebas negativas cliente vs consola SaaS.

## Lo que NO se debe implementar todavia

- Facturacion fiscal automatica.
- Cobro en linea.
- Impersonacion completa sin controles.
- Borrado de datos productivos.
- Edicion directa de ventas/pagos.
- Consola multi-servidor.
- BI avanzado.

## Decision sugerida

Disenar e implementar primero una consola SaaS minima: empresas, estado, plan, primer admin, salud, auditoria y soporte limitado. Cualquier herramienta que toque datos financieros u operativos debe quedar para fases posteriores con QA y auditoria reforzada.
