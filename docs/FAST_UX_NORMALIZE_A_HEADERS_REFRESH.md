# FAST-UX-NORMALIZE-A - Encabezados y boton Actualizar

Fecha: 2026-06-19

## Resumen ejecutivo

Se normalizo el uso de encabezados y acciones de recarga visibles en AppModa. La regla final queda: el boton visible `Actualizar` solo pertenece a LIVE / En vivo. Las demas pantallas mantienen carga inicial, filtros, cambios de sucursal o recargas internas despues de acciones, pero no muestran un boton manual de actualizacion.

Tambien se corrigio `/platform`, donde el encabezado principal y la tarjeta de alcance repetian el concepto `Administracion multiempresa AppModa`.

## Busqueda realizada

Se revisaron ocurrencias de:

- `PANEL OPERATIVO`
- `ALCANCE SAAS`
- `Modo Plataforma`
- `Administracion multiempresa`
- `Actualizar`
- `Actualizando`
- `refresh`, `onRefresh`, `handleRefresh`
- componentes de header como `AppShell`, `AppShellPage`, `TopBar` y `SectionHeader`

## Archivos donde aparecia Actualizar

- `app/customer-packages.tsx`: boton de header removido.
- `app/dashboard.tsx`: boton de dashboard removido.
- `app/door-reservation.tsx`: boton de header removido.
- `app/door-sale.tsx`: boton de header removido.
- `app/incidents.tsx`: boton inferior removido.
- `app/platform.tsx`: boton de header removido.
- `app/refunds.tsx`: boton inferior removido.
- `app/reservations.tsx`: boton de header removido.
- `app/returns.tsx`: boton inferior removido.
- `app/shipments.tsx`: boton de header removido.
- `app/system-logs.tsx`: boton de logs removido.
- `app/live.tsx`: se conserva el boton permitido de LIVE mediante `t('live.refresh')`.
- `services/apiError.ts`: conserva `errors.refresh` como etiqueta generica de error; no renderiza un boton de pantalla.

## Encabezados y contextos revisados

- `components/layout/TopBar.tsx`: encabezado global que renderiza el bloque principal con eyebrow, titulo, subtitulo, metadata, modo oscuro y `rightContent`.
- `components/layout/AppShellPage.tsx`: wrapper de pantalla que delega al `TopBar`.
- `components/layout/AppShell.tsx`: shell de navegacion y contexto.
- `app/platform.tsx`: caso corregido de duplicidad visual entre header principal y tarjeta `ALCANCE SAAS`.
- `app/users.tsx`: mantiene tarjeta de alcance tenant; no repite el titulo del header y no tenia boton `Actualizar`.
- `app/live.tsx`: mantiene `Actualizar` por ser el unico modulo autorizado.

## Pantallas corregidas

- Plataforma
- Dashboard / resumen operativo
- Paquetes
- Envio
- Apartados y reservas
- Venta puerta
- Apartado puerta
- Reembolsos
- Devoluciones
- Incidencias
- Logs del sistema

## Regla final de Actualizar

`Actualizar` queda permitido solo en LIVE / En vivo:

- Ruta principal: `app/live.tsx`
- Motivo: LIVE es el unico modulo donde la operacion en tiempo real justifica una accion manual visible de recarga.

En pantallas no LIVE se retiro el boton visible. Cuando una pantalla requiere recargar despues de una accion, conserva la recarga interna sin exponer `Actualizar`.

## Patron definido para encabezados

- Cada pantalla debe tener un solo encabezado principal mediante `AppShell` o `AppShellPage`.
- `rightContent` debe reservarse para acciones principales reales de la pantalla, no para refresh generico.
- Las tarjetas secundarias de alcance son validas si no repiten el mismo titulo del header.
- El modo oscuro puede seguir en el `TopBar`.
- El boton de refresh visible debe activarse explicitamente solo en LIVE.

## Cambios especificos en Plataforma

- Se elimino el boton `Actualizar`.
- La tarjeta `ALCANCE SAAS` ya no repite `Administracion multiempresa AppModa`.
- La tarjeta ahora describe que se puede hacer desde Plataforma.
- El panel interno de resumen cambia `Modo Plataforma AppModa` por `Alcance operativo de Plataforma`.

## Validaciones

Ejecutadas:

- `npm run lint`: PASS, con warnings historicos/preexistentes de hooks, array-type y BOM; sin errores.
- `npx tsc --noEmit`: PASS.
- `git --no-pager diff --check`: PASS.

## Riesgos pendientes

- Aun existen recargas por gesto o callbacks internos en algunas listas; no son botones visibles, pero deben mantenerse vigiladas para no confundirse con polling automatico.
- `TopBar` sigue aceptando `rightContent`, por lo que futuras pantallas podrian volver a agregar `Actualizar`; la regla queda documentada para evitar regresion.
