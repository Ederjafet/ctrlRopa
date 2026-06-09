# PRODUCT-UX-B1 - Limpieza de detalles tecnicos en permisos

## Objetivo

Mantener la pantalla de roles/permisos legible para administradores operativos, evitando que codigos internos aparezcan como texto principal cuando exista una etiqueta humana disponible.

Esta fase no crea permisos, no cambia RBAC, no modifica backend y no vuelve asignable ningun permiso futuro.

## Complemento LIVE-Z10B / LIVE-AUTH-A / LIVE-ROLE-A

LIVE-Z10B, LIVE-AUTH-A y LIVE-ROLE-A propusieron permisos futuros para autorizaciones de precio, autorizaciones operativas, control LIVE fino y protecciones de apartados/pagos.

Algunos permisos LIVE aparecen como propuestos/futuros por arquitectura. No fueron creados ni habilitados en RBAC en esta fase.

El cambio permitido fue agregar etiquetas legibles al mapper frontend para que, si un permiso aparece en el catalogo real en el futuro, la UI no muestre solamente el codigo tecnico.

## Permisos propuestos con etiqueta legible

| Codigo propuesto | Etiqueta visible ES |
| --- | --- |
| `REQUEST_LIVE_PRICE_CHANGE` | Solicitar cambio de precio LIVE |
| `APPROVE_LIVE_PRICE_CHANGE` | Aprobar cambio de precio LIVE |
| `APPLY_APPROVED_LIVE_PRICE_CHANGE` | Aplicar precio LIVE aprobado |
| `VIEW_LIVE_PRICE_AUTHORIZATIONS` | Ver autorizaciones de precio LIVE |
| `CHANGE_LIVE_PRICE` | Cambiar precio LIVE directamente |
| `REQUEST_LIVE_OPERATION_AUTHORIZATION` | Solicitar autorizacion operativa LIVE |
| `APPROVE_LIVE_OPERATION_AUTHORIZATION` | Aprobar autorizacion operativa LIVE |
| `VIEW_LIVE_OPERATION_AUTHORIZATIONS` | Ver autorizaciones operativas LIVE |
| `APPLY_LIVE_OPERATION_AUTHORIZATION` | Aplicar autorizacion operativa LIVE |
| `PREPARE_LIVE_ITEM` | Preparar prenda para LIVE |
| `OPERATE_LIVE` | Operar LIVE |
| `CHANGE_LIVE_ACTIVE_ITEM` | Cambiar prenda al aire |
| `REMOVE_LIVE_ACTIVE_ITEM` | Retirar prenda del aire |
| `CLOSE_LIVE_OPERATIONAL_SALE` | Cerrar venta operativa LIVE |
| `UNDO_LIVE_OPERATIONAL_SALE` | Deshacer cierre de venta LIVE |
| `RELEASE_RESERVED_ITEM` | Liberar prenda apartada |
| `CANCEL_RESERVATION_WITH_PAYMENT` | Cancelar apartado con pago |
| `REASSIGN_RESERVATION` | Reasignar apartado |
| `EDIT_LOCKED_ITEM` | Editar prenda bloqueada |
| `VIEW_PAYMENT_STATUS` | Ver estado de pago |

## Que no cambio

- No se agregaron permisos al backend.
- No se agregaron migraciones.
- No se modifico `PermissionCode`.
- No se cambiaron roles ni permisos asignados.
- No se habilito ningun boton LIVE nuevo.
- No se inventaron capacidades frontend.

## QA requerido

1. Abrir la pantalla de roles/permisos.
2. Confirmar que los permisos existentes siguen apareciendo con nombre legible.
3. Confirmar que los codigos internos no son el texto principal cuando existe etiqueta.
4. Confirmar que detalles tecnicos siguen disponibles solo como referencia.
5. Confirmar que los permisos propuestos no aparecen si el backend no los devuelve.
6. Confirmar que no se pueden asignar permisos inexistentes.

## GO/NO-GO

GO para etiquetas frontend defensivas y documentacion.

NO-GO para crear permisos reales, modificar RBAC, crear migraciones o habilitar capacidades LIVE nuevas en esta fase.
