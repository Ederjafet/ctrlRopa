# ERP - Riesgos operativos

Fecha: 2026-05-12

## Escala

Severidad:

- CRITICO: puede afectar dinero, seguridad, inventario o continuidad operativa.
- ALTO: puede afectar un flujo principal o generar reproceso fuerte.
- MEDIO: afecta eficiencia, soporte o trazabilidad parcial.
- BAJO: afecta claridad o mantenimiento sin detener operacion.

Probabilidad:

- ALTA: ya se observo o es probable por estructura actual.
- MEDIA: depende de uso, datos o permisos.
- BAJA: posible pero no frecuente.

## Matriz de riesgos

| Riesgo | Severidad | Probabilidad | Impacto operacional | Mitigacion | Rollback |
|---|---|---|---|---|---|
| Venta sin validacion clara | CRITICO | MEDIA | Venta incompleta, prenda mal afectada, diferencia de caja. | Validaciones accionables, regresion de venta puerta, mensajes claros. | Revertir pantalla/servicio afectado y validar item/pago. |
| Pago/anulacion con error | CRITICO | MEDIA | Saldo o caja incorrecta. | QA especifico de pagos, auditoria financiera, permisos revisados. | Revertir backend/frontend y revisar movimientos financieros. |
| Permisos incompletos | CRITICO | ALTA | Usuario ejecuta accion indebida o queda bloqueado. | Matriz endpoint-permiso, pruebas con usuario permitido/no permitido. | Revertir cambio de permisos o rol; validar sesion. |
| Seguridad dispersa por servicio | CRITICO | ALTA | Endpoint sin `assertCan` podria quedar expuesto. | Fase de seguridad dedicada, pruebas por controlador, revision `SecurityConfig.java`. | Revertir cambio de seguridad; bloquear ruta si aplica. |
| Lote recibido con mala captura | ALTO | MEDIA | Inventario incorrecto desde origen. | Validaciones de cantidad/calidad/proveedor, QA de recepcion. | Revertir recepcion si existe operacion; si no, correccion controlada. |
| Live asociado incorrectamente | ALTO | MEDIA | Reservas quedan en live equivocado o sin contexto. | Seleccion clara, historial paginado, pruebas de crear/cerrar live. | Reabrir/corregir reserva si existe soporte; si no, ajuste manual documentado. |
| Cancelaciones sin autorizacion formal | ALTO | ALTA | Perdida de trazabilidad y posibles errores operativos. | Flujo futuro solicitud/aprobacion, motivo obligatorio, auditoria. | Revertir cancelacion solo con procedimiento administrativo. |
| Historiales inmanejables | MEDIO | ALTA | Pantallas lentas o dificiles de operar. | Paginacion/filtros por fase futura. | Revertir pantalla o ocultar historial pesado temporalmente. |
| Logs tecnicos visibles a usuarios operativos | MEDIO | MEDIA | Confusion, exposicion de informacion tecnica. | Perfil tecnico separado, permisos y UX de soporte. | Ocultar ruta/menu de logs. |
| Codificacion rota en textos | MEDIO | MEDIA | Mala experiencia, mensajes poco confiables. | Barridos de mojibake, usar UTF-8, QA visual. | Revertir archivo o corregir texto. |
| Artefactos no rastreados en Git | MEDIO | ALTA | Release con archivos no controlados o ruido en diff. | Limpiar/ignorar antes de release; checklist Git. | No incluir artefactos; restaurar working tree limpio. |
| Auditoria insuficiente | ALTO | ALTA | No se puede explicar quien hizo una accion sensible. | Fase de auditoria, eventos de negocio, revision de logs. | No aplica rollback completo; se mitiga hacia adelante. |

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

## Riesgos criticos actuales

- Permisos incompletos por validacion dispersa.
- Pagos/ventas sin regresion automatizada suficiente.
- Auditoria de negocio todavia parcial.
- Artefactos no rastreados antes de release.
