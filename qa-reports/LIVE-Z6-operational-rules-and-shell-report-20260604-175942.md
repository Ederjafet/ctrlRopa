# LIVE-Z6C2 - Premium LIVE Console polish

## Contexto

- Rama: `feature/live-z6-operational-rules-and-shell`
- Fecha: 2026-06-04 17:59
- Alcance: ajuste correctivo y visual premium sobre `/live`.

## Objetivo

Hacer que `/live` se sienta como consola operativa premium y no como formulario largo, sin cambiar backend, AUTH/RBAC, permisos, reglas profundas ni contratos de API.

## Cambios aplicados

- Se corrigio el orden visual del Operador:
  1. Preparar siguiente prenda.
  2. Prenda al aire ahora.
  3. Precio + Cliente / Interesado.
  4. Reserva.
  5. Reservas recientes.
  6. Finalizar en vivo.
- `Preparar siguiente prenda` queda primero como panel de preparacion.
- `Prenda al aire ahora` queda despues, pero con mayor protagonismo visual mediante card destacada, padding y sombra suave.
- `Precio` y `Cliente / Interesado` quedan como bloque compartido para reforzar que el precio corresponde a la prenda al aire.
- `RESERVAR AHORA` quedo dentro del panel `Reserva`.
- Cuando la reserva esta bloqueada, se mantiene `disabledReason` y se muestra motivo visible dentro del panel.
- Se agregaron sombras suaves y menor ruido visual en cards principales.
- Se mantuvieron reservas recientes compactas y acciones derivadas de capacidades.

## Ajuste AppShell/Header contextual

- `AppShell` ahora soporta `contextTitle` y `contextSubtitle`.
- En desktop con sidebar fijo, el header usa contexto operativo para no repetir pobremente el item activo del menu.
- En tablet/mobile con drawer, el header conserva el titulo normal de la seccion.
- `Inicio` muestra `Resumen operativo` con contexto de sucursal/fecha o accesos permitidos.
- `LIVE` muestra `Operacion LIVE` con Live/Sucursal/Ultima reserva si existen, o `Sin transmision activa`.
- El header interno de Operador no repite la misma linea de contexto en desktop.
- `/ui-kit` muestra `Catalogo UI` y contexto de componentes/tokens/templates.
- El sidebar sigue visible en desktop grande.

## Design system y tema claro/oscuro

- `AppThemeContext` expone `themeMode`, `setThemeMode` y `toggleThemeMode`.
- La preferencia claro/oscuro se guarda localmente en AsyncStorage.
- `TopBar` muestra un toggle claro/oscuro visible en desktop/tablet/mobile.
- `AppButton` incorpora variante `neutral` y estado bloqueado con tokens dedicados.
- LIVE ya no usa variantes visuales legacy `operation`/`cancel`; usa:
  - `primary`;
  - `secondary`;
  - `neutral`;
  - `danger`;
  - disabled con motivo visible.
- Cards de prenda al aire/preparada/reservada sustituyen colores hardcodeados por tokens `warning`, `warningBackground`, `successBackground`, `infoCardBackground` e `infoCardBorder`.
- `/ui-kit` ahora muestra tema activo, toggle y preview de variantes de botones.
- `reservation-detail` hereda el tema desde AppShell y componentes base.

## Ajuste visual puntual - Prenda reservada

- La card `PRENDA AL AIRE AHORA` reservada ya no usa fondo ambar dominante en toda la card.
- Se usa `surface` como fondo y acento/borde lateral ambar.
- Se mantienen chips `Al aire` y `Reservada`.
- La alerta de prenda reservada queda compacta y se muestra una sola vez.
- Estados activos:
  - disponible: acento verde sutil;
  - reservada/apartada: acento ambar sutil;
  - vendida/no reservable: acento danger sutil;
  - sin prenda: estado neutro existente.
- Botones de la card mantienen jerarquia UI Kit:
  - `SACAR DEL AIRE`: neutral;
  - `CAMBIAR PRENDA`: secondary.

## Conexion vs sesion en otro equipo

- `services/apiClient.ts` ya no limpia sesion ni redirige a login si falla la validacion `/api/me` por red/backend apagado.
- Las fallas de red se convierten en `ApiError` de estado `0`.
- `services/apiError.ts` clasifica estado `0` como `network`.
- Mensaje esperado:
  - `No se pudo conectar con el servidor. Revisa tu conexion o intenta nuevamente.`
- El mensaje de sesion en otro equipo queda reservado para 401 con texto de sesion revocada/reemplazada.

## Archivos modificados

- `app/live.tsx`
- `app/index.tsx`
- `app/ui-kit.tsx`
- `context/AppThemeContext.tsx`
- `components/layout/TopBar.tsx`
- `components/ui/AppButton.tsx`
- `components/layout/AppShell.tsx`
- `locales/es/common.json`
- `locales/en/common.json`
- `docs/PRODUCT_B_INTERNAL_UI_KIT_FOUNDATION.md`
- `services/apiClient.ts`
- `services/apiError.ts`
- `docs/LIVE_Z6_OPERATIONAL_RULES_AND_SHELL.md`

## Archivos revisados no modificados

- `components/ui/AppButton.tsx`
- `docs/LIVE_Z6_CAPABILITIES_MATRIX.md`
- `qa-reports/LIVE-Z6-operational-rules-and-shell-report-20260604-160344.md`

## Que NO se cambio

- Backend.
- AUTH/RBAC backend.
- Permisos backend.
- Pagos reales.
- Caja.
- Reportes financieros.
- Billing.
- IA.
- Contratos publicos de API.
- WebSocket/SSE.
- Reglas de capacidades LIVE.
- Reglas de reserva, bloqueo de doble reserva, vendido operativo, cancelacion con motivo o precio LIVE.

## Validaciones ejecutadas

- `npm.cmd run lint`: OK, 0 errores, 60 warnings preexistentes.
- `npx.cmd tsc --noEmit`: OK.
- `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: OK.
- `backend/control-ropa/./mvnw.cmd test`: OK, 73 tests, 0 failures.
- `backend/control-ropa/./mvnw.cmd -q -DskipTests package`: OK.
- `git diff --check`: OK funcional; solo warnings LF/CRLF.

## Warnings

- Lint mantiene 60 warnings preexistentes en pantallas no tocadas.
- Backend mantiene warnings preexistentes de Mockito/Java agent dinamico y MySQL 5.7 fuera de soporte comunitario.
- Git muestra warnings LF/CRLF en archivos modificados.

## Validacion manual pendiente

- QA visual desktop/tablet/mobile de `/live`.
- Backend detenido:
  - no debe mostrarse mensaje de sesion iniciada en otro equipo;
  - debe mostrarse error de conexion.
- Sesion real reemplazada:
  - solo en ese caso debe mostrarse mensaje de sesion en otro equipo.

## Git final

- `git status --short --untracked-files=all`: cambios tracked en LIVE/docs/locales/servicios y untracked Z6 (`docs/LIVE_Z6_*`, `services/liveCapabilities.ts`).
- `git diff --stat`: 9 archivos tracked, 493 inserciones, 298 eliminaciones.
- `git diff --name-only`: OK.
- `git diff --check`: OK funcional; solo warnings LF/CRLF.
- Evidencias `qa-reports/` y `git-diffs/` generadas, pero ignoradas por `.gitignore`.

## GO/NO-GO

GO tecnico para LIVE-Z6C2.
GO visual condicionado a QA manual responsive y prueba manual de backend detenido/sesion reemplazada.

## Pendiente LIVE-Z7

- QA visual con screenshots.
- Evaluar componente interno `LiveConsolePanel` si se quiere reducir JSX.
- Realtime formal LIVE-RT con SSE/WebSocket.
