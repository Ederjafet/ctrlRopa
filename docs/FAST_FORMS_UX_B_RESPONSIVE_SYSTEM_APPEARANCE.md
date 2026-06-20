# FAST-FORMS-UX-B - Pantallas responsivas de operacion, sistema, roles y apariencia

## Resumen ejecutivo

Se compactaron pantallas de formularios y configuracion para laptop/escritorio sin tocar backend. La fase se concentro en reducir espacios verticales, usar grids responsivos, alinear acciones principales y dejar claro el estado funcional de rutas de sistema y apariencia.

## Pantallas revisadas

- `/items-create`
- `/users-form?id=7`
- `/system`
- `/system-channels`
- `/system-roles`
- `/appearance`

## Archivos modificados

- `app/items-create.tsx`
- `app/users-form.tsx`
- `app/system.tsx`
- `app/system-channels.tsx`
- `app/system-roles.tsx`
- `app/appearance.tsx`

## `/items-create`

Se aplico `compactHeader`, se agregaron encabezados internos ligeros para datos de inventario y datos opcionales, se mantiene el grid responsivo existente y el boton `Generar prendas` queda con ancho natural en escritorio y ancho completo en movil.

No se cambio la logica de creacion, validacion, lotes, marcas, tallas, precio requerido por flujo ni retorno hacia LIVE/venta/apartado.

## `/users-form`

Se aplico `compactHeader`, se organizo el formulario en grids para datos visibles, acceso, sucursal principal, sucursales asignadas, roles y permisos directos. Las acciones finales ahora usan barra compacta con `Volver` y `Guardar` en escritorio, y botones apilados en movil.

No se cambio el contrato con `/api/users`, roles, permisos, sucursales ni reglas de aislamiento tenant.

## `/system`

La pantalla sigue vigente como configuracion de sistema accesible solo cuando `canConfigureSystem` lo permite. Se compacto el header y las tarjetas de acceso a roles/canales/auditoria tecnica pasan a grid responsivo.

Estado: vigente como configuracion operativa/sistema, no como Panel Owner SaaS.

## `/system-channels`

La pantalla administra canales de venta globalmente habilitados. Se compacto el header, los canales se muestran en grid de dos columnas en escritorio/laptop y las acciones `Guardar cambios` / `Descartar cambios` quedaron en barra compacta.

Estado: vigente para configuracion de canales; la configuracion por sucursal sigue viviendo en los flujos existentes de canales/sucursal.

## `/system-roles`

La pantalla sigue administrando el esquema RBAC actual. Se agrego aviso visual de alcance para no confundirlo con roles por compania, se compacto el header y los roles se muestran como cards en grid.

Riesgo documentado: roles/permisos por compania requieren una fase dedicada `FAST-RBAC-TENANT-A`.

## `/appearance`

La ruta existe, carga, esta enlazada desde navegacion con permiso `MANAGE_BRANDING` y modulo `APPEARANCE_CUSTOMIZATION`, usa `services/appearanceService.ts` y guarda mediante `/api/appearance`. Tambien es consumida por login e impresion.

Decision: se mantiene como funcional vigente, no se oculta ni redirige. Se agrego aviso de alcance y se compacto identidad, colores principales y accion de guardado.

Riesgo: el hardening de personalizacion por compania queda pendiente en `FAST-APPEARANCE-A`. En esta fase no se implementaron nuevos permisos ni backend para separar colores/logos por tenant.

## Actualizar solo LIVE

Se revisaron ocurrencias de `Actualizar` y `showRefresh/onRefresh/handleRefresh`. No se agrego boton `Actualizar` en ninguna pantalla objetivo. El texto literal restante pertenece a i18n/errores (`services/apiError.ts`) y no renderiza un boton de refresh en estas rutas.

## Sidebar y dark mode

No se modifico la estructura global del sidebar. Las pantallas conservan `activeRoute` para mantener la opcion activa visible segun los ajustes previos. El modo oscuro sigue usando el tema global y no se agregaron toggles dentro del cuerpo.

## Validaciones

- `git --no-pager diff --check`: OK
- `npx tsc --noEmit`: OK
- `npm run lint`: OK, con 52 warnings preexistentes del proyecto y 0 errores

No se tocaron archivos backend, por lo que `./mvnw.cmd test` no aplica.

## Smoke QA recomendado

1. Entrar a `/items-create` en laptop y confirmar formulario compacto, boton no gigante y alta funcional.
2. Entrar a `/users-form?id=7` y confirmar secciones claras, acciones alineadas y permisos sin mezcla de plataforma.
3. Entrar a `/system`, `/system-channels` y `/system-roles` para validar grids y textos de alcance.
4. Entrar a `/appearance`, guardar un cambio controlado en ambiente local y confirmar aplicacion visual.
5. Confirmar que `Actualizar` solo aparece en LIVE.
6. Confirmar modo claro/oscuro y sidebar sin solapamientos.

## Riesgos pendientes

- `/system-roles` todavia opera con RBAC actual, no con roles por compania.
- `/appearance` requiere hardening por compania antes de prometer personalizacion SaaS completa.
- Algunos textos heredados tienen mojibake preexistente y requieren fase de normalizacion i18n/encoding.

## Backlog

- `FAST-APPEARANCE-A Control de apariencia por compania`
- `FAST-RBAC-TENANT-A Roles/permisos por compania`
- Normalizacion de textos con encoding heredado en pantallas operativas.
