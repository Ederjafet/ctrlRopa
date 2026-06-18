# ERP - Definition of Done

Fecha: 2026-05-12  
Uso: criterio obligatorio para cerrar cambios ERP.

## Principio

Un cambio ERP no se considera terminado solo porque compila. Debe ser entendible, reversible, trazable, probado y consistente con la operacion.

## Criterios minimos obligatorios

Todo cambio debe cumplir:

- Frontend validado en la pantalla afectada.
- Backend validado si hay endpoint, servicio o contrato involucrado.
- Permisos revisados cuando exista accion, ruta o modulo sensible.
- Validaciones frontend/backend alineadas.
- UX homogenea con `AppBottomModal`, `AppNoticeDropdown`, `AppButton`, `AppScreen` y patrones vigentes.
- Errores manejados sin exponer stack trace, URL tecnica, payload interno o codigos crudos al usuario operativo.
- QA de regresion ejecutado segun impacto.
- Documentacion actualizada.
- Rollback posible y documentado.
- Logs/auditoria revisados si la accion afecta dinero, inventario, cliente, seguridad o trazabilidad.
- Pruebas minimas realizadas o limitacion documentada.

## Cambio pequeno

Ejemplos:

- Texto visible.
- Mensaje de validacion.
- Documentacion.
- Ajuste visual menor sin alterar flujo.

Criterios:

- Validar diff manualmente.
- Ejecutar `npx.cmd tsc --noEmit` si toca TypeScript.
- Ejecutar ESLint acotado si toca frontend.
- Ejecutar Maven test si toca Java.
- Confirmar que no cambia modelo de datos, endpoints ni reglas de negocio.
- Actualizar bitacora si impacta criterio ERP.

## Cambio mediano

Ejemplos:

- Pantalla operativa.
- Servicio frontend.
- Endpoint existente.
- Validacion backend/frontend.
- Flujo con estado.

Criterios:

- Todo lo de cambio pequeno.
- Matriz de validaciones actualizada.
- Matriz de permisos revisada.
- Smoke test del flujo afectado.
- Regresion de flujos dependientes.
- Captura o evidencia QA cuando afecte mobile/web.
- Rollback definido por archivo y por comportamiento.

## Cambio critico

Ejemplos:

- Pagos.
- Ventas.
- Live.
- Lotes/recepcion.
- Seguridad.
- Permisos.
- Auditoria.
- Migraciones.
- Caja.
- Cancelaciones o autorizaciones.

Criterios:

- Todo lo de cambio mediano.
- Aprobacion tecnica antes de implementar.
- Backup definido si toca datos.
- Plan de release y rollback.
- Pruebas con usuario permitido y usuario sin permiso.
- Auditoria revisada.
- Logs revisados.
- Validacion en ambiente QA antes de release.
- No liberar con artefactos no rastreados sin justificar.

## No terminado

Un cambio queda NO terminado si:

- El boton no responde ni explica que falta.
- El backend permite una accion que el frontend bloquea, o al reves, sin razon documentada.
- El usuario ve error tecnico.
- No hay forma clara de revertir.
- No se actualizaron docs cuando cambio el comportamiento.
- Se mezclaron cambios funcionales con refactor masivo.

