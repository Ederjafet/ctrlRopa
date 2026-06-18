# PRODUCT-ERR-A - Mensajes de error accionables

## Objetivo

QA reporto mensajes genericos como `Ocurrio un error interno inesperado` en flujos operativos. Esta fase estandariza el manejo frontend para mostrar mensajes claros, accionables y seguros, sin exponer stack traces, SQL, endpoints ni detalles internos.

## Clasificacion aplicada

| Tipo | Criterio | Mensaje al usuario |
| --- | --- | --- |
| Conexion | `status = 0`, fetch/network | No se pudo conectar con el servidor. Revisa tu conexion o intenta nuevamente. |
| Timeout | `408`, `504` o texto de timeout | El servidor tardo demasiado en responder. Intenta nuevamente en unos segundos. |
| Sesion expirada | `401` | Tu sesion expiro. Vuelve a iniciar sesion para continuar. |
| Sin permiso | `403` | No tienes permiso para realizar esta accion. Solicita acceso a tu supervisor. |
| No encontrado | `404` | No se encontro la informacion solicitada. Puede haber sido eliminada o ya no estar disponible. |
| Conflicto | `409` | La operacion no se puede completar porque la informacion cambio. Actualiza la pantalla e intenta nuevamente. |
| Validacion | `400`, `422` | Revisa los datos capturados. Hay informacion pendiente o invalida. |
| Interno | `5xx` | No se pudo completar la operacion. Intenta nuevamente. Si continua, reporta el caso a soporte. |

## Mapper frontend

Se reforzo `services/apiError.ts` con:

- normalizacion de errores `ApiError`, errores de red y errores desconocidos;
- deteccion de mensajes tecnicos o sensibles;
- bloqueo de mensajes genericos internos para que no lleguen crudos a UI;
- copias i18n para `es`, `en`, `pt-BR`, `fr`, `ja`, `zh` y `ko`;
- acciones primarias por tipo: reintentar, actualizar, solicitar acceso, ir a login o cerrar.

`services/apiClient.ts` mantiene fallback local en espanol para pantallas que todavia no consuman el mapper, sin crear dependencia circular con i18n.

## Pantallas corregidas

- `app/door-reservation.tsx`: carga inicial, cargas parciales de recursos y creacion de apartado.
- `app/door-sale.tsx`: carga inicial, cargas parciales de recursos y cierre de venta puerta.
- `app/live.tsx`: carga LIVE, refresh vendedor/supervisor, fallos operativos, crear/activar/cerrar LIVE, prenda al aire y crear apartado LIVE.
- `app/items-create.tsx`: carga de catalogos y alta de prendas.
- `app/customers.tsx`: carga de clientes con panel inline y reintento.
- `app/reservations.tsx`: carga de apartados y asignacion de caja.
- `app/users.tsx`: carga y activacion/desactivacion de usuarios.

## Pendientes

El barrido detecto otros modulos con `err.message` directo fuera del alcance prioritario de PRODUCT-ERR-A, por ejemplo consignaciones, transfers, shipments, refunds, reportes y caja. Deben migrarse en PRODUCT-ERR-B por dominio para no mezclar cambios operativos amplios.

## Seguridad

- No se muestran stack traces.
- No se muestran SQL, rutas `/api/`, excepciones Java/Spring/Hibernate ni endpoints completos.
- Los mensajes especificos de frontend se conservan solo si son cortos y no contienen detalles tecnicos.
- No se cambio backend, permisos, contratos API ni reglas LIVE.

## Validacion manual esperada

- Detener backend o cortar red y abrir `/door-reservation`.
- Confirmar que no aparece `Ocurrio un error interno inesperado`.
- Confirmar mensaje de conexion accionable con opcion de reintento/cierre.
- Probar usuario sin permiso y confirmar mensaje de acceso.
- Probar recurso inexistente o conflicto si aplica.
- Abrir `/live`, `/items-create`, `/customers`, `/reservations` y `/users`.
- Validar light/dark e idiomas ES/EN/PT/FR/JA/ZH/KO.

## Continuidad LIVE-Z9J

LIVE-Z9J reutiliza `getActionableApiError` en el refresh controlado de operador/admin. Si falla la sincronizacion de apartados/eventos, la UI muestra mensaje accionable y no expone el error interno crudo.
