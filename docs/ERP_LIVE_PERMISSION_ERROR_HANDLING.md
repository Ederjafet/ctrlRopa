# Manejo de permisos y errores secundarios en LIVE

Fecha: 2026-05-18

Rama observada: `develop`

## Problema detectado

En validacion movil, LIVE mostraba un modal con titulo `Live` y el mensaje:

```text
No tienes permisos para acceder a este recurso.
No tienes permisos para acceder a este recurso.
```

La pantalla quedaba parcialmente cargada detras del modal, incluyendo metricas demo. Esto indicaba que no era necesariamente un bloqueo total de acceso a LIVE, sino una o mas cargas secundarias fallando.

## Causa raiz

`app/live.tsx` cargaba en paralelo:

- `GET /api/lives/branch/{branchId}`
- `GET /api/items/branch/{branchId}`
- `GET /api/customers/branch/{branchId}`
- `GET /api/reservations/branch/{branchId}`

La carga usaba `Promise.allSettled`, pero despues tomaba todos los resultados rechazados, extraia `reason.message` y los juntaba con saltos de linea en un unico `Alert.alert`.

Si dos endpoints devolvian el mismo `403`, el modal mostraba dos veces el mismo texto. Ademas, el mensaje global no aclaraba si fallo el acceso a LIVE o solo una seccion secundaria como clientes, prendas o reservaciones.

## Endpoints o llamadas que pueden devolver 403

| Recurso | Llamada frontend | Endpoint | Impacto |
|---|---|---|---|
| LIVE principal | `getLivesByBranch` | `GET /api/lives/branch/{branchId}` | Si falla con 403, puede ser bloqueo real de LIVE. |
| Clientes | `getCustomersByBranch` | `GET /api/customers/branch/{branchId}` | Debe afectar solo el selector de cliente. |
| Prendas | `getItemsByBranch` | `GET /api/items/branch/{branchId}` | Debe afectar solo el selector de prenda. |
| Reservaciones | `getReservationsByBranch` | `GET /api/reservations/branch/{branchId}` | Debe afectar solo reservas recientes/historico de la pantalla. |

El permiso esperado para entrar al flujo es:

- Canal: `LIVE`
- Permiso: `DO_LIVE_RESERVATION`

El backend tambien puede regresar `403` por validaciones tenant-aware de sucursal/compania, aunque el usuario tenga permiso funcional en sesion.

## Correccion aplicada

- Se elimino el `Alert.alert` global que concatenaba todos los errores secundarios.
- Se agrego deteccion de `ApiError.status === 403`.
- Si falla LIVE principal con 403, se muestra un unico mensaje:
  - ES: `No tienes permisos para acceder a En vivo.`
  - EN: `You do not have permission to access Live.`
- Si fallan clientes, prendas o reservaciones, se guarda un mensaje especifico por recurso.
- Los errores secundarios se muestran en la seccion/modal correspondiente, no como bloqueo global.
- Se agregaron claves i18n ES/EN para:
  - acceso denegado a En vivo,
  - error cargando clientes,
  - error cargando prendas,
  - error cargando reservaciones,
  - permisos faltantes por recurso.

## Seguridad

Este cambio no convierte un 403 en exito silencioso. El error sigue visible, pero con alcance correcto:

- 403 del recurso principal LIVE: alerta unica y clara.
- 403 de recurso secundario: aviso localizado donde el usuario intenta usar ese recurso.

No se modifico backend, permisos, ventas, pagos, reportes ni migraciones.

## Validacion esperada

1. Login web y movil con usuario con `DO_LIVE_RESERVATION`.
2. Abrir En vivo.
3. Confirmar que no aparece modal duplicado.
4. Si clientes falla con 403, abrir selector cliente y ver mensaje especifico.
5. Si prendas falla con 403, abrir selector prenda y ver mensaje especifico.
6. Si reservaciones falla con 403, ver aviso no bloqueante de reservaciones.
7. Si LIVE principal falla con 403, ver un solo mensaje de acceso denegado a En vivo.
8. Cambiar idioma global en Sistema y confirmar mensajes ES/EN.

## Validaciones tecnicas

- `npm run lint`: exitoso, sin errores; permanecen 55 warnings preexistentes fuera del alcance.
- `npx tsc --noEmit`: exitoso.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: exitoso.
- `rg -n "Ã|Â|�" app services locales docs/ERP_LIVE_PERMISSION_ERROR_HANDLING.md`: sin coincidencias.

## Riesgos pendientes

- Si un usuario tiene permiso para LIVE pero no para inventario/clientes, podra entrar a pantalla pero no operar completamente. Esto debe revisarse en matriz de permisos.
- Reservaciones todavia tiene consumidores legacy y debe tenantizarse formalmente en una fase posterior.
- La validacion movil real debe confirmar cual endpoint devuelve 403 en el dispositivo.
