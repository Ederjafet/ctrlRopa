# LIVE-Z9C - Reporte de estados accionables de apartados LIVE

## Objetivo

Hacer que las acciones de `Apartados recientes` sean coherentes con el estado operativo actual y evitar botones que no generan un cambio perceptible para la persona usuaria.

## Cambios implementados

- Se oculta `Mantener apartado` cuando el registro ya esta en estado visible `Apartado`.
- Se conserva `Ver detalle`, `Cerrar como venta LIVE` y `Cancelar apartado` para registros en estado `Apartado`, segun capacidades.
- Se muestra `Volver a apartado` cuando el estado actual permite regresar desde `Venta LIVE`, `Cancelado operativo` o `Apartado en seguimiento`.
- Se agrego ayuda para `Volver a apartado`: no registra pago ni caja.
- Se reemplazo el mensaje generico de estado actualizado por mensajes especificos:
  - `Venta LIVE registrada`.
  - `Apartado reactivado`.
  - `Apartado cancelado`.
  - `Sin cambios`.

## Alcance

- Frontend y locales.
- Documentacion y evidencia.
- Sin cambios backend, AUTH/RBAC, pagos, caja, reportes, billing, IA, permisos o contratos API.

## Validaciones tecnicas

Ejecutadas el 2026-06-05:

- OK - `npm.cmd run lint` (sin errores; 60 warnings preexistentes).
- OK - `npx.cmd tsc --noEmit`.
- OK - `npx.cmd expo export --platform web --output-dir C:/tmp/control-ropa-web-export` (73 rutas exportadas).
- OK - `cd backend/control-ropa; ./mvnw.cmd test` (73 tests, 0 fallas, 0 errores).
- OK - `cd backend/control-ropa; ./mvnw.cmd -q -DskipTests package`.
- Pendiente de cierre - `git diff --check`.

Warnings observados:

- Lint conserva 60 warnings ya existentes, no introducidos por esta fase.
- Maven test muestra warnings de entorno conocidos: MySQL 5.7 fuera de soporte comunitario, Mockito dynamic agent y password generado por Spring Security en contexto de test.

## Riesgos

- `Mantener apartado` permanece en locales como texto de compatibilidad, pero ya no se renderiza desde la lista de apartados recientes.
- La reactivacion de apartados cancelados depende de la capacidad/frontend existente y del soporte actual del endpoint; no se agrego nueva regla backend.

## GO/NO-GO

GO tecnico condicionado a `git diff --check` final.
