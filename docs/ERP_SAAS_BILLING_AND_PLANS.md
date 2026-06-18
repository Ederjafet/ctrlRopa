# ERP - Planes, suscripciones y billing SaaS

Fecha: 2026-05-12  
Fase: 2A - diseno multi-compania y SaaS admin  
Tipo: propuesta comercial/tecnica, sin implementacion

## Objetivo

Definir la base conceptual para planes comerciales, limites de uso, suspension/reactivacion y metricas necesarias para operar el ERP como SaaS en un solo servidor.

No se implementa facturacion automatica en esta fase.

## Planes comerciales propuestos

Los nombres son de referencia y deben validarse comercialmente.

### STARTER

Enfoque:

- Negocio pequeno.

Limites sugeridos:

- 1 compania.
- 1 sucursal.
- 3 usuarios.
- Modulos base: clientes, inventario simple, venta puerta, pagos basicos, dashboard.
- Reportes basicos.

### PROFESSIONAL

Enfoque:

- Operacion multi-sucursal pequena/mediana.

Limites sugeridos:

- Hasta 3 sucursales.
- Hasta 15 usuarios.
- Lotes.
- Live/reservas.
- Paquetes/envios.
- Reportes operativos.
- Branding basico.

### BUSINESS

Enfoque:

- Cliente con mayor control operativo.

Limites sugeridos:

- Hasta 10 sucursales.
- Hasta 50 usuarios.
- Reportes avanzados.
- Auditoria ampliada.
- Transferencias/devoluciones.
- Configuracion avanzada.
- Soporte prioritario.

### ENTERPRISE

Enfoque:

- Cliente con necesidades especiales.

Limites sugeridos:

- Limites personalizados.
- SLA acordado.
- Integraciones futuras.
- Auditoria avanzada.
- Soporte dedicado.

## Modulos habilitables

- Clientes.
- Inventario.
- Lotes/proveedores.
- Ventas puerta.
- Apartados/reservas.
- Live.
- Pagos/caja.
- Paquetes.
- Envios.
- Reportes.
- Auditoria.
- Branding.
- Usuarios/permisos avanzados.

Regla: el backend debe bloquear modulo no contratado aunque el frontend lo oculte.

## Periodo de prueba

Estado: `TRIAL`.

Reglas:

- Duracion configurable.
- Limites definidos por plan de prueba.
- Avisos previos al vencimiento.
- Al vencer, pasar a `GRACE` o `SUSPENDED` segun politica.

## Gracia de pago

Estado: `GRACE`.

Reglas:

- Permite operar temporalmente.
- Mostrar aviso amigable a administradores de compania.
- No bloquear usuarios operativos sin politica definida.
- Registrar fecha `grace_until`.

## Suspension por falta de pago

Estado: `SUSPENDED`.

Reglas:

- Bloquear operacion del ERP cliente.
- Permitir mensaje de contacto/renovacion.
- Mantener datos intactos.
- Permitir acceso HPSQ-SOFT segun rol.
- Auditar cambio de estado.

No debe borrar informacion.

## Reactivacion

Reglas:

- Cambiar estado a `ACTIVE`.
- Restaurar acceso sin perdida de datos.
- Registrar motivo, usuario HPSQ-SOFT y timestamp.
- Validar que limites del plan actual siguen aplicando.

## Historial de suscripcion

Debe conservar:

- Plan anterior.
- Plan nuevo.
- Estado anterior.
- Estado nuevo.
- Fecha.
- Usuario HPSQ-SOFT.
- Motivo.
- Periodos.
- Limites aplicados.

## Metricas de uso necesarias

Para facturacion futura y control operativo:

- Usuarios activos.
- Sucursales activas.
- Almacenamiento usado.
- Transacciones de venta.
- Pagos registrados.
- Reportes generados/exportados.
- Lotes recibidos.
- Prendas activas.
- Reservas/live.
- Paquetes/envios.
- Errores/incidencias.
- Ultima actividad.

## Datos requeridos por empresa

- Nombre legal.
- Nombre comercial.
- RFC/tax id.
- Contacto principal.
- Correo de facturacion.
- Telefono.
- Direccion fiscal opcional.
- Plan.
- Estado.
- Fecha de alta.
- Fecha de vencimiento.

## Alertas recomendadas

- Trial por vencer.
- Pago vencido.
- Empresa en gracia.
- Empresa suspendida.
- Limite de usuarios alcanzado.
- Limite de sucursales alcanzado.
- Uso anormal.
- Errores recurrentes.

## Que NO implementar todavia

- Cobro automatico con pasarela.
- Facturacion fiscal electronica.
- Prorrateos complejos.
- Add-ons con cobro automatico.
- Multi-moneda.
- Portal self-service de cliente.
- Eliminacion automatica por cancelacion.

## Decision sugerida

Implementar primero el modelo de suscripcion y limites como control administrativo, no como facturacion automatica. La prioridad ERP es aislamiento, continuidad operativa, suspension/reactivacion segura y trazabilidad.
