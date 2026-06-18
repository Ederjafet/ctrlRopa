# ERP LIVE UX Flow Normalization

Fecha: 2026-05-18  
Rama: `feature/live-c-normaliza-estados-ux`

## Objetivo

Normalizar el flujo visual de LIVE para que operador y QA entiendan claramente el estado actual, la siguiente accion recomendada y las acciones disponibles, sin cambiar backend, reglas de negocio, ventas, pagos, reportes ni reservaciones.

## Alcance

- Frontend `app/live.tsx`.
- Diccionarios `locales/es/common.json` y `locales/en/common.json`.
- Documentacion ERP.

## Mejoras UX Aplicadas

- Se agrego tarjeta de `Estado operativo`.
- Se diferencia visualmente:
  - sin live seleccionado,
  - live abierto,
  - live activo,
  - live cerrado,
  - estado desconocido.
- Se agrega texto de siguiente paso para operador/QA.
- Se agrega confirmacion antes de activar un live.
- Se agrega mensaje de exito al activar.
- Se refuerza confirmacion de cierre con advertencia adicional.
- Se conserva selector ES/EN.
- Todo texto nuevo usa `t('...')`.

## Decisiones

- No se agregaron estados backend nuevos.
- No se cambio `services/liveService.ts`.
- No se cambio la logica de crear, activar, cerrar o reservar.
- No se elimino ningun endpoint legacy.
- No se integro Facebook.

## QA Manual Esperado

- Login.
- Dashboard.
- Abrir LIVE.
- Cambiar ES/EN.
- Validar tarjeta de estado sin live seleccionado.
- Seleccionar live abierto.
- Confirmar modal de activacion.
- Activar live si aplica.
- Confirmar modal de cierre.
- Cerrar live si aplica.
- Abrir customers/items/batches para validar que no se rompieron rutas base.

## Validaciones Ejecutadas

- `npm run lint`: ejecutado sin errores; permanecen warnings preexistentes fuera del alcance LIVE-C.
- `npx tsc --noEmit`: ejecutado correctamente.
- `npx expo export --platform web --output-dir C:/tmp/control-ropa-web-export`: ejecutado correctamente.
- Busqueda de mojibake en `app/live.tsx` y locales ES/EN: sin coincidencias.
- Smoke local `http://localhost:8081/live`: pendiente; el servidor web no quedo escuchando en `8081` durante el intento de validacion local.

## Riesgos Pendientes

- LIVE backend aun solo maneja `OPEN`, `ACTIVE`, `CLOSED`; estados LIVE-B son futuros.
- LIVE aun no es tenant-aware completo.
- Runtime web en `8081` puede bloquearse si existe proceso stale, riesgo ya documentado.
- Validacion de activar/cerrar depende de datos QA disponibles.

## Decision

`GO tecnico acotado` para LIVE-C. Runtime interactivo en `8081` debe repetirse con datos QA cuando el ambiente este levantado.
