# FAST-OWNER-UX-F - Refinamiento final Panel Owner, UI y roles

## Resumen ejecutivo

FAST-OWNER-UX-F refina `/platform` para dejar el Panel Owner AppModa mas compacto, claro y listo para instalacion cliente. La navegacion principal queda en el menu lateral; se retiran accesos rapidos que parecian otra navegacion, se compacta el dashboard, se reemplazan botones ambiguos tipo `Seleccionar` y se integra el contexto de cliente en una franja discreta.

Tambien se centraliza el control Claro/Oscuro en el menu lateral global, se valida que `Actualizar` visible siga reservado para LIVE y se agrega una primera proteccion real para personalizacion UI/Branding: la opcion `Apariencia / Branding` requiere permiso `MANAGE_BRANDING` y modulo de compania `APPEARANCE_CUSTOMIZATION` habilitado.

## Problemas visuales detectados

- El dashboard tenia accesos `Ver clientes` y `Revisar suscripciones` que competian con el menu lateral.
- Varias secciones mostraban contexto de cliente como tarjeta grande y repetitiva.
- El boton `Seleccionar` no explicaba si cambiaba cliente activo, uso visible o plan de precios.
- `Planes / Suscripciones` amontonaba grupos de botones sin etiquetas.
- `Modulos activos` no aprovechaba bien el ancho de PC.
- `ui-kit` mantenia un toggle Claro/Oscuro dentro del cuerpo de pantalla.

## Cambios UX aplicados

- `Dashboard SaaS AppModa`: queda compacto, sin botones de navegacion paralela y con metricas principales mas pequenas.
- `Clientes / Companias`: los cards de cliente conservan datos clave y la accion queda como `Usar como cliente activo`.
- Secciones dependientes de cliente: usan franja compacta `CLIENTE ACTIVO` con compania, estado, sucursal, conteo de sucursales y usuarios.
- `Modulos activos`: se acomoda en grid responsive para PC.
- `Planes / Suscripciones`: se separa en bloques claros: modelo de cobro, plan asignado, periodicidad y estado.
- `Uso por cliente`: la accion queda como `Ver uso` / `Uso visible`.
- `Catalogo de planes`: la accion queda como `Configurar precios` / `Plan para precios`.
- `Auditoria global`: conserva placeholder explicito de hardening y no repite dashboard.

## Botones `Seleccionar`

En `/platform` se reemplazaron los botones ambiguos:

- `Seleccionar` de cliente -> `Usar como cliente activo`.
- cliente ya activo -> `Cliente activo`.
- selector de uso -> `Ver uso` / `Uso visible`.
- selector de plan para precios -> `Configurar precios` / `Plan para precios`.

La regla final es que toda accion que cambie el contexto debe decirlo explicitamente.

## Claro / Oscuro

El toggle de tema se movio al menu lateral global, dentro del panel de sesion, junto al usuario y cerrar sesion. Se retiro del `TopBar` y del cuerpo de `ui-kit`.

Regla final:

- Claro/Oscuro vive en el layout global.
- Las pantallas no deben renderizar su propio toggle de tema en el contenido.

## Actualizar solo LIVE

Busqueda realizada:

- `Actualizar`
- `onRefresh`
- `handleRefresh`
- `showRefresh`

Resultado:

- El unico texto visible `Actualizar` fuera de docs queda en `services/apiError.ts` como traduccion generica de error, no como boton.
- LIVE mantiene `handleRefreshLiveView` y su boton visible de refresh.
- Otras pantallas conservan callbacks `onRefresh` internos de templates/listas, pero no renderizan boton visible `Actualizar`.

Regla final: el boton visible `Actualizar` solo pertenece a LIVE.

## Control para modificar UI / diseno

Estado implementado en esta fase:

- Se reutiliza permiso existente `MANAGE_BRANDING`.
- Se agrega el modulo administrable `APPEARANCE_CUSTOMIZATION` al catalogo de modulos de plataforma.
- El menu lateral solo muestra `Apariencia / Branding` si el usuario tiene `MANAGE_BRANDING` y su compania tiene `APPEARANCE_CUSTOMIZATION` habilitado.
- `/appearance` valida lo mismo por URL directa.
- El menu operacional backend marca `BRANDING` deshabilitado si falta permiso o si el modulo de compania esta apagado.

Alcance:

- Platform Owner puede habilitar/deshabilitar `APPEARANCE_CUSTOMIZATION` desde `Modulos activos`.
- Tenant Admin solo entra si conserva `MANAGE_BRANDING` y el modulo esta habilitado.
- Supervisor, vendedor y caja no tienen `MANAGE_BRANDING` por seed/base y no deben ver branding.

Pendiente importante: `appearance_settings` sigue siendo configuracion global, no por compania. Para SaaS completo se debe crear modelo tenant-aware de apariencia antes de permitir personalizacion productiva por cliente.

## Roles y permisos por compania

Revision tecnica:

- `roles` no tiene `company_id`.
- `permissions` no tiene `company_id`.
- `user_roles` solo relaciona `user_id` y `role_id`.
- `role_permissions` relaciona roles globales con permisos globales.

Decision:

- No se implemento RBAC tenant-scoped completo en esta fase para no arriesgar instalacion.
- Queda documentado como backlog `FAST-RBAC-TENANT-A`.

Propuesta para `FAST-RBAC-TENANT-A`:

- Agregar roles globales/sistema separados de roles tenant.
- Permitir roles personalizados con `company_id`.
- Evitar que Tenant Admin otorgue permisos de plataforma.
- Asegurar que roles de Marla Boutique no aparezcan en otro cliente.
- Agregar pruebas negativas cross-company para roles y permisos.

## Validaciones realizadas

- `git --no-pager diff --check`: OK.
- `npm run lint`: OK sin errores; mantiene warnings historicos de hooks, BOM y tipos.
- `npx tsc --noEmit`: OK.
- `./mvnw.cmd test`: OK cargando `.env` local y limpiando comillas del archivo. El primer intento sin `.env` fallo por `using password: NO`; el segundo intento con `.env` sin limpiar comillas fallo por formato de URL; el intento final paso. Persisten warnings de Logback por no poder escribir en `C:\HPSQ-SOFT\control-ropa\logs\backend\control-ropa.log`, sin fallar el build.

## Smoke visual recomendado

1. Login `platform@appmoda.local` / `Platform123!`.
2. Abrir `/platform`.
3. Confirmar dashboard compacto sin accesos paralelos.
4. Confirmar que `Clientes / Companias` usa `Usar como cliente activo`.
5. Confirmar que secciones de cliente muestran franja compacta.
6. Confirmar `Modulos activos` en grid y que existe `Personalizacion UI / Branding`.
7. Apagar `Personalizacion UI / Branding` para un cliente y confirmar que su admin no ve `Apariencia / Branding`.
8. Confirmar que Claro/Oscuro esta en el menu lateral.
9. Confirmar que `Actualizar` no aparece fuera de LIVE.

## Riesgos pendientes

- `appearance_settings` aun no es tenant-aware; la personalizacion productiva por cliente requiere migracion y endpoints por company.
- Roles/permisos por compania siguen como brecha tecnica; no liberar roles personalizados SaaS sin `FAST-RBAC-TENANT-A`.
- Los callbacks `onRefresh` internos siguen existiendo en algunos templates/listados; no son boton visible, pero deben evitar copy `Actualizar` fuera de LIVE.

## GO / NO-GO

GO para revision visual e instalacion controlada si pasan validaciones tecnicas y smoke manual.

NO-GO para SaaS productivo completo de personalizacion UI o roles personalizados por cliente hasta cerrar `FAST-RBAC-TENANT-A` y apariencia tenant-aware.
